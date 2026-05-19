-- Teamlet 검색 인프라 확장 (docs/04 §1-8)
-- pg_trgm: 영문 + 한국어 음절 단위 트라이그램 (표준 contrib — 항상 사용 가능)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_bigm: 한국어 2-gram (형태소 검색에 더 적합)
-- ⚠️ 표준 postgres:16-alpine 이미지에는 미포함.
--    프로덕션/한국어 정밀 검색 단계에서 pg_bigm 포함 커스텀 이미지로 교체 필요.
--    그 전까지는 pg_trgm 으로 동작 (음절 트라이그램 매칭).
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_bigm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_bigm 미설치 — pg_trgm 으로 폴백 (docs/04 §1-8 참조)';
END
$$;
