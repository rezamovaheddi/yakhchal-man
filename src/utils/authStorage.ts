import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAccount } from '../types';

const STORAGE_USERS_KEY = '@yakhchal_registered_users';
const STORAGE_CURRENT_USER_KEY = '@yakhchal_active_user';

// In-memory fallback in case of storage failure
let memoryUsers: UserAccount[] = [];
let memoryCurrentUser: UserAccount | null = null;

export const authStorage = {
  /**
   * Retrieves all registered users
   */
  async getUsers(): Promise<UserAccount[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_USERS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        memoryUsers = parsed;
        return parsed;
      }
      return memoryUsers;
    } catch (e) {
      console.warn('Error reading users from storage:', e);
      return memoryUsers;
    }
  },

  /**
   * Saves users list
   */
  async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      memoryUsers = users;
      await AsyncStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving users to storage:', e);
    }
  },

  /**
   * Gets the currently active logged-in user
   */
  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        memoryCurrentUser = parsed;
        return parsed;
      }
      return memoryCurrentUser;
    } catch (e) {
      console.warn('Error reading active user:', e);
      return memoryCurrentUser;
    }
  },

  /**
   * Sets the currently active logged-in user
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
      console.warn('Error saving active user:', e);
    }
  },

  /**
   * Registers a new user account
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

    if (!userData.password || userData.password.length < 4) {
      return { success: false, error: 'رمز عبور باید حداقل ۴ نویسه باشد.' };
    }

    const users = await this.getUsers();
    const exists = users.some(
      (u) => u.username.trim().toLowerCase() === trimmedUsername
    );

    if (exists) {
      return { success: false, error: 'کاربری با این نام کاربری قبلاً ثبت‌نام کرده است.' };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      username: trimmedUsername,
      password: userData.password,
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
   * Logs in with username and password
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
      (u) =>
        u.username.trim().toLowerCase() === trimmedUsername &&
        u.password === password
    );

    if (!found) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    await this.setCurrentUser(found);
    return { success: true, user: found };
  },

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    await this.setCurrentUser(null);
  },
};
