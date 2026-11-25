import { describe, test, expect, jest } from '@jest/globals';
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

  test('CURRENT_APP_VERSION is 1.5.1', () => {
    expect(CURRENT_APP_VERSION).toBe('1.5.1');
  });

  test('checkForAppUpdates handles successful fetch with newer version', async () => {
    const mockRelease = {
      tag_name: 'v2.0.0',
      name: 'یخچال من نسخه ۲.۰.۰',
      body: 'بهبود رتبه‌بندی غذا و به‌روزرسانی درون‌برنامه‌ای',
      published_at: '2026-10-18T10:00:00Z',
      html_url: 'https://github.com/rezamovaheddi/yakhchal-man/releases/tag/v2.0.0',
      assets: [
        {
          name: 'yakhchal-man.apk',
          browser_download_url: 'https://github.com/rezamovaheddi/yakhchal-man/releases/download/v2.0.0/app.apk',
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
    expect(res.latestRelease?.version).toBe('2.0.0');
    expect(res.latestRelease?.title).toBe('یخچال من نسخه ۲.۰.۰');
    expect(res.latestRelease?.downloadUrl).toBe(
      'https://github.com/rezamovaheddi/yakhchal-man/releases/download/v2.0.0/app.apk'
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

  test('openUpdatePage opens valid https URL and rejects invalid URLs', async () => {
    const { openUpdatePage } = await import('../utils/updateService');

    const okResult = await openUpdatePage('https://github.com/rezamovaheddi/yakhchal-man/releases');
    expect(okResult.success).toBe(true);

    const badResult = await openUpdatePage('javascript:alert(1)');
    expect(badResult.success).toBe(false);
    expect(badResult.error).toBeDefined();
  });
});
