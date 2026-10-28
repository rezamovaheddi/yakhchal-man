// CI-only helper: points the release buildType at a real keystore when the
// ANDROID_KEYSTORE_BASE64 secret is provided (decoded earlier in the workflow
// to android/app/release.keystore). Without the secret it exits 0 and the
// build keeps the template debug key — same as before, just loudly.
const fs = require('fs');
const path = require('path');

const gradlePath = path.join('android', 'app', 'build.gradle');

if (!process.env.ANDROID_KEYSTORE_BASE64) {
  console.warn(
    '⚠️  ANDROID_KEYSTORE_BASE64 secret is not set — the release APK will be ' +
      'signed with the well-known template debug key. Add the ANDROID_KEYSTORE_BASE64, ' +
      'ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD secrets ' +
      'to sign releases properly.'
  );
  process.exit(0);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (gradle.includes('signingConfig signingConfigs.release')) {
  console.log('release signingConfig already applied — skipping.');
  process.exit(0);
}

const releaseSigningEntry = [
  '        release {',
  "            storeFile file(System.getenv('KEYSTORE_FILE') ?: 'release.keystore')",
  "            storePassword System.getenv('KEYSTORE_PASSWORD')",
  "            keyAlias System.getenv('KEY_ALIAS')",
  "            keyPassword System.getenv('KEY_PASSWORD')",
  '        }',
].join('\n');

// 1. Add the release entry inside the signingConfigs block.
const configsIdx = gradle.indexOf('signingConfigs {');
if (configsIdx === -1) {
  console.error('❌ Could not find signingConfigs block in build.gradle');
  process.exit(1);
}
gradle =
  gradle.slice(0, configsIdx + 'signingConfigs {'.length) +
  '\n' +
  releaseSigningEntry +
  gradle.slice(configsIdx + 'signingConfigs {'.length);

// 2. Point the release buildType (the occurrence after buildTypes) at it.
const buildTypesIdx = gradle.indexOf('buildTypes');
const releaseBlockIdx = gradle.indexOf('release {', buildTypesIdx);
if (buildTypesIdx === -1 || releaseBlockIdx === -1) {
  console.error('❌ Could not find release buildType in build.gradle');
  process.exit(1);
}
const before = gradle.slice(0, releaseBlockIdx);
const withinRelease = gradle.slice(releaseBlockIdx);
if (!withinRelease.includes('signingConfig signingConfigs.debug')) {
  console.error('❌ Expected debug signingConfig inside release buildType');
  process.exit(1);
}
gradle =
  before +
  withinRelease.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');

fs.writeFileSync(gradlePath, gradle);
console.log('✅ release signingConfig applied — APK will be signed with the CI-provided keystore.');
