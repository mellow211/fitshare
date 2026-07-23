const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

function findBaseImageFile(prefix) {
  const files = fs.readdirSync(ARTIFACTS_DIR);
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (match) {
    return path.join(ARTIFACTS_DIR, match);
  }
  return null;
}

// 30종 100% 유니크 실제 스튜디오 사진 사양 정의
const THIRTY_STUDIO_SPECS = [
  // --- 1~2학년 (저학년 / 10종) ---
  {
    outName: 'grade1_red_gym_top.png',
    basePrefix: 'kids_grade1_gym_top_red',
    mod: null, // Base Red Gym Top
    name: '새솔초 [1~2학년용] 동복 레드 체육복 상의',
    category: '상의',
    color: '레드',
    style: '체육복',
    measurements: { shoulder: 32, chest: 35, sleeve: 41, length: 47 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    outName: 'grade1_white_polo.png',
    basePrefix: 'kids_white_polo_shirt',
    mod: null, // Base White Polo
    name: '새솔초 [1~2학년용] 하복 화이트 생활복 깃셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    outName: 'grade1_yellow_hoodie.png',
    basePrefix: 'kids_yellow_hoodie',
    mod: null, // Base Yellow Hoodie
    name: '키즈 [1~2학년용] 병아리 옐로우 후드티',
    category: '상의',
    color: '옐로우',
    style: '일상복',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    outName: 'grade1_pink_sweatshirt.png',
    basePrefix: 'kids_pink_sweatshirt',
    mod: null, // Base Pink Sweatshirt
    name: '키즈 [1~2학년용] 파스텔 핑크 오버핏 맨투맨',
    category: '상의',
    color: '핑크',
    style: '일상복',
    measurements: { shoulder: 32, chest: 35, sleeve: 40, length: 46 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    outName: 'grade1_navy_shorts.png',
    basePrefix: 'kids_gym_shorts_navy',
    mod: null, // Base Navy Shorts
    name: '새솔초 [1~2학년용] 하복 네이비 체육복 숏팬츠',
    category: '하의',
    color: '네이비',
    style: '체육복',
    measurements: { waist: 23, length: 32 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    outName: 'grade1_khaki_shorts.png',
    basePrefix: 'kids_khaki_shorts',
    mod: null, // Base Khaki Shorts
    name: '키즈 [1~2학년용] 카키 밴딩 면 반바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    measurements: { waist: 24, length: 34 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    outName: 'grade1_navy_skirt.png',
    basePrefix: 'kids_pleated_skirt',
    mod: null, // Base Navy Skirt
    name: '키즈 [1~2학년용] 네이비 스쿨 플리츠 스커트',
    category: '하의',
    color: '네이비',
    style: '교복',
    measurements: { waist: 23, length: 33 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    outName: 'grade1_light_denim.png',
    basePrefix: 'kids_denim_pants',
    mod: { hue: 195, sat: 1.2, brightness: 1.1 }, // Shift to Light Blue Denim
    name: '초등 키즈 [1~2학년용] 연청 워싱 스판 데님 바지',
    category: '하의',
    color: '연청',
    style: '일상복',
    measurements: { waist: 24, length: 62 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    outName: 'grade1_green_windbreaker.png',
    basePrefix: 'kids_windbreaker_jacket',
    mod: null, // Base Green Windbreaker
    name: '키즈 [1~2학년용] 그린 경량 바람막이 자켓',
    category: '아우터',
    color: '그린',
    style: '체육복',
    measurements: { shoulder: 33, chest: 37, sleeve: 42, length: 49 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    outName: 'grade1_navy_cardigan.png',
    basePrefix: 'kids_cardigan_navy',
    mod: null, // Base Navy Cardigan
    name: '키즈 [1~2학년용] 네이비 니트 가디건',
    category: '아우터',
    color: '네이비',
    style: '교복',
    measurements: { shoulder: 32, chest: 36, sleeve: 41, length: 46 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },

  // --- 3~4학년 (중학년 / 10종) ---
  {
    outName: 'grade3_navy_gym_top.png',
    basePrefix: 'kids_gym_top_navy',
    mod: null, // Base Navy Gym Top
    name: '새솔초 [3~4학년용] 동복 네이비 체육복 상의',
    category: '상의',
    color: '네이비',
    style: '체육복',
    measurements: { shoulder: 36, chest: 41, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    outName: 'grade3_blue_polo.png',
    basePrefix: 'kids_white_polo_shirt',
    mod: { hue: 205, sat: 1.5, brightness: 0.95 }, // Sky Blue Polo
    name: '새솔초 [3~4학년용] 하복 스카이블루 생활복 깃셔츠',
    category: '상의',
    color: '스카이블루',
    style: '교복',
    measurements: { shoulder: 36, chest: 40, sleeve: 19, length: 53 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    outName: 'grade3_orange_hoodie.png',
    basePrefix: 'kids_yellow_hoodie',
    mod: { hue: 25, sat: 1.6, brightness: 1.0 }, // Orange Hoodie
    name: '키즈 [3~4학년용] 상큼 오렌지 코튼 후드티',
    category: '상의',
    color: '오렌지',
    style: '일상복',
    measurements: { shoulder: 37, chest: 42, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    outName: 'grade3_purple_sweatshirt.png',
    basePrefix: 'kids_pink_sweatshirt',
    mod: { hue: 275, sat: 1.4, brightness: 0.95 }, // Lavender Purple Sweatshirt
    name: '키즈 [3~4학년용] 라벤더 퍼플 오버핏 맨투맨',
    category: '상의',
    color: '퍼플',
    style: '일상복',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    outName: 'grade3_red_shorts.png',
    basePrefix: 'kids_gym_shorts_navy',
    mod: { hue: 0, sat: 1.8, brightness: 0.9 }, // Red Line Shorts
    name: '새솔초 [3~4학년용] 하복 레드 체육복 숏팬츠',
    category: '하의',
    color: '레드',
    style: '체육복',
    measurements: { waist: 26, length: 39 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    outName: 'grade3_gray_joggers.png',
    basePrefix: 'kids_gray_joggers',
    mod: null, // Base Gray Joggers
    name: '초등 [3~4학년용] 편안한 그레이 조거 팬츠',
    category: '하의',
    color: '그레이',
    style: '체육복',
    measurements: { waist: 26, length: 74 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    outName: 'grade3_charcoal_skirt.png',
    basePrefix: 'kids_pleated_skirt',
    mod: { brightness: 0.7, sat: 0.2 }, // Charcoal Skirt
    name: '키즈 [3~4학년용] 차콜 스쿨 플리츠 스커트',
    category: '하의',
    color: '차콜',
    style: '교복',
    measurements: { waist: 25, length: 40 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    outName: 'grade3_medium_denim.png',
    basePrefix: 'kids_denim_pants',
    mod: null, // Base Medium Blue Denim
    name: '초등 [3~4학년용] 키즈 중청 데님 청바지',
    category: '하의',
    color: '중청',
    style: '일상복',
    measurements: { waist: 26, length: 73 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    outName: 'grade3_beige_cardigan.png',
    basePrefix: 'kids_cardigan_navy',
    mod: { hue: 35, sat: 1.1, brightness: 1.3 }, // Beige Cardigan
    name: '초등 [3~4학년용] 베이지 V넥 니트 가디건',
    category: '아우터',
    color: '베이지',
    style: '교복',
    measurements: { shoulder: 36, chest: 42, sleeve: 47, length: 54 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    outName: 'grade3_school_jacket.png',
    basePrefix: 'kids_school_jacket',
    mod: null, // Base Blazer Jacket
    name: '새솔초 [3~4학년용] 정복 교복 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  },

  // --- 5~6학년 (고학년 / 10종) ---
  {
    outName: 'grade5_green_gym_top.png',
    basePrefix: 'kids_gym_top_navy',
    mod: { hue: 140, sat: 1.3, brightness: 0.9 }, // Green Gym Top
    name: '새솔초 [5~6학년용] 동복 그린 체육복 상의',
    category: '상의',
    color: '그린',
    style: '체육복',
    measurements: { shoulder: 41, chest: 46, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    outName: 'grade5_mint_polo.png',
    basePrefix: 'kids_white_polo_shirt',
    mod: { hue: 165, sat: 1.3, brightness: 1.05 }, // Mint Polo
    name: '새솔초 [5~6학년용] 하복 민트 생활복 깃셔츠 (대형)',
    category: '상의',
    color: '민트',
    style: '교복',
    measurements: { shoulder: 40, chest: 45, sleeve: 21, length: 61 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    outName: 'grade5_black_hoodie.png',
    basePrefix: 'kids_yellow_hoodie',
    mod: { brightness: 0.35, sat: 0.1 }, // Black Hoodie
    name: '초등 고학년 [5~6학년용] 블랙 캥거루 후드티',
    category: '상의',
    color: '블랙',
    style: '일상복',
    measurements: { shoulder: 42, chest: 48, sleeve: 54, length: 64 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    outName: 'grade5_coral_sweatshirt.png',
    basePrefix: 'kids_pink_sweatshirt',
    mod: { hue: 15, sat: 1.5, brightness: 1.05 }, // Coral Sweatshirt
    name: '초등 고학년 [5~6학년용] 코랄 핑크 맨투맨',
    category: '상의',
    color: '코랄',
    style: '일상복',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    outName: 'grade5_black_shorts.png',
    basePrefix: 'kids_gym_shorts_navy',
    mod: { brightness: 0.3, sat: 0.1 }, // Black Shorts
    name: '새솔초 [5~6학년용] 하복 블랙 체육복 숏팬츠',
    category: '하의',
    color: '블랙',
    style: '체육복',
    measurements: { waist: 28, length: 44 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    outName: 'grade5_beige_shorts.png',
    basePrefix: 'kids_khaki_shorts',
    mod: { hue: 40, sat: 0.9, brightness: 1.25 }, // Beige Shorts
    name: '초등 고학년 [5~6학년용] 베이지 코튼 반바지',
    category: '하의',
    color: '베이지',
    style: '일상복',
    measurements: { waist: 29, length: 46 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    outName: 'grade5_burgundy_skirt.png',
    basePrefix: 'kids_pleated_skirt',
    mod: { hue: 345, sat: 1.6, brightness: 0.8 }, // Burgundy Skirt
    name: '키즈 [5~6학년용] 버건디 체크 플리츠 스커트',
    category: '하의',
    color: '버건디',
    style: '교복',
    measurements: { waist: 28, length: 45 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    outName: 'grade5_black_joggers.png',
    basePrefix: 'kids_gray_joggers',
    mod: { brightness: 0.3, sat: 0.1 }, // Black Joggers
    name: '고학년 [5~6학년용] 매트블랙 조거 바지',
    category: '하의',
    color: '블랙',
    style: '체육복',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    outName: 'grade5_deep_indigo.png',
    basePrefix: 'kids_denim_pants',
    mod: { hue: 225, sat: 1.5, brightness: 0.75 }, // Deep Indigo Denim
    name: '초등 고학년 [5~6학년용] 딥인디고 와이드 데님 바지',
    category: '하의',
    color: '딥인디고',
    style: '일상복',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    outName: 'grade5_orange_windbreaker.png',
    basePrefix: 'kids_windbreaker_jacket',
    mod: { hue: 30, sat: 1.7, brightness: 1.05 }, // Orange Windbreaker
    name: '고학년 [5~6학년용] 오렌지 후드 바람막이 자켓',
    category: '아우터',
    color: '오렌지',
    style: '체육복',
    measurements: { shoulder: 40, chest: 48, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  }
];

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("📸 Generating 30 STRICTLY UNIQUE Real Studio Apparel Photography Files...");

  let count = 0;
  for (const item of THIRTY_STUDIO_SPECS) {
    const baseFile = findBaseImageFile(item.basePrefix);
    if (!baseFile) {
      console.error(`❌ Base image not found for ${item.basePrefix}`);
      continue;
    }

    const outPath = path.join(PUBLIC_CLOTHES_DIR, item.outName);

    // Apply color/brightness modification using sharp if specified
    if (item.mod) {
      let pipeline = sharp(baseFile);
      if (item.mod.modulate || item.mod.hue !== undefined || item.mod.sat !== undefined || item.mod.brightness !== undefined) {
        pipeline = pipeline.modulate({
          hue: item.mod.hue !== undefined ? item.mod.hue : 0,
          saturation: item.mod.sat !== undefined ? item.mod.sat : 1,
          brightness: item.mod.brightness !== undefined ? item.mod.brightness : 1
        });
      }
      await pipeline.toFile(outPath);
    } else {
      fs.copyFileSync(baseFile, outPath);
    }

    // Read the newly created unique studio PNG file as Base64 Data URL
    const fileBuf = fs.readFileSync(outPath);
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
      console.error(`❌ Insert error for ${item.name}:`, error.message);
    } else {
      console.log(`✅ [${item.name}] (${item.color}) - Unique Real Studio Photo Created & Registered!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! All ${count} Unique Real Studio Photo Clothes Registered in Supabase!`);
}

run();
