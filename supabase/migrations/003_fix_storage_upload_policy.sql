-- =============================================
-- Storage 업로드 정책 보강: 본인 폴더만 업로드 가능
-- =============================================

-- 기존 정책 삭제
drop policy if exists "인증 사용자 이미지 업로드" on storage.objects;

-- 새 정책: bucket + 본인 폴더 확인
create policy "인증 사용자 이미지 업로드" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tasting-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
