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

// 초등학생 기준 의류 데이터 목록 (32개 품목)
const KIDS_CLOTHES = [
  // --- 상의 (Tops) ---
  {
    name: '새솔초등학교 동복 체육복 상의',
    category: '상의',
    color: '네이비',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 37, chest: 43, sleeve: 49, length: 57 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 90 }
  },
  {
    name: '새솔초등학교 하복 체육복 반팔',
    category: '상의',
    color: '블루',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 35, chest: 41, sleeve: 19, length: 53 },
    guidelines: { shoulder_y: 18, chest_y: 33, sleeve_start_x: 25, sleeve_end_x: 15, length_start_y: 18, length_end_y: 85 }
  },
  {
    name: '새솔초등학교 하복 생활복 깃셔츠',
    category: '상의',
    color: '화이트',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 42, sleeve: 20, length: 55 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 26, sleeve_end_x: 14, length_start_y: 19, length_end_y: 86 }
  },
  {
    name: '키즈 파스텔 솜사탕 오버핏 맨투맨',
    category: '상의',
    color: '핑크',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 38, chest: 45, sleeve: 48, length: 56 },
    guidelines: { shoulder_y: 21, chest_y: 36, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '키즈 베이직 코튼 그래픽 후드티',
    category: '상의',
    color: '옐로우',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 39, chest: 46, sleeve: 50, length: 58 },
    guidelines: { shoulder_y: 22, chest_y: 37, sleeve_start_x: 23, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    name: '초등 데일리 스포티 스트라이프 긴팔티',
    category: '상의',
    color: '블랙',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 42, sleeve: 47, length: 54 },
    guidelines: { shoulder_y: 19, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 11, length_start_y: 19, length_end_y: 87 }
  },
  {
    name: '키즈 크루넥 그린 피케 반팔티',
    category: '상의',
    color: '그린',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 35, chest: 41, sleeve: 19, length: 52 },
    guidelines: { shoulder_y: 18, chest_y: 33, sleeve_start_x: 25, sleeve_end_x: 15, length_start_y: 18, length_end_y: 85 }
  },
  {
    name: '어린이 웜 플리스 집업 반티셔츠',
    category: '상의',
    color: '베이지',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 38, chest: 44, sleeve: 49, length: 57 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },

  // --- 하의 (Bottoms) ---
  {
    name: '새솔초등학교 동복 체육복 하의',
    category: '하의',
    color: '네이비',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 28, length: 74 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '새솔초등학교 하복 체육복 숏팬츠',
    category: '하의',
    color: '네이비',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 38 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 50 }
  },
  {
    name: '초등 키즈 스판 밴딩 데님 팬츠',
    category: '하의',
    color: '블루',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 27, length: 76 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },
  {
    name: '키즈 편안한 코튼 조거 팬츠',
    category: '하의',
    color: '그레이',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 28, length: 75 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 94 }
  },
  {
    name: '키즈 클래식 네이비 스쿨 플리츠 스커트',
    category: '하의',
    color: '네이비',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 26, length: 42 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 55 }
  },
  {
    name: '어린이 카고 면 밴딩 수납 바지',
    category: '하의',
    color: '카키',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 29, length: 78 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 96 }
  },
  {
    name: '초등 쿨링 쿨메쉬 5부 반바지',
    category: '하의',
    color: '블랙',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 27, length: 40 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 52 }
  },
  {
    name: '키즈 브라운 포근 코듀로이 웜팬츠',
    category: '하의',
    color: '브라운',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?auto=format&fit=crop&q=80&w=600',
    measurements: { waist: 28, length: 76 },
    guidelines: { waist_y: 15, length_start_y: 15, length_end_y: 95 }
  },

  // --- 아우터 (Outerwear) ---
  {
    name: '새솔초등학교 정복 교복 재킷',
    category: '아우터',
    color: '다크그레이',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 39, chest: 45, sleeve: 51, length: 59 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 27, sleeve_end_x: 11, length_start_y: 21, length_end_y: 87 }
  },
  {
    name: '키즈 경량 윈드브레이커 바람막이',
    category: '아우터',
    color: '그린',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 38, chest: 46, sleeve: 50, length: 58 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    name: '초등 등교룩 V넥 클래식 니트 가디건',
    category: '아우터',
    color: '네이비',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 37, chest: 44, sleeve: 48, length: 56 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 26, sleeve_end_x: 12, length_start_y: 20, length_end_y: 87 }
  },
  {
    name: '키즈 블랙 경량 덕다운 패딩 조끼',
    category: '아우터',
    color: '블랙',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 36, chest: 45, sleeve: 0, length: 55 },
    guidelines: { shoulder_y: 20, chest_y: 35, sleeve_start_x: 25, sleeve_end_x: 25, length_start_y: 20, length_end_y: 86 }
  },
  {
    name: '키즈 야구 점퍼 스타디움 베이스볼 재킷',
    category: '아우터',
    color: '네이비',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 40, chest: 47, sleeve: 52, length: 60 },
    guidelines: { shoulder_y: 22, chest_y: 38, sleeve_start_x: 24, sleeve_end_x: 9, length_start_y: 22, length_end_y: 89 }
  },
  {
    name: '키즈 중청 데님 트러커 자켓',
    category: '아우터',
    color: '블루',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 38, chest: 44, sleeve: 49, length: 57 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 10, length_start_y: 20, length_end_y: 88 }
  },
  {
    name: '초등 포근 덤블 뽀글이 후리스 점퍼',
    category: '아우터',
    color: '베이지',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 39, chest: 46, sleeve: 50, length: 59 },
    guidelines: { shoulder_y: 21, chest_y: 37, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 21, length_end_y: 88 }
  },
  {
    name: '키즈 다이아몬드 퀼팅 누빔 자켓',
    category: '아우터',
    color: '카키',
    style: '등교룩',
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 38, chest: 45, sleeve: 49, length: 58 },
    guidelines: { shoulder_y: 20, chest_y: 36, sleeve_start_x: 25, sleeve_end_x: 11, length_start_y: 20, length_end_y: 87 }
  },

  // --- 원피스 및 세트 (Dresses & Sets) ---
  {
    name: '키즈 클래식 뷔스티에 체크 원피스',
    category: '원피스',
    color: '다크그레이',
    style: '교복',
    image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 34, chest: 40, sleeve: 0, length: 72 },
    guidelines: { shoulder_y: 18, chest_y: 32, sleeve_start_x: 25, sleeve_end_x: 25, length_start_y: 18, length_end_y: 92 }
  },
  {
    name: '키즈 데님 멜빵 캐주얼 점프슈트',
    category: '원피스',
    color: '블루',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 35, chest: 42, sleeve: 0, length: 98 },
    guidelines: { shoulder_y: 18, chest_y: 34, sleeve_start_x: 25, sleeve_end_x: 25, length_start_y: 18, length_end_y: 96 }
  },
  {
    name: '초등 프릴 플라워 멜빵 원피스',
    category: '원피스',
    color: '옐로우',
    style: '일상복',
    image_url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 33, chest: 39, sleeve: 0, length: 70 },
    guidelines: { shoulder_y: 17, chest_y: 31, sleeve_start_x: 25, sleeve_end_x: 25, length_start_y: 17, length_end_y: 90 }
  },
  {
    name: '초등 체육대회 한정 세트 (상하의 통합)',
    category: '세트',
    color: '블루',
    style: '체육복',
    image_url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=600',
    measurements: { shoulder: 37, chest: 43, sleeve: 49, length: 57, waist: 27 },
    guidelines: { shoulder_y: 19, chest_y: 35, sleeve_start_x: 24, sleeve_end_x: 10, length_start_y: 19, length_end_y: 92 }
  }
];

async function registerClothes() {
  console.log(`🚀 Starting registration of ${KIDS_CLOTHES.length} elementary school clothes into space_code: '${SPACE_CODE}'...`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of KIDS_CLOTHES) {
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

    const { data, error } = await supabase
      .from('clothes')
      .insert([record])
      .select();

    if (error) {
      console.error(`❌ Failed to insert: ${item.name}`, error.message);
      errorCount++;
    } else {
      console.log(`✅ [${item.category}/${item.style}] ${item.name} (${item.color}) - Inserted!`);
      successCount++;
    }
  }

  console.log(`\n🎉 Registration Complete!`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
}

registerClothes();
