# Teamlet — HR SaaS UX 브리핑

> Claude.ai 디자인 작업용 프로젝트 컨텍스트 문서

---

## 서비스 개요

**Teamlet**은 중소기업 대상 HR 관리 SaaS 웹앱입니다.

- 구성원 관리, 휴가 신청/결재, 전자결재(워크플로우), 조직도, 권한 관리 등을 통합
- Sales-led 가입 모델: 회사 등록 신청 → 플랫폼 관리자 승인 → 구성원 초대/가입
- 사용자 역할: 최고 관리자(SYSTEM_SUPER_ADMIN) / 조직장 / 일반 구성원

---

## 기술 스택

- **프레임워크**: Next.js 15 App Router (RSC + Server Actions)
- **스타일링**: Tailwind CSS v4 + 커스텀 디자인 토큰
- **DB**: PostgreSQL + Prisma ORM
- **인증**: Auth.js v5 (JWT, Credentials + Google OAuth, TOTP 2FA)
- **모노레포**: pnpm + Turborepo

---

## 디자인 토큰 (색상 시스템)

```
배경:
  background-primary   — 카드, 패널 배경 (흰색 계열)
  background-secondary — 호버, 서브 배경 (연한 회색)

텍스트:
  foreground           — 주요 텍스트
  foreground-muted     — 보조 텍스트 (레이블, 설명)
  foreground-subtle    — 힌트, 플레이스홀더

테두리:
  border               — 일반 구분선
  border-focus         — 포커스 링

강조색:
  primary              — 파란 계열 (버튼, 링크, 활성 상태)
  destructive-50/600/700 — 빨간 계열 (오류, 반려, 삭제)
```

---

## 레이아웃 구조

```
앱 전체
├── (auth) 그룹 — 로그인 전 인증 흐름
│   ├── /login          — 이메일 로그인
│   ├── /signup         — 회원가입
│   ├── /2fa            — TOTP 2단계 인증
│   ├── /join-company   — 회사 가입 선택 (3가지 옵션)
│   ├── /register-company — 회사 등록 신청
│   └── /pending-approval — 승인 대기 / 반려 결과
│
├── (app) 그룹 — 로그인 후 메인 앱
│   ├── 사이드바 + 헤더 고정 레이아웃
│   ├── /home           — 홈 (홈 피드 / 소식 / 할 일 탭 + 미니 캘린더)
│   ├── /members        — 구성원 목록 / 상세 / 조직도
│   ├── /leave          — 휴가 현황 + 신청
│   └── /workflow       — 전자결재 목록 / 문서 상세
│
└── (settings) 그룹 — 설정
    ├── 사이드 네비 (개인 / 회사 / 운영 — 권한별 노출)
    ├── /settings/profile       — 개인 설정 (이름, 연락처)
    ├── /settings/security      — 보안 (2FA)
    ├── /settings/company       — 회사 정보
    ├── /settings/holidays      — 공휴일 관리
    ├── /settings/permissions   — 권한 그룹 설정 (최고 관리자 전용)
    ├── /settings/leave-types   — 휴가 종류 관리
    └── /settings/leave-policies — 휴가 정책
```

---

## 주요 화면별 현황

### 1. 인증 흐름
- 이메일만 입력 → 자동 로그인 (비밀번호 없음, 임시 비번 발급 방식)
- 2FA 활성화 계정: 로그인 후 `/2fa` 강제 경유 (6자리 TOTP)
- 회사 가입 선택 화면: ① 회사 등록 신청 ② 회사 코드 입력 ③ 초대 대기
- 승인 대기: 5초마다 자동 폴링, 승인 시 홈으로 이동
- 반려: 사유 표시 + "다시 선택하기" / "로그아웃하기"

### 2. 홈
- 3개 탭: 홈 피드 / 소식 / 할 일
- 우측 미니 캘린더 (이번 달 공휴일, 휴가 일정 표시 예정)
- 상단 알림 벨 (SSE 실시간 업데이트, 드롭다운 패널)

### 3. 구성원
- 리스트 뷰 (테이블) + 조직도 뷰 전환
- 구성원 상세: 기본 정보 / 발령 이력 / 권한 탭

### 4. 휴가
- 연차 잔여 현황 카드
- 휴가 신청 폼 (날짜 범위, 종류, 사유)
- 신청 이력 테이블

### 5. 전자결재
- 문서 목록 (내가 요청 / 결재 대기 / 완료)
- 문서 상세 + 결재선 타임라인

### 6. 설정
- 사이드 네비: 권한에 따라 섹션 노출 다름
  - 일반 구성원: 개인 탭만
  - 최고 관리자: 개인 + 회사 + 운영 전체

---

## 컴포넌트 패턴

- **버튼**: `rounded-lg`, primary(파랑)/outline(테두리)/ghost 3종
- **입력 필드**: `rounded-md border border-border bg-background-primary px-3 py-2`
- **카드**: `rounded-xl border border-border bg-background-primary p-5`
- **뱃지**: `rounded-full px-2 py-0.5 text-xs`
- **알림 상태**: pending(노랑) / approved(초록) / rejected(빨강)
- **사이드바**: 240px 고정, 아이콘 + 텍스트, 활성 항목 bg-background-secondary

---

## 미완성 / 개선 필요 화면

- [ ] 홈 피드 — 실제 콘텐츠 피드 (공지, 이벤트 등) 미구현
- [ ] 조직도 — 트리 뷰 UI 미완성
- [ ] HR 관리 — 급여, 계약서 등 미구현
- [ ] 모바일 반응형 — 현재 데스크탑 우선
- [ ] 다크 모드 — 토큰 준비됨, UI 미적용

---

## 디자인 참고 레퍼런스

비슷한 톤앤매너: **Linear**, **Notion**, **Rippling** (심플하고 정보 밀도 높은 B2B SaaS 스타일)

---

*이 파일은 Claude.ai에서 UX 디자인 작업 시 컨텍스트용으로 사용합니다.*
