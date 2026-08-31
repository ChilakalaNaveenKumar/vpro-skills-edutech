# Jenkins controller with everything this project's Jenkinsfile needs:
# python3 (backend pytest stage), Node.js 20 (web build/lint stage), the
# Docker CLI + Compose plugin (talks to the *host's* Docker daemon via
# the docker.sock bind-mount in docker-compose.jenkins.yml - "Docker
# outside of Docker", so no Docker-in-Docker / privileged mode is
# needed), and the AWS CLI v2 (ECR login/push and docker/fetch-secrets.sh
# both need it - authenticated via the EC2 instance's IAM role at
# runtime, see infra/aws/iam.tf, never a stored AWS key in this image).
FROM jenkins/jenkins:lts-jdk17

USER root

# Docker CLI + Compose plugin (not the full engine/daemon - we talk to
# the host's). docker-compose-plugin gives the `docker compose` subcommand
# the AWS Deploy stage uses against docker/docker-compose.aws.yml.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl gnupg unzip \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# AWS CLI v2 - official installer (no apt package for v2). Used for the
# ECR login in the Deploy stage and by docker/fetch-secrets.sh; both rely
# on the EC2 instance's IAM role for credentials at runtime, never a key
# baked into this image.
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(dpkg --print-architecture | sed 's/amd64/x86_64/;s/arm64/aarch64/').zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws

# Python 3 + venv, for the backend test stage.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20, for the web build/lint stage.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

USER jenkins

# Bake in exactly the plugins the Jenkinsfile needs, so a fresh Jenkins
# doesn't depend on the setup wizard's "suggested plugins" selection:
#   workflow-aggregator  - Pipeline (the `pipeline { ... }` syntax itself)
#   git                  - checkout scm against a git/GitHub repo
#   credentials-binding  - withCredentials(...) for the Docker Hub push stage
#   github               - GitHub webhook trigger support
RUN jenkins-plugin-cli --plugins "workflow-aggregator git credentials-binding github"
