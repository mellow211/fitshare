/**
 * FitShare Dedicated Auth & User Profile Engine
 * Handles explicit Sign Up (Username, Password, Child Name, School, Grade/Class, Phone)
 * and Simple 2-field Login (Username + Password).
 */

import { supabase } from './supabase';
import { BADGE_DEFINITIONS } from './gamification';

const ACTIVE_USER_KEY = 'fitshare_active_user';
const USERS_LIST_KEY = 'fitshare_registered_users';

// Get current logged-in user profile
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(ACTIVE_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Get all registered users from localStorage
export function getRegisteredUsers() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Save registered users list
function saveRegisteredUsers(users) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  }
}

// 1. Sign Up New User (회원가입)
export async function registerNewUser({ username, password, childName, schoolName, gradeClass, phone }) {
  if (!username?.trim() || !password?.trim()) {
    throw new Error('아이디와 비밀번호를 모두 입력해주세요.');
  }
  if (!childName?.trim() || !schoolName?.trim()) {
    throw new Error('자녀 이름과 학교 이름을 입력해주세요.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const users = getRegisteredUsers();

  // Check duplicate username
  const existing = users.find(u => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    throw new Error('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
  }

  const newUser = {
    id: `user_${Date.now()}_${cleanUsername}`,
    username: cleanUsername,
    password: password.trim(),
    childName: childName.trim(),
    nickname: childName.trim(), // Display name
    schoolName: schoolName.trim(),
    spaceCode: schoolName.trim().toUpperCase(),
    gradeClass: gradeClass?.trim() || '1학년 1반',
    grade: gradeClass?.trim() || '1학년 1반',
    phone: phone?.trim() || '',
    xp: 100, // Welcome bonus
    points: 50,
    sharesCount: 0,
    tryOnCount: 0,
    reservationCount: 0,
    unlockedBadges: ['earth_saver'],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // Set active logged-in user
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(newUser));

  // Sync to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('user_profiles').upsert([
        {
          id: newUser.id,
          username: newUser.username,
          nickname: newUser.nickname,
          child_name: newUser.childName,
          school_name: newUser.schoolName,
          grade: newUser.grade,
          phone: newUser.phone,
          space_code: newUser.spaceCode,
          xp: newUser.xp,
          points: newUser.points,
          unlocked_badges: newUser.unlockedBadges,
          updated_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.warn('Supabase profile sync skipped:', err);
    }
  }

  return newUser;
}

// 2. Login Existing User (로그인: 아이디 + 비밀번호만 입력)
export async function loginUser({ username, password }) {
  if (!username?.trim() || !password?.trim()) {
    throw new Error('아이디와 비밀번호를 입력해주세요.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();
  const users = getRegisteredUsers();

  const user = users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || user.password !== cleanPassword) {
    throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
  }

  // Set active user session
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  return user;
}

// Logout user
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

// Award XP & Check for Badge Unlocks
export function awardUserXP(xpAmount, activityType = 'action') {
  const user = getCurrentUser();
  if (!user) return { newXp: 0, unlockedBadges: [] };

  user.xp = (user.xp || 0) + xpAmount;

  if (activityType === 'try_on') {
    user.tryOnCount = (user.tryOnCount || 0) + 1;
  } else if (activityType === 'share') {
    user.sharesCount = (user.sharesCount || 0) + 1;
  } else if (activityType === 'reserve') {
    user.reservationCount = (user.reservationCount || 0) + 1;
  }

  // Check badges unlock
  const newBadges = [];
  user.unlockedBadges = user.unlockedBadges || [];

  if (user.tryOnCount >= 3 && !user.unlockedBadges.includes('fashion_model')) {
    user.unlockedBadges.push('fashion_model');
    newBadges.push(BADGE_DEFINITIONS.find(b => b.id === 'fashion_model'));
  }
  if (user.sharesCount >= 3 && !user.unlockedBadges.includes('earth_saver')) {
    user.unlockedBadges.push('earth_saver');
    newBadges.push(BADGE_DEFINITIONS.find(b => b.id === 'earth_saver'));
  }
  if (user.reservationCount >= 1 && !user.unlockedBadges.includes('warm_neighbor')) {
    user.unlockedBadges.push('warm_neighbor');
    newBadges.push(BADGE_DEFINITIONS.find(b => b.id === 'warm_neighbor'));
  }

  // Update active user in localStorage
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));

  // Also update registered users list
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    saveRegisteredUsers(users);
  }

  return {
    user,
    newXp: user.xp,
    unlockedBadges: newBadges
  };
}
