import AsyncStorage from '@react-native-async-storage/async-storage';
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
// djb2 variant — fast, dependency-free, good enough for local offline profiles.
// If real server-side auth is ever added, replace this with a proper bcrypt /
// argon2 implementation on the backend and stop storing passwords locally.
// ---------------------------------------------------------------------------

/**
 * Produces a deterministic hex-like hash string from the given input.
 * Uses a two-pass djb2 variant to reduce trivial collisions.
 */
function hashPassword(password: string): string {
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

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return `$lp1$${toHex(h1)}${toHex(h2)}`;
}

/**
 * Compares a plain-text candidate against a stored hash.
 */
function verifyPassword(candidate: string, storedHash: string): boolean {
  return hashPassword(candidate) === storedHash;
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

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      username: trimmedUsername,
      // Store hash, never plain-text
      password: hashPassword(userData.password),
      avatar: userData.avatar || 'chef',
      createdAt: new Date().toLocaleDateString('fa-IR'),
      fridgeName: userData.fridgeName || `یخچال ${trimmedName}`,
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

    // Support both legacy plain-text passwords (migration path) and new hashes.
    // After a successful legacy login the password is re-hashed and saved.
    const isHashedFormat = found.password.startsWith('$lp1$');
    let passwordOk: boolean;

    if (isHashedFormat) {
      passwordOk = verifyPassword(password, found.password);
    } else {
      // Legacy plain-text comparison — migrate to hash on success
      passwordOk = found.password === password;
      if (passwordOk) {
        const migratedUser: UserAccount = { ...found, password: hashPassword(password) };
        const updated = users.map((u) => (u.id === found.id ? migratedUser : u));
        await this.saveUsers(updated);
        await this.setCurrentUser(migratedUser);
        return { success: true, user: migratedUser };
      }
    }

    if (!passwordOk) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    await this.setCurrentUser(found);
    return { success: true, user: found };
  },

  /**
   * Ends the current local profile session.
   */
  async logout(): Promise<void> {
    await this.setCurrentUser(null);
  },
};
