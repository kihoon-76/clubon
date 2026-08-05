# ClubOn — 아키텍처 설계서

> 프리미엄 온라인 화상 소셜 클럽. 그룹 테이블 기반, AI 웨이터 매칭, 마스크 착용 화상, 방장 합의 얼굴 공개.
> **1:1 데이팅 앱이 아니며, 랜덤 화상 채팅 서비스가 아닙니다.**

---

## 1. 애플리케이션 아키텍처

### 1.1 레이어 구조

```
┌──────────────────────────────────────────────────────────┐
│  app/  (Next.js App Router — RSC + Server Actions)       │
│  · 페이지 · 레이아웃 · 라우트 핸들러                        │
└────────────────────────┬─────────────────────────────────┘
                         │ (서버 액션 / API 라우트만 통과)
┌────────────────────────▼─────────────────────────────────┐
│  features/*  (도메인 모듈)                                │
│  auth · profile · consent · tables · matching             │
│  video · chat · moderation · admin                        │
│  각 모듈 = { actions.ts, queries.ts, schema.ts,           │
│             state-machine.ts, components/ }               │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  services/  (교체 가능한 외부 서비스 어댑터)                │
│  · VideoProvider      (mock → LiveKit/Agora/Daily)        │
│  · ModerationProvider (rule-based → 외부 API)             │
│  · MatchingService    (rule-based → AI 모델)              │
│  · IdentityVerifier   (mock → 실제 본인확인)               │
│  · RealtimeProvider   (polling → Supabase Realtime)       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  lib/db  (데이터 접근 — DataAdapter 인터페이스)            │
│  · SupabaseAdapter   (env 있을 때)                        │
│  · DevMemoryAdapter  (env 없을 때 — 로컬 개발/데모)        │
└──────────────────────────────────────────────────────────┘
```

### 1.2 핵심 설계 원칙

| 원칙 | 구현 |
|---|---|
| **서버가 진실의 원천** | 운영시간, 테이블 상태 전이, 매치 수락, 마스크 해제는 전부 서버에서 검증. 클라이언트 상태는 표시용. |
| **service-role 키는 브라우저에 절대 없음** | `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 모듈(`lib/supabase/admin.ts`)에서만 import. `import 'server-only'` 가드. |
| **모든 외부 서비스는 어댑터 뒤에** | 인터페이스 → 구현 교체만으로 mock ↔ 실서비스 전환. |
| **모의 기능은 명확히 표시** | UI에 `MOCK` 배지 + 설명 툴팁. |
| **불확실한 안전 판정은 파괴적 조치를 하지 않음** | 모더레이션은 단계적 조치(경고 → 블러 → 음소거 → 룸 잠금 → 관리자 검토). |

### 1.3 상태 관리

- **서버 상태**: RSC + Server Actions + `revalidatePath`. 실시간이 필요한 곳은 `RealtimeProvider`.
- **클라이언트 임시 상태**: Zustand (룸 로컬 UI — 마이크/카메라 토글, 패널 열림 등).
- **검증**: 모든 서버 액션 입력은 Zod 스키마 통과 후 실행.

---

## 2. 라우트 구조

```
src/app/
├── (marketing)/
│   ├── page.tsx                      # 1. 랜딩
│   ├── membership/page.tsx           # 2. 멤버십·요금 (플레이스홀더)
│   ├── safety/page.tsx               # 18. 안전 센터
│   ├── terms/page.tsx                # 20. 이용약관 (플레이스홀더)
│   └── privacy/page.tsx              # 20. 개인정보처리방침 (플레이스홀더)
│
├── (auth)/
│   ├── signup/page.tsx               # 3. 회원가입
│   ├── login/page.tsx                # 3. 로그인
│   └── verify/page.tsx               # 인증 대기 (mock)
│
├── (onboarding)/
│   ├── adult-check/page.tsx          # 4. 성인 확인 (생년월일)
│   ├── consent/page.tsx              # 4. 동의 플로우
│   └── profile-setup/page.tsx        # 5. 프로필 설정
│
├── (club)/                           # ← 운영시간 게이트 적용 레이아웃
│   ├── closed/page.tsx               # 6. 클럽 마감
│   ├── lobby/page.tsx                # 7. 클럽 로비
│   ├── tables/
│   │   ├── new/page.tsx              # 8. 테이블 생성
│   │   ├── join/page.tsx             # 9. 초대코드로 참여
│   │   └── [tableId]/
│   │       ├── page.tsx              # 10. 대기 라운지
│   │       └── matching/page.tsx     # 11. AI 웨이터 매칭
│   ├── match/[proposalId]/page.tsx   # 12. 매치 제안
│   └── room/[sessionId]/
│       ├── page.tsx                  # 13. 라이브 마스크 화상룸
│       └── feedback/page.tsx         # 16. 세션 피드백
│
├── (app)/
│   └── dashboard/page.tsx            # 17. 유저 대시보드
│
├── admin/                            # 19. 관리자 (role=admin|moderator)
│   ├── page.tsx                      # 개요
│   ├── reports/page.tsx
│   ├── moderation/page.tsx
│   ├── sessions/page.tsx
│   ├── consents/page.tsx
│   └── settings/page.tsx
│
└── api/
    ├── club/status/route.ts          # 운영시간 상태
    ├── tables/[tableId]/stream/route.ts   # 테이블 상태 SSE
    └── rooms/[sessionId]/stream/route.ts  # 룸 이벤트 SSE
```

**모달 라우트(인터셉팅 아님, 컴포넌트로 구현)**: 14. 방장 얼굴 공개 합의 패널, 15. 신고·차단 모달.

### 2.1 접근 제어 매트릭스

| 라우트 그룹 | 로그인 | 성인확인 | 동의 완료 | 프로필 | 운영시간 | 역할 |
|---|:-:|:-:|:-:|:-:|:-:|---|
| `(marketing)` | – | – | – | – | – | – |
| `(auth)` | 비로그인 | – | – | – | – | – |
| `(onboarding)` | ✔ | 단계별 | 단계별 | 단계별 | – | – |
| `(app)/dashboard` | ✔ | ✔ | ✔ | ✔ | – | – |
| `(club)/*` | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| `admin/*` | ✔ | – | – | – | – | admin·moderator |

정지(suspended) 계정은 `(club)` 전체 차단 → 안전센터로 리디렉션.

---

## 3. 데이터베이스 스키마

전체 SQL은 `supabase/migrations/`에 있습니다. 아래는 논리 모델 요약입니다.

### 3.1 계정 · 신원

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `users` | `id`, `email`, `role(user\|moderator\|admin)`, `status(active\|suspended\|banned)`, `created_at` | Supabase `auth.users` 확장 |
| `profiles` | `user_id`, `nickname`, `age_band`, `region`, `languages[]`, `interests[]`, `conversation_style`, `group_vibe`, `music[]`, `travel[]`, `hobbies[]`, `availability`, `reputation_score`, `completed_sessions`, `report_count` | **외모 점수 없음** |
| `identity_verifications` | `user_id`, `method(email\|phone\|document)`, `status(unverified\|pending\|verified\|failed)`, `verified_at`, `provider_ref` | **원본 신분증 저장 안 함** — 참조 토큰만 |
| `account_suspensions` | `user_id`, `reason`, `severity`, `starts_at`, `ends_at`, `issued_by`, `lifted_at` | |

### 3.2 동의

| 테이블 | 핵심 컬럼 |
|---|---|
| `consents` | `user_id`, `consent_type`, `version`, `granted`, `granted_at`, `revoked_at`, `ip_hash`, `device_id` |

`consent_type` enum: `terms_of_service`, `privacy_policy`, `adult_only`, `camera_microphone`, `ai_text_moderation`, `ai_video_moderation`, `face_tracking`, `anti_recording`, `community_standards`, `mutual_face_reveal`.

### 3.3 클럽 운영

| 테이블 | 핵심 컬럼 |
|---|---|
| `clubs` | `id`, `name`, `timezone`, `min_table_size`, `max_table_size`, `min_room_participants`, `is_active` |
| `operating_hours` | `club_id`, `day_of_week`, `opens_at`, `closes_at` (자정 넘김 허용) |

### 3.4 테이블 · 매칭

| 테이블 | 핵심 컬럼 |
|---|---|
| `tables` | `id`, `club_id`, `host_user_id`, `name`, `state`, `invite_code`, `max_size`, `created_at`, `closed_at` |
| `table_members` | `table_id`, `user_id`, `role(host\|member)`, `joined_at`, `left_at` |
| `table_preferences` | `table_id`, `age_bands[]`, `languages[]`, `interests[]`, `energy(relaxed\|balanced\|lively)`, `topic_focus[]`, `region_preference` |
| `invitations` | `table_id`, `code`, `created_by`, `expires_at`, `max_uses`, `used_count`, `revoked_at` |
| `match_proposals` | `id`, `table_a_id`, `table_b_id`, `score`, `reasons(jsonb)`, `state`, `a_response`, `b_response`, `expires_at` |
| `matches` | `id`, `proposal_id`, `table_a_id`, `table_b_id`, `matched_at` |

### 3.5 세션 · 얼굴 공개

| 테이블 | 핵심 컬럼 |
|---|---|
| `video_sessions` | `id`, `match_id`, `state(live\|paused\|ended\|locked)`, `host_a_user_id`, `host_b_user_id`, `started_at`, `ended_at`, `provider`, `room_ref` |
| `participant_sessions` | `session_id`, `user_id`, `table_id`, `mask(fox\|cat\|rabbit\|bear\|wolf)`, `mic_on`, `cam_on`, `video_state(ok\|blurred\|frozen\|avatar)`, `joined_at`, `left_at` |
| `reveal_agreements` | `session_id` (유일), `state`, `requester_id`, `requester_table_id`, `granted_at`, `revoked_at`, `revoked_by`, `updated_at` | **세션당 1건 · 방 전체 단위 합의** |

`host_a_user_id` · `host_b_user_id`는 합석한 두 라운지의 방장으로, 얼굴 공개를 결정할 수 있는 유일한 두 사람입니다. 세션 개설 시각의 방장을 고정 저장합니다.

### 3.6 채팅 · 모더레이션

| 테이블 | 핵심 컬럼 |
|---|---|
| `chat_messages` | `id`, `scope(table\|room)`, `scope_id`, `sender_id`, `kind(user\|system\|waiter)`, `body`, `moderation_status(allowed\|blocked\|flagged)`, `created_at` |
| `moderation_events` | `id`, `subject_user_id`, `context(chat\|video\|behavior)`, `context_ref`, `category`, `severity(low\|medium\|high\|critical)`, `action_taken`, `source(rule\|ai\|report\|admin)`, `detail(jsonb)`, `created_at` |
| `reports` | `id`, `reporter_id`, `reported_user_id`, `session_id`, `category`, `description`, `status(open\|reviewing\|resolved\|dismissed)`, `resolved_by` |
| `blocks` | `blocker_id`, `blocked_id`, `created_at` |

### 3.7 웨이터 · 피드백

| 테이블 | 핵심 컬럼 |
|---|---|
| `waiter_tips` | `id`, `user_id`, `table_id`, `credits`, `tier(standard\|priority)`, `expires_at` — **모의 크레딧** |
| `waiter_activity` | `id`, `table_id`, `action`, `message`, `payload(jsonb)`, `created_at` |
| `session_feedback` | `session_id`, `user_id`, `rating`, `vibe`, `would_rematch`, `comment` |

### 3.8 보존 정책

- 화상 **녹화 없음**. 프레임 모더레이션 결과는 판정 메타데이터만 저장.
- 채팅은 세션 종료 후 30일 보존 후 삭제(잡 플레이스홀더). 신고에 연결된 메시지는 검토 종료까지 보존.
- 원본 신분증/문서 미저장.

---

## 4. 디자인 시스템

### 4.1 컬러 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-ink` | `#0B0B0C` | 최심층 배경 |
| `--color-surface` | `#121214` | 페이지 배경 |
| `--color-surface-raised` | `#191A1D` | 카드 |
| `--color-surface-overlay` | `#212227` | 모달·팝오버 |
| `--color-line` | `#2B2D33` | 보더 |
| `--color-ivory` | `#F4F1EA` | 본문 텍스트 |
| `--color-muted` | `#9A968D` | 보조 텍스트 |
| `--color-champagne` | `#D8BE86` | 주 강조(샴페인 골드) |
| `--color-champagne-soft` | `#EBD9AE` | 호버·하이라이트 |
| `--color-silver` | `#B9BCC2` | 보조 강조(브러시드 실버) |
| `--color-danger` | `#C4695F` | 경고·차단 (채도 낮춘 톤) |
| `--color-success` | `#7E9B7A` | 성공 (채도 낮춘 톤) |

**금지**: 네온 핑크, 과도한 퍼플, 카지노풍 이펙트, 주류·선정적 이미지.

### 4.2 타이포그래피

- 디스플레이/헤딩: 세리프 계열 (`Cormorant Garamond`) — 절제된 럭셔리.
- 본문/UI: 산세리프 (`Pretendard` 우선, fallback `Geist`) — 한글 가독성.
- 스케일: `display 56/44/36 · h1 32 · h2 24 · h3 20 · body 16 · sm 14 · xs 12`
- 자간: 헤딩 `-0.02em`, 대문자 라벨 `0.18em`.

### 4.3 형태 · 깊이 · 모션

- 반경: 카드 `20px`, 버튼 `12px`, 필 `9999px`.
- 그림자: `0 1px 2px rgba(0,0,0,.4), 0 12px 40px rgba(0,0,0,.35)` — 부드럽고 낮은 대비.
- 골드 라인: `1px` 헤어라인 + 미세 그라디언트.
- 모션: 120–220ms, `cubic-bezier(.2,.6,.2,1)`. `prefers-reduced-motion` 존중.

### 4.4 접근성

- 본문 대비 ≥ 4.5:1, 큰 텍스트 ≥ 3:1 (아이보리 on 서피스 = 15:1).
- 포커스 링: `2px` 샴페인 + `2px` 오프셋. 키보드로 모든 기능 접근 가능.
- 모든 모달 포커스 트랩 + `Esc` 닫기 + `aria-modal`.
- 상태는 색상 단독으로 전달하지 않음(아이콘·텍스트 병기).

---

## 5. 유저 플로우

```
랜딩
 └─ 가입 → 이메일/전화 인증(mock) → 성인 확인(생년월일 + 체크박스)
      └─ 동의 플로우(10개 항목, 필수/선택 구분)
           └─ 프로필 설정
                └─ 대시보드
                     ├─ [운영시간 외] 클럽 마감 페이지 (예약·초대·프로필만 가능)
                     └─ [운영시간 내] 클럽 로비
                          ├─ 테이블 생성 ─┐
                          ├─ 초대코드 참여 ┤→ 대기 라운지 (FORMING → READY)
                          └─ 대기 라운지 입장 ┘
                               └─ 매칭 요청 (READY → WAITING)
                                    └─ AI 웨이터 매칭 화면
                                         └─ 매치 제안 (양 테이블)
                                              ├─ 한쪽 거절/만료 → 대기 라운지 복귀
                                              └─ 양쪽 수락 → 카메라·녹화금지 재확인
                                                   └─ 라이브 마스크 화상룸
                                                        ├─ 채팅 / 아이스브레이커
                                                        ├─ 방장 공개 제안 → 상대 방장 수락 → 방 전체 공개
                                                        ├─ 신고 / 차단 / 나가기
                                                        └─ 종료 → 세션 피드백 → 재매칭 or 로비
```

---

## 6. 테이블 & 매칭 상태 머신

### 6.1 테이블 상태

```
        create
          │
          ▼
      ┌────────┐  인원 ≥ min      ┌───────┐
      │FORMING │ ───────────────▶ │ READY │
      └────────┘ ◀─────────────── └───────┘
          │       인원 < min          │ 매칭 요청
          │                           ▼
          │                      ┌─────────┐
          │                      │ WAITING │◀────────────┐
          │                      └─────────┘             │
          │                           │ 웨이터 제안 생성  │ 거절·만료·재매칭
          │                           ▼                  │
          │                   ┌────────────────┐         │
          │                   │ MATCH_PROPOSED │─────────┘
          │                   └────────────────┘
          │                           │ 양측 수락
          │                           ▼
          │                   ┌────────────────┐
          │                   │ MATCH_ACCEPTED │
          │                   └────────────────┘
          │                           │ 룸 개설
          │                           ▼
          │                       ┌──────┐  참가자 < 최소   ┌────────┐
          │                       │ LIVE │ ───────────────▶│ PAUSED │
          │                       └──────┘ ◀───────────────└────────┘
          │                           │       인원 회복         │ 타임아웃
          ▼                           ▼                        ▼
      ┌────────┐              ┌────────┐              ┌─────────┐
      │ CLOSED │◀─────────────│ CLOSED │              │ WAITING │
      └────────┘              └────────┘              └─────────┘

  임의 상태 ──(모더레이션 심각도 critical)──▶ MODERATION_LOCKED ──(관리자 해제)──▶ CLOSED
```

**불변식(서버에서 강제)**
1. 테이블 인원: `min_table_size(2) ≤ n ≤ max_table_size(4)`
2. 매칭된 룸 총 참가자 ≥ 4명 — **1:1 매칭 금지**
3. 룸 참가자가 4명 미만으로 떨어지면 즉시 `PAUSED`, 유예 후 `WAITING` 복귀
4. `MODERATION_LOCKED`는 관리자만 해제

### 6.2 매치 제안 상태

```
PENDING ──A수락──▶ A_ACCEPTED ──B수락──▶ ACCEPTED ──▶ (matches 생성, 룸 개설)
   │  └───B수락──▶ B_ACCEPTED ──A수락──┘
   ├── 어느 한쪽 거절 ──▶ DECLINED  ──▶ 양 테이블 WAITING 복귀
   └── 만료(기본 45초) ──▶ EXPIRED   ──▶ 양 테이블 WAITING 복귀
```

**규칙**: 팁(priority)은 탐색 빈도·상세도만 올리며, 상대 테이블의 수락을 강제하지 않습니다.

### 6.3 매칭 점수 (설정 가능)

| 요소 | 기본 가중치 |
|---|---:|
| 공통 관심사 | 0.25 |
| 언어 호환성 | 0.20 |
| 대화 에너지 일치 | 0.15 |
| 연령대 선호 호환성 | 0.15 |
| 테이블 크기 균형 | 0.10 |
| 지역·시간대 | 0.05 |
| 대기 시간 보정 | 0.05 |
| 안전 평판 | 0.05 |

**하드 필터(점수 이전 적용)**: 차단 관계 존재 · 최근 재매칭 쿨다운 · 정지 계정 · 룸 총원 < 4 · 테이블 상태 ≠ `WAITING`.
**외모 점수 사용 안 함.**

---

## 7. 얼굴 공개 상태 머신 (방장 합의)

공개는 참가자 개인이 아니라 **합석한 두 라운지의 방장**이 결정합니다. 세션당 합의는 하나이며, 확정되면 방 전체에 한꺼번에 적용됩니다.

```
                    ┌────────┐
        ┌──────────▶│ MASKED │◀─────────────┐
        │           └────────┘              │
        │                │ 방장 A가 제안      │
        │                ▼                  │
        │      ┌──────────────────┐         │
        │      │ REVEAL_REQUESTED │         │
        │      └──────────────────┘         │
        │           │          │            │
        │  방장 B   │          │ 방장 B 수락  │
        │  거절     ▼          ▼            │
        │  ┌──────────────────┐  ┌──────────────────────────┐
        │  │ REVEAL_CANCELLED │  │ 서버가 양쪽 방장 동의 확정  │
        │  └──────────────────┘  └──────────────────────────┘
        │           │                       │
        │           └───────────────────────┤
        │                                   ▼
        │                            ┌──────────┐
        │                            │ REVEALED │ ← 방 전체 참가자 동시 공개
        │                            └──────────┘
        │                                   │ 어느 방장이든 복구 / 방장 퇴장 / 세션 종료
        │                                   ▼
        │                            ┌──────────┐
        └────────────────────────────│ REMASKED │
                                     └──────────┘
```

**불변식**
1. 상태 전이를 일으킬 수 있는 사람은 **세션에 고정된 두 방장뿐**입니다. 그 외 참가자가 서버 액션을 직접 호출해도 런타임이 방장 여부를 다시 확인해 무시합니다.
2. 제안한 쪽 라운지의 방장은 **자기 제안에 응답할 수 없습니다**. 반드시 반대쪽 라운지의 방장이 수락해야 합니다.
3. 공개는 **양쪽 방장의 명시적 수락**이 서버에 기록된 뒤에만 발생하며, 그 순간 방 안의 **모든 참가자**에게 동시에 적용됩니다.
4. 어느 방장이든 마스크를 다시 적용하면 참가자 **전원**이 즉시 마스크로 돌아갑니다. 공개를 결정한 방장이 나가거나 세션이 끝날 때도 같습니다.
5. 공개 중이라도 **뷰 조립 단계에서** 다음은 계속 마스크로 보입니다 — 내가 차단한 참가자(`blockedByMe`), 모더레이션으로 영상이 제한된 참가자(`video_state = blurred`).
6. 신고·차단 한 건이 방 전체의 공개를 되돌리지는 않습니다. 신고자 화면에만 반영되고, 위반이 확인되면 모더레이션이 해당 참가자의 영상을 제한합니다.
7. 얼굴 추적 실패 시 **절대 원본 얼굴을 노출하지 않고** 블러/프리즈/아바타로 대체합니다.

---

## 8. 모더레이션 상태 머신

### 8.1 텍스트 메시지 파이프라인

```
작성 → [ModerationProvider.checkText] → allowed  → 저장 + 전송
                                      → flagged  → 저장 + 전송 + 이벤트 기록
                                      → blocked  → 저장(비공개) + 발신자에게만 사유 표시
                                                   + moderation_events 기록 + 위반 카운트 증가
```

검사 카테고리: 괴롭힘, 혐오 표현, 협박, 성적 괴롭힘, 반복 모욕, 스팸, 전화번호, SNS 핸들, 결제 요구, 성매매 알선, 미성년자 접촉 시도, 반복 우회 시도.

### 8.2 참가자 조치 에스컬레이션

```
  OK
   │ 위반 1회 (low/medium)
   ▼
 WARNED ────────────┐
   │ 위반 2회        │ 30분 내 위반 없으면 감쇠
   ▼                │
 RESTRICTED ────────┤   (비디오 블러 또는 일시정지)
   │ 위반 3회        │
   ▼                │
 MUTED / REMOVED ───┤   (음소거 또는 룸에서 제외)
   │ 심각도 high     │
   ▼                │
 TABLE_LOCKED ──────┘   (테이블 MODERATION_LOCKED)
   │ severity=critical 또는 반복 위반
   ▼
 ADMIN_REVIEW ──▶ SUSPENDED (관리자 결정) ──▶ RESTORED (해제)
```

**규칙**
- 단일 불확실 프레임 하나로 룸 전체를 종료하지 않습니다. 심각도 `critical`만 즉시 조치.
- 모든 자동 조치는 `moderation_events`에 `source`, `detail`과 함께 기록되어 관리자가 검토·번복 가능.
- **AI 탐지가 완벽하다고 표기하지 않습니다.** UI 문구에 한계를 명시합니다.

### 8.3 화상 안전 (Phase 3 준비 구조)

프레임 샘플링 → 분류(노출, 성행위, 과도한 노출, 폭력, 무기, 미검증 다인 등장, 얼굴추적 실패, 위조 카메라 피드) → 심각도 매핑 → 위 에스컬레이션에 투입. MVP에서는 **모의 트리거**로 동일 경로를 테스트합니다.

---

## 9. MVP 구현 계획

### Phase 1 (본 작업 범위)

| # | 항목 | 상태 |
|---|---|---|
| 1 | 스캐폴딩 · 디자인 시스템 · 랜딩 | 진행 |
| 2 | DB 스키마 · RLS · 시드 · 데이터 어댑터 | 대기 |
| 3 | 인증 · 성인확인 · 동의 플로우 | 대기 |
| 4 | 프로필 · 대시보드 | 대기 |
| 5 | 운영시간 게이트 · 로비 | 대기 |
| 6 | 그룹 테이블 · 초대 · 대기 라운지 | 대기 |
| 7 | AI 웨이터 매칭 · 제안 · 상호 수락 · 팁 | 대기 |
| 8 | 모의 마스크 화상룸 · 방장 합의 얼굴 공개 | 대기 |
| 9 | 채팅 · 텍스트 모더레이션 · 신고 · 차단 | 대기 |
| 10 | 세션 피드백 · 안전센터 · 약관 | 대기 |
| 11 | 관리자 모더레이션 대시보드 | 대기 |

### Phase 2
LiveKit/Agora 연동 · MediaPipe 얼굴 추적 · 실제 동물 마스크 렌더 · Supabase Realtime 룸 이벤트 · 외부 텍스트 모더레이션 API · 동적 워터마크 강화 · 네이티브 모바일 래퍼.

### Phase 3
화상 안전 모더레이션 · 실제 본인확인 · 모바일 앱 · Android 스크린샷 차단 · iOS 녹화 감지 · 실결제/멤버십 · 고도화된 AI 웨이터 · 추천 최적화.

---

## 10. 보안 요구사항 체크리스트

- [x] Supabase Row Level Security 전 테이블 적용
- [x] 역할 기반 접근 제어 (user / moderator / admin)
- [x] 서버 액션 보호 (세션·역할·상태 검증)
- [x] Zod 입력 검증
- [x] 레이트 리밋 플레이스홀더 (`lib/rate-limit.ts`)
- [x] 감사 로그 (`moderation_events`, `waiter_activity`, 관리자 조치)
- [x] service-role 키 브라우저 노출 없음
- [x] 원본 신분증 미저장
- [x] 원본 영상 미저장
- [x] 불필요한 채팅 보존 없음 (보존 정책 명시)
- [x] 안전한 초대 코드 (암호학적 난수, 만료·사용횟수 제한, 폐기 가능)
- [x] 만료되는 룸 토큰 (서버 발급, 단기 TTL)
- [x] 서버 제어 룸 권한

## 11. 스크린샷 · 녹화 정책

플랫폼은 모든 스크린샷·외부 촬영을 **기술적으로 완전히 차단할 수 없습니다.** 따라서:

- 가입 시 녹화 금지 동의 필수
- 라이브 룸 입장 전 재확인
- 방 전체 얼굴 공개 전 재확인
- 동적 워터마크(사용자 ID·세션 ID·타임스탬프) 오버레이
- 프라이버시 침해 신고 플로우 + 계정 정지 규정

표기 문구:
> 다른 참가자의 영상, 음성, 개인정보를 캡처·녹화·촬영하거나 공유하는 행위는 금지됩니다. 위반 시 영구 이용정지 및 관련 법률에 따른 법적 책임이 따를 수 있습니다.

**"스크린샷은 기술적으로 불가능합니다"와 같은 표현은 사용하지 않습니다.**
