# Static hosting for the web app (web/dist) - S3 + CloudFront, not the
# EC2 instance. This was already the architecture decision on record
# (README's tech-stack line: "static hosting for web"); CloudFront gives
# free automatic HTTPS on its own *.cloudfront.net domain immediately, no
# certificate or custom domain needed to get real encryption today, and
# scales to any traffic level at negligible cost.
#
# The bucket itself stays fully private (no public access, no static
# website hosting mode) - CloudFront reaches it via Origin Access
# Control, the current AWS-recommended pattern (replacing the older
# Origin Access Identity). Deploying a new build is a plain `aws s3 sync`
# + a CloudFront invalidation - documented in docs/AWS_DEPLOYMENT.md, not
# wired into the Jenkinsfile in this first pass (the backend's CI/CD is
# the part the user explicitly asked to automate; the web deploy step is
# small enough to add to the pipeline later the same way).

resource "aws_s3_bucket" "web" {
  bucket_prefix = "${var.project_name}-web-"
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${var.project_name}-web-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Rewrites /courses to /courses/index.html so the prerendered files are the
# ones actually served. Without it, every clean URL falls through to the SPA
# shell and the per-page metadata the prerender produced is never seen by a
# crawler or a share scraper. See cloudfront-rewrite.js for the full reasoning.
resource "aws_cloudfront_function" "web_rewrite" {
  name    = "vpro-skills-directory-index"
  runtime = "cloudfront-js-2.0"
  comment = "Append index.html to extensionless paths so prerendered pages are served"
  publish = true
  code    = file("${path.module}/cloudfront-rewrite.js")
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "s3-web"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  # The EC2 app server as a second origin, so the browser can call the
  # API on the SAME https://*.cloudfront.net address the web app is
  # served from. Without this, the web app (HTTPS, via CloudFront) would
  # call the backend directly over plain HTTP (the EC2 instance has no
  # certificate - no domain has been added yet, see ec2.tf/nginx), which
  # every browser blocks as "mixed content". CloudFront-to-origin stays
  # plain HTTP here (origin_protocol_policy = "http-only") - that hop
  # never leaves AWS's own network, only the viewer-to-CloudFront leg
  # (which does leave the network) needs to be encrypted, and it already
  # is via CloudFront's own default certificate.
  origin {
    # CloudFront custom origins must be a DNS name, not a bare IP address
    # ("InvalidArgument: The parameter origin name cannot be an IP
    # address") - aws_eip.app.public_dns is the DNS name AWS already
    # assigns to this Elastic IP (ec2-<ip>.<region>.compute.amazonaws.com),
    # which still resolves to the same address.
    domain_name = aws_eip.app.public_dns
    origin_id   = "ec2-api"

    custom_origin_config {
      http_port              = 80
      https_port              = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Anything under /api/ goes to the backend instead of the S3 bucket -
  # matched before default_cache_behavior since CloudFront evaluates
  # ordered_cache_behavior blocks first. Not cached (this is a live API,
  # not static assets) and every method is allowed, not just GET/HEAD.
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ec2-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods          = ["GET", "HEAD"]
    compress                = true
    min_ttl                  = 0
    default_ttl               = 0
    max_ttl                   = 0

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept", "Origin"]
      cookies {
        forward = "all"
      }
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods          = ["GET", "HEAD"]
    target_origin_id        = "s3-web"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true

    # Only on this behaviour - /api/* has its own above and must reach the
    # backend with its path untouched.
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.web_rewrite.arn
    }

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # React Router (client-side routing) - a direct hit on e.g. /dashboard
  # has no matching object in the bucket, so S3 returns 403 (private
  # bucket) / 404. Serve index.html instead and let the SPA's own router
  # take over, rather than showing CloudFront's raw error page.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # No custom domain configured yet (decided with the user: "decide
  # later") - CloudFront's own default certificate covers its
  # *.cloudfront.net domain with real HTTPS today. Adding a custom domain
  # later means an ACM certificate (must be requested in us-east-1
  # regardless of the deployment region - a CloudFront requirement) plus
  # an `aliases` block here - documented in docs/AWS_DEPLOYMENT.md.
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.web.arn
        }
      }
    }]
  })
}
