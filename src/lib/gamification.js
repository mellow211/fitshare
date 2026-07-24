/**
 * FitShare Gamification Utility Engine
 * Manages XP, Levels, Badges, Carbon Footprint Savings, and Daily Rewards
 */

export const LEVEL_THRESHOLDS = [
  { level: 1, name: '새싹 아나바다', minXp: 0, icon: '🌱' },
  { level: 2, name: '나눔 모범생', minXp: 200, icon: '🎒' },
  { level: 3, name: '초록 옷장 지킴이', minXp: 500, icon: '🌿' },
  { level: 4, name: '지구 영웅', minXp: 1000, icon: '🌍' },
  { level: 5, name: 'FitShare 전설', minXp: 2000, icon: '👑' }
];

export const BADGE_DEFINITIONS = [
  {
    id: 'fashion_model',
    name: '패션 모델',
    icon: '📸',
    description: 'AI 가상 입어보기 샷 3회 촬영 달성',
    targetCount: 3
  },
  {
    id: 'earth_saver',
    name: '지구 지킴이',
    icon: '♻️',
    description: '아나바다 나눔 의류 3벌 이상 등록',
    targetCount: 3
  },
  {
    id: 'warm_neighbor',
    name: '훈훈한 이웃',
    icon: '🤝',
    description: '의류 나눔 분양 예약 1회 이상 완료',
    targetCount: 1
  },
  {
    id: 'smart_stylist',
    name: '스마트 코디',
    icon: '🤖',
    description: 'AI 세트 추천 조합 확인 1회 이상',
    targetCount: 1
  }
];

// Calculate level details from current total XP
export function getLevelInfo(xp = 0) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
      break;
    }
  }

  const currentLevelXp = currentLevel.minXp;
  const nextLevelXp = nextLevel ? nextLevel.minXp : currentLevel.minXp * 1.5;
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercent = nextLevel ? Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100)) : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.name,
    icon: currentLevel.icon,
    currentXp: xp,
    progressPercent,
    nextLevelTitle: nextLevel ? nextLevel.name : '최고 레벨 달성!',
    xpToNext: nextLevel ? (nextLevelXp - xp) : 0
  };
}

// Convert clothing share count to CO2 saved (kg) & pine tree equivalent
export function calculateCarbonSavings(shareCount = 0) {
  const co2SavedKg = (shareCount * 2.5).toFixed(1);
  const pineTrees = (shareCount * 0.4).toFixed(1);
  return { co2SavedKg, pineTrees };
}

// Generate dynamic leaderboard data combining top community members & active user
export function getLeaderboardData(currentUser) {
  const defaultBoard = [
    { rank: 1, name: '지후네 학부모', space: 'SESOL-2026', xp: 1850, shares: 7, co2: '17.5', level: '👑 Lv.4 지구 영웅', avatar: '👑' },
    { rank: 2, name: '민준이네 (4학년 2반)', space: 'SESOL-2026', xp: 1420, shares: 5, co2: '12.5', level: '🌍 Lv.4 지구 영웅', avatar: '🎒' },
    { rank: 3, name: '서연 맘', space: 'SESOL-2026', xp: 980, shares: 4, co2: '10.0', level: '🌿 Lv.3 초록 옷장', avatar: '🌱' },
    { rank: 4, name: '하은이네 학부모', space: 'SESOL-2026', xp: 620, shares: 2, co2: '5.0', level: '🎒 Lv.2 나눔 모범생', avatar: '🧸' },
    { rank: 5, name: '도윤 맘 (2학년 1반)', space: 'SESOL-2026', xp: 450, shares: 1, co2: '2.5', level: '🌱 Lv.2 나눔 모범생', avatar: '🍀' },
  ];

  if (currentUser) {
    const userXp = currentUser.xp || 100;
    const userShares = currentUser.sharesCount || 1;
    const userCo2 = (userShares * 2.5).toFixed(1);
    const userLevel = getLevelInfo(userXp);

    const me = {
      rank: 0,
      isMe: true,
      name: `${currentUser.nickname} (나)`,
      space: currentUser.spaceCode || 'SESOL-2026',
      xp: userXp,
      shares: userShares,
      co2: userCo2,
      level: `${userLevel.icon} Lv.${userLevel.level} ${userLevel.title}`,
      avatar: userLevel.icon
    };

    const combined = [...defaultBoard, me];
    combined.sort((a, b) => b.xp - a.xp);
    combined.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return combined;
  }

  return defaultBoard;
}
