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
| `NEXT_PUBLIC_SUPABASE_URL` | – | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | – | Supabase anon 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | – | **서버 전용.** 브라우저 번들에 절대 포함되지 않습니다 |
| `CLUB_TIMEZONE` | – | 클럽 운영 시간 기준 타임존 (기본 `Asia/Seoul`) |

> Supabase 환경 변수가 없으면 앱은 로컬 개발용 인메모리 어댑터로 동작합니다.
> 이 상태에서도 전체 화면 플로우를 확인할 수 있으며, 데이터는 프로세스 재시작 시 초기화됩니다.

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
