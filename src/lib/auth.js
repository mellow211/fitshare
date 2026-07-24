/**
 * FitShare Quick Auth & User Profile Management
 * Manages user accounts, session state, XP gain, and unlocked badges in LocalStorage & Supabase.
 */

import { supabase } from './supabase';
import { BADGE_DEFINITIONS } from './gamification';

const AUTH_STORAGE_KEY = 'fitshare_active_user';

// Get current active logged-in user profile
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Quick Register or Login User
export async function loginOrRegisterUser({ nickname, grade, spaceCode, pin }) {
  if (!nickname || !spaceCode) {
    throw new Error('닉네임과 공간 코드를 입력해주세요.');
  }

  const cleanNickname = nickname.trim();
  const cleanSpaceCode = spaceCode.trim().toUpperCase();
  const userId = `user_${cleanSpaceCode}_${cleanNickname.replace(/\s+/g, '_')}`;

  const defaultUser = {
    id: userId,
    nickname: cleanNickname,
    grade: grade || '1학년 1반',
    spaceCode: cleanSpaceCode,
    pin: pin || '0000',
    xp: 100, // Initial welcome bonus
    points: 50,
    sharesCount: 0,
    tryOnCount: 0,
    reservationCount: 0,
    unlockedBadges: ['earth_saver'],
    createdAt: new Date().toISOString()
  };

  let activeUser = defaultUser;

  // Check if existing user in localStorage
  const existingData = localStorage.getItem(AUTH_STORAGE_KEY);
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData);
      if (parsed.id === userId) {
        activeUser = parsed;
      }
    } catch (e) {}
  }

  // Save active user in localStorage
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(activeUser));

  // Sync to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('user_profiles').upsert([
        {
          id: activeUser.id,
          nickname: activeUser.nickname,
          grade: activeUser.grade,
          space_code: activeUser.spaceCode,
          xp: activeUser.xp,
          points: activeUser.points,
          unlocked_badges: activeUser.unlockedBadges,
          updated_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.warn('Supabase user profile sync skipped:', err);
    }
  }

  return activeUser;
}

// Logout user
export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

  return {
    user,
    newXp: user.xp,
    unlockedBadges: newBadges
  };
}
