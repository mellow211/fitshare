'use client';
import React from 'react';
import { getLevelInfo, calculateCarbonSavings } from '../lib/gamification';
import { Sparkles, Trophy, Leaf, UserCheck, LogIn } from 'lucide-react';
import styles from '../app/dashboard.module.css';

export default function GamificationBar({ currentUser, onOpenAuth, onOpenBadges, onOpenLeaderboard }) {
  if (!currentUser) {
    return (
      <div className={styles.gamificationBarGuest}>
        <div className={styles.gamificationGuestContent}>
          <Sparkles size={16} className={styles.pulseIcon} />
          <span>아나바다 나눔하고 <strong>레벨업 &amp; 배지</strong>를 획득해보세요!</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.badgePillBtn} onClick={onOpenLeaderboard} title="나눔 랭킹 보기">
            <Trophy size={14} /> <span>나눔 랭킹</span>
          </button>
          <button className={styles.loginBtnSmall} onClick={onOpenAuth}>
            <LogIn size={14} /> 3초 간편 로그인
          </button>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(currentUser.xp || 0);
  const carbon = calculateCarbonSavings(currentUser.sharesCount || 1);

  return (
    <div className={styles.gamificationBar}>
      {/* Profile & Level Title */}
      <div className={styles.gamificationProfileInfo} onClick={onOpenAuth}>
        <span className={styles.levelBadgeIcon}>{levelInfo.icon}</span>
        <div>
          <div className={styles.userNameRow}>
            <strong>{currentUser.nickname}</strong>
            <span className={styles.levelTag}>Lv.{levelInfo.level} {levelInfo.title}</span>
          </div>
          <div className={styles.xpBarTrack}>
            <div 
              className={styles.xpBarFill} 
              style={{ width: `${levelInfo.progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Carbon Savings & Badges Quick Info */}
      <div className={styles.gamificationStatsGroup}>
        <div className={styles.statPill} title="내가 절감한 탄소 배출량">
          <Leaf size={14} className={styles.leafIcon} />
          <span><strong>{carbon.co2SavedKg}kg</strong> CO₂ 절감</span>
        </div>

        <button className={styles.badgePillBtn} onClick={onOpenBadges} title="배지 컬렉션 보기">
          <Trophy size={14} />
          <span>배지 <strong>{currentUser.unlockedBadges?.length || 0}</strong>개</span>
        </button>

        <button className={styles.badgePillBtn} onClick={onOpenLeaderboard} title="학교 나눔 랭킹 보기" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
          <Trophy size={14} />
          <span>🏆 <strong>랭킹</strong></span>
        </button>
      </div>
    </div>
  );
}
