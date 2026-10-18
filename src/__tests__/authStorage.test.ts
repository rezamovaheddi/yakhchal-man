import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/authStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Auth Storage Service', () => {
  beforeEach(async () => {
    await authStorage.saveUsers([]);
    await authStorage.logout();
  });

  test('registers a new user successfully and sets active session', async () => {
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
    expect(duplicateRes.error).toContain('قبلاً ثبت‌نام کرده است');
  });

  test('fails registration when password is too short', async () => {
    const res = await authStorage.register({
      name: 'کاربر تست',
      username: 'testuser',
      password: '12',
      avatar: 'robot',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('حداقل ۴ نویسه');
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
});
