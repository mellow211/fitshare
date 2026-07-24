'use client';
import React, { useState } from 'react';
import { loginUser, registerNewUser, logoutUser } from '../lib/auth';
import { getLevelInfo, calculateCarbonSavings } from '../lib/gamification';
import { X, Sparkles, User, School, KeyRound, LogOut, Award, Leaf, Lock, Phone, UserPlus, LogIn } from 'lucide-react';
import styles from '../app/dashboard.module.css';

export default function AuthModal({ isOpen, onClose, currentUser, onUserChange, triggerToast }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Login Form States (Only ID + Password)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States (Full details)
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regChildName, setRegChildName] = useState('');
  const [regSchoolName, setRegSchoolName] = useState('SESOL-2026');
  const [regGradeClass, setRegGradeClass] = useState('4학년 1반');
  const [regPhone, setRegPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form inputs completely when modal opens or closes
  const resetForm = () => {
    setLoginUsername('');
    setLoginPassword('');
    setRegUsername('');
    setRegPassword('');
    setRegChildName('');
    setRegSchoolName('');
    setRegGradeClass('');
    setRegPhone('');
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Handle Login (아이디 + 비밀번호)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      triggerToast('아이디와 비밀번호를 모두 입력해주세요!');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await loginUser({
        username: loginUsername.trim(),
        password: loginPassword.trim()
      });
      onUserChange(user);
      triggerToast(`반갑습니다, ${user.nickname}님! 🔑 로그인되었습니다.`);
      resetForm();
      onClose();
    } catch (err) {
      triggerToast(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register (전체 회원가입)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim() || !regChildName.trim() || !regSchoolName.trim()) {
      triggerToast('필수 회원가입 정보를 모두 입력해주세요!');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await registerNewUser({
        username: regUsername.trim(),
        password: regPassword.trim(),
        childName: regChildName.trim(),
        schoolName: regSchoolName.trim(),
        gradeClass: regGradeClass.trim(),
        phone: regPhone.trim()
      });
      onUserChange(user);
      triggerToast(`회원가입 완료! 환영합니다, ${user.nickname}님! 🎉 (+100 XP 웰컴 보너스)`);
      resetForm();
      onClose();
    } catch (err) {
      triggerToast(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onUserChange(null);
    triggerToast('로그아웃 되었습니다.');
    resetForm();
    onClose();
  };

  const levelInfo = currentUser ? getLevelInfo(currentUser.xp || 0) : null;
  const carbon = currentUser ? calculateCarbonSavings(currentUser.sharesCount || 1) : null;

  return (
    <div className={styles.modalOverlay} onClick={handleCloseModal}>
      <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleCloseModal}>
          <X size={16} />
        </button>

        {currentUser ? (
          /* Profile Card when logged in */
          <div className={styles.authProfileCard}>
            <div className={styles.authHeader}>
              <div className={styles.authAvatar}>{levelInfo.icon}</div>
              <h3>{currentUser.nickname} (학부모)</h3>
              <span className={styles.authSubtitle}>
                아이디: {currentUser.username} · {currentUser.schoolName} ({currentUser.gradeClass})
              </span>
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
          /* Auth Form Container (Login / Register Switch) */
          <div>
            {/* Mode Switcher Tabs */}
            <div className={styles.leaderboardTabs} style={{ marginBottom: '20px' }}>
              <button 
                className={`${styles.tabBtn} ${authMode === 'login' ? styles.tabBtnActive : ''}`}
                onClick={() => setAuthMode('login')}
              >
                <LogIn size={14} /> 로그인
              </button>
              <button 
                className={`${styles.tabBtn} ${authMode === 'register' ? styles.tabBtnActive : ''}`}
                onClick={() => setAuthMode('register')}
              >
                <UserPlus size={14} /> 회원가입
              </button>
            </div>

            {authMode === 'login' ? (
              /* LOGIN FORM (ID + Password ONLY) */
              <form className={styles.authForm} onSubmit={handleLoginSubmit}>
                <div className={styles.authTitleGroup}>
                  <LogIn size={22} style={{ color: '#10b981', margin: '0 auto' }} />
                  <h3>FitShare 로그인</h3>
                  <p>아이디와 비밀번호로 간편하게 접속하세요.</p>
                </div>

                <div className={styles.formGroup}>
                  <label><User size={14} /> 아이디 (ID)</label>
                  <input 
                    type="text" 
                    placeholder="아이디를 입력하세요" 
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><Lock size={14} /> 비밀번호 (Password)</label>
                  <input 
                    type="password" 
                    placeholder="비밀번호를 입력하세요" 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '14px' }} disabled={isSubmitting}>
                  {isSubmitting ? '로그인 중...' : '🔑 로그인하기'}
                </button>

                <div className={styles.switchAuthLink} onClick={() => setAuthMode('register')}>
                  아직 계정이 없으신가요? <strong>회원가입하기 ➔</strong>
                </div>
              </form>
            ) : (
              /* SIGN UP FORM (Full details) */
              <form className={styles.authForm} onSubmit={handleRegisterSubmit}>
                <div className={styles.authTitleGroup}>
                  <UserPlus size={22} style={{ color: '#c084fc', margin: '0 auto' }} />
                  <h3>FitShare 회원가입</h3>
                  <p>최초 1회 회원가입으로 나눔 계정을 생성합니다.</p>
                </div>

                <div className={styles.formGroup}>
                  <label><User size={14} /> 희망 아이디 (ID)</label>
                  <input 
                    type="text" 
                    placeholder="예: minjun_mom" 
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><Lock size={14} /> 비밀번호 (Password)</label>
                  <input 
                    type="password" 
                    placeholder="비밀번호 4자리 이상" 
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><Sparkles size={14} /> 자녀 이름</label>
                  <input 
                    type="text" 
                    placeholder="예: 김민준" 
                    value={regChildName}
                    onChange={e => setRegChildName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><School size={14} /> 학교/유치원 이름 (공간 코드)</label>
                  <input 
                    type="text" 
                    placeholder="예: 새솔초등학교 (SESOL-2026)" 
                    value={regSchoolName}
                    onChange={e => setRegSchoolName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><KeyRound size={14} /> 학년 및 반 번호</label>
                  <input 
                    type="text" 
                    placeholder="예: 4학년 1반" 
                    value={regGradeClass}
                    onChange={e => setRegGradeClass(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label><Phone size={14} /> 학부모 연락처</label>
                  <input 
                    type="tel" 
                    placeholder="예: 010-1234-5678" 
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                  />
                </div>

                <button type="submit" className="glow-btn" style={{ width: '100%', marginTop: '14px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }} disabled={isSubmitting}>
                  {isSubmitting ? '가입 처리 중...' : '📝 회원가입 완료 및 로그인'}
                </button>

                <div className={styles.switchAuthLink} onClick={() => setAuthMode('login')}>
                  이미 계정이 있으신가요? <strong>로그인하기 ➔</strong>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
