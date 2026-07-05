import fs from 'node:fs';

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
  throw new Error('Missing npm_package_version. Run this through npm version.');
}

const manifestPath = 'manifest.json';
const versionsPath = 'versions.json';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));

manifest.version = targetVersion;
versions[targetVersion] = manifest.minAppVersion;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(versionsPath, `${JSON.stringify(versions, null, 2)}\n`);
