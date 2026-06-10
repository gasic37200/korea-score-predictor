# Korea Score Predictor 작업 목록

## Milestone 1: 프로젝트 기반

- [x] Next.js App Router 설정 확인 또는 생성
- [x] 기본 모바일 우선 레이아웃 추가
- [x] 공통 UI 구조 추가
- [x] `.env.example` 추가
- [x] Supabase helper placeholder 추가
- [x] 필요한 검증 유틸 추가
- [x] 문서 파일 생성 및 한국어 정리

## Milestone 2: 데이터베이스 스키마

- [x] Supabase SQL migration/schema 생성
- [x] `events`, `matches`, `participants`, `predictions` 테이블 추가
- [x] 인덱스와 제약 조건 추가
- [x] 스코어 분포 집계 view 또는 query 추가
- [x] `service_role` 명시 grant migration 추가
- [x] 관련 문서 갱신

## Milestone 3: 이벤트 페이지

- [x] `/event` 구현
- [x] 닉네임 입력 추가
- [x] 휴대폰 번호 입력 추가
- [x] 경기 스코어 카드 추가
- [x] 개인정보 동의 체크박스 추가
- [x] 제출 버튼 추가
- [x] 로딩/에러 상태 추가
- [x] 이벤트 페이지에서는 결과 비율을 보여주지 않기
- [x] 관련 문서 갱신

## Milestone 4: 제출 흐름

- [x] Server Action 또는 Route Handler 추가
- [x] zod로 폼 검증
- [x] 한국 휴대폰 번호 정규화
- [x] 휴대폰 번호 서버 사이드 해시
- [x] 참여자와 예측 저장
- [x] 중복 참여 차단
- [x] `/result`로 리다이렉트
- [x] 한국어 에러 메시지 표시
- [x] 관련 문서 갱신

## Milestone 5: 결과 페이지

- [x] `/result` 구현
- [x] 전체 참여자 수 표시
- [x] 경기별 스코어 분포 표시
- [x] 예측 비율 표시
- [x] 높은 비율 순으로 정렬
- [x] 개인정보 노출 방지
- [x] 관련 문서 갱신

## Milestone 6: 관리자

- [x] 보호된 `/admin` 구현
- [x] `/admin/matches` 구현
- [x] `/admin/export` 구현
- [x] 참여자와 예측 데이터 표시
- [x] 휴대폰 번호 마스킹
- [x] 경기 열기/닫기 기능 추가
- [x] 경기 직접 추가/수정 폼 추가
- [x] 경기 실제 결과 입력과 당첨 후보 표시 추가
- [x] CSV export 추가
- [x] 관련 문서 갱신

## Milestone 7: 배포 준비

- [x] Vercel 배포 준비 상태 확인
- [x] 환경 변수 확인
- [x] 모바일 흐름 점검
- [x] QR target URL 준비
- [x] 포트폴리오 문서 정리

## 운영 보강

- [x] 관리자 경기 표시 정책을 한 번에 하나의 경기만 노출되도록 조정
- [x] 기존 경기 수정/표시/숨김 이후 기존 경기 탭으로 돌아가도록 개선
- [x] `events`와 `matches`의 역할 차이를 문서화
