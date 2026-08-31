# CI/CD: GitHub -> Jenkins -> Docker

This is the step-by-step walkthrough for getting this project onto GitHub
and building it automatically with Jenkins on every push, using Docker
images the pipeline builds itself. It's written to be run **locally
first** (Jenkins in Docker on your own machine) so you can see the whole
pipeline work before anything touches AWS.

A few things worth knowing up front:

- **Every step that needs your GitHub login, a token, or any other
  credential is something you run yourself**, in your own terminal or
  browser - never pasted into chat, never typed by Claude. Claude prepared
  all the files below; the connecting steps (creating the repo, creating a
  token, logging in, pushing) are yours to run.
- GitHub retired plain password logins for git years ago. Wherever a
  password is asked for during a `git push`, you'll use a **Personal
  Access Token (PAT)**, not your account password - see Part 1.
- Jenkins itself runs in Docker via `docker compose`, and that command
  needs to be run from **your own Mac Terminal**, not through this
  session - this sandbox doesn't have the Docker CLI (same limitation
  noted in `docs/RUNBOOK.md`).

## Part 1 - Push this code to GitHub

1. **Create the repository.** Go to https://github.com/new while signed
   in. Pick a name (e.g. `vpro-skills-edutech`), leave it empty - do
   **not** check "Add a README", "Add .gitignore", or "Choose a license"
   (this project already has all three; letting GitHub create its own
   would conflict with the first push). Create the repository, then copy
   its HTTPS URL, e.g. `https://github.com/<your-username>/vpro-skills-edutech.git`.

2. **Create a Personal Access Token (PAT).** Go to
   https://github.com/settings/tokens -> "Generate new token" ->
   "Generate new token (classic)" is the simplest option. Give it a name
   like `vpro-skills-push`, an expiration you're comfortable with, and
   check the **`repo`** scope. Generate it and copy the token somewhere
   safe (a password manager) - GitHub only shows it once.

3. **Push the code**, from your own Mac Terminal (not this chat), in the
   project folder:

   ```
   cd ~/Desktop/LMS
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<your-username>/vpro-skills-edutech.git
   git branch -M main
   git push -u origin main
   ```

   When it prompts for a username, enter your GitHub username. When it
   prompts for a password, paste the **PAT from step 2** (not your account
   password - it won't work, and pasting your real password into a git
   prompt trains you to paste it places you shouldn't). macOS may offer to
   save it in Keychain so you're not asked again.

   > If Claude already ran `git add`/`git commit` for you in this session,
   > skip straight to `git remote add` and `git push`.

## Part 2 - Run Jenkins locally

This repo includes `docker/docker-compose.jenkins.yml`, which builds a
Jenkins image with Python, Node.js, and the Docker CLI already installed
(see `docker/jenkins/Dockerfile`) - everything this project's `Jenkinsfile`
needs.

From your own Mac Terminal:

```
cd ~/Desktop/LMS
docker compose -f docker/docker-compose.jenkins.yml up -d --build
```

The first build takes a few minutes (it's installing Node/Python/Docker
CLI into the image). Once it's up:

1. Open http://localhost:8080 in your browser.
2. It will ask for an "initial admin password". Get it with:
   ```
   docker compose -f docker/docker-compose.jenkins.yml exec jenkins \
     cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. On the "Customize Jenkins" screen, either option is fine - "Install
   suggested plugins" works, or you can skip it, since the plugins this
   pipeline actually needs (Pipeline, Git, Credentials Binding, GitHub)
   are already baked into the image.
4. Create your first admin user when prompted.

## Part 3 - Add credentials to Jenkins

This step is entirely inside the Jenkins web UI you just logged into -
Claude never sees or handles these values.

Go to **Manage Jenkins -> Credentials -> System -> Global credentials ->
Add Credentials**:

- **Docker Hub** (only needed if you want the pipeline's optional image
  push step): Kind = "Username with password", Username = your Docker Hub
  username, Password = a Docker Hub access token (Docker Hub -> Account
  Settings -> Security -> New Access Token; don't use your Docker Hub
  account password here either). Set the **ID** field to exactly
  `dockerhub-credentials` - the `Jenkinsfile` looks for that ID by name.

- **GitHub** (only needed if the repo is private): Kind = "Username with
  password", Username = your GitHub username, Password = the same PAT
  from Part 1. Give it an ID like `github-credentials`.

## Part 4 - Create the pipeline job

1. Jenkins dashboard -> **New Item**.
2. Name it (e.g. `vpro-skills-edutech`), select **Pipeline**, click OK.
3. Under **Build Triggers**, check **"GitHub hook trigger for GITScm
   polling"** (this is what makes a push auto-start a build - Part 5
   wires up the other end of it).
4. Under **Pipeline**, set:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: your repo's HTTPS URL from Part 1
   - Credentials: the `github-credentials` entry from Part 3 (only needed
     for a private repo - leave as "none" for a public one)
   - Branches to build: `*/main`
   - Script Path: `Jenkinsfile` (default, already correct)
5. Save.
6. Click **Build Now** once to confirm it runs end-to-end (backend
   tests -> web build -> Docker image build) before wiring up the
   automatic trigger.

## Part 5 - Wire up the GitHub webhook (via ngrok)

GitHub needs a public URL to send push notifications to. Since Jenkins is
running on your own Mac, it isn't reachable from the internet by default -
`ngrok` gives it a temporary public URL.

From your own Mac Terminal (ngrok's account/auth step needs to be run by
you, same reasoning as the GitHub token above):

1. Install ngrok: `brew install ngrok` (or download from ngrok.com).
2. Sign up for a free ngrok account if you don't have one, then follow
   ngrok's own instructions to connect your account
   (`ngrok config add-authtoken <your-token>` - run this yourself; it's
   the same category of credential as the GitHub token).
3. Start the tunnel:
   ```
   ngrok http 8080
   ```
4. Copy the `https://....ngrok-free.app` forwarding URL it prints.

Then, on GitHub: your repo -> **Settings -> Webhooks -> Add webhook**:

- Payload URL: `https://<your-ngrok-url>/github-webhook/` (the trailing
  slash matters)
- Content type: `application/json`
- Which events: "Just the push event"
- Active: checked

Save it. GitHub will send a test ping immediately - the webhook's "Recent
Deliveries" tab shows whether Jenkins responded.

> **Free ngrok's URL changes every time you restart it.** Each new ngrok
> session means updating the Payload URL in GitHub's webhook settings.
> This is fine for testing the pipeline locally; once this moves to AWS
> (see Part 7), Jenkins will have a stable address and this step goes
> away.

## Part 6 - Test the whole pipeline

From your own Mac Terminal, make any small change, then:

```
git add .
git commit -m "Test CI trigger"
git push
```

Within a few seconds, a new build should start automatically on the
Jenkins job's page. Click into it -> **Console Output** to watch the
backend tests, web build, and Docker image build run live.

## Part 7 - Turning on the optional Docker Hub push

Once `dockerhub-credentials` exists (Part 3), go to the job -> **Build
with Parameters** -> check `PUSH_TO_DOCKERHUB` -> Build. The pipeline will
tag and push `<your-dockerhub-username>/vpro-skills-backend:<build-number>`
and `:latest`. Leave the parameter unchecked (the default) for a normal
CI run that just builds and tests.

## Part 8 - Future: deploying to AWS

Not implemented yet, deliberately - this pipeline is meant to prove itself
locally first. When AWS is ready, the natural next steps are:

- Push the backend image to **Amazon ECR** instead of (or alongside)
  Docker Hub, authenticated via an AWS IAM credential stored in Jenkins
  (or better, once Jenkins itself runs on AWS: an instance role, no
  long-lived key in Jenkins at all).
- Add a real **Deploy** stage in place of the current placeholder in
  `Jenkinsfile` - for example `aws ecs update-service
  --force-new-deployment` for an ECS/Fargate service, or a `kubectl`/
  `eksctl` rollout for EKS.
- Move Jenkins itself off your Mac and onto a small EC2 instance (or use
  AWS's own CodeBuild/CodePipeline instead of self-hosted Jenkins) so it
  has a stable, always-on public URL - removing the ngrok step from
  Part 5 entirely.

This doc will get a Part 9 covering the concrete AWS steps once that phase
starts.

## Troubleshooting

- **`docker build` inside a Jenkins build fails with a permission error
  talking to `/var/run/docker.sock`.** The compose file already runs the
  Jenkins container as root specifically to avoid this (see the comment
  in `docker/docker-compose.jenkins.yml`); if it still happens, restart
  Docker Desktop and re-run `docker compose -f
  docker/docker-compose.jenkins.yml up -d --build`.
- **Port 8080 already in use.** Something else on your Mac is using it;
  either stop that process or change the `"8080:8080"` mapping in
  `docker/docker-compose.jenkins.yml` to e.g. `"8081:8080"` and use that
  port instead.
- **GitHub's webhook "Recent Deliveries" shows a failed/red delivery.**
  Usually means the ngrok tunnel isn't running, the ngrok URL in the
  webhook is stale (Part 5's free-tier caveat), or the trailing
  `/github-webhook/` slash is missing from the Payload URL.
- **The web build stage fails with a native-binding error
  (rolldown/oxlint).** This is the same class of issue noted in project
  memory for `npm run build`/`lint` inside this sandbox's own Linux VM -
  it should **not** happen inside the Jenkins container, since that
  container gets a clean `npm ci` on Linux from scratch. If it does
  happen there too, delete `web/node_modules` from the repo before
  pushing (it should already be gitignored - see `.gitignore`) so Jenkins
  always installs its own clean copy rather than reusing anything built
  on your Mac.
