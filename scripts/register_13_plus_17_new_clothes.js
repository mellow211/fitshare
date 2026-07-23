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

// 1. 기존 13종 고정 원본 데이터셋 (100% 보존)
const ORIGINAL_13 = [
  {
    prefix: 'kids_grade1_gym_top_red',
    name: '새솔초 [1~2학년용] 동복 레드 체육복 상의',
    category: '상의',
    color: '레드',
    style: '체육복',
    measurements: { shoulder: 32, chest: 35, sleeve: 41, length: 47 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    prefix: 'kids_white_polo_shirt',
    name: '새솔초 [1~2학년용] 하복 화이트 생활복 깃셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    prefix: 'kids_yellow_hoodie',
    name: '키즈 [1~2학년용] 병아리 옐로우 후드티',
    category: '상의',
    color: '옐로우',
    style: '일상복',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    prefix: 'kids_gym_shorts_navy',
    name: '새솔초 [1~2학년용] 하복 네이비 체육복 숏팬츠',
    category: '하의',
    color: '네이비',
    style: '체육복',
    measurements: { waist: 23, length: 32 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    prefix: 'kids_pleated_skirt',
    name: '키즈 [1~2학년용] 네이비 스쿨 플리츠 스커트',
    category: '하의',
    color: '네이비',
    style: '교복',
    measurements: { waist: 23, length: 33 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    prefix: 'kids_cardigan_navy',
    name: '키즈 [1~2학년용] 네이비 니트 가디건',
    category: '아우터',
    color: '네이비',
    style: '등교룩',
    measurements: { shoulder: 32, chest: 36, sleeve: 41, length: 46 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    prefix: 'kids_gym_top_navy',
    name: '새솔초 [3~4학년용] 동복 네이비 체육복 상의',
    category: '상의',
    color: '네이비',
    style: '체육복',
    measurements: { shoulder: 36, chest: 41, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    prefix: 'kids_pink_sweatshirt',
    name: '키즈 [3~4학년용] 파스텔 핑크 오버핏 맨투맨',
    category: '상의',
    color: '핑크',
    style: '일상복',
    measurements: { shoulder: 37, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    prefix: 'kids_khaki_shorts',
    name: '키즈 [3~4학년용] 카키 밴딩 면 반바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    measurements: { waist: 26, length: 39 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    prefix: 'kids_windbreaker_jacket',
    name: '키즈 [3~4학년용] 그린 경량 바람막이 자켓',
    category: '아우터',
    color: '그린',
    style: '체육복',
    measurements: { shoulder: 36, chest: 43, sleeve: 47, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    prefix: 'kids_gray_joggers',
    name: '고학년 [5~6학년용] 편안한 그레이 조거 팬츠',
    category: '하의',
    color: '그레이',
    style: '체육복',
    measurements: { waist: 29, length: 85 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    prefix: 'kids_denim_pants',
    name: '초등 고학년 [5~6학년용] 와이드 핏 데님 청바지',
    category: '하의',
    color: '블루',
    style: '일상복',
    measurements: { waist: 29, length: 87 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    prefix: 'kids_school_jacket',
    name: '새솔초 [5~6학년용] 정복 교복 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    measurements: { shoulder: 41, chest: 47, sleeve: 53, length: 63 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  }
];

// 2. 신규 추가하는 17종 실제 의류 단독 플랫레이 컷 (모델 없음, 인물 없음, 단독 옷 사진)
const CLEAN_FLATLAY_17 = [
  {
    name: '키즈 [1~2학년용] 무지 화이트 데일리 반팔티',
    category: '상의',
    color: '화이트',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 35, sleeve: 17, length: 46 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 [1~2학년용] 스포티 블랙 코튼 반팔티',
    category: '상의',
    color: '블랙',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 31, chest: 34, sleeve: 16, length: 45 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 [1~2학년용] 상큼 그린 베이직 후드티',
    category: '상의',
    color: '그린',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 33, chest: 36, sleeve: 42, length: 48 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    name: '초등 저학년 [1~2학년용] 포근 베이지 니트 스웨터',
    category: '상의',
    color: '베이지',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 35, sleeve: 40, length: 46 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '키즈 [1~2학년용] 멜란지 그레이 데일리 맨투맨',
    category: '상의',
    color: '그레이',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 32, chest: 35, sleeve: 40, length: 47 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '새솔초 [3~4학년용] 하복 화이트 교복 와이셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '초등 중학년 [3~4학년용] 클래식 블루 단추 셔츠',
    category: '상의',
    color: '블루',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 [3~4학년용] 스포티 레드 그래픽 반팔티',
    category: '상의',
    color: '레드',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 41, sleeve: 18, length: 53 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 [3~4학년용] 옥스포드 핀스트라이프 셔츠',
    category: '상의',
    color: '화이트',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 40, sleeve: 46, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '초등 [3~4학년용] 빈티지 중청 데님 청바지',
    category: '하의',
    color: '블루',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 73 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '초등 중학년 [3~4학년용] 스포티 블루 데님 반바지',
    category: '하의',
    color: '블루',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 39 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    name: '키즈 [3~4학년용] 상큼 핑크 캔버스 반바지',
    category: '하의',
    color: '핑크',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 25, length: 38 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    name: '초등 [3~4학년용] 내추럴 카키 캐주얼 면바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 74 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    name: '키즈 [3~4학년용] 화이트 스쿨 밴딩 바지',
    category: '하의',
    color: '화이트',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 25, length: 72 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 92 }
  },
  {
    name: '초등 고학년 [5~6학년용] 스포티 옐로우 바람막이 점퍼',
    category: '아우터',
    color: '옐로우',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 40, chest: 48, sleeve: 52, length: 62 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    name: '초등 고학년 [5~6학년용] 빈티지 블랙 가죽 자켓',
    category: '아우터',
    color: '블랙',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 42, chest: 49, sleeve: 54, length: 64 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 21, length_end_y: 89 }
  },
  {
    name: '초등 고학년 [5~6학년용] 브라운 롱 윈터 코트',
    category: '아우터',
    color: '브라운',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 41, chest: 48, sleeve: 53, length: 84 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 92 }
  }
];

async function run() {
  console.log("🧹 Clearing previous data from Supabase 'clothes' table...");
  await supabase.from('clothes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("📸 Registering 13 Fixed Original + 17 Clean Flat-Lay Photos (Total 30 Items)...");

  let count = 0;

  // 1. Insert Original 13
  for (const item of ORIGINAL_13) {
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
      console.error(`❌ Insert error for original ${item.name}:`, error.message);
    } else {
      console.log(`✅ [Original 13] ${item.name} - Registered!`);
      count++;
    }
  }

  // 2. Insert Brand New 17 Clean Flat-lays (no models, only clothes)
  for (const item of CLEAN_FLATLAY_17) {
    const record = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      space_code: SPACE_CODE,
      name: item.name,
      category: item.category,
      color: item.color,
      style: item.style,
      image_url: item.image_url,
      measurements: item.measurements,
      guidelines: item.guidelines,
      status: 'available',
      reservation: null
    };

    const { error } = await supabase.from('clothes').insert([record]);
    if (error) {
      console.error(`❌ Insert error for new flatlay ${item.name}:`, error.message);
    } else {
      console.log(`✨ [New 17 Clean Flat-lay] ${item.name} - Registered!`);
      count++;
    }
  }

  console.log(`\n🎉 Success! Total ${count} Items (13 Original + 17 Clean Flat-lays) Registered in Supabase!`);
}

run();
