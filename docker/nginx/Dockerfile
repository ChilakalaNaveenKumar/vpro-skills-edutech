# Bakes nginx.conf into the image at build time instead of bind-mounting
# it at runtime. Required because Jenkins runs "Docker outside of
# Docker" (docker/docker-compose.jenkins.yml bind-mounts the host's own
# /var/run/docker.sock) - any `docker compose` command issued from
# inside the Jenkins container is actually executed by the HOST's own
# Docker daemon, which resolves bind-mount source paths against its OWN
# filesystem, not the Jenkins container's workspace. A relative bind
# mount like "./nginx/nginx.conf:/etc/nginx/nginx.conf" therefore points
# at a path that doesn't exist on the host, which silently creates an
# empty directory there and then fails to start the container ("not a
# directory"). Baking the file in at build time (like backend/Dockerfile
# already does for its own app code) sidesteps this entirely - the
# config becomes part of the built image instead of a host path
# reference. See docs/AWS_DEPLOYMENT.md's Troubleshooting section.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
