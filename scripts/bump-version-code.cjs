// CI-only helper: keeps every released APK installable over the previous one.
// versionCode must grow monotonically, so it is derived from the workflow run
// number. On tag pushes, expo.version is also synced from the tag so
// app.json, package.json and the in-app update checker never drift apart.
const fs = require('fs');

const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
const ref = process.env.GITHUB_REF || '';

if (process.env.GITHUB_REF_TYPE === 'tag' && ref.startsWith('refs/tags/v')) {
  const tagVersion = ref.replace('refs/tags/v', '');
  app.expo.version = tagVersion;
  console.log(`expo.version synced from tag: ${tagVersion}`);
}

const runNumber = parseInt(process.env.GITHUB_RUN_NUMBER || '', 10);
if (Number.isFinite(runNumber) && runNumber > 0) {
  app.expo.android.versionCode = runNumber;
  console.log(`versionCode set to ${runNumber} (from GITHUB_RUN_NUMBER)`);
} else {
  app.expo.android.versionCode = (app.expo.android.versionCode || 1) + 1;
  console.log(`versionCode bumped to ${app.expo.android.versionCode}`);
}

fs.writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
console.log(`✅ app.json: version=${app.expo.version}, versionCode=${app.expo.android.versionCode}`);
