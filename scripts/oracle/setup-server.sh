#!/usr/bin/env bash
set -euo pipefail

# Run on the Oracle VM as a quick setup (Ubuntu/Debian)
# Usage: sudo bash setup-server.sh

# install tools
apt-get update
apt-get install -y git curl ca-certificates gnupg lsb-release

# install docker
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
fi

# enable docker for current user (if you have a non-root user, add them instead of root)
if command -v usermod >/dev/null 2>&1 && [ "$(id -u)" -ne 0 ]; then
  sudo usermod -aG docker $(whoami) || true
fi

# install docker compose plugin if missing
if ! docker compose version >/dev/null 2>&1; then
  apt-get update
  apt-get install -y docker-compose-plugin
fi

# prepare app directory
mkdir -p ~/app
cd ~/app
if [ ! -d .git ]; then
  git clone https://github.com/JoeFranco1207/Applica.git .
else
  git fetch --all
  git reset --hard origin/main
fi

# bring up services
docker compose -f docker-compose.oracle.yml up -d --build

echo "Setup complete. Application should be running."
