import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { compareVersions, checkForAppUpdates, CURRENT_APP_VERSION } from '../utils/updateService';

describe('updateService', () => {
  test('compareVersions accurately compares semver strings', () => {
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
    expect(compareVersions('1.1.0', '1.1.0')).toBe(0);
    expect(compareVersions('v2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.1.1', '1.1.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.1.1')).toBe(-1);
  });

  test('CURRENT_APP_VERSION is 1.4.0', () => {
    expect(CURRENT_APP_VERSION).toBe('1.4.0');
  });

  test('checkForAppUpdates handles successful fetch with newer version', async () => {
    const mockRelease = {
      tag_name: 'v1.5.0',
      name: 'یخچال من نسخه ۱.۵.۰',
      body: 'بهبود رتبه‌بندی غذا و به‌روزرسانی درون‌برنامه‌ای',
      published_at: '2026-10-18T10:00:00Z',
      html_url: 'https://github.com/rezamovaheddi/yakhchal-man/releases/tag/v1.5.0',
      assets: [
        {
          name: 'yakhchal-man.apk',
          browser_download_url: 'https://github.com/rezamovaheddi/yakhchal-man/releases/download/v1.5.0/app.apk',
        },
      ],
    };

    // Mock global fetch
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRelease),
      })
    );

    const res = await checkForAppUpdates();
    expect(res.updateAvailable).toBe(true);
    expect(res.latestRelease?.version).toBe('1.5.0');
    expect(res.latestRelease?.title).toBe('یخچال من نسخه ۱.۵.۰');
    expect(res.latestRelease?.downloadUrl).toBe(
      'https://github.com/rezamovaheddi/yakhchal-man/releases/download/v1.5.0/app.apk'
    );
  });

  test('checkForAppUpdates handles current version equal or newer', async () => {
    const mockRelease = {
      tag_name: 'v1.4.0',
      name: 'یخچال من نسخه ۱.۴.۰',
      body: 'نسخه فعلی',
      html_url: 'https://github.com/rezamovaheddi/yakhchal-man/releases/tag/v1.4.0',
    };

    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRelease),
      })
    );

    const res = await checkForAppUpdates();
    expect(res.updateAvailable).toBe(false);
  });

  test('checkForAppUpdates handles 404 (no releases published yet)', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    const res = await checkForAppUpdates();
    expect(res.updateAvailable).toBe(false);
    expect(res.error).toBeUndefined();
  });

  test('checkForAppUpdates handles network error gracefully', async () => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const res = await checkForAppUpdates();
    expect(res.updateAvailable).toBe(false);
    expect(res.error).toBeDefined();
  });

  test('downloadAndInstallApk handles fallback or error gracefully', async () => {
    const { downloadAndInstallApk } = await import('../utils/updateService');
    const result = await downloadAndInstallApk('https://invalid-host-for-testing/app.apk');
    expect(typeof result.success).toBe('boolean');
  });
});
