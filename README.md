# ClubOn




> 프리미엄 온라인 화상 소셜 클럽. 그룹 테이블 기반 만남, AI 웨이터 매칭, 마스크 착용 대화, 상호 동의 얼굴 공개.

성인 전용 회원제 서비스이며, **1:1 데이팅 앱이나 랜덤 화상 채팅 서비스가 아닙니다.**
모든 대화는 최소 4명 이상의 그룹으로 시작합니다.

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript |
| 스타일 | Tailwind CSS v4 (`@theme` 토큰 기반 디자인 시스템) |
| 데이터 | Supabase (Auth · PostgreSQL · Realtime) |
| 검증 | Zod |
| 클라이언트 상태 | Zustand |
| 외부 서비스 | 어댑터 인터페이스 뒤에 캡슐화 (video / moderation / matching / identity) |

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 입력 (아래 참고)
npm run dev                  # http://localhost:3000
```

### 환경 변수

| 변수 | 필수 | 설명 |
|---|:-:|---|
| `DATABASE_URL` | – | PostgreSQL 접속 문자열. 없으면 인메모리 데모 모드로 동작합니다 |
| `AUTH_SECRET` | 배포 시 | 세션 쿠키 서명 키. 프로덕션에서 미설정이면 기동을 거부합니다 |
| `NEXT_PUBLIC_SUPABASE_URL` | – | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | – | Supabase anon 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | – | **서버 전용.** 브라우저 번들에 절대 포함되지 않습니다 |
| `CLUB_TIMEZONE` | – | 클럽 운영 시간 기준 타임존 (기본 `Asia/Seoul`) |

> `DATABASE_URL`이 없으면 앱은 로컬 개발용 인메모리 어댑터로 동작합니다.
> 이 상태에서도 전체 화면 플로우를 확인할 수 있으며, 데이터는 프로세스 재시작 시 초기화됩니다.

## 미리보기 단계: 로그인 없이 사용

현재 단계에서는 **로그인 없이 모든 기능을 그대로 쓸 수 있습니다.**
세션 쿠키가 없으면 데모 회원(하나)으로 자동 입장하며, 헤더의 **회원 전환기**로
다른 데모 회원(관리자·모더레이터 포함)으로 바꿔 볼 수 있습니다.
관리자 콘솔처럼 역할이 필요한 화면도 전환기에서 `관리자`를 고르면 확인됩니다.

로그인·회원가입(`/login`, `/signup`)과 온보딩(성인확인 → 동의 → 프로필)도
구현되어 있으며, 원할 때만 사용하는 선택 경로입니다. 로그인하면 그 계정으로
동작하고, 로그아웃하면 다시 데모 회원으로 돌아갑니다.

> 회원 전환기와 데모 계정 안내는 `DATABASE_URL`이 없는 인메모리 모드에서만
> 노출됩니다. 실제 DB를 연결하면 로그인한 회원만 통과합니다.

### 혼자서 전체 플로우 보기

합석 룸은 **총 4명 이상**이어야 열립니다(1:1 매칭 금지). 혼자 둘러볼 때는
라운지 화면의 **`데모 동반자 합류시키기`** 버튼으로 내 라운지 인원을 채우면
매칭 → 마스크 대화방까지 이어집니다. 상대 라운지가 데모 라운지인 경우
웨이터가 상대 측 수락을 대신 처리합니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run check:browser -- /경로 ...` | 헤드리스 Chromium으로 렌더링·콘솔 오류·모바일 오버플로 검증 및 스크린샷 |

`check:browser`는 최초 1회 다음이 필요합니다.

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

## 문서

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 아키텍처, 라우트 구조, DB 스키마, 디자인 시스템, 유저 플로우, 상태 머신, 구현 계획

## 안전 관련 고지

- 자동 모더레이션은 모든 위반을 완벽하게 탐지한다고 보장하지 않습니다.
- 플랫폼은 스크린샷이나 외부 기기 촬영을 기술적으로 완전히 차단할 수 없습니다.
- 화상 세션은 기본적으로 녹화되지 않으며, 원본 영상·신분증 이미지는 저장하지 않습니다.
