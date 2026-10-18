import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { AppReleaseInfo } from '../types';

export const CURRENT_APP_VERSION = '1.1.0';

// GitHub repository info for fetching latest release
const GITHUB_OWNER = 'rezamovaheddi';
const GITHUB_REPO = 'yakhchal-man';
const GITHUB_API_LATEST_RELEASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/**
 * Compares two semantic version strings (e.g. "1.2.0" > "1.1.0").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Checks GitHub for the latest release of the application.
 * Returns AppReleaseInfo if a newer version is available, or null if current is up-to-date.
 */
export async function checkForAppUpdates(): Promise<{
  updateAvailable: boolean;
  currentVersion: string;
  latestRelease: AppReleaseInfo | null;
  error?: string;
}> {
  try {
    const response = await fetch(GITHUB_API_LATEST_RELEASE, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'YakhchalMan-App',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No releases published yet on github
        return {
          updateAvailable: false,
          currentVersion: CURRENT_APP_VERSION,
          latestRelease: null,
        };
      }
      return {
        updateAvailable: false,
        currentVersion: CURRENT_APP_VERSION,
        latestRelease: null,
        error: `خطا در برقراری ارتباط با سرور به‌روزرسانی (کد ${response.status})`,
      };
    }

    const data = await response.json();
    const latestTag = data.tag_name || data.name || '1.0.0';
    const latestVersion = latestTag.replace(/^v/, '');

    // Look for apk or asset download if present
    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find((asset: { name?: string; browser_download_url?: string }) =>
          asset.name?.endsWith('.apk')
        )
      : null;

    const releaseInfo: AppReleaseInfo = {
      version: latestVersion,
      title: data.name || `نسخه ${latestVersion}`,
      releaseNotes: data.body || 'تغییرات و بهبودهای جدید در این نسخه اعمال شده است.',
      publishedAt: data.published_at
        ? new Date(data.published_at).toLocaleDateString('fa-IR')
        : '',
      downloadUrl: apkAsset?.browser_download_url || undefined,
      webUrl: data.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      isMandatory: data.body?.includes('[mandatory]') || false,
    };

    const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

    return {
      updateAvailable: isNewer,
      currentVersion: CURRENT_APP_VERSION,
      latestRelease: releaseInfo,
    };
  } catch (err) {
    console.warn('[updateService] Failed to check for updates:', err);
    return {
      updateAvailable: false,
      currentVersion: CURRENT_APP_VERSION,
      latestRelease: null,
      error: 'امکان اتصال به اینترنت جهت بررسی به‌روزرسانی فراهم نیست.',
    };
  }
}

/**
 * Downloads the APK directly inside the app with real-time percentage callback,
 * converts the file to a secure Android content URI via FileProvider, and triggers
 * the native package installer intent without opening a browser or GitHub web page.
 */
export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (percentage: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS !== 'android') {
      // If running on web or iOS, fallback to opening URL directly
      await Linking.openURL(apkUrl);
      return { success: true };
    }

    const fileName = `yakhchal-man-update-${Date.now()}.apk`;
    const targetFileUri = `${FileSystem.cacheDirectory}${fileName}`;

    let lastReportedPercent = 0;
    const progressCallback = (data: FileSystem.DownloadProgressData) => {
      if (data.totalBytesExpectedToWrite > 0) {
        const percent = Math.min(100, Math.round((data.totalBytesWritten / data.totalBytesExpectedToWrite) * 100));
        if (percent > lastReportedPercent) {
          lastReportedPercent = percent;
          onProgress?.(percent);
        }
      }
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      targetFileUri,
      {},
      progressCallback
    );

    const downloadResult = await downloadResumable.downloadAsync();
    if (!downloadResult || downloadResult.status !== 200) {
      throw new Error(`خطا در دانلود فایل به‌روزرسانی (کد وضعیت: ${downloadResult?.status || 'نامشخص'})`);
    }

    onProgress?.(100);

    // Convert local file URI to Android content URI using FileProvider
    const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);

    // Launch package installer intent with FLAG_GRANT_READ_URI_PERMISSION (1)
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: 'application/vnd.android.package-archive',
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });

    return { success: true };
  } catch (err: any) {
    console.warn('[updateService] In-app install error:', err);
    return {
      success: false,
      error: err?.message || 'خطا در دانلود یا راه‌اندازی فرآیند نصب بسته.',
    };
  }
}
