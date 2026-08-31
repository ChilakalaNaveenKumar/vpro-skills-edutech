// VPro Skills EduTech - CI/CD pipeline.
//
// Runs on a Jenkins controller built from docker/jenkins/Dockerfile
// (jenkins/jenkins:lts-jdk17 + python3/pip/venv, Node.js 20, the Docker
// CLI + Compose plugin, and the AWS CLI v2). That image's Docker CLI
// talks to the *host's* Docker daemon via the docker.sock bind-mount in
// docker/docker-compose.jenkins.yml ("Docker outside of Docker") - so
// `docker build` below builds real images on the host, no extra plugin
// required beyond what Jenkins' own "suggested plugins" install
// (Pipeline, Git, Credentials Binding).
//
// This controller itself now runs on the AWS app instance (infra/aws/),
// colocated with the running app - see docs/ARCHITECTURE.md's "AWS
// Deployment" section for why. The Deploy stage below pushes to ECR and
// deploys via `docker compose`, both authenticated by that instance's
// IAM role (infra/aws/iam.tf) - no AWS access key is stored in Jenkins
// for this. See docs/AWS_DEPLOYMENT.md for the full setup walkthrough
// (GitHub push, Jenkins first run, credentials, the GitHub webhook) and
// docs/CICD.md for the superseded local-Mac/ngrok version of this file's
// history.

pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    parameters {
        // Off by default so a brand-new Jenkins with no Docker Hub
        // credential configured yet still runs green end-to-end. Flip to
        // true once "dockerhub-credentials" exists (docs/CICD.md).
        booleanParam(
            name: 'PUSH_TO_DOCKERHUB',
            defaultValue: false,
            description: 'Push the built backend image to Docker Hub (requires the "dockerhub-credentials" Jenkins credential).'
        )
    }

    environment {
        BACKEND_IMAGE = 'vpro-skills-backend'
        IMAGE_TAG     = "${env.BUILD_NUMBER}"
        // Populated by `terraform output` after infra/aws/ has been
        // applied - see docs/AWS_DEPLOYMENT.md. Configured once as
        // Jenkins global environment variables (Manage Jenkins > System),
        // not hardcoded here, since they're per-deployment values.
        // ECR_REPOSITORY_URL: e.g. <account>.dkr.ecr.<region>.amazonaws.com/vpro-skills-backend
        // AWS_REGION: the region infra/aws/ was deployed into
    }

    stages {
        stage('Backend: install & test') {
            steps {
                dir('backend') {
                    sh '''
                        set -e
                        python3 -m venv .ci-venv
                        . .ci-venv/bin/activate
                        pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt
                        pytest -v
                    '''
                }
            }
        }

        stage('Web: install, typecheck & build') {
            steps {
                dir('web') {
                    sh '''
                        set -e
                        npm ci
                        npm run lint
                        npm run build
                    '''
                }
            }
        }

        stage('Docker: build backend image') {
            steps {
                dir('backend') {
                    sh '''
                        set -e
                        docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest .
                    '''
                }
            }
        }

        stage('Docker: push backend image') {
            when {
                expression { return params.PUSH_TO_DOCKERHUB }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_PASS'
                )]) {
                    sh '''
                        set -e
                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} $DOCKERHUB_USER/${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} $DOCKERHUB_USER/${BACKEND_IMAGE}:latest
                        docker push $DOCKERHUB_USER/${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push $DOCKERHUB_USER/${BACKEND_IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy: push to ECR') {
            steps {
                dir('backend') {
                    sh '''
                        set -e
                        aws ecr get-login-password --region "${AWS_REGION}" \
                            | docker login --username AWS --password-stdin "${ECR_REPOSITORY_URL%%/*}"
                        docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${ECR_REPOSITORY_URL}:${IMAGE_TAG}
                        docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${ECR_REPOSITORY_URL}:latest
                        docker push ${ECR_REPOSITORY_URL}:${IMAGE_TAG}
                        docker push ${ECR_REPOSITORY_URL}:latest
                    '''
                }
            }
        }

        stage('Deploy: roll out on this instance') {
            steps {
                dir('docker') {
                    // Fetches JWT_SECRET/DATABASE_URL/CORS_ORIGINS fresh
                    // from SSM Parameter Store into backend/.env on every
                    // deploy (docker/fetch-secrets.sh) - authenticated by
                    // this instance's IAM role, no AWS key stored here.
                    // Jenkins is colocated with the running app (see the
                    // file header above), so this is a direct `docker
                    // compose` call against the host's Docker daemon, not
                    // a remote SSH/SSM round-trip.
                    sh '''
                        set -e
                        ./fetch-secrets.sh
                        ECR_IMAGE="${ECR_REPOSITORY_URL}:${IMAGE_TAG}" docker compose -f docker-compose.aws.yml pull backend
                        ECR_IMAGE="${ECR_REPOSITORY_URL}:${IMAGE_TAG}" docker compose -f docker-compose.aws.yml up -d --build
                    '''
                }
            }
        }

        stage('Deploy: verify') {
            steps {
                // Real smoke test, not just "the deploy command exited
                // 0" - fails the build (and leaves the previous
                // container running, since `up -d` only replaces a
                // container once its replacement is healthy per this
                // service's own HEALTHCHECK) if the new deployment never
                // comes up healthy.
                sh '''
                    set -e
                    for i in $(seq 1 12); do
                        if curl -fsS http://localhost/health; then
                            echo ""
                            echo "Deploy verified healthy."
                            exit 0
                        fi
                        echo "Waiting for the app to report healthy (attempt $i/12)..."
                        sleep 5
                    done
                    echo "Deploy did not become healthy in time - failing the build." >&2
                    exit 1
                '''
            }
        }

        stage('Deploy: web app') {
            // Builds and publishes web/ to S3 + CloudFront on every
            // build, right here on the instance - so a plain `git push`
            // is the only step needed for the website too, not a manual
            // `npm run build` + `aws s3 sync` run by hand from someone's
            // own laptop. Needs three Jenkins global environment
            // variables set once (Manage Jenkins > System > Global
            // properties, same place as ECR_REPOSITORY_URL/AWS_REGION -
            // see docs/AWS_DEPLOYMENT.md): CLOUDFRONT_DOMAIN,
            // WEB_BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID (all three from
            // `terraform output` in infra/aws/). Authenticated by this
            // instance's own IAM role (infra/aws/iam.tf's
            // aws_iam_role_policy.web_deploy) - no AWS key stored here.
            steps {
                dir('web') {
                    sh '''
                        set -e
                        npm ci
                        echo "VITE_API_BASE_URL=https://${CLOUDFRONT_DOMAIN}" > .env
                        npm run build
                        aws s3 sync dist/ "s3://${WEB_BUCKET_NAME}" --delete
                        aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" --paths "/*"
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Build ${env.BUILD_NUMBER} finished with status: ${currentBuild.currentResult}"
        }
        cleanup {
            sh 'rm -rf backend/.ci-venv'
        }
    }
}
