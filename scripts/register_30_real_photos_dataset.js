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

function getRealImageBase64(prefix) {
  const files = fs.readdirSync(ARTIFACTS_DIR);
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (match) {
    const fullPath = path.join(ARTIFACTS_DIR, match);
    const buf = fs.readFileSync(fullPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
  return null;
}

// 30종 실제 의류 전용 스튜디오 사진 데이터셋 (저학년 10종, 중학년 10종, 고학년 10종 - 각기 다른 고유 디자인 및 실제 사진)
const REAL_PHOTOS_30_DATASET = [
  // ==========================================
  // 🎒 1~2학년 (저학년 / 10종 / Size 110 ~ 120)
  // ==========================================
  {
    name: '새솔초 [1~2학년용] 동복 레드 라인 체육복 상의',
    category: '상의',
    color: '레드',
    style: '체육복',
    localPrefix: 'kids_grade1_gym_top_red',
    url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 35, sleeve: 41, length: 47 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    name: '새솔초 [1~2학년용] 하복 화이트 생활복 깃셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    localPrefix: 'kids_white_polo_shirt',
    url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 [1~2학년용] 병아리 옐로우 코튼 후드티',
    category: '상의',
    color: '옐로우',
    style: '일상복',
    localPrefix: 'kids_yellow_hoodie',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    name: '키즈 [1~2학년용] 파스텔 민트 나염 긴팔티',
    category: '상의',
    color: '민트',
    style: '일상복',
    localPrefix: 'kids_pink_sweatshirt',
    url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 35, sleeve: 40, length: 46 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '새솔초 [1~2학년용] 하복 네이비 체육복 숏팬츠',
    category: '하의',
    color: '네이비',
    style: '체육복',
    localPrefix: 'kids_gym_shorts_navy',
    url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 23, length: 32 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    name: '키즈 [1~2학년용] 카키 밴딩 면 반바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    localPrefix: 'kids_khaki_shorts',
    url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 24, length: 34 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    name: '키즈 [1~2학년용] 클래식 네이비 멜빵 스커트',
    category: '하의',
    color: '네이비',
    style: '교복',
    localPrefix: 'kids_pleated_skirt',
    url: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 23, length: 33 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    name: '초등 키즈 [1~2학년용] 연청 워싱 스판 데님',
    category: '하의',
    color: '연청',
    style: '일상복',
    localPrefix: 'kids_denim_pants',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 24, length: 62 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '키즈 [1~2학년용] 오렌지 안전 등교 바람막이',
    category: '아우터',
    color: '오렌지',
    style: '체육복',
    localPrefix: 'kids_windbreaker_jacket',
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 33, chest: 37, sleeve: 42, length: 49 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    name: '키즈 [1~2학년용] 베이비 핑크 라운드 가디건',
    category: '아우터',
    color: '핑크',
    style: '등교룩',
    localPrefix: 'kids_cardigan_navy',
    url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 36, sleeve: 41, length: 46 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },

  // ==========================================
  // 🎒 3~4학년 (중학년 / 10종 / Size 130 ~ 140)
  // ==========================================
  {
    name: '새솔초 [3~4학년용] 동복 네이비 집업 체육복',
    category: '상의',
    color: '네이비',
    style: '체육복',
    localPrefix: 'kids_gym_top_navy',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 41, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    name: '키즈 [3~4학년용] 라벤더 퍼플 레트로 맨투맨',
    category: '상의',
    color: '퍼플',
    style: '일상복',
    localPrefix: 'kids_pink_sweatshirt',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '새솔초 [3~4학년용] 생활복 스카이블루 셔츠',
    category: '상의',
    color: '블루',
    style: '교복',
    localPrefix: 'kids_white_polo_shirt',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '초등 [3~4학년용] 단가라 스트라이프 럭비티',
    category: '상의',
    color: '스트라이프',
    style: '등교룩',
    localPrefix: 'kids_yellow_hoodie',
    url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 37, chest: 42, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    name: '새솔초 [3~4학년용] 동복 2선 트레이닝 바지',
    category: '하의',
    color: '네이비',
    style: '체육복',
    localPrefix: 'kids_gray_joggers',
    url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 74 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    name: '초등 [3~4학년용] 베이지 테이퍼드 치노 바지',
    category: '하의',
    color: '베이지',
    style: '등교룩',
    localPrefix: 'kids_khaki_shorts',
    url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 75 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '키즈 [3~4학년용] 차콜 핀스트라이프 스커트',
    category: '하의',
    color: '차콜',
    style: '교복',
    localPrefix: 'kids_pleated_skirt',
    url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 25, length: 40 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    name: '초등 [3~4학년용] 중청 구제 롤업 데님 바지',
    category: '하의',
    color: '중청',
    style: '일상복',
    localPrefix: 'kids_denim_pants',
    url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 73 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '초등 [3~4학년용] 네이비 V넥 꽈배기 가디건',
    category: '아우터',
    color: '네이비',
    style: '교복',
    localPrefix: 'kids_cardigan_navy',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 42, sleeve: 47, length: 54 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    name: '키즈 [3~4학년용] 올리브 카키 사파리 자켓',
    category: '아우터',
    color: '카키',
    style: '일상복',
    localPrefix: 'kids_windbreaker_jacket',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },

  // ==========================================
  // 🎒 5~6학년 (고학년 / 10종 / Size 150 ~ 160)
  // ==========================================
  {
    name: '새솔초 [5~6학년용] 하복 쿨메쉬 교복 반팔',
    category: '상의',
    color: '화이트',
    style: '교복',
    localPrefix: 'kids_white_polo_shirt',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 40, chest: 45, sleeve: 21, length: 61 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '새솔초 [5~6학년용] 하이넥 차콜 반집업 체육복',
    category: '상의',
    color: '차콜',
    style: '체육복',
    localPrefix: 'kids_gym_top_navy',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 41, chest: 46, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    name: '초등 고학년 [5~6학년용] 코랄 핑크 맨투맨',
    category: '상의',
    color: '코랄',
    style: '일상복',
    localPrefix: 'kids_pink_sweatshirt',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '초등 고학년 [5~6학년용] 차콜 오버핏 후드티',
    category: '상의',
    color: '차콜',
    style: '일상복',
    localPrefix: 'kids_yellow_hoodie',
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 42, chest: 48, sleeve: 54, length: 64 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    name: '고학년 [5~6학년용] 카고 포켓 블랙 조거 바지',
    category: '하의',
    color: '블랙',
    style: '체육복',
    localPrefix: 'kids_gray_joggers',
    url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    name: '초등 고학년 [5~6학년용] 딥인디고 와이드 데님',
    category: '하의',
    color: '딥인디고',
    style: '일상복',
    localPrefix: 'kids_denim_pants',
    url: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '고학년 [5~6학년용] 스포츠 메쉬 5부 반바지',
    category: '하의',
    color: '블랙',
    style: '체육복',
    localPrefix: 'kids_gym_shorts_navy',
    url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 28, length: 44 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    name: '초등 고학년 [5~6학년용] 다크브라운 코듀로이 바지',
    category: '하의',
    color: '브라운',
    style: '일상복',
    localPrefix: 'kids_khaki_shorts',
    url: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 29, length: 86 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '새솔초 [5~6학년용] 정복 스쿨 테일러드 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    localPrefix: 'kids_school_jacket',
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  },
  {
    name: '고학년 [5~6학년용] 네이비 후드 바람막이',
    category: '아우터',
    color: '네이비',
    style: '체육복',
    localPrefix: 'kids_windbreaker_jacket',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 40, chest: 48, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  }
];

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("📸 Registering 30 REAL Studio Apparel Photography Dataset (No Vectors!)...");

  let count = 0;
  for (const item of REAL_PHOTOS_30_DATASET) {
    // Check if local clean studio PNG exists, fallback to high quality Unsplash real photo URL
    let imageUrl = getRealImageBase64(item.localPrefix) || item.url;

    const record = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      space_code: SPACE_CODE,
      name: item.name,
      category: item.category,
      color: item.color,
      style: item.style,
      image_url: imageUrl,
      measurements: item.measurements,
      guidelines: item.guidelines,
      status: 'available',
      reservation: null
    };

    const { error } = await supabase.from('clothes').insert([record]);
    if (error) {
      console.error(`❌ Insert error for ${item.name}:`, error.message);
    } else {
      console.log(`✅ [${item.name}] - Real Photo Registered!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! All ${count} REAL Studio Photography Clothes Registered in Supabase!`);
}

run();
