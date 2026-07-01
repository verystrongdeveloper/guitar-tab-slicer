import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const target = process.argv[2] || 'portable';
const projectRoot = process.cwd();
const tempOutput = path.join(os.tmpdir(), 'guitar-tab-slicer-release');
const releaseOutput = path.join(projectRoot, 'release');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function copyTopLevelArtifacts() {
  await fs.rm(releaseOutput, { recursive: true, force: true });
  await fs.mkdir(releaseOutput, { recursive: true });

  const entries = await fs.readdir(tempOutput, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    await fs.copyFile(path.join(tempOutput, entry.name), path.join(releaseOutput, entry.name));
  }
}

await fs.rm(tempOutput, { recursive: true, force: true });
const builderCli = path.join(projectRoot, 'node_modules', 'electron-builder', 'cli.js');
await run(process.execPath, [
  builderCli,
  '--win',
  target,
  `--config.directories.output=${tempOutput}`
]);
await copyTopLevelArtifacts();
console.log(`Copied Windows build artifacts to ${releaseOutput}`);
