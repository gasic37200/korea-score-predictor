# 배포 준비 체크리스트

## 1. Supabase SQL 적용

Supabase Dashboard의 SQL Editor에서 아래 순서대로 실행한다.

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_service_role_grants.sql`
3. `supabase/migrations/003_update_czech_only_match.sql`
4. `supabase/migrations/004_match_actual_scores.sql`
5. `supabase/seed.sql`

적용 후 Table Editor에서 다음 항목을 확인한다.

- `events`에 `world-cup-2026` slug가 있다.
- `matches`에 `대한민국 조별리그 1차전` 1개가 있고 상대팀은 `체코`다.
- `participants`, `predictions`는 비어 있어도 정상이다.
- `score_distribution` view가 생성되어 있다.
- 테이블 RLS가 켜져 있다.
- `service_role`에 필요한 table/view 권한이 grant되어 있다.

## 2. 로컬 환경 변수

`.env.local`에 아래 값을 설정한다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PHONE_HASH_SECRET=
ADMIN_PASSWORD_HASH=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

주의할 점:

- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Dashboard의 Project Settings > API에서 확인한다.
- `PHONE_HASH_SECRET`은 길고 예측하기 어려운 문자열을 사용한다.
- `ADMIN_PASSWORD_HASH`는 `npm run admin:hash`로 생성한다.
- `PHONE_ENCRYPTION_KEY`는 당첨자 연락용 원본 번호 암호화 저장에 사용한다.
- 기존 참여자 번호는 나중에 복구할 수 없으므로 운영 시작 전 반드시 `PHONE_ENCRYPTION_KEY`를 설정한다.

## 3. Vercel 환경 변수

Vercel Project Settings > Environment Variables에 아래 값을 추가한다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONE_HASH_SECRET`
- `ADMIN_PASSWORD_HASH`
- `NEXT_PUBLIC_SITE_URL`

운영 배포 후 `NEXT_PUBLIC_SITE_URL`은 Vercel 배포 도메인으로 설정한다.

예:

```env
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

## 4. 배포 전 검증

로컬에서 아래 명령어를 실행한다.

```bash
npm run lint
npm run typecheck
npm run build
```

검증 후 확인할 화면:

- `/`가 `/event`로 이동한다.
- `/event`에서 닉네임, 휴대폰 번호, 점수, 개인정보 동의를 입력할 수 있다.
- 제출 후 `/result`로 이동한다.
- `/result`에서 참여자 수와 예측 비율이 보인다.
- `/admin`은 로그인 전 보호된다.
- `/admin/matches`에서 경기 열기/닫기가 된다.
- `/admin/export`는 로그인 후 CSV를 내려준다.

## 5. QR Target URL

QR 코드는 `/event`로 연결한다.

```txt
https://your-project.vercel.app/event
```

매장에 붙이기 전에 휴대폰으로 직접 스캔해 다음을 확인한다.

- 페이지가 3초 이내에 열린다.
- 입력창이 모바일 키보드에 맞게 동작한다.
- 제출 후 결과 페이지로 이동한다.
- 결과 페이지에 개인정보가 노출되지 않는다.

## 6. 포트폴리오 준비

포트폴리오에는 실제 고객 데이터를 사용하지 않는다.

- 목업 참여자 데이터 또는 마스킹된 데이터만 사용한다.
- 관리자 화면 캡처 시 휴대폰 번호는 `010-****-1234` 형태인지 확인한다.
- Supabase URL, service role key, admin password hash, store-sensitive 정보는 캡처하지 않는다.
- 운영 후에는 전체 참여자 수, 완료율, 중복 시도 수 등 익명 지표만 기록한다.
