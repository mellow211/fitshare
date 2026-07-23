const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Load environment variables from .env.local
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const SPACE_CODE = 'default-wardrobe';
const ARTIFACTS_DIR = 'C:\\Users\\mello\\.gemini\\antigravity-ide\\brain\\39ab6fc4-1daa-4c61-839d-ed6c977b7491';
const PUBLIC_CLOTHES_DIR = path.join(__dirname, '../public/clothes');

if (!fs.existsSync(PUBLIC_CLOTHES_DIR)) {
  fs.mkdirSync(PUBLIC_CLOTHES_DIR, { recursive: true });
}

function getOriginalPath(prefix) {
  const files = fs.readdirSync(ARTIFACTS_DIR);
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  return match ? path.join(ARTIFACTS_DIR, match) : null;
}

// 1. 기존 13종 고정 원본 데이터셋 (전혀 건드리지 않음)
const ORIGINAL_13 = [
  {
    prefix: 'kids_grade1_gym_top_red',
    filename: 'kids_grade1_gym_top_red.png',
    name: '새솔초 [1~2학년용] 동복 레드 체육복 상의',
    category: '상의',
    color: '레드',
    style: '체육복',
    measurements: { shoulder: 32, chest: 35, sleeve: 41, length: 47 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    prefix: 'kids_white_polo_shirt',
    filename: 'kids_white_polo_shirt.png',
    name: '새솔초 [1~2학년용] 하복 화이트 생활복 깃셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    prefix: 'kids_yellow_hoodie',
    filename: 'kids_yellow_hoodie.png',
    name: '키즈 [1~2학년용] 병아리 옐로우 후드티',
    category: '상의',
    color: '옐로우',
    style: '일상복',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    prefix: 'kids_gym_shorts_navy',
    filename: 'kids_gym_shorts_navy.png',
    name: '새솔초 [1~2학년용] 하복 네이비 체육복 숏팬츠',
    category: '하의',
    color: '네이비',
    style: '체육복',
    measurements: { waist: 23, length: 32 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    prefix: 'kids_pleated_skirt',
    filename: 'kids_pleated_skirt.png',
    name: '키즈 [1~2학년용] 네이비 스쿨 플리츠 스커트',
    category: '하의',
    color: '네이비',
    style: '교복',
    measurements: { waist: 23, length: 33 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    prefix: 'kids_cardigan_navy',
    filename: 'kids_cardigan_navy.png',
    name: '키즈 [1~2학년용] 네이비 니트 가디건',
    category: '아우터',
    color: '네이비',
    style: '등교룩',
    measurements: { shoulder: 32, chest: 36, sleeve: 41, length: 46 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    prefix: 'kids_gym_top_navy',
    filename: 'kids_gym_top_navy.png',
    name: '새솔초 [3~4학년용] 동복 네이비 체육복 상의',
    category: '상의',
    color: '네이비',
    style: '체육복',
    measurements: { shoulder: 36, chest: 41, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    prefix: 'kids_pink_sweatshirt',
    filename: 'kids_pink_sweatshirt.png',
    name: '키즈 [3~4학년용] 파스텔 핑크 오버핏 맨투맨',
    category: '상의',
    color: '핑크',
    style: '일상복',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    prefix: 'kids_khaki_shorts',
    filename: 'kids_khaki_shorts.png',
    name: '키즈 [3~4학년용] 카키 밴딩 면 반바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    measurements: { waist: 26, length: 39 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    prefix: 'kids_windbreaker_jacket',
    filename: 'kids_windbreaker_jacket.png',
    name: '키즈 [3~4학년용] 그린 경량 바람막이 자켓',
    category: '아우터',
    color: '그린',
    style: '체육복',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    prefix: 'kids_gray_joggers',
    filename: 'kids_gray_joggers.png',
    name: '고학년 [5~6학년용] 편안한 그레이 조거 팬츠',
    category: '하의',
    color: '그레이',
    style: '체육복',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    prefix: 'kids_denim_pants',
    filename: 'kids_denim_pants.png',
    name: '초등 고학년 [5~6학년용] 와이드 핏 데님 청바지',
    category: '하의',
    color: '블루',
    style: '일상복',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    prefix: 'kids_school_jacket',
    filename: 'kids_school_jacket.png',
    name: '새솔초 [5~6학년용] 정복 교복 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  }
];

// 2. 신규 추가하는 17종: 기존 13종 원본 사진에 디자인 디테일(포켓, 지퍼, 단추, 레터링 등)을 합성하여 완전히 독자적인 옷 사진으로 생성
const DISTINCT_MODS_17 = [
  {
    basePrefix: 'kids_white_polo_shirt',
    filename: 'new_blue_stripe_polo.png',
    name: '새솔초 [1~2학년용] 하복 블루 스트라이프 티셔츠',
    category: '상의',
    color: '블루',
    style: '일상복',
    measurements: { shoulder: 32, chest: 35, sleeve: 17, length: 46 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 },
    hue: 0, sat: 1, brightness: 1,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <rect x="220" y="240" width="160" height="12" fill="#1e3a8a" opacity="0.85" />
        <rect x="210" y="280" width="180" height="12" fill="#1e3a8a" opacity="0.85" />
        <rect x="210" y="320" width="180" height="12" fill="#1e3a8a" opacity="0.85" />
        <rect x="220" y="360" width="160" height="12" fill="#1e3a8a" opacity="0.85" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_pink_sweatshirt',
    filename: 'new_orange_campus_m2m.png',
    name: '키즈 [1~2학년용] 오렌지 레터링 캐주얼 맨투맨',
    category: '상의',
    color: '오렌지',
    style: '일상복',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 },
    hue: 35, sat: 1.6, brightness: 1.05,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <text x="300" y="290" font-family="Impact, Arial Black, sans-serif" font-size="32" fill="#ffffff" stroke="#1e293b" stroke-width="2" text-anchor="middle" letter-spacing="4">CAMPUS</text>
      </svg>
    `
  },
  {
    basePrefix: 'kids_khaki_shorts',
    filename: 'new_cargo_khaki_shorts.png',
    name: '초등 저학년 [1~2학년용] 카키 라이트 카고 5부 반바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    measurements: { waist: 24, length: 35 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 },
    hue: -10, sat: 0.95, brightness: 0.9,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 카고 사이드 주머니 덮개 추가 -->
        <rect x="175" y="270" width="55" height="45" rx="4" fill="#5c4033" opacity="0.9" stroke="#3d2a1d" stroke-width="1.5" />
        <line x1="175" y1="285" x2="230" y2="285" stroke="#3d2a1d" stroke-dasharray="3,3" />
        <rect x="370" y="270" width="55" height="45" rx="4" fill="#5c4033" opacity="0.9" stroke="#3d2a1d" stroke-width="1.5" />
        <line x1="370" y1="285" x2="425" y2="285" stroke="#3d2a1d" stroke-dasharray="3,3" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_denim_pants',
    filename: 'new_denim_bustier_pants.png',
    name: '키즈 [1~2학년용] 데님 뷔스티에 점프슈트 멜빵',
    category: '원피스',
    color: '블루',
    style: '등교룩',
    measurements: { shoulder: 33, chest: 38, sleeve: 0, length: 74 },
    guidelines: { shoulder_y: 18, chest_y: 32, sleeve_start_x: 25, sleeve_end_x: 25, length_start_y: 18, length_end_y: 92 },
    hue: 0, sat: 1.1, brightness: 1.0,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 멜빵 가슴받이 및 멜빵 끈 추가 -->
        <path d="M 230,120 L 230,190 L 370,190 L 370,120" fill="none" stroke="#2563eb" stroke-width="14" stroke-linecap="round" opacity="0.9" />
        <rect x="220" y="190" width="160" height="90" fill="#3b82f6" opacity="0.9" stroke="#1d4ed8" stroke-width="2.5" />
        <circle cx="245" cy="210" r="7" fill="#eab308" />
        <circle cx="355" cy="210" r="7" fill="#eab308" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_windbreaker_jacket',
    filename: 'new_fleece_gray_jumper.png',
    name: '초등 [1~2학년용] 다크그레이 덤블 보아 후리스 점퍼',
    category: '아우터',
    color: '다크그레이',
    style: '일상복',
    measurements: { shoulder: 34, chest: 39, sleeve: 43, length: 50 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 },
    hue: 0, sat: 0.1, brightness: 0.55,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 보아 플리스 양털 질감 텍스처 오버레이 -->
        <rect x="180" y="170" width="240" height="320" fill="url(#fleece-pattern)" opacity="0.25" />
        <!-- 지퍼 및 배색 포켓 라인 -->
        <rect x="296" y="170" width="8" height="300" fill="#1e293b" />
        <rect x="320" y="210" width="60" height="45" rx="3" fill="#1e293b" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_white_polo_shirt',
    filename: 'new_skyblue_oxford_shirt.png',
    name: '새솔초 [3~4학년용] 하복 스카이블루 단추 옥스포드 셔츠',
    category: '상의',
    color: '스카이블루',
    style: '교복',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 },
    hue: 200, sat: 1.2, brightness: 0.95,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 세로 단추 여밈선과 우드 단추들 합성 -->
        <line x1="300" y1="180" x2="300" y2="440" stroke="#78350f" stroke-width="2.5" />
        <circle cx="300" cy="220" r="6" fill="#b45309" stroke="#78350f" stroke-width="1" />
        <circle cx="300" cy="270" r="6" fill="#b45309" stroke="#78350f" stroke-width="1" />
        <circle cx="300" cy="320" r="6" fill="#b45309" stroke="#78350f" stroke-width="1" />
        <circle cx="300" cy="370" r="6" fill="#b45309" stroke="#78350f" stroke-width="1" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_pink_sweatshirt',
    filename: 'new_gray_badge_m2m.png',
    name: '키즈 [3~4학년용] 멜란지 그레이 크루넥 오버핏 맨투맨',
    category: '상의',
    color: '그레이',
    style: '일상복',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 },
    hue: 0, sat: 0.15, brightness: 0.85,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 왼쪽 가슴부분 아웃도어 와펜 배지 합성 -->
        <circle cx="260" cy="240" r="18" fill="#1e3a8a" stroke="#ffffff" stroke-width="1.5" />
        <path d="M 252,248 L 260,232 L 268,248 Z" fill="#f59e0b" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_denim_pants',
    filename: 'new_faded_blue_jeans.png',
    name: '초등 [3~4학년용] 딥블루 중청 스트레이트 청바지',
    category: '하의',
    color: '블루',
    style: '일상복',
    measurements: { shoulder: 0, chest: 0, waist: 26, length: 73 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 },
    hue: 210, sat: 1.3, brightness: 0.85,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 무릎 워싱 하이라이트 효과 합성 -->
        <ellipse cx="230" cy="450" rx="20" ry="40" fill="#ffffff" opacity="0.25" filter="blur(8px)" />
        <ellipse cx="370" cy="450" rx="20" ry="40" fill="#ffffff" opacity="0.25" filter="blur(8px)" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_pleated_skirt',
    filename: 'new_charcoal_pinstripe_skirt.png',
    name: '키즈 [3~4학년용] 차콜 핀스트라이프 스쿨 스커트',
    category: '하의',
    color: '차콜',
    style: '교복',
    measurements: { waist: 25, length: 40 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 },
    hue: 0, sat: 0.1, brightness: 0.5,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 가느다란 핀스트라이프 패턴 세로선 합성 -->
        <line x1="220" y1="180" x2="220" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
        <line x1="250" y1="180" x2="250" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
        <line x1="280" y1="180" x2="280" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
        <line x1="310" y1="180" x2="310" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
        <line x1="340" y1="180" x2="340" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
        <line x1="370" y1="180" x2="370" y2="400" stroke="#e2e8f0" stroke-width="1.5" opacity="0.4" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_school_jacket',
    filename: 'new_khaki_safari_jacket.png',
    name: '초등 [3~4학년용] 카키 야상 사파리 점퍼',
    category: '아우터',
    color: '카키',
    style: '일상복',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 },
    hue: 85, sat: 0.75, brightness: 0.65,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 입체적인 사파리 주머니 아웃포켓 디자인 합성 -->
        <rect x="200" y="340" width="70" height="80" rx="5" fill="#3f6212" stroke="#14532d" stroke-width="2" />
        <rect x="200" y="330" width="70" height="20" rx="3" fill="#14532d" />
        <rect x="330" y="340" width="70" height="80" rx="5" fill="#3f6212" stroke="#14532d" stroke-width="2" />
        <rect x="330" y="330" width="70" height="20" rx="3" fill="#14532d" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_white_polo_shirt',
    filename: 'new_white_mesh_tee.png',
    name: '초등 고학년 [5~6학년용] 드라이 쿨메쉬 무지 화이트 반팔티',
    category: '상의',
    color: '화이트',
    style: '일상복',
    measurements: { shoulder: 40, chest: 45, sleeve: 21, length: 61 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 },
    hue: 0, sat: 1, brightness: 1,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 깃(Collar) 부분을 흰색 원단 패치로 가려서 크루넥 반팔로 수정 -->
        <path d="M 260,170 Q 300,210 340,170" fill="none" stroke="#f1f5f9" stroke-width="12" />
        <path d="M 260,170 Q 300,210 340,170" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_gym_top_navy',
    filename: 'new_charcoal_halfzip_top.png',
    name: '새솔초 [5~6학년용] 하이넥 차콜 반집업 체육복',
    category: '상의',
    color: '차콜',
    style: '체육복',
    measurements: { shoulder: 41, chest: 46, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 },
    hue: 0, sat: 0.1, brightness: 0.45,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 깃 중심에 반집업 금속 지퍼 라인 합성 -->
        <rect x="297" y="170" width="6" height="85" fill="#94a3b8" />
        <circle cx="300" cy="255" r="5" fill="#475569" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_yellow_hoodie',
    filename: 'new_charcoal_kangaroo_hoodie.png',
    name: '초등 고학년 [5~6학년용] 차콜 캥거루 오버핏 후드티',
    category: '상의',
    color: '차콜',
    style: '일상복',
    measurements: { shoulder: 42, chest: 48, sleeve: 54, length: 64 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 },
    hue: 0, sat: 0.05, brightness: 0.42,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 밝은 화이트 후드 드로우 스트링 끈 및 캥거루 포켓 경계선 합성 -->
        <line x1="280" y1="210" x2="270" y2="290" stroke="#f1f5f9" stroke-width="4.5" stroke-linecap="round" />
        <line x1="320" y1="210" x2="330" y2="290" stroke="#f1f5f9" stroke-width="4.5" stroke-linecap="round" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_gray_joggers',
    filename: 'new_black_cargo_joggers.png',
    name: '고학년 [5~6학년용] 블랙 시보리 입체 카고 조거 바지',
    category: '하의',
    color: '블랙',
    style: '일상복',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 },
    hue: 0, sat: 0, brightness: 0.28,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 허벅지 카고 포켓 및 블랙 봉조선 디테일 합성 -->
        <rect x="180" y="420" width="50" height="65" rx="4" fill="#0c0a09" stroke="#292524" stroke-width="2" />
        <rect x="370" y="420" width="50" height="65" rx="4" fill="#0c0a09" stroke="#292524" stroke-width="2" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_denim_pants',
    filename: 'new_deep_indigo_jeans.png',
    name: '초등 고학년 [5~6학년용] 딥인디고 와이드 데님 청바지',
    category: '하의',
    color: '딥인디고',
    style: '일상복',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 },
    hue: 230, sat: 1.4, brightness: 0.65,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 데님 특유의 오렌지색 더블 스티치 스티칭 라인 디테일 합성 -->
        <line x1="205" y1="210" x2="205" y2="580" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8" />
        <line x1="395" y1="210" x2="395" y2="580" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_gym_shorts_navy',
    filename: 'new_black_piping_shorts.png',
    name: '초등 고학년 [5~6학년용] 기능성 스포츠 쿨메쉬 5부 반바지',
    category: '하의',
    color: '블랙',
    style: '체육복',
    measurements: { waist: 28, length: 44 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 },
    hue: 0, sat: 0, brightness: 0.25,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 옆선 스포티한 더블 화이트 배색 파이핑 라인 합성 -->
        <line x1="190" y1="180" x2="190" y2="340" stroke="#ffffff" stroke-width="3" />
        <line x1="410" y1="180" x2="410" y2="340" stroke="#ffffff" stroke-width="3" />
      </svg>
    `
  },
  {
    basePrefix: 'kids_windbreaker_jacket',
    filename: 'new_navy_waterproof_windbreaker.png',
    name: '초등 고학년 [5~6학년용] 네이비 후드 방수 바람막이 집업',
    category: '아우터',
    color: '네이비',
    style: '체육복',
    measurements: { shoulder: 40, chest: 48, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 },
    hue: 220, sat: 1.3, brightness: 0.55,
    svgOverlay: `
      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <!-- 전면 지퍼 화이트 포인트 지퍼라인 및 후드 스트링 합성 -->
        <line x1="300" y1="180" x2="300" y2="480" stroke="#f1f5f9" stroke-width="3" />
        <line x1="270" y1="190" x2="260" y2="245" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round" />
        <line x1="330" y1="190" x2="340" y2="245" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round" />
      </svg>
    `
  }
];

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("📸 Generating 30 DISTINCT Clothes-Only Flat-lay Photos...");

  let count = 0;

  // 1. Insert Original 13
  for (const item of ORIGINAL_13) {
    const srcPath = getOriginalPath(item.prefix);
    if (!srcPath) {
      console.error(`❌ Original photo not found for prefix: ${item.prefix}`);
      continue;
    }

    const destPath = path.join(PUBLIC_CLOTHES_DIR, item.filename);
    fs.copyFileSync(srcPath, destPath);

    const fileBuf = fs.readFileSync(destPath);
    const base64Data = `data:image/png;base64,${fileBuf.toString('base64')}`;

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
      console.error(`❌ Insert error for original ${item.name}:`, error.message);
    } else {
      console.log(`✅ [Original 13] ${item.name} - Registered!`);
      count++;
    }
  }

  // 2. Composite and Insert 17 Unique Design Items
  for (const item of DISTINCT_MODS_17) {
    const srcPath = getOriginalPath(item.basePrefix);
    if (!srcPath) {
      console.error(`❌ Base photo not found for modifier: ${item.basePrefix}`);
      continue;
    }

    const destPath = path.join(PUBLIC_CLOTHES_DIR, item.filename);

    // Dynamic Tone Modulate + SVG Details Composite Overlay
    let pipeline = sharp(srcPath).modulate({
      hue: item.hue,
      saturation: item.sat,
      brightness: item.brightness
    });

    if (item.svgOverlay) {
      pipeline = pipeline.composite([
        {
          input: Buffer.from(item.svgOverlay),
          blend: 'over'
        }
      ]);
    }

    await pipeline.toFile(destPath);

    const fileBuf = fs.readFileSync(destPath);
    const base64Data = `data:image/png;base64,${fileBuf.toString('base64')}`;

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
      console.error(`❌ Insert error for modified ${item.name}:`, error.message);
    } else {
      console.log(`✨ [New 17 Unique Design] ${item.name} - Registered!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! Total ${count} Distinct Clothes-Only Flat-lay Photos Registered in Supabase!`);
}

run();
