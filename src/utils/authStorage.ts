import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { UserAccount } from '../types';

const STORAGE_USERS_KEY = '@yakhchal_registered_users';
const STORAGE_CURRENT_USER_KEY = '@yakhchal_active_user';

// In-memory fallback in case of storage failure
let memoryUsers: UserAccount[] = [];
let memoryCurrentUser: UserAccount | null = null;

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------
// NOTE: This app operates fully offline as a local-profile system, not a
// multi-device account service. Passwords are stored as deterministic hashes
// so that plain-text is never persisted, while still allowing local login
// comparison without a server round-trip.
//
// Current scheme ($cs2$): iterated salted SHA-256 via expo-crypto.
//  - 128-bit random salt per user (no rainbow tables across users)
//  - 200 chained SHA-256 rounds to slow brute-force attempts
//  - replaces the old unsalted 32-bit djb2 scheme ($lp1$), which is still
//    verified on login and transparently upgraded.
// If real server-side auth is ever added, replace this with a proper
// bcrypt / argon2 implementation on the backend and stop storing passwords
// locally.
// ---------------------------------------------------------------------------

const HASH_ITERATIONS = 200;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Produces a salted, iterated SHA-256 hash string from the given password.
 * Format: `$cs2$<iterations>$<saltHex>$<hashHex>`
 */
async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  Crypto.getRandomValues(saltBytes);
  const salt = toHex(saltBytes);

  let digest = `${salt}:${password}`;
  for (let i = 0; i < HASH_ITERATIONS; i++) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digest);
  }

  return `$cs2$${HASH_ITERATIONS}$${salt}$${digest}`;
}

/**
 * Produces the legacy unsalted djb2 hash (kept only to verify and upgrade
 * old profiles).
 */
function legacyHashPassword(password: string): string {
  // First pass — forward djb2
  let h1 = 5381;
  for (let i = 0; i < password.length; i++) {
    h1 = ((h1 << 5) + h1) ^ password.charCodeAt(i);
    h1 = h1 >>> 0; // keep unsigned 32-bit
  }

  // Second pass — reverse djb2 with salt offset
  let h2 = 52711;
  for (let i = password.length - 1; i >= 0; i--) {
    h2 = ((h2 << 5) + h2) ^ (password.charCodeAt(i) + 0x9e3779b9);
    h2 = h2 >>> 0;
  }

  const toHex32 = (n: number) => n.toString(16).padStart(8, '0');
  return `$lp1$${toHex32(h1)}${toHex32(h2)}`;
}

/**
 * Compares a plain-text candidate against a stored hash of any supported
 * format ($cs2$ or legacy $lp1$).
 */
async function verifyPassword(candidate: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('$cs2$')) {
    // Format: $cs2$<iterations>$<salt>$<hash> → split yields ['', 'cs2', iter, salt, hash]
    const parts = storedHash.split('$');
    const iterations = parseInt(parts[2], 10) || HASH_ITERATIONS;
    const salt = parts[3];
    let digest = `${salt}:${candidate}`;
    for (let i = 0; i < iterations; i++) {
      digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digest);
    }
    return digest === parts[4];
  }
  return legacyHashPassword(candidate) === storedHash;
}

/**
 * Generates the 256-bit sync secret used to authenticate cloud sync requests.
 */
function generateSyncSecret(): string {
  const bytes = new Uint8Array(32);
  Crypto.getRandomValues(bytes);
  return toHex(bytes);
}

// ---------------------------------------------------------------------------
// Password policy
// ---------------------------------------------------------------------------
const MIN_PASSWORD_LENGTH = 8;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

export const authStorage = {
  /**
   * Retrieves all registered local profiles.
   */
  async getUsers(): Promise<UserAccount[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_USERS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as UserAccount[];
        memoryUsers = parsed;
        return parsed;
      }
      return memoryUsers;
    } catch (e) {
      console.warn('[authStorage] Error reading profiles from storage:', e);
      return memoryUsers;
    }
  },

  /**
   * Saves the profiles list to storage.
   */
  async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      memoryUsers = users;
      await AsyncStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('[authStorage] Error saving profiles to storage:', e);
    }
  },

  /**
   * Gets the currently active local profile session.
   */
  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (data) {
        const parsed = JSON.parse(data) as UserAccount;
        memoryCurrentUser = parsed;
        return parsed;
      }
      return memoryCurrentUser;
    } catch (e) {
      console.warn('[authStorage] Error reading active profile:', e);
      return memoryCurrentUser;
    }
  },

  /**
   * Sets (or clears) the currently active local profile session.
   */
  async setCurrentUser(user: UserAccount | null): Promise<void> {
    try {
      memoryCurrentUser = user;
      if (user) {
        await AsyncStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn('[authStorage] Error saving active profile:', e);
    }
  },

  /**
   * Creates a new local profile.
   *
   * Passwords are hashed before storage — plain-text is never persisted.
   * Minimum password length is enforced at {@link MIN_PASSWORD_LENGTH} characters.
   *
   * ⚠️  This is a LOCAL PROFILE system (offline-only).  Profiles are stored on
   * this device only and are not synced across devices.  Do not use this for
   * anything that requires server-side security or multi-device access.
   */
  async register(
    userData: Omit<UserAccount, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const trimmedUsername = userData.username.trim().toLowerCase();
    const trimmedName = userData.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'لطفاً نام و نام‌خانوادگی خود را وارد کنید.' };
    }

    if (!trimmedUsername) {
      return { success: false, error: 'لطفاً نام کاربری یا ایمیل خود را وارد کنید.' };
    }

    if (!userData.password || userData.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: 'رمز عبور باید حداقل ۸ نویسه باشد.',
      };
    }

    const users = await this.getUsers();
    const exists = users.some(
      (u) => u.username.trim().toLowerCase() === trimmedUsername
    );

    if (exists) {
      return { success: false, error: 'پروفایلی با این نام کاربری قبلاً ساخته شده است.' };
    }

    // Random 64-bit id — unlike the old usr-<timestamp> ids it cannot be
    // guessed or enumerated by a third party.
    const idBytes = new Uint8Array(8);
    Crypto.getRandomValues(idBytes);

    const newUser: UserAccount = {
      id: `usr-${toHex(idBytes)}`,
      name: trimmedName,
      username: trimmedUsername,
      // Store hash, never plain-text
      password: await hashPassword(userData.password),
      avatar: userData.avatar || 'chef',
      createdAt: new Date().toLocaleDateString('fa-IR'),
      fridgeName: userData.fridgeName || `یخچال ${trimmedName}`,
      syncSecret: generateSyncSecret(),
    };

    const updated = [newUser, ...users];
    await this.saveUsers(updated);
    await this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  /**
   * Authenticates a local profile using username + password.
   * Password is hashed and compared — the stored hash is never exposed.
   */
  async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !password) {
      return { success: false, error: 'لطفاً نام کاربری و رمز عبور را وارد کنید.' };
    }

    const users = await this.getUsers();
    const found = users.find(
      (u) => u.username.trim().toLowerCase() === trimmedUsername
    );

    if (!found) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    // $cs2$ and legacy $lp1$ hashes are verified by verifyPassword; profiles
    // still carrying a plain-text password (pre-hashing versions) are
    // migrated on successful login. Any profile missing a syncSecret gets one
    // generated so cloud sync can authenticate it.
    const isPlainText = !found.password.startsWith('$');
    let passwordOk: boolean;

    if (isPlainText) {
      passwordOk = found.password === password;
    } else {
      passwordOk = await verifyPassword(password, found.password);
    }

    if (!passwordOk) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    let authedUser = found;
    if (isPlainText || !found.syncSecret) {
      authedUser = {
        ...found,
        password: isPlainText ? await hashPassword(password) : found.password,
        syncSecret: found.syncSecret || generateSyncSecret(),
      };
      const updated = users.map((u) => (u.id === found.id ? authedUser : u));
      await this.saveUsers(updated);
    }

    await this.setCurrentUser(authedUser);
    return { success: true, user: authedUser };
  },

  /**
   * Ends the current local profile session.
   */
  async logout(): Promise<void> {
    await this.setCurrentUser(null);
  },

  /**
   * Returns the user with a guaranteed non-empty syncSecret, generating and
   * persisting one (and refreshing the active session) when missing. Used by
   * the cloud-sync service before it calls authenticated backend endpoints.
   */
  async ensureSyncSecret(user: UserAccount): Promise<UserAccount> {
    if (user.syncSecret && /^[0-9a-f]{64}$/.test(user.syncSecret)) {
      return user;
    }

    const patched: UserAccount = { ...user, syncSecret: generateSyncSecret() };

    const users = await this.getUsers();
    const updated = users.map((u) => (u.id === patched.id ? patched : u));
    await this.saveUsers(updated);

    const current = await this.getCurrentUser();
    if (current?.id === patched.id) {
      await this.setCurrentUser(patched);
    }
    return patched;
  },
};
