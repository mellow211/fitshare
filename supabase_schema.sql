-- 1. 의류 데이터 관리를 위한 테이블 생성
CREATE TABLE public.clothes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    space_code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    style TEXT NOT NULL,
    image_url TEXT NOT NULL,
    measurements JSONB NOT NULL,
    guidelines JSONB NOT NULL,
    status TEXT DEFAULT 'available'::text NOT NULL,
    reservation JSONB
);

-- 검색 최적화를 위한 인덱스 생성
CREATE INDEX idx_clothes_space_code ON public.clothes(space_code);

-- 2. Supabase Storage 버킷 정책 설정 안내
-- Supabase 대시보드 -> Storage -> 'New bucket'을 통해 'clothing-images'라는 이름의 버킷을 생성해야 합니다.
-- 생성 시 버킷 속성을 'Public'으로 설정해야 이미지 링크(URL)가 웹에 공개되어 모든 기기에서 보입니다.

-- Storage의 'clothing-images' 버킷에 대한 정책(Policies) 구성:
-- 아래 SQL을 사용하거나 Supabase Storage 콘솔에서 "Allow public read access" 및 "Allow authenticated/anon insert/update" 정책을 허용하세요.
