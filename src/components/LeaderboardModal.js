'use client';
import React, { useState } from 'react';
import { getLeaderboardData } from '../lib/gamification';
import { X, Trophy, Leaf, Sparkles, Medal } from 'lucide-react';
import styles from '../app/dashboard.module.css';

export default function LeaderboardModal({ isOpen, onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('xp'); // 'xp' or 'co2'

  if (!isOpen) return null;

  const leaderboardList = getLeaderboardData(currentUser);
  
  // Sort based on active tab
  const sortedList = [...leaderboardList].sort((a, b) => {
    if (activeTab === 'co2') {
      return parseFloat(b.co2) - parseFloat(a.co2);
    }
    return b.xp - a.xp;
  });

  sortedList.forEach((item, idx) => {
    item.currentRank = idx + 1;
  });

  const myEntry = sortedList.find(u => u.isMe);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>

        <div className={styles.badgeModalHeader}>
          <Trophy size={28} className={styles.trophyIcon} />
          <h3>우리 학교 나눔 랭킹 (Leaderboard)</h3>
          <p>아나바다 나눔 활동과 환경 보호에 가장 많이 기여한 학부모 순위입니다!</p>
        </div>

        {/* Tab switcher */}
        <div className={styles.leaderboardTabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'xp' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('xp')}
          >
            <Sparkles size={14} /> 나눔 포인트 / XP 랭킹
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'co2' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('co2')}
          >
            <Leaf size={14} /> 지구 지킴이 (CO₂) 랭킹
          </button>
        </div>

        {/* Leaderboard List */}
        <div className={styles.leaderboardList}>
          {sortedList.map(item => {
            const isTop3 = item.currentRank <= 3;
            const crownEmoji = item.currentRank === 1 ? '🥇' : item.currentRank === 2 ? '🥈' : item.currentRank === 3 ? '🥉' : `${item.currentRank}위`;

            return (
              <div 
                key={item.name} 
                className={`${styles.rankItem} ${item.isMe ? styles.rankItemMe : ''} ${isTop3 ? styles.rankItemTop : ''}`}
              >
                <div className={styles.rankBadgeWrapper}>
                  <span className={styles.rankNumber}>{crownEmoji}</span>
                </div>
                
                <div className={styles.rankUserInfo}>
                  <div className={styles.rankNameRow}>
                    <strong>{item.name}</strong>
                    {item.isMe && <span className={styles.meTag}>내 순위</span>}
                  </div>
                  <span className={styles.rankLevelSub}>{item.level} · {item.space}</span>
                </div>

                <div className={styles.rankScoreBox}>
                  {activeTab === 'xp' ? (
                    <span className={styles.xpScoreText}>{item.xp} XP</span>
                  ) : (
                    <span className={styles.co2ScoreText}>{item.co2}kg CO₂</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* My Rank Summary at Bottom */}
        {myEntry && (
          <div className={styles.myRankFooter}>
            <Medal size={16} style={{ color: '#34d399' }} />
            <span>내 현재 순위: <strong>{myEntry.currentRank}위</strong> ({myEntry.xp} XP · {myEntry.co2}kg CO₂ 절감)</span>
          </div>
        )}
      </div>
    </div>
  );
}
