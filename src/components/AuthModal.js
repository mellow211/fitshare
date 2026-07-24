'use client';
import React, { useState } from 'react';
import { loginOrRegisterUser, logoutUser } from '../lib/auth';
import { getLevelInfo, calculateCarbonSavings } from '../lib/gamification';
import { X, Sparkles, User, School, KeyRound, LogOut, Award, Leaf } from 'lucide-react';
import styles from '../app/dashboard.module.css';

export default function AuthModal({ isOpen, onClose, currentUser, onUserChange, triggerToast }) {
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('1학년 1반');
  const [spaceCode, setSpaceCode] = useState('SESOL-2026');
  const [pin, setPin] = useState('0000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      triggerToast('닉네임(또는 자녀 이름)을 입력해주세요!');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await loginOrRegisterUser({
        nickname: nickname.trim(),
        grade: grade.trim(),
        spaceCode: spaceCode.trim(),
        pin: pin.trim()
      });
      onUserChange(user);
      triggerToast(`환영합니다, ${user.nickname}님! 🎉 (+100 XP 웰컴 보너스)`);
      onClose();
    } catch (err) {
      triggerToast(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onUserChange(null);
    triggerToast('로그아웃 되었습니다.');
    onClose();
  };

  const levelInfo = currentUser ? getLevelInfo(currentUser.xp || 0) : null;
  const carbon = currentUser ? calculateCarbonSavings(currentUser.sharesCount || 1) : null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={16} />
        </button>

        {currentUser ? (
          /* Profile Card */
          <div className={styles.authProfileCard}>
            <div className={styles.authHeader}>
              <div className={styles.authAvatar}>{levelInfo.icon}</div>
              <h3>{currentUser.nickname}</h3>
              <span className={styles.authSubtitle}>{currentUser.spaceCode} · {currentUser.grade}</span>
            </div>

            <div className={styles.levelProgressBox}>
              <div className={styles.levelTitleRow}>
                <span>Level {levelInfo.level} <strong>{levelInfo.title}</strong></span>
                <span>{levelInfo.currentXp} XP</span>
              </div>
              <div className={styles.xpBarTrackBig}>
                <div className={styles.xpBarFillBig} style={{ width: `${levelInfo.progressPercent}%` }} />
              </div>
              <div className={styles.xpTip}>
                다음 레벨({levelInfo.nextLevelTitle})까지 <strong>{levelInfo.xpToNext} XP</strong> 남았습니다.
              </div>
            </div>

            <div className={styles.userStatsGrid}>
              <div className={styles.userStatItem}>
                <Leaf size={18} className={styles.greenText} />
                <strong>{carbon.co2SavedKg}kg</strong>
                <span>CO₂ 절감</span>
              </div>
              <div className={styles.userStatItem}>
                <Award size={18} className={styles.purpleText} />
                <strong>{currentUser.unlockedBadges?.length || 0}개</strong>
                <span>획득 배지</span>
              </div>
            </div>

            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        ) : (
          /* Quick Login Form */
          <form className={styles.authForm} onSubmit={handleLogin}>
            <div className={styles.authTitleGroup}>
              <Sparkles size={20} className={styles.sparkleIcon} />
              <h3>3초 간편 로그인</h3>
              <p>나눔 참여하고 레벨업 &amp; 뱃지를 모아보세요!</p>
            </div>

            <div className={styles.formGroup}>
              <label><User size={14} /> 닉네임 (또는 자녀 이름)</label>
              <input 
                type="text" 
                placeholder="예: 민준이네 / 김민준" 
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label><School size={14} /> 학년 및 반</label>
              <input 
                type="text" 
                placeholder="예: 4학년 1반" 
                value={grade}
                onChange={e => setGrade(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label><KeyRound size={14} /> 나눔 공간 코드</label>
              <input 
                type="text" 
                placeholder="예: SESOL-2026" 
                value={spaceCode}
                onChange={e => setSpaceCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? '로그인 처리 중...' : '🚀 나눔 시작하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
