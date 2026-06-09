'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Search, SlidersHorizontal, RefreshCw, Smartphone, 
  MapPin, Check, QrCode, ClipboardList, Ruler, Info, ShoppingBag, Trash2, X
} from 'lucide-react';
import styles from './dashboard.module.css';
import { getClothes, reserveCloth, deleteCloth } from '../lib/db';

export default function DashboardPage() {
  const router = useRouter();
  
  // Wardrobe Space Code
  const [spaceCode, setSpaceCode] = useState('');
  const [enteredSpaceCode, setEnteredSpaceCode] = useState('');
  const [isSpaceLoaded, setIsSpaceLoaded] = useState(false);

  // Clothes Database & Loading
  const [clothes, setClothes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStyle, setSelectedStyle] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');

  // Child Size Matcher
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [childSize, setChildSize] = useState({
    height: '',
    weight: '',
    shoulder: '',
    chest: '',
    waist: '',
    length: ''
  });

  // Active Interactive Modal
  const [selectedCloth, setSelectedCloth] = useState(null);
  const [hoveredSpec, setHoveredSpec] = useState(null); // 'shoulder', 'chest', 'sleeve', 'length', 'waist'

  // Modals visibility
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  // Reservation Info
  const [reserveName, setReserveName] = useState('');
  const [reserveGrade, setReserveGrade] = useState('');
  const [reservePhone, setReservePhone] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load space code on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitshare_active_space');
      if (saved) {
        setSpaceCode(saved);
        setEnteredSpaceCode(saved);
        setIsSpaceLoaded(true);
      }
    }
  }, []);

  // Fetch clothes whenever spaceCode changes
  useEffect(() => {
    if (!spaceCode) return;
    loadClothes();
  }, [spaceCode]);

  const loadClothes = async () => {
    setIsLoading(true);
    try {
      const data = await getClothes(spaceCode);
      setClothes(data);
    } catch (e) {
      console.error(e);
      triggerToast('옷장 정보를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSpace = (e) => {
    e.preventDefault();
    const code = enteredSpaceCode.trim() || 'default-wardrobe';
    localStorage.setItem('fitshare_active_space', code);
    setSpaceCode(code);
    setIsSpaceLoaded(true);
    triggerToast(`'${code}' 옷장에 접속했습니다.`);
  };

  const handleLeaveSpace = () => {
    localStorage.removeItem('fitshare_active_space');
    setSpaceCode('');
    setIsSpaceLoaded(false);
    setClothes([]);
  };

  // Auto-estimate children's flat measurements based on Height & Weight
  useEffect(() => {
    const h = Number(childSize.height);
    const w = Number(childSize.weight);
    
    if (h > 0) {
      // Standard empirical equations for Korean primary school children
      const estShoulder = Math.round(h * 0.27); // 120cm -> 32cm
      const estChest = Math.round(h * 0.35);    // 120cm -> 42cm
      const estWaist = w > 0 ? Math.round(w * 0.7 + 8) : Math.round(h * 0.22); // 25kg -> 25.5cm
      const estPantsLength = Math.round(h * 0.58); // 120cm -> 70cm
      
      setChildSize(prev => ({
        ...prev,
        shoulder: prev.shoulder === '' || prev.autoPopulated ? estShoulder : prev.shoulder,
        chest: prev.chest === '' || prev.autoPopulated ? estChest : prev.chest,
        waist: prev.waist === '' || prev.autoPopulated ? estWaist : prev.waist,
        length: prev.length === '' || prev.autoPopulated ? estPantsLength : prev.length,
        autoPopulated: true
      }));
    }
  }, [childSize.height, childSize.weight]);

  const handleSizeInput = (field, val) => {
    setChildSize(prev => ({
      ...prev,
      [field]: val,
      autoPopulated: field === 'height' || field === 'weight' ? prev.autoPopulated : false
    }));
  };

  const handleClearSizes = () => {
    setChildSize({ height: '', weight: '', shoulder: '', chest: '', waist: '', length: '' });
  };

  // Get compatibility score & message for a specific garment
  const checkCompatibility = (item) => {
    const s_child = Number(childSize.shoulder);
    const c_child = Number(childSize.chest);
    const w_child = Number(childSize.waist);
    const l_child = Number(childSize.length);

    if (!s_child && !c_child && !w_child && !l_child) return null;

    const ms = item.measurements;
    
    if (item.category === '상의' || item.category === '아우터') {
      if (!s_child || !c_child) return null;
      
      // Too small check
      if (ms.shoulder < s_child || ms.chest < c_child) {
        return { status: 'too-small', label: '작음 (불편함)', color: '#ef4444' };
      }
      // Just right
      if (ms.shoulder <= s_child + 2 && ms.chest <= c_child + 3) {
        return { status: 'fit', label: '예쁘게 잘 맞음', color: '#4ade80' };
      }
      // Grow room
      if (ms.shoulder <= s_child + 6 && ms.chest <= c_child + 8) {
        return { status: 'loose', label: '여유로움 (성장 대비)', color: '#fbbf24' };
      }
      // Too big
      return { status: 'too-large', label: '너무 큼 (비추천)', color: '#a855f7' };
    }

    if (item.category === '하의') {
      if (!w_child || !l_child) return null;

      // Too small
      if (ms.waist < w_child - 2 || ms.length < l_child - 3) {
        return { status: 'too-small', label: '작음 (길이/품 부족)', color: '#ef4444' };
      }
      // Just right
      if (ms.waist <= w_child + 2 && ms.length >= l_child - 1 && ms.length <= l_child + 3) {
        return { status: 'fit', label: '예쁘게 잘 맞음', color: '#4ade80' };
      }
      // Grow room
      if (ms.waist <= w_child + 4 && ms.length <= l_child + 8) {
        return { status: 'loose', label: '여유로움 (성장 대비)', color: '#fbbf24' };
      }
      // Too big
      return { status: 'too-large', label: '너무 큼 (기장 김)', color: '#a855f7' };
    }

    return null;
  };

  // Filter clothes
  const filteredClothes = clothes.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.color.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Dropdown filters
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchesStyle = selectedStyle === '전체' || item.style === selectedStyle;
    const matchesStatus = selectedStatus === '전체' || item.status === selectedStatus;

    // Sizing filter
    const comp = checkCompatibility(item);
    const matchesSize = !isMatcherOpen || !childSize.height || !comp || 
                        (comp.status === 'fit' || comp.status === 'loose');

    return matchesSearch && matchesCategory && matchesStyle && matchesStatus && matchesSize;
  });

  // Smart Outfit Recommendation Algorithm
  const getOutfitRecommendations = () => {
    const availableTops = clothes.filter(i => i.status === 'available' && (i.category === '상의' || i.category === '아우터'));
    const availableBottoms = clothes.filter(i => i.status === 'available' && i.category === '하의');
    
    const recommendations = [];

    availableTops.forEach(top => {
      availableBottoms.forEach(bottom => {
        // Calculate estimated height tier for top and bottom
        const topEstHeight = Math.round(top.measurements.shoulder / 0.27);
        const bottomEstHeight = Math.round(bottom.measurements.length / 0.58);

        // 1. Size Compatibility (should fit the same height tier within 12cm margin)
        const sizeCompatible = Math.abs(topEstHeight - bottomEstHeight) <= 12;

        // 2. Style Compatibility (Uniform sets or Gym sets are highly compatible)
        const styleCompatible = top.style === bottom.style;

        // 3. Color Harmony (Navy + Navy, Navy + White, Gray + White, etc.)
        const colors = [top.color, bottom.color];
        const colorCompatible = 
          top.color === bottom.color || 
          (colors.includes('네이비') && colors.includes('화이트')) ||
          (colors.includes('다크그레이') && colors.includes('화이트')) ||
          (colors.includes('블랙') && colors.includes('화이트'));

        if (sizeCompatible && styleCompatible) {
          let score = 50;
          if (top.style === '교복' || top.style === '체육복') score += 30; // standard uniform pairings
          if (colorCompatible) score += 20;

          recommendations.push({
            top,
            bottom,
            score,
            title: top.style === '체육복' 
              ? `활동적인 ${top.color} 단체 체육복 세트`
              : top.style === '교복'
              ? `정갈한 ${top.color} 정복 교복 세트`
              : `자연스러운 ${top.color} 나눔 상/하의 코디`,
            estHeight: Math.round((topEstHeight + bottomEstHeight) / 2)
          });
        }
      });
    });

    // Sort by compatibility score
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const recommendations = getOutfitRecommendations();

  // Handle reserve click
  const openReserveModal = (cloth) => {
    setSelectedCloth(cloth);
    setIsReserveModalOpen(true);
  };

  const handleReserve = async () => {
    if (!reserveName.trim() || !reserveGrade.trim() || !reservePhone.trim()) {
      triggerToast('예약자 정보를 모두 입력해 주세요.');
      return;
    }

    try {
      const reservation = {
        student_name: reserveName,
        grade: reserveGrade,
        parent_phone: reservePhone
      };

      await reserveCloth(spaceCode, selectedCloth.id, reservation);
      triggerToast('나눔 옷 예약이 완료되었습니다. 학교로 방문해주세요!');
      setIsReserveModalOpen(false);
      setSelectedCloth(null);
      
      // Reset reserve fields
      setReserveName('');
      setReserveGrade('');
      setReservePhone('');

      loadClothes(); // Refresh
    } catch (e) {
      console.error(e);
      triggerToast('예약 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (cloth, e) => {
    e.stopPropagation();
    if (!confirm(`'${cloth.name}'을(를) 옷장에서 삭제하시겠습니까?`)) return;
    
    try {
      await deleteCloth(spaceCode, cloth.id);
      triggerToast('옷이 성공적으로 삭제되었습니다.');
      loadClothes();
    } catch (e) {
      console.error(e);
      triggerToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Welcome Screen (Enter space code)
  if (!isSpaceLoaded) {
    return (
      <div className={styles.welcomeCard}>
        {/* Playful Eco-Friendly Welcome SVG Illustration */}
        <svg width="140" height="140" viewBox="0 0 120 120" fill="none" style={{ margin: '0 auto 20px auto', display: 'block', filter: 'drop-shadow(0 8px 16px rgba(16,185,129,0.15))' }}>
          <circle cx="60" cy="60" r="54" fill="#e8f5ed" />
          {/* Main Closet frame */}
          <rect x="35" y="35" width="50" height="55" rx="8" fill="#ffffff" stroke="#16a34a" strokeWidth="3" />
          <line x1="60" y1="35" x2="60" y2="90" stroke="#16a34a" strokeWidth="2" />
          <circle cx="53" cy="62" r="3" fill="#16a34a" />
          <circle cx="67" cy="62" r="3" fill="#16a34a" />
          
          {/* Eco Leaves growing out of closet */}
          <path d="M60 25C60 25 70 18 78 26C78 26 70 34 60 25Z" fill="#22c55e" />
          <path d="M60 25C60 25 50 18 42 26C42 26 50 34 60 25Z" fill="#22c55e" />
          <line x1="60" y1="25" x2="60" y2="35" stroke="#16a34a" strokeWidth="2.5" />
          
          {/* Small clothes hanger floating */}
          <path d="M30 45C30 45 20 50 22 56C24 60 38 60 38 60" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M90 45C90 45 100 50 98 56C96 60 82 60 82 60" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 45C32 40 38 40 40 45" stroke="#0ea5e9" strokeWidth="2" />
        </svg>

        <h1 className={styles.welcomeTitle}>
          🌱 <span className="gradient-text">우리 학교 스마트 옷장</span>
        </h1>
        <p className={styles.welcomeDesc}>
          작아져서 못 입는 교복과 체육복을 나눔하고 재활용하는 따뜻한 친환경 옷장입니다. 우리 학교 전용 코드를 입력하고 들어가 보세요!
        </p>
        <form onSubmit={handleJoinSpace}>
          <div className={styles.spaceInputRow}>
            <input 
              type="text" 
              value={enteredSpaceCode} 
              onChange={(e) => setEnteredSpaceCode(e.target.value)} 
              placeholder="예: seosol-elementary" 
              className="input-field"
              style={{ padding: '14px 20px', fontSize: '15px', borderRadius: 'var(--radius-md)' }}
            />
            <button type="submit" className="glow-btn" style={{ padding: '14px 28px', borderRadius: 'var(--radius-md)' }}>
              옷장 구경하기 🎒
            </button>
          </div>
        </form>
        <p style={{ marginTop: '22px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
          * 입력하지 않을 시 기본 체험용 옷장(default-wardrobe)으로 입장합니다.
        </p>
      </div>
    );
  }

  const qrCodeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/admin` 
    : '';

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <h1 className={styles.mainTitle}>
            🎒 FitShare <span className="gradient-text">우리 학교 옷장</span>
          </h1>
          <p className={styles.subtitle}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: 'hsl(var(--primary))' }} />
            현재 학교 옷장: <strong style={{ color: 'hsl(var(--primary))' }}>{spaceCode}</strong> 🟢
          </p>
        </div>

        <div className={styles.actionRow}>
          <button className="glow-btn-secondary" onClick={() => setIsQRModalOpen(true)}>
            <Smartphone size={16} /> 📱 모바일 연동 QR
          </button>
          <button className="glow-btn-secondary" onClick={() => router.push('/admin')}>
            <ClipboardList size={16} /> 🧺 옷 기부하기 (등록)
          </button>
          <button className="glow-btn-secondary" style={{ padding: '10px' }} onClick={loadClothes}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="glow-btn-secondary" onClick={handleLeaveSpace} style={{ border: '1px solid hsl(var(--danger)/0.2)', color: 'hsl(var(--danger))' }}>
            옷장 나가기
          </button>
        </div>
      </div>

      {/* Mascot Guidance Widget */}
      <div className={styles.mascotWidget} style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius-lg)', padding: '22px 26px', marginBottom: '30px', boxShadow: '0 8px 30px rgba(16,185,129,0.05)' }}>
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {/* Cute leaf mascot Choroki */}
          <svg width="68" height="68" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="36" r="24" fill="#e8f5ed" stroke="#16a34a" strokeWidth="3" />
            {/* Leaf ears */}
            <path d="M22 16C18 10 26 6 30 12C28 16 24 18 22 16Z" fill="#16a34a" />
            <path d="M42 16C46 10 38 6 34 12C36 16 40 18 42 16Z" fill="#16a34a" />
            {/* Eyes */}
            <circle cx="23" cy="34" r="3" fill="#0c1a13" />
            <circle cx="41" cy="34" r="3" fill="#0c1a13" />
            {/* Blushing cheeks */}
            <circle cx="18" cy="38" r="3" fill="#f43f5e" fillOpacity="0.4" />
            <circle cx="46" cy="38" r="3" fill="#f43f5e" fillOpacity="0.4" />
            {/* Smile */}
            <path d="M28 41C28 41 30 44 32 44C34 44 36 41 36 41" stroke="#0c1a13" strokeWidth="2" strokeLinecap="round" />
            {/* Mini Graduation cap */}
            <path d="M26 19L32 16L38 19L32 22L26 19Z" fill="#ca8a04" />
            <rect x="30" y="20" width="4" height="2" fill="#ca8a04" />
          </svg>
          <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#22c55e', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>🌱</span>
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'hsl(var(--primary))', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            안녕! 나는 스마트 옷장의 도우미 '초록이'야!
          </h3>
          <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '5px', lineHeight: '1.5' }}>
            우리 학교 선배, 후배들이 입던 소중한 옷들을 함께 나누어 지구 온도도 낮추고, 
            가족의 의류비도 아낄 수 있어! 아래 **'내 아이 맞춤 사이즈 필터'**를 눌러 키와 몸무게를 입력하면 
            예쁘게 잘 맞는 옷들을 AI가 쏙쏙 골라줄게! 🏫✨
          </p>
        </div>
      </div>

      {/* Child Size Matcher expandable box */}
      <div className={styles.matcherPanel}>
        <div 
          className={styles.matcherTitle} 
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
          onClick={() => setIsMatcherOpen(!isMatcherOpen)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ruler size={18} style={{ color: 'hsl(var(--primary))' }} /> 
            내 아이 맞춤 사이즈 매칭 필터 {isMatcherOpen ? '▲' : '▼'}
          </span>
          {childSize.height && (
            <span style={{ fontSize: '13px', color: 'hsl(var(--primary))', fontWeight: '700' }}>
              자녀 키: {childSize.height}cm / 몸무게: {childSize.weight}kg 설정 완료 🎯
            </span>
          )}
        </div>

        {isMatcherOpen && (
          <div className="fade-in" style={{ marginTop: '20px' }}>
            <div className={styles.matcherInputs}>
              <div>
                <label className={styles.formLabel}>아이 키 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.height} 
                  onChange={(e) => handleSizeInput('height', e.target.value)} 
                  className="input-field" 
                  placeholder="예: 130"
                />
              </div>
              <div>
                <label className={styles.formLabel}>아이 몸무게 (kg)</label>
                <input 
                  type="number" 
                  value={childSize.weight} 
                  onChange={(e) => handleSizeInput('weight', e.target.value)} 
                  className="input-field" 
                  placeholder="예: 30"
                />
              </div>
              <div>
                <label className={styles.formLabel}>어깨 너비 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.shoulder} 
                  onChange={(e) => handleSizeInput('shoulder', e.target.value)} 
                  className="input-field" 
                  placeholder="자동 계산"
                />
              </div>
              <div>
                <label className={styles.formLabel}>가슴 단면 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.chest} 
                  onChange={(e) => handleSizeInput('chest', e.target.value)} 
                  className="input-field" 
                  placeholder="자동 계산"
                />
              </div>
              <div>
                <label className={styles.formLabel}>허리 단면 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.waist} 
                  onChange={(e) => handleSizeInput('waist', e.target.value)} 
                  className="input-field" 
                  placeholder="자동 계산"
                />
              </div>
              <div>
                <label className={styles.formLabel}>바지 총장 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.length} 
                  onChange={(e) => handleSizeInput('length', e.target.value)} 
                  className="input-field" 
                  placeholder="자동 계산"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                <Info size={14} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                <span>키와 몸무게를 입력하면 표준 신체 치수가 자동 설정되며, 자녀보다 너무 작거나 비추천하는 크기의 옷은 똑똑하게 필터링됩니다.</span>
              </div>
              {childSize.height && (
                <button className="glow-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }} onClick={handleClearSizes}>
                  필터 지우기 🔄
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid Filtering options */}
      <div className={styles.filterSection}>
        <div className={styles.searchBar}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="의류 이름 또는 색상 검색..." 
              className="input-field"
              style={{ paddingLeft: '38px', borderRadius: 'var(--radius-md)' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'hsl(var(--muted-foreground))' }} />
          </div>
        </div>

        <div className={styles.tagFilters}>
          {/* Category Filters */}
          {[['전체', '전체 🌈'], ['상의', '상의 👕'], ['하의', '하의 👖'], ['아우터', '아우터 🧥']].map(([key, label]) => (
            <button 
              key={key} 
              className={`${styles.filterTag} ${selectedCategory === key ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
          <div style={{ width: '1px', background: 'hsl(var(--border))', margin: '0 4px' }} />
          {/* Style Filters */}
          {[['전체', '전체 💫'], ['교복', '교복 👔'], ['체육복', '체육복 🏃'], ['일상복', '일상복 🧸']].map(([key, label]) => (
            <button 
              key={key} 
              className={`${styles.filterTag} ${selectedStyle === key ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedStyle(key)}
            >
              {label}
            </button>
          ))}
          <div style={{ width: '1px', background: 'hsl(var(--border))', margin: '0 4px' }} />
          {/* Status Filters */}
          {[['전체', '전체 🏷️'], ['available', '신청가능 🌱'], ['reserved', '예약됨 🔒']].map(([key, label]) => (
            <button 
              key={key} 
              className={`${styles.filterTag} ${selectedStatus === key ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clothing Card Grid */}
      {isLoading ? (
        <div className={styles.autoGrid}>
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="glass-panel" style={{ height: '390px', display: 'flex', flexDirection: 'column' }}>
              <div className="skeleton" style={{ height: '240px', width: '100%' }} />
              <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                <div className="skeleton" style={{ height: '20px', width: '80%' }} />
                <div className="skeleton" style={{ height: '14px', width: '60%', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClothes.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={48} style={{ color: 'hsl(var(--primary))', opacity: 0.6 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800' }}>여기에 알맞은 옷이 아직 없어요.</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>
            필터 조건을 변경하거나 모바일 화면을 통해 아이가 입던 깨끗한 옷을 먼저 기부해 주세요!
          </p>
        </div>
      ) : (
        <div className={`${styles.autoGrid} fade-in`}>
          {filteredClothes.map(cloth => {
            const comp = checkCompatibility(cloth);
            return (
              <div key={cloth.id} className={styles.card} onClick={() => setSelectedCloth(cloth)}>
                {/* Image wrapper */}
                <div className={styles.imageWrapper}>
                  <span className={`${styles.statusBadge} badge ${cloth.status === 'available' ? 'badge-available' : 'badge-reserved'}`}>
                    {cloth.status === 'available' ? '🌱 신청 가능' : '🔒 예약 완료'}
                  </span>
                  <img src={cloth.image_url} alt={cloth.name} className={styles.cardImage} loading="lazy" />
                  
                  {/* Delete button */}
                  <button 
                    onClick={(e) => handleDelete(cloth, e)}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s ease' }}
                    title="의류 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Content details */}
                <div className={styles.cardContent}>
                  <span className={styles.cardCategory}>{cloth.style} • {cloth.category}</span>
                  <h3 className={styles.cardName}>{cloth.name}</h3>

                  <div className={styles.cardSpecs}>
                    <span className={styles.specTag}>🎨 {cloth.color}</span>
                    {cloth.category === '하의' ? (
                      <>
                        <span className={styles.specTag}>📐 허리: {cloth.measurements.waist}cm</span>
                        <span className={styles.specTag}>📏 기장: {cloth.measurements.length}cm</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.specTag}>📐 어깨: {cloth.measurements.shoulder}cm</span>
                        <span className={styles.specTag}>📐 가슴: {cloth.measurements.chest}cm</span>
                        <span className={styles.specTag}>📏 총장: {cloth.measurements.length}cm</span>
                      </>
                    )}
                  </div>

                  {/* Compatibility Badge */}
                  {comp && (
                    <div className={styles.compatibilityBadge} style={{ color: comp.color }}>
                      <Ruler size={13} style={{ stroke: comp.color }} />
                      <span>{comp.label === '예쁘게 잘 맞음' ? '💚 ' + comp.label : comp.label === '여유로움 (성장 대비)' ? '💛 ' + comp.label : '❤️ ' + comp.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outfit Recommendations Panel */}
      {!isLoading && recommendations.length > 0 && (
        <div className={`${styles.recommendSection} fade-in`}>
          <h2 className={styles.recommendTitle}>
            💡 <span className="gradient-text">초록이가 어울리는 나눔 코디를 골라왔어!</span>
          </h2>
          <div className={styles.recommendGrid}>
            {recommendations.map((combo, idx) => (
              <div key={idx} className={styles.comboCard}>
                <div className={styles.comboTitle}>{combo.title}</div>
                <div className={styles.comboItems}>
                  <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.top)}>
                    <img src={combo.top.image_url} alt="Top" className={styles.comboItemImg} />
                    <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>상의</span>
                  </div>
                  <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.bottom)}>
                    <img src={combo.bottom.image_url} alt="Bottom" className={styles.comboItemImg} />
                    <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>하의</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                    추천 자녀 키: <strong>{combo.estHeight}cm 내외</strong>
                  </div>
                  <button 
                    className="glow-btn" 
                    style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => {
                      setSelectedCloth(combo.top);
                      triggerToast('상의 상세 정보를 먼저 열어드릴게요! 확인 후 둘 다 분양받으세요.');
                    }}
                  >
                    세트 확인하기 👉
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL: Visual Inspect Panel */}
      {selectedCloth && !isReserveModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCloth(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedCloth(null)}>
              <X size={16} />
            </button>

            {/* Left side: Canvas overlay with glowing lines */}
            <div className={styles.modalImageArea}>
              <img src={selectedCloth.image_url} alt={selectedCloth.name} className={styles.modalImage} />
              
              {/* Measurement lines SVG overlay */}
              <svg 
                width="100%" height="100%" viewBox="0 0 100 100" 
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              >
                {selectedCloth.category === '하의' ? (
                  <>
                    {/* Waist Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.waist / 2} y1={selectedCloth.guidelines.waist_y} 
                      x2={50 + selectedCloth.measurements.waist / 2} y2={selectedCloth.guidelines.waist_y}
                      stroke="hsl(var(--neon-chest))" 
                      strokeWidth={hoveredSpec === 'waist' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'waist' ? 'drop-shadow(0 0 6px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Length Line */}
                    <line 
                      x1={50} y1={selectedCloth.guidelines.length_start_y} 
                      x2={50} y2={selectedCloth.guidelines.length_end_y}
                      stroke="hsl(var(--neon-length))" 
                      strokeWidth={hoveredSpec === 'length' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 6px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                  </>
                ) : (
                  <>
                    {/* Shoulder Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                      x2={50 + selectedCloth.measurements.shoulder / 2} y2={selectedCloth.guidelines.shoulder_y}
                      stroke="hsl(var(--neon-shoulder))" 
                      strokeWidth={hoveredSpec === 'shoulder' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'shoulder' ? 'drop-shadow(0 0 6px hsl(var(--neon-shoulder)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Chest Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.chest / 2} y1={selectedCloth.guidelines.chest_y} 
                      x2={50 + selectedCloth.measurements.chest / 2} y2={selectedCloth.guidelines.chest_y}
                      stroke="hsl(var(--neon-chest))" 
                      strokeWidth={hoveredSpec === 'chest' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'chest' ? 'drop-shadow(0 0 6px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Sleeve Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                      x2={selectedCloth.guidelines.sleeve_end_x} y2={48}
                      stroke="hsl(var(--neon-sleeve))" 
                      strokeWidth={hoveredSpec === 'sleeve' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'sleeve' ? 'drop-shadow(0 0 6px hsl(var(--neon-sleeve)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Length Line */}
                    <line 
                      x1={50} y1={selectedCloth.guidelines.length_start_y} 
                      x2={50} y2={selectedCloth.guidelines.length_end_y}
                      stroke="hsl(var(--neon-length))" 
                      strokeWidth={hoveredSpec === 'length' ? '3.5' : '2'}
                      style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 6px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Right side: clothing properties + compare sizes */}
            <div className={styles.modalInfoArea}>
              <span className={styles.modalCategory}>{selectedCloth.style} • {selectedCloth.category}</span>
              <h2 className={styles.modalTitle}>{selectedCloth.name}</h2>

              <div className={styles.specSection}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>기증 식별 코드</span>
                  <span className={styles.specValue}>{selectedCloth.id.slice(0, 8)}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>색상</span>
                  <span className={styles.specValue}>{selectedCloth.color}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>현재 분양 상태</span>
                  <span className={styles.specValue} style={{ color: selectedCloth.status === 'available' ? 'hsl(var(--primary))' : '#ca8a04' }}>
                    {selectedCloth.status === 'available' ? '🌱 신청 가능' : '🔒 예약 완료'}
                  </span>
                </div>
              </div>

              {/* Interactive Specification List */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: 'hsl(var(--muted-foreground))' }}>
                  의류 실측 치수 (치수선에 마우스를 올리면 옷에 표시선이 비쳐요!)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCloth.category === '하의' ? (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('waist')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>허리 단면</span>
                        <strong>{selectedCloth.measurements.waist} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('length')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>바지 총 기장</span>
                        <strong>{selectedCloth.measurements.length} cm</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-shoulder))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('shoulder')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>어깨 너비</span>
                        <strong>{selectedCloth.measurements.shoulder} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('chest')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>가슴 단면</span>
                        <strong>{selectedCloth.measurements.chest} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-sleeve))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('sleeve')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>소매 기장</span>
                        <strong>{selectedCloth.measurements.sleeve} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                        onMouseEnter={() => setHoveredSpec('length')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>의류 총장</span>
                        <strong>{selectedCloth.measurements.length} cm</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Compare measurements graph */}
              {childSize.height && (
                <div style={{ marginBottom: '25px', background: 'rgba(16,185,129,0.04)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--card-border))' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: 'hsl(var(--primary))' }}>내 자녀 치수와 비교 그래프</h4>
                  
                  {selectedCloth.category === '하의' ? (
                    <>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>허리 단면</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.waist) / 50) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.waist / 50) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.waist} / 옷 {selectedCloth.measurements.waist}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>바지 총장</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.length) / 110) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.length / 110) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.length} / 옷 {selectedCloth.measurements.length}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>어깨 너비</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.shoulder) / 60) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.shoulder / 60) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.shoulder} / 옷 {selectedCloth.measurements.shoulder}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>가슴 단면</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.chest) / 65) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.chest / 65) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.chest} / 옷 {selectedCloth.measurements.chest}</span>
                      </div>
                      <div className={styles.compareRow}>
                        <span className={styles.compareName}>총 기장</span>
                        <div className={styles.compareBars}>
                          <div className={styles.barWrapper}><div className={styles.barChild} style={{ width: `${(Number(childSize.length) / 90) * 100}%` }} /></div>
                          <div className={styles.barWrapper}><div className={styles.barCloth} style={{ width: `${(selectedCloth.measurements.length / 90) * 100}%` }} /></div>
                        </div>
                        <span className={styles.compareValues}>아이 {childSize.length} / 옷 {selectedCloth.measurements.length}</span>
                      </div>
                    </>
                  )}
                  
                  {checkCompatibility(selectedCloth) && (
                    <div style={{ fontSize: '12px', fontWeight: '700', color: checkCompatibility(selectedCloth).color, marginTop: '12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <Check size={14} /> 자녀 피팅 결과: {checkCompatibility(selectedCloth).label}
                    </div>
                  )}
                </div>
              )}

              {/* Claim Action Button */}
              <div style={{ marginTop: 'auto' }}>
                {selectedCloth.status === 'available' ? (
                  <button 
                    className="glow-btn" 
                    style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)' }}
                    onClick={() => openReserveModal(selectedCloth)}
                  >
                    🎁 이 나눔 옷 무료로 신청하기
                  </button>
                ) : (
                  <div style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontWeight: '800', color: '#ca8a04', fontSize: '14px' }}>🔒 이미 나눔 예약이 완료된 의류입니다</p>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
                      예약자: {selectedCloth.reservation?.student_name} ({selectedCloth.reservation?.grade})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESERVATION INPUT FORM MODAL */}
      {isReserveModalOpen && selectedCloth && (
        <div className={styles.modalOverlay} onClick={() => { setIsReserveModalOpen(false); setSelectedCloth(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '30px', position: 'relative', border: '1px solid hsl(var(--primary)/0.2)' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => { setIsReserveModalOpen(false); setSelectedCloth(null); }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', fontWeight: '800', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--primary))' }}>
              📝 나눔 신청서 작성
            </h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '20px', lineHeight: '1.4' }}>
              나눔 옷은 학교 수거함에서 본인 확인 후 직접 수령하실 수 있습니다. 간단한 신청자 정보를 입력해주세요.
            </p>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>학생 이름</label>
                <input 
                  type="text" 
                  value={reserveName} 
                  onChange={(e) => setReserveName(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 홍길동"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학년 및 반</label>
                <input 
                  type="text" 
                  value={reserveGrade} 
                  onChange={(e) => setReserveGrade(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 3학년 2반"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div>
                <label className={styles.formLabel}>학부모 연락처</label>
                <input 
                  type="text" 
                  value={reservePhone} 
                  onChange={(e) => setReservePhone(e.target.value)} 
                  className="input-field" 
                  placeholder="예: 010-1234-5678"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  className="glow-btn-secondary" 
                  style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
                  onClick={() => setIsReserveModalOpen(false)}
                >
                  돌아가기
                </button>
                <button 
                  className="glow-btn" 
                  style={{ flex: 2, borderRadius: 'var(--radius-md)' }}
                  onClick={handleReserve}
                >
                  신청 완료하기 🌱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CONNECT MODAL */}
      {isQRModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsQRModalOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '30px', position: 'relative', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setIsQRModalOpen(false)}>
              <X size={16} />
            </button>

            <div className={styles.qrWrapper}>
              <QrCode size={48} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', fontWeight: '800', marginTop: '15px' }}>
                모바일에서 편리하게 촬영하기
              </h3>
              <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '8px', lineHeight: '1.4' }}>
                스마트폰 카메라로 아래 QR 코드를 스캔하면, 모바일 전용 의류 촬영 및 AI 실측 등록 화면으로 연동됩니다.
              </p>
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                alt="Mobile Connection QR"
                className={styles.qrImage}
              />

              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '12px', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid hsl(var(--border))', marginTop: '10px' }}>
                주소 복사 링크: <br />
                <a href={qrCodeUrl} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--secondary))', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: '600' }}>
                  {qrCodeUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

