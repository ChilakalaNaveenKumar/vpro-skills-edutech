#!/usr/bin/env bash
# EC2 first-boot bootstrap (Amazon Linux 2023). Installs Docker + the
# Docker Compose plugin, then brings up Jenkins - the exact
# docker/jenkins/Dockerfile + docker/docker-compose.jenkins.yml already
# in this repo, embedded by Terraform (ec2.tf) so this instance always
# gets whatever is actually committed there, never a hand-maintained copy.
#
# The application backend itself is NOT started here - Jenkins' own
# pipeline builds and deploys it the first time it runs, once the user
# has finished the one-time GitHub/Jenkins wiring documented in
# docs/AWS_DEPLOYMENT.md. Nothing below needs a GitHub credential.
set -euo pipefail
exec > >(tee /var/log/vpro-user-data.log) 2>&1

echo "=== Installing Docker ==="
dnf update -y
dnf install -y docker git
systemctl enable --now docker

echo "=== Installing the Docker Compose CLI plugin ==="
mkdir -p /usr/local/lib/docker/cli-plugins
COMPOSE_VERSION="v2.29.7"
curl -fsSL \
  "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

echo "=== Booting Jenkins ==="
mkdir -p /opt/vpro-skills/jenkins/jenkins
echo "${jenkins_dockerfile_b64}" | base64 -d > /opt/vpro-skills/jenkins/jenkins/Dockerfile
echo "${jenkins_compose_b64}"    | base64 -d > /opt/vpro-skills/jenkins/docker-compose.yml

cd /opt/vpro-skills/jenkins
docker compose up -d --build

echo "=== user-data complete ==="
