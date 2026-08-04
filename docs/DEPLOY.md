# ClubOn 배포 가이드 (Supabase + Vercel)

이 문서는 ClubOn을 **Supabase(PostgreSQL) + Vercel(Next.js 호스팅)** 조합으로
배포하는 방법을 설명합니다. 배포하면 라운지·부킹 상태가 DB에 영구 저장되어
어디서 접속하든 동일하게 동작합니다.

> 로컬에서는 `DATABASE_URL` 없이 `npm run dev`만 하면 인메모리 어댑터로
> 동작합니다(프로세스 재시작 시 초기화). `DATABASE_URL`이 있으면 자동으로
> PostgreSQL 어댑터를 사용합니다.

---

## 1. Supabase 프로젝트 생성

1. https://supabase.com 가입 후 **New project** 생성.
2. 프로젝트 이름과 **Database Password**를 정합니다(이 비밀번호는 뒤에서 접속
   문자열에 필요하니 기록해 두세요).
3. 생성까지 1~2분 정도 걸립니다.

## 2. 데이터베이스 초기화

1. Supabase 대시보드 → **SQL Editor** → **New query**.
2. 리포의 [`supabase/setup_supabase.sql`](../supabase/setup_supabase.sql) 파일
   **전체 내용을 복사**해 붙여넣고 **Run**.
   - 스키마 + 매칭 확장 + 데모 데이터(회원 8명, 매칭 후보 라운지 3개)가 한 번에
     생성됩니다.
   - 이 데모 시드는 인증(auth.users)에 의존하지 않도록 구성되어 있어, 별도
     로그인 설정 없이 바로 동작합니다.

> RLS(Row Level Security)는 이 데모에서 필수가 아닙니다. 서버가 `DATABASE_URL`
> 로 직접 접속하기 때문입니다. 원한다면
> [`supabase/migrations/20260803000002_rls.sql`](../supabase/migrations/20260803000002_rls.sql)
> 을 추가로 실행할 수 있습니다.

## 3. 접속 문자열(DATABASE_URL) 복사

1. Supabase 대시보드 → **Project Settings → Database**.
2. **Connection string** 섹션에서 **Connection pooling → Transaction** 모드의
   URI를 복사합니다(서버리스 배포에 적합).
   - 형태: `postgresql://postgres.<ref>:<PASSWORD>@aws-0-...pooler.supabase.com:6543/postgres`
3. `<PASSWORD>` 부분을 1단계에서 정한 실제 비밀번호로 바꿉니다.

## 4. Vercel 배포

1. 코드를 GitHub에 올립니다(아래 "GitHub에 올리기" 참고).
2. https://vercel.com → **Add New → Project** → GitHub 리포 **Import**.
3. Framework는 **Next.js**로 자동 인식됩니다.
4. **Environment Variables**에 추가:
   - `DATABASE_URL` = 3단계에서 복사한 URI
   - (선택) `CLUBON_ENFORCE_HOURS` = `1` — 운영시간 게이트(저녁 6시~새벽 4시)를
     켜려면 설정. 넣지 않으면 항상 열린 상태(미리보기용)로 동작합니다.
5. **Deploy**.

## 5. 확인

배포된 URL에 접속해 `/waiters`에서 라운지 매니저를 고르고 → 라운지 입장 →
원하는 상대 스타일 체크 → 부킹까지 진행해 보세요. 상태가 Supabase DB에
저장되므로 새로고침·다른 기기에서도 유지됩니다.

---

## GitHub에 올리기

**옵션 A — git 사용**

```bash
git add .
git commit -m "deploy clubon"
git remote add origin https://github.com/kihoon-76/clubon.git   # 이미 있으면 생략
git push -u origin main
```

**옵션 B — 터미널 없이(브라우저)**

github.com 리포 → **Add file → Upload files** → `node_modules`를 제외한 폴더를
드래그해서 업로드 → Commit.

---

## 참고 / 한계

- 이 데모는 로그인 기능이 아직 없어, 모든 방문자가 데모 사용자 **하나**로
  동작합니다(공유 세션). 실제 서비스에서는 Supabase Auth 연동이 다음 단계입니다.
- `postgres` 드라이버는 Supabase 트랜잭션 풀러(pgbouncer) 호환을 위해
  `prepare: false`로 설정되어 있습니다.
- 부킹을 다시 시도하려면 부킹 결과 화면의 **"다른 조건으로 다시 찾기"** 를
  누르면 됩니다.
