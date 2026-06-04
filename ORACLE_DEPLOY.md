Oracle Cloud Always Free - Deploy Guide
=====================================

This file explains how to deploy Applica to an Oracle Cloud Always Free VM (Compute Instance).

Overview
- Create an Always Free VM (ARM or AMD) in Oracle Cloud with a public IP.
- Install Docker and Docker Compose on the VM.
- Use the included `docker-compose.oracle.yml` to run the `backend` and `frontend` containers.
- Use the GitHub Actions workflow to SSH to the VM and run `git pull` + `docker compose up --build` on pushes to `main`.

Requirements on the VM
- Ubuntu 22.04 (recommended) or similar Linux distro
- Public SSH access (from the GitHub Actions runner IPs) or allow the action to connect
- Docker installed and the `docker` command accessible to the deploy user
- `docker compose` (either plugin or v2) installed

Ports to open
- 80 (HTTP) — frontend
- 443 (HTTPS) — optional (set up TLS, not covered here)
- 8000 — backend (optional: you can place backend behind a reverse proxy)

GitHub Secrets you must add to the repository
- `ORACLE_HOST` — public IP or host of your Oracle VM
- `ORACLE_USER` — SSH username (e.g. ubuntu or opc)
- `ORACLE_SSH_PRIVATE_KEY` — private SSH key (PEM format) for the `ORACLE_USER` that has access to the VM

Quick steps
1. Provision a VM in Oracle Cloud (Always Free) and make note of its public IP.
2. On the VM run the setup script `scripts/oracle/setup-server.sh` (or follow its steps) to install Docker and clone this repo.
3. Add the GitHub Secrets listed above in the repository settings.
4. Push to `main`. The workflow `.github/workflows/deploy-oracle.yml` will SSH to the VM and update+restart the app.

Notes & troubleshooting
- If your repo is private, the workflow clones from GitHub inside the VM by using `git` and public clone URL; for private repos consider installing a deploy key on the VM or using the GitHub Actions runner to `scp` files instead.
- Ensure the deploy user can run `docker` without interactive sudo. If needed add the user to the `docker` group.
- This guide keeps the app behind Docker Compose for simplicity — if you prefer nginx reverse proxy or TLS, add an `nginx` service or use certbot on the VM.

If you want, I can prepare a small step-by-step terminal snippet to run on your Oracle VM and then run the workflow as soon as you add the secrets.
