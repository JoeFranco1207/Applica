const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

async function copyDir(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`Source not found: ${src}`);
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const frontendDir = path.join(repoRoot, 'frontend');
  console.log('Building frontend in', frontendDir);
  run('npm', ['ci'], { cwd: frontendDir });
  run('npm', ['run', 'build'], { cwd: frontendDir });
  const src = path.join(frontendDir, 'dist');
  const dest = path.join(repoRoot, 'dist');
  console.log(`Copying ${src} -> ${dest}`);
  copyDir(src, dest).then(() => {
    console.log('Copied dist to repo root.');
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
