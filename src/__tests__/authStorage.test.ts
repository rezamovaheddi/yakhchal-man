import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/authStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Auth Storage Service (local-profile system)', () => {
  beforeEach(async () => {
    await authStorage.saveUsers([]);
    await authStorage.logout();
  });

  test('registers a new profile successfully and sets active session', async () => {
    const res = await authStorage.register({
      name: 'رضا موحدی',
      username: 'rezamovaheddi',
      password: 'password123',
      avatar: 'chef',
      fridgeName: 'یخچال رضا',
    });

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.name).toBe('رضا موحدی');
    expect(res.user?.username).toBe('rezamovaheddi');

    const currentUser = await authStorage.getCurrentUser();
    expect(currentUser?.username).toBe('rezamovaheddi');
  });

  test('does NOT store the plain-text password', async () => {
    const plainPassword = 'mySecret8!';
    await authStorage.register({
      name: 'کاربر امن',
      username: 'secureuser',
      password: plainPassword,
      avatar: 'chef',
    });

    const users = await authStorage.getUsers();
    const saved = users.find((u) => u.username === 'secureuser');
    expect(saved).toBeDefined();
    // The stored value must not equal the plain-text password
    expect(saved?.password).not.toBe(plainPassword);
    // It must start with the expected hash prefix
    expect(saved?.password).toMatch(/^\$lp1\$/);
  });

  test('fails registration on duplicate username (case-insensitive)', async () => {
    await authStorage.register({
      name: 'کاربر اول',
      username: 'user1',
      password: 'password123',
      avatar: 'cat',
    });

    const duplicateRes = await authStorage.register({
      name: 'کاربر دوم',
      username: 'USER1',
      password: 'password456',
      avatar: 'star',
    });

    expect(duplicateRes.success).toBe(false);
    expect(duplicateRes.error).toContain('قبلاً ساخته شده است');
  });

  test('fails registration when password is shorter than 8 characters', async () => {
    const res = await authStorage.register({
      name: 'کاربر تست',
      username: 'testuser',
      password: '1234',
      avatar: 'robot',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('۸ نویسه');
  });

  test('accepts passwords that are exactly 8 characters', async () => {
    const res = await authStorage.register({
      name: 'کاربر هشت',
      username: 'eightchar',
      password: '12345678',
      avatar: 'chef',
    });

    expect(res.success).toBe(true);
  });

  test('logs in successfully with valid credentials and logs out', async () => {
    await authStorage.register({
      name: 'مریم اکبری',
      username: 'maryam',
      password: 'secretPassword',
      avatar: 'fridge',
    });

    await authStorage.logout();
    expect(await authStorage.getCurrentUser()).toBeNull();

    const loginRes = await authStorage.login('maryam', 'secretPassword');
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.name).toBe('مریم اکبری');

    expect(await authStorage.getCurrentUser()).not.toBeNull();

    await authStorage.logout();
    expect(await authStorage.getCurrentUser()).toBeNull();
  });

  test('fails login with invalid password', async () => {
    await authStorage.register({
      name: 'علی احمدی',
      username: 'ali',
      password: 'correctPassword',
      avatar: 'chef',
    });

    const failedRes = await authStorage.login('ali', 'wrongPassword');
    expect(failedRes.success).toBe(false);
    expect(failedRes.error).toContain('اشتباه');
  });

  test('migrates a legacy plain-text password to a hash on successful login', async () => {
    // Manually insert a "legacy" user record with a plain-text password
    const legacyUser = {
      id: 'usr-legacy',
      name: 'کاربر قدیمی',
      username: 'legacy',
      password: 'oldpassword', // plain-text, no $lp1$ prefix
      avatar: 'chef',
      createdAt: '۱۴۰۳/۱/۱',
    };
    await authStorage.saveUsers([legacyUser]);

    // Login should succeed and migrate the password
    const loginRes = await authStorage.login('legacy', 'oldpassword');
    expect(loginRes.success).toBe(true);

    // The stored record should now be hashed
    const users = await authStorage.getUsers();
    const updated = users.find((u) => u.username === 'legacy');
    expect(updated?.password).toMatch(/^\$lp1\$/);
  });
});
