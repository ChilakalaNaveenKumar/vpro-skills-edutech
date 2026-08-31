// VPro Skills EduTech - CI/CD pipeline.
//
// Runs on a Jenkins controller built from docker/jenkins/Dockerfile
// (jenkins/jenkins:lts-jdk17 + python3/pip/venv, Node.js 20, and the
// Docker CLI). That image's Docker CLI talks to the *host's* Docker
// daemon via the docker.sock bind-mount in
// docker/docker-compose.jenkins.yml ("Docker outside of Docker") - so
// `docker build` below builds real images on the host, no extra plugin
// required beyond what Jenkins' own "suggested plugins" install
// (Pipeline, Git, Credentials Binding).
//
// See docs/CICD.md for the full setup walkthrough (GitHub push, Jenkins
// first run, credentials, the GitHub webhook via ngrok).

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

        stage('Deploy (placeholder - AWS, future)') {
            steps {
                echo 'AWS deployment is not wired up yet. When ready: push the image to ECR ' +
                     'instead of/alongside Docker Hub, then add a step here such as ' +
                     '"aws ecs update-service --force-new-deployment" (ECS) or a kubectl/eksctl ' +
                     'rollout (EKS). Keep this a separate stage so it stays easy to swap in.'
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
