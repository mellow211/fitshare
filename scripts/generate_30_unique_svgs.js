const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envConfig[match[1]] = value;
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SPACE_CODE = 'default-wardrobe';
const PUBLIC_CLOTHES_DIR = path.join(__dirname, '../public/clothes');
if (!fs.existsSync(PUBLIC_CLOTHES_DIR)) {
  fs.mkdirSync(PUBLIC_CLOTHES_DIR, { recursive: true });
}

// Function to generate clean vector SVG flat-lay apparel product illustrations
function generateApparelSVG(item) {
  const { category, colorHex, secondaryHex, name, detailType } = item;
  const width = 400;
  const height = 400;
  const mainColor = colorHex || '#3b82f6';
  const subColor = secondaryHex || '#ffffff';
  const shadowColor = 'rgba(0,0,0,0.08)';

  let innerContent = '';

  if (category === '상의') {
    if (detailType === 'hoodie') {
      innerContent = `
        <!-- Hoodie body -->
        <path d="M 120 130 Q 200 110 280 130 L 310 330 Q 200 340 90 330 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Hood -->
        <path d="M 140 120 Q 200 60 260 120 Q 200 135 140 120 Z" fill="${subColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Hood strings -->
        <path d="M 185 130 L 180 200" stroke="#f1f5f9" stroke-width="4" stroke-linecap="round" />
        <path d="M 215 130 L 220 200" stroke="#f1f5f9" stroke-width="4" stroke-linecap="round" />
        <!-- Kangaroo Pocket -->
        <path d="M 130 260 L 270 260 L 255 315 L 145 315 Z" fill="${subColor}" opacity="0.3" stroke="#1e293b" stroke-width="3" />
        <!-- Sleeves -->
        <path d="M 120 130 L 50 230 L 85 245 L 130 180 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 130 L 350 230 L 315 245 L 270 180 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    } else if (detailType === 'polo') {
      innerContent = `
        <!-- Polo Body -->
        <path d="M 120 120 L 280 120 L 295 330 L 105 330 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Collar -->
        <path d="M 120 120 L 200 155 L 280 120 L 240 100 L 200 115 L 160 100 Z" fill="${subColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Placket & Buttons -->
        <rect x="188" y="150" width="24" height="60" fill="${subColor}" stroke="#1e293b" stroke-width="2" />
        <circle cx="200" cy="165" r="3" fill="#1e293b" />
        <circle cx="200" cy="190" r="3" fill="#1e293b" />
        <!-- Short Sleeves -->
        <path d="M 120 120 L 60 170 L 85 200 L 125 160 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 120 L 340 170 L 315 200 L 275 160 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    } else if (detailType === 'sweatshirt') {
      innerContent = `
        <!-- Sweatshirt Body -->
        <path d="M 120 115 Q 200 105 280 115 L 295 320 Q 200 330 105 320 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- V-notch Crewneck -->
        <path d="M 160 115 Q 200 140 240 115 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3" />
        <path d="M 190 135 L 200 150 L 210 135 Z" fill="${subColor}" stroke="#1e293b" stroke-width="2" />
        <!-- Long Sleeves -->
        <path d="M 120 115 L 50 240 L 85 255 L 125 170 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 115 L 350 240 L 315 255 L 275 170 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    } else {
      // Standard Gym/T-shirt
      innerContent = `
        <!-- T-Shirt Body -->
        <path d="M 120 110 L 280 110 L 295 330 L 105 330 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Neckline -->
        <path d="M 160 110 Q 200 140 240 110 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3" />
        <!-- Accent Chest Stripe -->
        <rect x="110" y="180" width="180" height="30" fill="${subColor}" stroke="#1e293b" stroke-width="2" />
        <!-- Sleeves -->
        <path d="M 120 110 L 55 170 L 90 200 L 125 155 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 110 L 345 170 L 310 200 L 275 155 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    }
  } else if (category === '하의') {
    if (detailType === 'shorts') {
      innerContent = `
        <!-- Shorts Body -->
        <path d="M 125 100 L 275 100 L 295 240 L 210 240 L 200 160 L 190 240 L 105 240 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Elastic Waistband -->
        <rect x="125" y="100" width="150" height="30" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Drawstring -->
        <path d="M 195 130 L 190 160 M 205 130 L 210 160" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <!-- Side Stripe -->
        <line x1="130" y1="130" x2="110" y2="240" stroke="${subColor}" stroke-width="6" />
        <line x1="270" y1="130" x2="290" y2="240" stroke="${subColor}" stroke-width="6" />
      `;
    } else if (detailType === 'skirt') {
      innerContent = `
        <!-- Pleated Skirt -->
        <path d="M 140 110 L 260 110 L 310 270 L 90 270 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Waistband -->
        <rect x="140" y="110" width="120" height="25" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Pleat Lines -->
        <line x1="130" y1="135" x2="120" y2="270" stroke="#1e293b" stroke-width="2" />
        <line x1="160" y1="135" x2="160" y2="270" stroke="#1e293b" stroke-width="2" />
        <line x1="200" y1="135" x2="200" y2="270" stroke="#1e293b" stroke-width="2" />
        <line x1="240" y1="135" x2="240" y2="270" stroke="#1e293b" stroke-width="2" />
        <line x1="270" y1="135" x2="280" y2="270" stroke="#1e293b" stroke-width="2" />
      `;
    } else {
      // Long Pants (Jeans / Joggers / Slacks)
      innerContent = `
        <!-- Long Pants Body -->
        <path d="M 130 90 L 270 90 L 290 350 L 215 350 L 200 170 L 185 350 L 110 350 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Waistband -->
        <rect x="130" y="90" width="140" height="30" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Pockets & Stitches -->
        <path d="M 135 120 Q 160 150 175 120" fill="none" stroke="#1e293b" stroke-width="3" />
        <path d="M 265 120 Q 240 150 225 120" fill="none" stroke="#1e293b" stroke-width="3" />
        <!-- Fly Stitch -->
        <path d="M 200 120 L 200 160 Q 190 170 180 170" fill="none" stroke="#1e293b" stroke-width="2" />
      `;
    }
  } else {
    // 아우터 (Jacket / Cardigan / Windbreaker)
    if (detailType === 'cardigan') {
      innerContent = `
        <!-- Cardigan Body -->
        <path d="M 120 110 L 280 110 L 295 320 L 105 320 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- V-Neck Opening -->
        <path d="M 140 110 L 200 230 L 260 110 Z" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Center Placket & Buttons -->
        <line x1="200" y1="230" x2="200" y2="320" stroke="#1e293b" stroke-width="4" />
        <circle cx="200" cy="245" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5" />
        <circle cx="200" cy="270" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5" />
        <circle cx="200" cy="295" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5" />
        <!-- Long Sleeves -->
        <path d="M 120 110 L 55 235 L 90 250 L 125 160 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 110 L 345 235 L 310 250 L 275 160 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    } else if (detailType === 'windbreaker') {
      innerContent = `
        <!-- Windbreaker Body -->
        <path d="M 120 115 Q 200 100 280 115 L 300 330 L 100 330 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Zipper Line -->
        <line x1="200" y1="110" x2="200" y2="330" stroke="${subColor}" stroke-width="5" />
        <!-- High Collar / Hood -->
        <path d="M 140 115 Q 200 85 260 115 L 250 135 Q 200 120 150 135 Z" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Color Block Chest Patch -->
        <path d="M 115 170 L 200 200 L 285 170 L 290 220 L 110 220 Z" fill="${subColor}" opacity="0.8" stroke="#1e293b" stroke-width="2" />
        <!-- Sleeves -->
        <path d="M 120 115 L 50 240 L 85 255 L 125 170 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 280 115 L 350 240 L 315 255 L 275 170 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    } else {
      // Blazer / School Jacket
      innerContent = `
        <!-- Blazer Body -->
        <path d="M 115 110 L 285 110 L 300 330 L 100 330 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <!-- Lapels -->
        <path d="M 115 110 L 175 180 L 135 185 L 175 230 L 200 230 L 225 230 L 265 185 L 225 180 L 285 110 Z" fill="${subColor}" stroke="#1e293b" stroke-width="3" />
        <!-- Flap Pockets -->
        <rect x="120" y="260" width="60" height="25" fill="${subColor}" stroke="#1e293b" stroke-width="2" />
        <rect x="220" y="260" width="60" height="25" fill="${subColor}" stroke="#1e293b" stroke-width="2" />
        <!-- Sleeves -->
        <path d="M 115 110 L 50 245 L 85 260 L 120 165 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
        <path d="M 285 110 L 350 245 L 315 260 L 280 165 Z" fill="${mainColor}" stroke="#1e293b" stroke-width="4" />
      `;
    }
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.15" />
    </filter>
  </defs>
  <!-- Background Studio Surface -->
  <rect width="100%" height="100%" rx="24" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="2" />
  
  <!-- Single Isolated Apparel Product Graphic -->
  <g filter="url(#shadow)">
    ${innerContent}
  </g>
  
  <!-- Subtle Watermark Tag -->
  <text x="200" y="380" font-family="'Pretendard', sans-serif" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">FITSHARE • ${name.slice(0, 18)}</text>
</svg>
`;

  return svg;
}

// 30종 100% 서로 다른 고유 디자인 품목 정의
const THIRTY_UNIQUE_DESIGNS = [
  // ==========================================
  // 🎒 1~2학년 (저학년 / 10종 / Size 110~120)
  // ==========================================
  {
    filename: 'grade1_red_gym_top.svg',
    name: '새솔초 [1~2학년용] 동복 레드 라인 체육복 상의',
    category: '상의',
    style: '체육복',
    color: '레드',
    colorHex: '#ef4444',
    secondaryHex: '#ffffff',
    detailType: 'tshirt',
    measurements: { shoulder: 32, chest: 35, sleeve: 41, length: 47 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    filename: 'grade1_white_polo.svg',
    name: '새솔초 [1~2학년용] 하복 화이트 생활복 깃셔츠',
    category: '상의',
    style: '교복',
    color: '화이트',
    colorHex: '#ffffff',
    secondaryHex: '#1e3a8a',
    detailType: 'polo',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    filename: 'grade1_yellow_hoodie.svg',
    name: '키즈 [1~2학년용] 병아리 옐로우 캐릭터 후드티',
    category: '상의',
    style: '일상복',
    color: '옐로우',
    colorHex: '#eab308',
    secondaryHex: '#fef08a',
    detailType: 'hoodie',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    filename: 'grade1_mint_sweatshirt.svg',
    name: '키즈 [1~2학년용] 파스텔 민트 나염 긴팔티',
    category: '상의',
    style: '일상복',
    color: '민트',
    colorHex: '#2dd4bf',
    secondaryHex: '#ccfbf1',
    detailType: 'sweatshirt',
    measurements: { shoulder: 32, chest: 35, sleeve: 40, length: 46 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    filename: 'grade1_navy_shorts.svg',
    name: '새솔초 [1~2학년용] 하복 네이비 체육복 숏팬츠',
    category: '하의',
    style: '체육복',
    color: '네이비',
    colorHex: '#1e3a8a',
    secondaryHex: '#ef4444',
    detailType: 'shorts',
    measurements: { waist: 23, length: 32 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    filename: 'grade1_khaki_shorts.svg',
    name: '키즈 [1~2학년용] 카키 밴딩 면 반바지',
    category: '하의',
    style: '일상복',
    color: '카키',
    colorHex: '#65a30d',
    secondaryHex: '#ecfccb',
    detailType: 'shorts',
    measurements: { waist: 24, length: 34 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    filename: 'grade1_navy_skirt.svg',
    name: '키즈 [1~2학년용] 클래식 네이비 멜빵 스커트',
    category: '하의',
    style: '교복',
    color: '네이비',
    colorHex: '#1e1b4b',
    secondaryHex: '#cbd5e1',
    detailType: 'skirt',
    measurements: { waist: 23, length: 33 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    filename: 'grade1_light_denim.svg',
    name: '초등 키즈 [1~2학년용] 연청 워싱 스판 데님',
    category: '하의',
    style: '일상복',
    color: '연청',
    colorHex: '#38bdf8',
    secondaryHex: '#e0f2fe',
    detailType: 'pants',
    measurements: { waist: 24, length: 62 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    filename: 'grade1_orange_windbreaker.svg',
    name: '키즈 [1~2학년용] 오렌지 안전 등교 바람막이',
    category: '아우터',
    style: '체육복',
    color: '오렌지',
    colorHex: '#f97316',
    secondaryHex: '#1e293b',
    detailType: 'windbreaker',
    measurements: { shoulder: 33, chest: 37, sleeve: 42, length: 49 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    filename: 'grade1_pink_cardigan.svg',
    name: '키즈 [1~2학년용] 베이비 핑크 라운드 가디건',
    category: '아우터',
    style: '등교룩',
    color: '핑크',
    colorHex: '#f472b6',
    secondaryHex: '#fdf2f8',
    detailType: 'cardigan',
    measurements: { shoulder: 32, chest: 36, sleeve: 41, length: 46 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },

  // ==========================================
  // 🎒 3~4학년 (중학년 / 10종 / Size 130~140)
  // ==========================================
  {
    filename: 'grade3_navy_zipup.svg',
    name: '새솔초 [3~4학년용] 동복 네이비 집업 체육복',
    category: '상의',
    style: '체육복',
    color: '네이비',
    colorHex: '#1e3a8a',
    secondaryHex: '#facc15',
    detailType: 'sweatshirt',
    measurements: { shoulder: 36, chest: 41, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    filename: 'grade3_purple_sweatshirt.svg',
    name: '키즈 [3~4학년용] 라벤더 퍼플 레트로 맨투맨',
    category: '상의',
    style: '일상복',
    color: '퍼플',
    colorHex: '#a855f7',
    secondaryHex: '#f3e8ff',
    detailType: 'sweatshirt',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    filename: 'grade3_blue_oxford.svg',
    name: '새솔초 [3~4학년용] 생활복 스카이블루 셔츠',
    category: '상의',
    style: '교복',
    color: '블루',
    colorHex: '#60a5fa',
    secondaryHex: '#ffffff',
    detailType: 'polo',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    filename: 'grade3_rugby_shirt.svg',
    name: '초등 [3~4학년용] 단가라 스트라이프 럭비티',
    category: '상의',
    style: '등교룩',
    color: '스트라이프',
    colorHex: '#475569',
    secondaryHex: '#f8fafc',
    detailType: 'tshirt',
    measurements: { shoulder: 37, chest: 42, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    filename: 'grade3_track_pants.svg',
    name: '새솔초 [3~4학년용] 동복 2선 트레이닝 바지',
    category: '하의',
    style: '체육복',
    color: '네이비',
    colorHex: '#1e293b',
    secondaryHex: '#ffffff',
    detailType: 'pants',
    measurements: { waist: 26, length: 74 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    filename: 'grade3_chino_pants.svg',
    name: '초등 [3~4학년용] 베이지 테이퍼드 치노 바지',
    category: '하의',
    style: '등교룩',
    color: '베이지',
    colorHex: '#d97706',
    secondaryHex: '#fef3c7',
    detailType: 'pants',
    measurements: { waist: 26, length: 75 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    filename: 'grade3_charcoal_skirt.svg',
    name: '키즈 [3~4학년용] 차콜 핀스트라이프 스커트',
    category: '하의',
    style: '교복',
    color: '차콜',
    colorHex: '#334155',
    secondaryHex: '#94a3b8',
    detailType: 'skirt',
    measurements: { waist: 25, length: 40 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    filename: 'grade3_medium_denim.svg',
    name: '초등 [3~4학년용] 중청 구제 롤업 데님 바지',
    category: '하의',
    style: '일상복',
    color: '중청',
    colorHex: '#2563eb',
    secondaryHex: '#dbeafe',
    detailType: 'pants',
    measurements: { waist: 26, length: 73 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    filename: 'grade3_cable_cardigan.svg',
    name: '초등 [3~4학년용] 네이비 V넥 꽈배기 가디건',
    category: '아우터',
    style: '교복',
    color: '네이비',
    colorHex: '#0f172a',
    secondaryHex: '#ffffff',
    detailType: 'cardigan',
    measurements: { shoulder: 36, chest: 42, sleeve: 47, length: 54 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    filename: 'grade3_olive_jacket.svg',
    name: '키즈 [3~4학년용] 올리브 카키 사파리 자켓',
    category: '아우터',
    style: '일상복',
    color: '카키',
    colorHex: '#4d7c0f',
    secondaryHex: '#f7fee7',
    detailType: 'blazer',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },

  // ==========================================
  // 🎒 5~6학년 (고학년 / 10종 / Size 150~160)
  // ==========================================
  {
    filename: 'grade5_cool_shirt.svg',
    name: '새솔초 [5~6학년용] 하복 쿨메쉬 교복 반팔',
    category: '상의',
    style: '교복',
    color: '화이트',
    colorHex: '#ffffff',
    secondaryHex: '#0284c7',
    detailType: 'polo',
    measurements: { shoulder: 40, chest: 45, sleeve: 21, length: 61 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    filename: 'grade5_charcoal_halfzip.svg',
    name: '새솔초 [5~6학년용] 하이넥 차콜 반집업 체육복',
    category: '상의',
    style: '체육복',
    color: '차콜',
    colorHex: '#1e293b',
    secondaryHex: '#0ea5e9',
    detailType: 'sweatshirt',
    measurements: { shoulder: 41, chest: 46, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    filename: 'grade5_coral_sweatshirt.svg',
    name: '초등 고학년 [5~6학년용] 코랄 핑크 맨투맨',
    category: '상의',
    style: '일상복',
    color: '코랄',
    colorHex: '#fb7185',
    secondaryHex: '#fff1f2',
    detailType: 'sweatshirt',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    filename: 'grade5_charcoal_hoodie.svg',
    name: '초등 고학년 [5~6학년용] 차콜 오버핏 후드티',
    category: '상의',
    style: '일상복',
    color: '차콜',
    colorHex: '#334155',
    secondaryHex: '#cbd5e1',
    detailType: 'hoodie',
    measurements: { shoulder: 42, chest: 48, sleeve: 54, length: 64 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    filename: 'grade5_cargo_joggers.svg',
    name: '고학년 [5~6학년용] 카고 포켓 블랙 조거 바지',
    category: '하의',
    style: '체육복',
    color: '블랙',
    colorHex: '#09090b',
    secondaryHex: '#3f3f46',
    detailType: 'pants',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    filename: 'grade5_deep_indigo.svg',
    name: '초등 고학년 [5~6학년용] 딥인디고 와이드 데님',
    category: '하의',
    color: '딥인디고',
    style: '일상복',
    colorHex: '#1e3a8a',
    secondaryHex: '#93c5fd',
    detailType: 'pants',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    filename: 'grade5_mesh_shorts.svg',
    filename: 'grade5_mesh_shorts.svg',
    name: '고학년 [5~6학년용] 스포츠 메쉬 5부 반바지',
    category: '하의',
    style: '체육복',
    color: '블랙',
    colorHex: '#18181b',
    secondaryHex: '#a1a1aa',
    detailType: 'shorts',
    measurements: { waist: 28, length: 44 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    filename: 'grade5_brown_corduroy.svg',
    name: '초등 고학년 [5~6학년용] 다크브라운 코듀로이',
    category: '하의',
    color: '브라운',
    style: '일상복',
    colorHex: '#78350f',
    secondaryHex: '#fef3c7',
    detailType: 'pants',
    measurements: { waist: 29, length: 86 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    filename: 'grade5_tailored_blazer.svg',
    name: '새솔초 [5~6학년용] 정복 스쿨 테일러드 재킷',
    category: '아우터',
    style: '교복',
    color: '다크그레이',
    colorHex: '#1f2937',
    secondaryHex: '#e5e7eb',
    detailType: 'blazer',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  },
  {
    filename: 'grade5_navy_windbreaker.svg',
    name: '고학년 [5~6학년용] 네이비 후드 바람막이',
    category: '아우터',
    style: '체육복',
    color: '네이비',
    colorHex: '#0b132b',
    secondaryHex: '#38bdf8',
    detailType: 'windbreaker',
    measurements: { shoulder: 40, chest: 48, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  }
];

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("🎨 Generating 30 Completely Unique Vector Flat-Lay Designs...");

  let count = 0;
  for (const item of THIRTY_UNIQUE_DESIGNS) {
    const svgString = generateApparelSVG(item);
    
    // Save SVG file into public/clothes/
    const svgPath = path.join(PUBLIC_CLOTHES_DIR, item.filename);
    fs.writeFileSync(svgPath, svgString, 'utf8');

    // Create Base64 Data URL for Supabase DB
    const base64Data = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

    const record = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      space_code: SPACE_CODE,
      name: item.name,
      category: item.category,
      color: item.color,
      style: item.style,
      image_url: base64Data,
      measurements: item.measurements,
      guidelines: item.guidelines,
      status: 'available',
      reservation: null
    };

    const { error } = await supabase.from('clothes').insert([record]);
    if (error) {
      console.error(`❌ Insert error for ${item.name}:`, error.message);
    } else {
      console.log(`✅ [${item.name}] - Unique Design Created & Registered!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! All ${count} Completely Unique Designs Registered in Supabase!`);
}

run();
