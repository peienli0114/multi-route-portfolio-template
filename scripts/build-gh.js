#!/usr/bin/env node
const { spawn } = require('child_process');

// ▶ Change 'your-repo-name' to match your GitHub repository name
const REPO_NAME = 'your-repo-name';

const command = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
const args = ['build'];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: { ...process.env, PUBLIC_URL: `/${REPO_NAME}` },
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
