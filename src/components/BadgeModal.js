'use client';
import React from 'react';
import { BADGE_DEFINITIONS } from '../lib/gamification';
import { X, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import styles from '../app/dashboard.module.css';

export default function BadgeModal({ isOpen, onClose, currentUser }) {
  if (!isOpen) return null;

  const unlockedSet = new Set(currentUser?.unlockedBadges || []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>

        <div className={styles.badgeModalHeader}>
          <Trophy size={24} className={styles.trophyIcon} />
          <h3>나눔 업적 배지 컬렉션</h3>
          <p>아나바다 나눔 활동을 달성하여 전설의 배지를 모아보세요!</p>
        </div>

        <div className={styles.badgeGrid}>
          {BADGE_DEFINITIONS.map(badge => {
            const isUnlocked = unlockedSet.has(badge.id);
            return (
              <div 
                key={badge.id} 
                className={`${styles.badgeCard} ${isUnlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
              >
                <div className={styles.badgeIconWrapper}>
                  <span className={styles.badgeIcon}>{badge.icon}</span>
                  {isUnlocked ? (
                    <CheckCircle2 size={16} className={styles.badgeCheckIcon} />
                  ) : (
                    <Lock size={14} className={styles.badgeLockIcon} />
                  )}
                </div>
                <div className={styles.badgeInfo}>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                </div>
                <div className={styles.badgeStatusTag}>
                  {isUnlocked ? '획득 완료 🎉' : '미달성'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
