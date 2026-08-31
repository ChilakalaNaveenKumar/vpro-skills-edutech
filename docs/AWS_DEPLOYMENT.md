# AWS deployment: EC2 + RDS + Jenkins CI/CD

This is the step-by-step walkthrough for taking this app live on AWS: one
right-sized EC2 server running the app (via Docker Compose) plus Jenkins
for CI/CD, a separate managed Postgres database (RDS), and the web app on
S3 + CloudFront. It builds on `docs/CICD.md` (Part 1's GitHub push step is
shared with this) but supersedes that doc's Part 5/8 - Jenkins now runs on
AWS itself, not on your Mac behind ngrok, so there's no tunnel to babysit
and no webhook URL that changes every restart.

Everything in `infra/aws/` (Terraform) and every file this describes was
written and reviewed in this session. **Nothing in AWS gets created, and
no cost is incurred, until you've done the short list below and given an
explicit go-ahead right before the one command that actually creates
anything.** That's not extra friction for its own sake - creating AWS
resources spends your real money, and entering account credentials
anywhere is something you have to do yourself for your own security, the
same rule already explained for the GitHub token in `docs/CICD.md`.

## What this costs and what it handles

Sized for the "Balanced" tier we agreed on: comfortably handles a few
hundred people actively using the app at the same moment (the realistic
read of "5,000 members" for a training platform where usage clusters
around scheduled batches, not everyone hitting Submit in the same
second), with room to grow before anything here needs to change.

| Resource | What it's for | Est. monthly cost |
|---|---|---|
| EC2 t3.medium | Runs the app + Jenkins | ~$30 |
| EBS 30GB gp3 | The instance's disk | ~$3 |
| RDS db.t4g.micro (Postgres) | The database, managed/backed-up automatically | ~$13 |
| RDS storage (20GB, autoscaling to 50GB) | | ~$2-5 |
| S3 + CloudFront | Hosts the web app, free HTTPS included | ~$1-5 |
| Elastic IP, ECR, SSM, Budget alert | Small/near-zero on their own | ~$1 |
| **Total** | | **roughly $50-65/month**, within the $50-90 range discussed |

This will vary with real traffic (data transfer, RDS storage growth) - the
Budget alert set up below emails you if forecast spend crosses $100/month
so nothing runs away unnoticed.

## The short list of things only you can do

Everything else - writing every file, running Terraform, wiring the
pipeline, verifying it all - happens in this session. This list is
genuinely as short as it can be while still following the rule that
account creation, payments, and credentials are never handled by Claude.

1. **Have an AWS account with billing set up.** Skip this if you already
   have one.
2. **Create one IAM user for Terraform to run as, and connect it on your
   own Mac.** In the [IAM console](https://console.aws.amazon.com/iam/home#/users) -> Create user -> name it e.g.
   `vpro-terraform` -> "Attach policies directly" -> "Create policy" ->
   JSON tab -> paste the contents of `infra/aws/bootstrap-user-policy.json`
   (already in your project folder) -> name the policy `vpro-terraform-policy`
   -> attach it to the user. Then, on the user's page -> **Security
   credentials** tab -> **Create access key** -> choose "Command Line
   Interface (CLI)" -> create it and copy both values. In your own Mac
   Terminal (not this chat):
   ```
   aws configure
   ```
   (if `aws` isn't found, install it first: `brew install awscli`.) Paste
   the Access Key ID and Secret Access Key when prompted, and set the
   region to `us-east-1` (or your own choice - see Part 1 below). This
   key lives only in a file on your own Mac (`~/.aws/credentials`) that
   this session never reads - Claude runs Terraform *through* your
   already-authenticated CLI, the same way it already runs other commands
   on your Mac, without ever seeing the key itself. Once the initial
   setup in Part 1 is done, you can delete this access key from the IAM
   console if you want - nothing ongoing depends on it (Jenkins and the
   running app use the EC2 instance's own role instead, not this key).
3. **Push this code to GitHub**, if you haven't already - `docs/CICD.md`
   Part 1 covers this exactly (repo creation, Personal Access Token,
   `git push`).
4. **Once the instance exists (Part 2 below), finish Jenkins' first-run
   setup through its own web page** - admin password, and adding the
   GitHub PAT/deploy key Jenkins needs to check out the repo. Same as
   `docs/CICD.md` Part 3, except you will **not** need to add a
   Docker Hub or AWS credential - the instance's own role already covers
   AWS access.
5. **Add the GitHub webhook** pointing at the new Jenkins address (Part 2
   gives you the exact URL).
6. **One "go ahead"** in chat, right when asked, after seeing the exact
   `terraform plan` output and the cost estimate above.

## Part 1 - Provision the infrastructure

Once you've done steps 1-2 above, tell Claude you're ready. From here,
this session runs the following via your already-configured AWS CLI (in
`~/Desktop/LMS/infra/aws/`):

```
cd infra/aws/bootstrap
terraform init
terraform apply          # creates just the S3 state bucket + a small lock table

cd ..
./init.sh                # points this config's state at that bucket
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set alert_email to a real address you check
terraform plan            # shows exactly what would be created - reviewed before anything real happens
```

At this point Claude will show you the plan's resource list and the cost
estimate above, and ask for your explicit go-ahead before running:

```
terraform apply
terraform output          # the instance's address, the ECR repo URL, etc. - needed for Part 2
```

This takes a few minutes (RDS in particular takes a while to come up).
Once it finishes, the app instance is running with Jenkins already booted
on it - but the backend app itself isn't deployed yet, that happens the
first time Jenkins' pipeline runs (Part 2-3).

## Part 2 - Point Jenkins at this deployment

Jenkins is now reachable at `http://<the app_public_ip output>:8080` - no
ngrok, it has its own stable address as long as this EC2 instance exists.

1. Open that URL, get the initial admin password the same way as
   `docs/CICD.md` Part 2 describes (just via SSM instead of a local
   `docker compose exec` - see the note below), and finish setup.
2. **Manage Jenkins -> System -> Global properties -> Environment
   variables**, add two:
   - `ECR_REPOSITORY_URL` = the `ecr_repository_url` value from
     `terraform output`
   - `AWS_REGION` = the region you deployed into (`us-east-1` by default)
3. Add the GitHub credential Jenkins needs to check out the repo, same as
   `docs/CICD.md` Part 3's GitHub entry (skip the Docker Hub one entirely
   unless you still want that optional push - AWS deployment doesn't need
   it).
4. Create the pipeline job exactly as `docs/CICD.md` Part 4 describes.
5. On GitHub, add the webhook (repo -> Settings -> Webhooks -> Add
   webhook): Payload URL `http://<app_public_ip>:8080/github-webhook/`,
   content type `application/json`, "Just the push event".

**Getting a shell on the instance** (to check the initial Jenkins
password, or anything else) doesn't use SSH - there's no SSH key and port
22 isn't even open, on purpose (see `docs/ARCHITECTURE.md`'s "AWS
Deployment" section for why). Instead:

```
aws ssm start-session --target <instance_id from terraform output>
```

then, once connected:

```
sudo docker exec vpro-skills-jenkins-jenkins-1 cat /var/jenkins_home/secrets/initialAdminPassword
```

## Part 3 - First deploy

Same as `docs/CICD.md` Part 6: push any small change, or click **Build
Now** on the job page. Watch **Console Output** - it now runs through
five stages instead of the old placeholder: tests, web build, Docker
image build, push to ECR, roll out via `docker compose`, then a real
health check that fails the build if the new deployment doesn't come up
healthy. Once green, `http://<app_public_ip>/health` should respond
`{"status":"ok",...}`.

**Create the first admin account** the same way as `docs/RUNBOOK.md`
already documents, just via SSM instead of a local shell:

```
aws ssm start-session --target <instance_id>
cd /opt/vpro-skills   # wherever Jenkins checked out the repo on this instance
sudo docker compose -f docker/docker-compose.aws.yml exec backend \
    python -m scripts.create_user --email admin@vproskills.com \
    --password "<a real password>" --full-name "Admin" --role ADMIN
```

## Part 4 - Deploying the web app

The web app isn't part of the Jenkins pipeline in this first pass (small
enough to add later the same way) - deploy it by hand for now, from your
own Mac Terminal:

```
cd web
echo "VITE_API_BASE_URL=http://<app_public_ip>" > .env
npm run build
aws s3 sync dist/ s3://<web_bucket_name from terraform output> --delete
aws cloudfront create-invalidation --distribution-id <cloudfront_distribution_id> --paths "/*"
```

Same build-time-vs-deploy-time gotcha already documented in
`docs/SETUP.md`: `VITE_API_BASE_URL` has to be right *before* `npm run
build`, not set afterward. Your app is then live at
`https://<cloudfront_domain from terraform output>` with real HTTPS,
automatically, on CloudFront's own domain.

## Part 5 - Adding a domain and HTTPS on the app server later

Not done yet (you said "decide later") - when you're ready:

1. Point your domain's DNS at the values `terraform output` gives you:
   an `A` record at `app_public_ip` for the API (e.g. `api.yourdomain.com`),
   and for the web app, either a `CNAME`/`ALIAS` at `cloudfront_domain`
   (simplest) or add the domain as a CloudFront alias with an ACM
   certificate (must be requested in `us-east-1` specifically - a
   CloudFront requirement regardless of which region everything else is
   in).
2. On the app instance (via SSM), install Certbot and get a certificate
   for the API domain, then uncomment/add the `443` server block in
   `docker/nginx/nginx.conf` pointing at it, and add `"443:443"` to
   `docker-compose.aws.yml`'s nginx service.
3. Update `CORS_ORIGINS` (the SSM parameter `ssm.tf` manages) and
   `VITE_API_BASE_URL` to the new HTTPS domain, re-deploy both.

## Costs, monitoring, and turning it off

- **Check current spend**: [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home).
- **The Budget alert** (`infra/aws/budget.tf`) emails `alert_email` if
  forecast spend crosses 80% of $100/month, and again if actual spend
  crosses 100%.
- **The CloudWatch alarm** (`infra/aws/ec2.tf`) emails the same address if
  the instance fails its own status checks.
- **To tear everything down** (stop being charged entirely):
  ```
  cd infra/aws
  terraform destroy
  ```
  RDS has `deletion_protection` on by default (a real precaution against
  an accidental destroy) - Terraform will refuse until you either add
  `-var` to disable it for this one run or edit `rds.tf`'s
  `deletion_protection` to `false` first. A final RDS snapshot is taken
  automatically either way (`skip_final_snapshot = false`), so the data
  isn't gone even after this. The state bucket in `bootstrap/` is
  deliberately not destroyed by this - it's a separate, tiny config, torn
  down the same way from `infra/aws/bootstrap/` if you ever want it gone
  too.

## Operations

Day-to-day procedures (migrations, `JWT_SECRET` rotation, restoring from
an RDS snapshot, viewing logs) are in `docs/RUNBOOK.md`'s AWS-specific
section - it points at the differences from the original Docker-only
runbook (SSM instead of SSH, RDS snapshots instead of `backup.sh`).

## Troubleshooting

- **`terraform apply` fails partway through.** Terraform is idempotent -
  fix whatever it reported and run `terraform apply` again; it only
  creates what's still missing.
- **`terraform destroy` on RDS fails with "cannot delete protected DB
  instance".** Expected - see "Costs, monitoring, and turning it off"
  above.
- **Jenkins' Deploy stage fails at "Deploy: verify".** The new container
  never reported healthy within a minute. `aws ssm start-session --target
  <instance_id>`, then `sudo docker compose -f
  /opt/vpro-skills/.../docker/docker-compose.aws.yml logs backend` to see
  why (commonly: a bad migration, or `fetch-secrets.sh` didn't find the
  SSM parameters yet because Part 1's `terraform apply` hasn't finished).
- **`fetch-secrets.sh` errors with "missing expected SSM parameters".**
  `infra/aws/ssm.tf` hasn't been applied yet, or `PROJECT_NAME`/
  `ENVIRONMENT` in the script's environment don't match what Terraform
  used (`vpro-skills`/`production` by default - only change one if you
  also changed the other).
- **Can't reach the app or Jenkins at all.** Check the instance's status
  in the EC2 console; check `aws ssm start-session --target <instance_id>`
  works (confirms the instance itself is up and the SSM agent is
  reporting in) before assuming the app is the problem.
