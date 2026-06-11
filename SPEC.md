# Korea Score Predictor 명세

## 서비스 목표

매장 고객이 QR 코드로 접속해 대한민국 경기 스코어를 예측하고, 제출 후 전체 예측 결과를 확인할 수 있는 모바일 우선 이벤트 앱을 만든다.

## 사용자 흐름

1. 사용자가 QR 코드를 스캔한다.
2. 사용자가 `/event` 페이지에 접속한다.
3. 사용자가 닉네임을 입력한다.
4. 사용자가 휴대폰 번호를 입력한다.
5. 사용자가 대한민국 경기별 예상 점수를 입력한다.
6. 사용자가 개인정보 안내에 동의한다.
7. 사용자가 예측을 제출한다.
8. 시스템이 참여자와 예측 데이터를 저장한다.
9. 사용자가 `/result` 페이지로 이동한다.
10. 사용자가 전체 참여자 수와 스코어 예측 비율을 확인한다.

## 관리자 흐름

1. 관리자가 보호된 `/admin` 페이지에 접속한다.
2. 관리자가 전체 참여자 수를 확인한다.
3. 관리자가 경기별 예측 데이터를 확인한다.
4. 관리자가 경기 정보를 관리한다.
5. 관리자가 이벤트에 표시할 경기를 선택한다.
6. 관리자가 CSV를 내보낸다.
7. 관리자는 기본적으로 마스킹된 휴대폰 번호만 확인한다.

## MVP 요구사항

- `/`는 `/event`로 리다이렉트한다.
- `/event`는 닉네임, 휴대폰 번호, 스코어 예측, 개인정보 동의를 입력받는다.
- `/event`에서는 예측 비율을 보여주지 않는다.
- `/result`는 참여 후 집계 결과만 보여준다.
- `/admin`은 MVP 수준의 안전한 인증으로 보호한다.
- `/admin/matches`는 경기 정보를 관리한다.
- `/admin/export`는 필요한 데이터만 CSV로 내보낸다.
- 중복 참여는 `match_id + phone_hash`로 차단한다.

## 비목표

- 첫 MVP에서 복잡한 인증 시스템을 만들지 않는다.
- 마케팅 랜딩 페이지를 만들지 않는다.
- 명시 요청이 있기 전까지 실시간 업데이트를 추가하지 않는다.
- 관리자 화면에 원본 휴대폰 번호를 기본 표시하지 않는다.
- 스코어 예측 외의 이벤트 기능을 추가하지 않는다.

## 개인정보 요구사항

- 휴대폰 번호는 HMAC SHA-256과 서버 사이드 secret으로 해시한다.
- Supabase service role key와 해시 secret은 서버 사이드에만 둔다.
- 원본 휴대폰 번호는 기본적으로 저장하지 않는다.
- 당첨자 알림 문자 발송을 위해 원본 번호가 꼭 필요하면 암호화해서 저장한다.
- CSV 내보내기는 불필요한 민감 정보를 포함하지 않는다.
- 포트폴리오 자료에는 목업 또는 마스킹 데이터를 사용한다.

## 데이터베이스 스키마

- `events`: QR 이벤트 묶음의 제목, slug, 열림 상태, 시작/종료 시간을 저장한다.
- `matches`: 이벤트별 경기 정보, 예측 마감 시간, 열림 상태, 표시 순서를 저장한다.
- `participants`: 경기별 닉네임, `match_id`, `phone_hash`, `phone_last4`, 선택적 `encrypted_phone`을 저장한다.
- `predictions`: 참여자별 경기 예측 점수를 저장한다.
- `score_distribution` view: 경기별 스코어 조합의 예측 수와 비율을 계산한다.

## 데이터베이스 제약 조건

- `events.slug`는 유일해야 한다.
- `matches.event_id`는 어떤 QR 이벤트에 속한 경기인지 구분한다.
- `participants`는 `match_id + phone_hash` 조합으로 경기별 중복 참여를 막는다.
- `predictions`는 `participant_id + match_id` 조합으로 한 경기당 한 번만 예측하게 한다.
- 스코어는 0 이상 20 이하 정수만 허용한다.
- `phone_hash`는 SHA-256 hex 길이인 64자를 기대한다.
- `phone_last4`는 숫자 4자리여야 한다.

## 현재 구현 상태

- Milestone 1 완료: Next.js App Router 기반, 모바일 우선 `/event` 기본 화면, Supabase helper placeholder, 개인정보 유틸 placeholder, 문서 파일을 추가했다.
- Milestone 2 완료: Supabase 초기 SQL schema, 테이블 제약 조건, 인덱스, `score_distribution` view, TypeScript row 타입을 추가했다.
- Milestone 3 완료: `/event`를 모바일 우선 입력 폼으로 정리하고 닉네임, 휴대폰 번호, 경기별 점수, 개인정보 동의, 한국어 에러/준비 상태를 추가했다.
- Milestone 4 완료: server action 기반 제출 흐름, zod 검증, 휴대폰 번호 정규화/해시, 참여자/예측 저장, 중복 참여 에러, `/result` 리다이렉트를 구현했다.
- Milestone 5 완료: `/result`에서 전체 참여자 수와 경기별 스코어 분포, 예측 비율을 Supabase 집계 데이터로 표시하도록 구현했다.
- Milestone 6 완료: 보호된 `/admin`, `/admin/matches`, `/admin/export`를 구현하고 참여자/예측 조회, 경기 열기/닫기, 마스킹 CSV export를 추가했다.
- Milestone 7 완료: 배포 체크리스트, Vercel 환경 변수 목록, QR target URL, 포트폴리오 개인정보 규칙, 관리자 비밀번호 해시 생성 스크립트를 정리했다.
- Supabase 프로젝트 URL과 publishable key를 로컬 환경 변수로 연결할 준비를 마쳤다.
- 아직 구현하지 않은 항목: Supabase `002_service_role_grants.sql` 적용, 실제 휴대폰 제출 테스트.

## 배포 준비 결정

- 배포 절차는 `DEPLOYMENT.md`에 정리한다.
- QR 코드는 운영 Vercel 도메인의 `/event`로 연결한다.
- 관리자 비밀번호는 원문을 저장하지 않고 `npm run admin:hash`로 만든 SHA-256 hex 값을 `ADMIN_PASSWORD_HASH`에 저장한다.
- Vercel에는 `NEXT_PUBLIC_*` 공개 값과 서버 전용 secret을 구분해서 입력한다.
- 포트폴리오 캡처에는 실제 고객 데이터, admin hash, Supabase secret을 포함하지 않는다.
- Supabase 프로젝트에서 새 테이블 자동 노출을 끈 경우, server action이 접근할 수 있도록 `002_service_role_grants.sql`을 실행한다.

## Milestone 3 구현 결정

- 현재 경기 목록은 DB 연결 전 preview data를 사용한다.
- `/event`에서는 예측 비율이나 참여자 수를 표시하지 않는다.
- 클라이언트에서는 빠른 UX를 위해 기본 입력 확인과 한국어 메시지만 제공한다.

## Milestone 4 구현 결정

- 제출은 `src/app/event/actions.ts` server action에서 처리한다.
- 클라이언트가 보낸 임시 경기 id를 신뢰하지 않고, 서버에서 `world-cup-2026` 이벤트의 열린 경기 목록을 다시 조회한다.
- 휴대폰 번호는 정규화 후 `PHONE_HASH_SECRET`으로 HMAC SHA-256 해시한다.
- 중복 참여는 `participants_match_phone_unique` 제약 조건으로 경기별 차단한다.
- 예측 저장 실패 시 방금 생성된 참여자 row를 삭제해 부분 저장을 줄인다.
- 실제 운영 전 Supabase SQL Editor에서 `supabase/migrations/001_initial_schema.sql`과 `supabase/seed.sql`을 실행해야 한다.
- 실제 저장에는 `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY`와 `PHONE_HASH_SECRET` 값이 필요하다.

## Milestone 5 구현 결정

- 결과 데이터는 `src/lib/results.ts`에서 서버 사이드로만 조회한다.
- `/result`는 `force-dynamic`으로 설정해 요청 시점의 최신 집계 데이터를 읽는다.
- `participants`에서는 count만 조회하고 닉네임, 전화번호, 해시 값은 결과 페이지에 노출하지 않는다.
- 스코어 분포는 `score_distribution` view를 사용하고 높은 비율 순으로 표시한다.
- 서버 환경 변수가 없거나 SQL이 아직 적용되지 않은 경우, 개인정보 없이 설정 안내 화면을 보여준다.

## Milestone 6 구현 결정

- 관리자 인증은 MVP용 비밀번호 방식으로 구현한다.
- `ADMIN_PASSWORD_HASH`는 관리자 비밀번호의 SHA-256 hex 값을 저장한다.
- 로그인 성공 시 httpOnly cookie를 설정하고 `/admin` 경로에서만 사용한다.
- 관리자 데이터 조회는 server-side service role client로만 수행한다.
- 관리자 화면에는 `phone_last4`로 만든 `010-****-1234` 형태만 표시한다.
- CSV export 필드는 `nickname`, `masked_phone`, `submitted_at`, `match`, `predicted_score`로 제한한다.
- CSV export는 실제 결과와 정확히 일치한 당첨자만 포함한다.
- `PHONE_ENCRYPTION_KEY` 설정 이후 제출된 참여자는 CSV에서 복호화된 휴대폰 번호를 내보낼 수 있다.
- 암호화 저장 전 참여자는 원본 번호 복구가 불가능하므로 CSV에서도 마스킹 번호만 표시된다.
- CSV에는 `phone_hash`, `encrypted_phone`, Supabase id, service role key 등 민감한 운영 값을 포함하지 않는다.
- 관리자는 `/admin/matches`에서 경기 제목, 대한민국 팀명, 상대팀, 경기 시간, 예측 마감 시간, 표시 순서를 직접 추가/수정할 수 있다.
- 열린 경기만 `/event` 페이지의 예측 카드로 표시된다.
- 기본 seed 경기는 `대한민국 조별리그 1차전`이며 상대팀은 `체코`다.
- 관리자는 경기 후 실제 대한민국 점수와 상대팀 점수를 입력할 수 있다.
- 실제 결과가 입력된 경기만 관리자 대시보드의 당첨 후보 계산에 사용한다.
- 당첨 후보는 실제 스코어와 예측 스코어가 정확히 일치한 참여자이며, 관리자 화면에서도 마스킹된 휴대폰 번호만 표시한다.
- 경기 관리 화면은 새 경기 추가와 기존 경기 관리를 탭으로 분리한다.
- 기존 경기 목록은 새로 만든 경기가 위에 오도록 보여준다.
- 기존 경기 목록은 기본적으로 간략 리스트로 표시하고, 화살표 버튼으로 경기별 상세 수정 폼을 펼치거나 접는다.
- 이벤트 페이지에는 한 번에 하나의 경기만 표시한다.
- 관리자가 새 경기를 추가하거나 숨김 상태의 경기를 표시하면 같은 이벤트의 다른 경기는 자동으로 숨김 처리한다.
- 기존 경기 수정, 표시, 숨김 작업 이후에는 기존 경기 탭으로 돌아가 작업 흐름을 유지한다.

## 데이터 모델 결정

- `events`는 경기 자체를 만들기 위한 테이블이 아니라 QR 이벤트 단위를 나타내는 상위 묶음이다.
- 현재 MVP는 `world-cup-2026` 이벤트 하나를 사용하지만, `events`를 유지하면 향후 다른 매장 이벤트나 다른 대회 이벤트를 같은 구조로 분리할 수 있다.
- 참여자 중복 확인은 경기 기준으로 처리하므로 `participants.match_id + phone_hash` 제약을 사용한다.
- `events`는 중복 참여 기준이 아니라 경기와 결과를 하나의 QR 이벤트 아래로 묶는 상위 그룹 역할을 한다.
- `matches`는 관리자가 실제로 추가/수정하는 경기 카드이며, 각 경기는 반드시 하나의 `events.id`에 연결된다.

## UX 보강 결정

- 휴대폰 번호 입력은 브라우저에서 자동으로 `010-1234-5678` 형태로 포맷한다.
- 제출 실패나 서버 설정 오류가 발생해도 사용자가 입력한 닉네임, 휴대폰 번호, 점수, 개인정보 동의 상태를 유지한다.
- Supabase 이벤트/경기 조회 오류는 설정 문제를 추적할 수 있도록 SQL 적용 또는 환경 변수 확인 메시지를 함께 표시한다.
- 이벤트 페이지에는 제출 전에도 집계 확인을 원하는 사용자를 위해 `/result` 이동 버튼을 제공한다.
- 개인정보 동의 문구에는 휴대폰 번호 수집 목적, 관리자 마스킹 표시, 당첨자 알림 문자 발송 시에만 복호화된 번호를 CSV로 확인한다는 내용을 명시한다.
- 이벤트 헤더는 대한민국 국기 느낌의 작은 배지를 사용하되, 제목과 본문을 가리지 않게 배치한다.
- 경기 카드에는 경기 시작 시간을 상단에 강조 표시하고, 예측 마감 시간은 현재 시간 기준 카운트다운으로 표시한다.
- 예측 마감 시간이 지난 경기가 있으면 제출 버튼을 비활성화하고 서버에서도 제출을 차단한다.
