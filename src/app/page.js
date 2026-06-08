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
        <h1 className={styles.welcomeTitle}>
          🎒 <span className="gradient-text">FitShare</span> 나눔 옷장
        </h1>
        <p className={styles.welcomeDesc}>
          초등학교에서 작아져 사용하지 않는 교복과 체육복을 나눔하고 재활용하는 클라우드 의류 옷장 플랫폼입니다. 학교나 지자체의 공동 옷장 코드를 입력하세요.
        </p>
        <form onSubmit={handleJoinSpace}>
          <div className={styles.spaceInputRow}>
            <input 
              type="text" 
              value={enteredSpaceCode} 
              onChange={(e) => setEnteredSpaceCode(e.target.value)} 
              placeholder="예: seosol-elementary" 
              className="input-field"
              style={{ padding: '12px 18px', fontSize: '15px' }}
            />
            <button type="submit" className="glow-btn" style={{ padding: '12px 28px' }}>
              옷장 입장
            </button>
          </div>
        </form>
        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
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
            🎒 FitShare <span className="gradient-text">나눔 옷장</span>
          </h1>
          <p className={styles.subtitle}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            접속 옷장: <strong style={{ color: 'hsl(var(--foreground))' }}>{spaceCode}</strong>
          </p>
        </div>

        <div className={styles.actionRow}>
          <button className="glow-btn-secondary" onClick={() => setIsQRModalOpen(true)}>
            <Smartphone size={16} /> 촬영 기기 연동 (QR)
          </button>
          <button className="glow-btn-secondary" onClick={() => router.push('/admin')}>
            <ClipboardList size={16} /> 새 의류 등록 (관리자)
          </button>
          <button className="glow-btn-secondary" style={{ padding: '10px' }} onClick={loadClothes}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="glow-btn-secondary" onClick={handleLeaveSpace} style={{ border: '1px solid hsl(var(--danger)/0.4)', color: 'hsl(var(--danger))' }}>
            옷장 나가기
          </button>
        </div>
      </div>

      {/* Child Size Matcher expandable box */}
      <div className={styles.matcherPanel}>
        <div 
          className={styles.matcherTitle} 
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
          onClick={() => setIsMatcherOpen(!isMatcherOpen)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ruler size={18} style={{ color: 'hsl(var(--secondary))' }} /> 
            내 자녀 체형 맞춤 사이즈 필터 {isMatcherOpen ? '▲' : '▼'}
          </span>
          {childSize.height && (
            <span style={{ fontSize: '13px', color: 'hsl(var(--primary))', fontWeight: '600' }}>
              자녀 키: {childSize.height}cm / 몸무게: {childSize.weight}kg 설정됨
            </span>
          )}
        </div>

        {isMatcherOpen && (
          <div className="fade-in" style={{ marginTop: '20px' }}>
            <div className={styles.matcherInputs}>
              <div>
                <label className={styles.formLabel}>키 (cm)</label>
                <input 
                  type="number" 
                  value={childSize.height} 
                  onChange={(e) => handleSizeInput('height', e.target.value)} 
                  className="input-field" 
                  placeholder="예: 130"
                />
              </div>
              <div>
                <label className={styles.formLabel}>몸무게 (kg)</label>
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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                <Info size={14} style={{ color: 'hsl(var(--secondary))' }} />
                <span>키와 몸무게를 입력하면 표준 성장에 따른 아이의 실측 어깨/가슴/허리 치수가 자동 추정되어 채워집니다.</span>
              </div>
              {childSize.height && (
                <button className="glow-btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={handleClearSizes}>
                  필터 초기화
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
              placeholder="의류명 또는 색상 검색..." 
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted-foreground)' }} />
          </div>
        </div>

        <div className={styles.tagFilters}>
          {/* Category Filters */}
          {['전체', '상의', '하의', '아우터'].map(cat => (
            <button 
              key={cat} 
              className={`${styles.filterTag} ${selectedCategory === cat ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <div style={{ width: '1px', background: 'hsl(var(--border))', margin: '0 8px' }} />
          {/* Style Filters */}
          {['전체', '교복', '체육복', '일상복'].map(st => (
            <button 
              key={st} 
              className={`${styles.filterTag} ${selectedStyle === st ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedStyle(st)}
            >
              {st === '전체' ? '스타일 전체' : st}
            </button>
          ))}
          <div style={{ width: '1px', background: 'hsl(var(--border))', margin: '0 8px' }} />
          {/* Status Filters */}
          {['전체', 'available', 'reserved'].map(stat => (
            <button 
              key={stat} 
              className={`${styles.filterTag} ${selectedStatus === stat ? styles.filterTagActive : ''}`}
              onClick={() => setSelectedStatus(stat)}
            >
              {stat === '전체' ? '상태 전체' : stat === 'available' ? '분양가능' : '예약됨'}
            </button>
          ))}
        </div>
      </div>

      {/* Clothing Card Grid */}
      {isLoading ? (
        <div className={styles.autoGrid}>
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="glass-panel" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
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
          <ShoppingBag size={48} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>해당하는 옷이 없습니다.</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>
            필터 조건을 변경하거나 관리자 페이지에서 촬영한 새로운 옷을 등록해 보세요!
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
                    {cloth.status === 'available' ? '분양 가능' : '예약 완료'}
                  </span>
                  <img src={cloth.image_url} alt={cloth.name} className={styles.cardImage} loading="lazy" />
                  
                  {/* Delete button (convenient for prototype) */}
                  <button 
                    onClick={(e) => handleDelete(cloth, e)}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer', zIndex: 10 }}
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
                    <span className={styles.specTag}>색상: {cloth.color}</span>
                    {cloth.category === '하의' ? (
                      <>
                        <span className={styles.specTag}>허리: {cloth.measurements.waist}cm</span>
                        <span className={styles.specTag}>기장: {cloth.measurements.length}cm</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.specTag}>어깨: {cloth.measurements.shoulder}cm</span>
                        <span className={styles.specTag}>가슴: {cloth.measurements.chest}cm</span>
                        <span className={styles.specTag}>총장: {cloth.measurements.length}cm</span>
                      </>
                    )}
                  </div>

                  {/* Compatibility Badge if child size is configured */}
                  {comp && (
                    <div className={styles.compatibilityBadge} style={{ color: comp.color }}>
                      <Ruler size={13} />
                      <span>{comp.label}</span>
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
            💡 <span className="gradient-text">오늘의 나눔 코디 조합 추천</span>
          </h2>
          <div className={styles.recommendGrid}>
            {recommendations.map((combo, idx) => (
              <div key={idx} className={styles.comboCard}>
                <div className={styles.comboTitle}>{combo.title}</div>
                <div className={styles.comboItems}>
                  <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.top)}>
                    <img src={combo.top.image_url} alt="Top" className={styles.comboItemImg} />
                  </div>
                  <div className={styles.comboItemThumb} onClick={() => setSelectedCloth(combo.bottom)}>
                    <img src={combo.bottom.image_url} alt="Bottom" className={styles.comboItemImg} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    추천 신장: <strong>{combo.estHeight}cm 내외</strong>
                  </div>
                  <button 
                    className="glow-btn" 
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => {
                      setSelectedCloth(combo.top);
                      triggerToast('상의 상세 정보 창을 띄웠습니다. 확인 후 분양받으세요!');
                    }}
                  >
                    조합 확인하기
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
                      strokeWidth={hoveredSpec === 'waist' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'waist' ? 'drop-shadow(0 0 5px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Length Line */}
                    <line 
                      x1={50} y1={selectedCloth.guidelines.length_start_y} 
                      x2={50} y2={selectedCloth.guidelines.length_end_y}
                      stroke="hsl(var(--neon-length))" 
                      strokeWidth={hoveredSpec === 'length' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 5px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                  </>
                ) : (
                  <>
                    {/* Shoulder Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                      x2={50 + selectedCloth.measurements.shoulder / 2} y2={selectedCloth.guidelines.shoulder_y}
                      stroke="hsl(var(--neon-shoulder))" 
                      strokeWidth={hoveredSpec === 'shoulder' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'shoulder' ? 'drop-shadow(0 0 5px hsl(var(--neon-shoulder)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Chest Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.chest / 2} y1={selectedCloth.guidelines.chest_y} 
                      x2={50 + selectedCloth.measurements.chest / 2} y2={selectedCloth.guidelines.chest_y}
                      stroke="hsl(var(--neon-chest))" 
                      strokeWidth={hoveredSpec === 'chest' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'chest' ? 'drop-shadow(0 0 5px hsl(var(--neon-chest)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Sleeve Line */}
                    <line 
                      x1={50 - selectedCloth.measurements.shoulder / 2} y1={selectedCloth.guidelines.shoulder_y} 
                      x2={selectedCloth.guidelines.sleeve_end_x} y2={48}
                      stroke="hsl(var(--neon-sleeve))" 
                      strokeWidth={hoveredSpec === 'sleeve' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'sleeve' ? 'drop-shadow(0 0 5px hsl(var(--neon-sleeve)))' : 'none', transition: 'all 0.2s ease' }}
                    />
                    {/* Length Line */}
                    <line 
                      x1={50} y1={selectedCloth.guidelines.length_start_y} 
                      x2={50} y2={selectedCloth.guidelines.length_end_y}
                      stroke="hsl(var(--neon-length))" 
                      strokeWidth={hoveredSpec === 'length' ? '2.5' : '1.5'}
                      style={{ filter: hoveredSpec === 'length' ? 'drop-shadow(0 0 5px hsl(var(--neon-length)))' : 'none', transition: 'all 0.2s ease' }}
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
                  <span className={styles.specLabel}>기증 코드</span>
                  <span className={styles.specValue}>{selectedCloth.id.slice(0, 8)}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>색상</span>
                  <span className={styles.specValue}>{selectedCloth.color}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>상태</span>
                  <span className={styles.specValue} style={{ color: selectedCloth.status === 'available' ? '#4ade80' : '#fbbf24' }}>
                    {selectedCloth.status === 'available' ? '분양 가능' : '예약 완료'}
                  </span>
                </div>
              </div>

              {/* Interactive Specification List */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--muted-foreground)' }}>
                  의류 실측 치수 (마우스 호버 시 치수선 하이라이트)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCloth.category === '하의' ? (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSpec('waist')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>허리 단면</span>
                        <strong>{selectedCloth.measurements.waist} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSpec('length')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>바지 총장</span>
                        <strong>{selectedCloth.measurements.length} cm</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-shoulder))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSpec('shoulder')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>어깨 너비</span>
                        <strong>{selectedCloth.measurements.shoulder} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-chest))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSpec('chest')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>가슴 단면</span>
                        <strong>{selectedCloth.measurements.chest} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-sleeve))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredSpec('sleeve')}
                        onMouseLeave={() => setHoveredSpec(null)}
                      >
                        <span>소매 길이</span>
                        <strong>{selectedCloth.measurements.sleeve} cm</strong>
                      </div>
                      <div 
                        className="glass-panel" 
                        style={{ padding: '10px 14px', borderLeft: '4px solid hsl(var(--neon-length))', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
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
                <div style={{ marginBottom: '25px', background: 'hsl(var(--muted)/0.3)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>내 자녀 치수와 비교</h4>
                  
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
                    <div style={{ fontSize: '12px', fontWeight: '600', color: checkCompatibility(selectedCloth).color, marginTop: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <Check size={14} /> 자녀 피팅 요약: {checkCompatibility(selectedCloth).label}
                    </div>
                  )}
                </div>
              )}

              {/* Claim Action Button */}
              <div style={{ marginTop: 'auto' }}>
                {selectedCloth.status === 'available' ? (
                  <button 
                    className="glow-btn" 
                    style={{ width: '100%', padding: '14px' }}
                    onClick={() => openReserveModal(selectedCloth)}
                  >
                    무료 분양 신청하기 (예약)
                  </button>
                ) : (
                  <div style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                    <p style={{ fontWeight: '700', color: '#fbbf24', fontSize: '14px' }}>이미 분양 예약된 의류입니다</p>
                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '30px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => { setIsReserveModalOpen(false); setSelectedCloth(null); }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', fontWeight: '800', marginBottom: '15px' }}>
              📝 분양 신청서 작성
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: '1.4' }}>
              나눔 옷은 학교 수거함에서 직접 수령하셔야 합니다. 본인 확인을 위한 학생 정보를 작성해 주세요.
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
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button 
                  className="glow-btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setIsReserveModalOpen(false)}
                >
                  취소
                </button>
                <button 
                  className="glow-btn" 
                  style={{ flex: 2 }}
                  onClick={handleReserve}
                >
                  예약 확정하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CONNECT MODAL */}
      {isQRModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsQRModalOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '30px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setIsQRModalOpen(false)}>
              <X size={16} />
            </button>

            <div className={styles.qrWrapper}>
              <QrCode size={48} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', fontWeight: '800', marginTop: '15px' }}>
                스마트폰 카메라 연결
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '8px', lineHeight: '1.4' }}>
                스마트폰으로 아래 QR 코드를 스캔하면, 모바일 전용 의류 촬영 및 실측 등록 페이지로 즉시 접속합니다.
              </p>
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                alt="Mobile Connection QR"
                className={styles.qrImage}
              />

              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', background: 'hsl(var(--muted)/0.4)', padding: '10px', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                연결 주소: <br />
                <a href={qrCodeUrl} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--secondary))', textDecoration: 'underline', wordBreak: 'break-all' }}>
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
