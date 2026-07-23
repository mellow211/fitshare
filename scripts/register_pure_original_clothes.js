const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

function getOriginalBase64(prefix) {
  const files = fs.readdirSync(ARTIFACTS_DIR);
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (match) {
    const fullPath = path.join(ARTIFACTS_DIR, match);
    const buf = fs.readFileSync(fullPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
  return null;
}

// 색상 변경/중복 없이 100% 순수 원본 개별 스튜디오 사진 13종
const PURE_ORIGINAL_DATASET = [
  // --- 1~2학년 (저학년) ---
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

  // --- 3~4학년 (중학년) ---
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

  // --- 5~6학년 (고학년) ---
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

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("📸 Registering Pure Original Clean Studio Photography Dataset (13 Items)...");

  let count = 0;
  for (const item of PURE_ORIGINAL_DATASET) {
    const srcFile = path.join(ARTIFACTS_DIR, `${item.prefix}_1784812` + (fs.readdirSync(ARTIFACTS_DIR).find(f => f.startsWith(item.prefix)).slice(item.prefix.length + 8)));
    
    // Copy to public/clothes/
    const destFile = path.join(PUBLIC_CLOTHES_DIR, item.filename);
    fs.copyFileSync(srcFile, destFile);

    const base64Data = getOriginalBase64(item.prefix);

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
      console.log(`✅ [${item.name}] (${item.color}) - Pure Original Photo Inserted!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! All ${count} Pure Original Studio Photo Clothes Registered in Supabase!`);
}

run();
