-- =============================================
-- drinking_timing 컬럼 추가 (언제 마시면 좋을지)
-- =============================================

alter table public.liquors
  add column if not exists drinking_timing varchar(50)
    check (drinking_timing in ('식전주', '식중주', '식후주', '언제든지'));

alter table public.tasting_notes
  add column if not exists drinking_timing varchar(50)
    check (drinking_timing in ('식전주', '식중주', '식후주', '언제든지'));
