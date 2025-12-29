# ESG Insight 백엔드

AI 기반 중소기업 ESG 자가진단 플랫폼 - 토스페이먼츠 결제 연동

## 📁 프로젝트 구조

```
esg-backend/
├── server.js          # Express 서버 (메인)
├── scheduler.js       # 정기결제 스케줄러
├── package.json       # 의존성 관리
├── .env.example       # 환경변수 예시
├── database/
│   └── schema.sql     # PostgreSQL 스키마
└── public/
    ├── index.html          # 🏠 랜딩 페이지 (마케팅)
    ├── pricing.html        # 💳 결제 페이지
    ├── dashboard.html      # 📊 ESG 대시보드 (메인 앱)
    ├── mypage.html         # 👤 마이페이지 (프로필/구독관리)
    ├── login.html          # 🔐 로그인 페이지
    ├── signup.html         # 📝 회원가입 페이지
    ├── about.html          # 🏢 회사 소개
    ├── blog.html           # 📰 블로그/ESG 인사이트
    ├── terms.html          # 📜 이용약관
    ├── privacy.html        # 🔒 개인정보처리방침
    ├── refund.html         # 💰 환불 정책
    ├── support.html        # 💬 고객센터 (FAQ + 1:1문의)
    ├── notices.html        # 📢 공지사항
    ├── forgot-password.html # 🔑 비밀번호 찾기
    ├── welcome.html        # 🎉 회원가입 완료
    ├── payment-success.html # ✅ 결제 성공
    ├── payment-fail.html   # ❌ 결제 실패
    └── 404.html            # 🚫 에러 페이지
```

## 🌐 전체 페이지 구조 (총 18개)

### 메인 페이지
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 랜딩 페이지 | 마케팅, 기능 소개, 가격 안내 |
| `/pricing` | 결제 페이지 | 요금제 선택 및 토스페이먼츠 결제 |
| `/dashboard` | ESG 대시보드 | 실제 ESG 분석 플랫폼 |
| `/mypage` | 마이페이지 | 프로필, 구독 관리, 결제 내역, 보안 설정 |

### 사용자 인증
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | 로그인 | 이메일/소셜 로그인 (Google, 카카오, 네이버) |
| `/signup` | 회원가입 | 3단계 회원가입 (기본정보 → 회사정보 → 동의) |
| `/forgot-password` | 비밀번호 찾기 | 이메일로 비밀번호 재설정 |
| `/welcome` | 회원가입 완료 | 환영 메시지, 다음 단계 안내 |

### 회사 & 콘텐츠
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/about` | 회사 소개 | 미션, 비전, 팀, 연혁, 핵심가치 |
| `/blog` | 블로그 | ESG 트렌드, 정책, 실무 가이드, 사례 연구 |

### 법적 필수 페이지
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/terms` | 이용약관 | 서비스 이용 조건 (법적 필수) |
| `/privacy` | 개인정보처리방침 | 개인정보 수집/이용 안내 (법적 필수) |
| `/refund` | 환불 정책 | 구독 취소 및 환불 규정 |

### 고객 지원
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/support` | 고객센터 | FAQ, 카테고리별 도움말, 1:1 문의 |
| `/notices` | 공지사항 | 업데이트, 점검 안내, 이벤트 |

### 결제 결과
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/payment/success` | 결제 성공 | 결제 완료 확인, 대시보드 이동 |
| `/payment/fail` | 결제 실패 | 오류 안내, 재시도 |

### 에러 페이지
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/*` | 404 | 존재하지 않는 페이지 처리 |

## 🔗 페이지 연결 흐름


```
랜딩 페이지 (/)
    ├── [로그인] → 대시보드 (/dashboard)
    ├── [회원가입] → 회원가입 완료 (/welcome) → 대시보드
    ├── [요금제 선택] → 결제 페이지 (/pricing)
    └── 푸터 링크
        ├── 이용약관 (/terms)
        ├── 개인정보처리방침 (/privacy)
        ├── 환불 정책 (/refund)
        ├── 고객센터 (/support)
        └── 공지사항 (/notices)

결제 페이지 (/pricing)
    ├── [결제 성공] → /payment/success → 대시보드 (/dashboard)
    ├── [결제 실패] → /payment/fail → 재시도
    └── [홈으로] → 랜딩 페이지 (/)

대시보드 (/dashboard)
    ├── [요금제 업그레이드] → 결제 페이지 (/pricing)
    ├── [마이페이지] → /mypage
    ├── [홈으로] → 랜딩 페이지 (/)
    └── [로그아웃] → 랜딩 페이지 (/)

마이페이지 (/mypage)
    ├── 프로필 정보 관리
    ├── 구독 관리 → 플랜 변경, 취소
    ├── 결제 내역 조회
    ├── 보안 설정 → 비밀번호 변경
    └── [로그아웃] → 랜딩 페이지 (/)
```

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
cd esg-backend
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 토스페이먼츠 API 키 입력
```

### 3. 서버 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 4. 접속

- 결제 페이지: http://localhost:3000/pricing.html
- API 서버: http://localhost:3000

## 💳 API 엔드포인트

### 사용자

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/users/register` | 회원가입 |
| POST | `/api/users/login` | 로그인 |

### 결제

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/payments/prepare` | 결제 준비 (주문ID 생성) |
| POST | `/api/payments/confirm` | 결제 승인 |
| GET | `/api/payments/history/:userId` | 결제 내역 조회 |

### 정기결제

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/billing/register` | 빌링키 발급 (카드 등록) |
| POST | `/api/billing/charge` | 정기결제 실행 |

### 구독

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/subscriptions/:userId` | 구독 정보 조회 |
| POST | `/api/subscriptions/cancel` | 구독 취소 |

### 웹훅

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/webhooks/tosspayments` | 토스페이먼츠 웹훅 |

## 🔑 토스페이먼츠 설정

### 1. 개발자 센터 가입
https://developers.tosspayments.com

### 2. API 키 발급
- 테스트 키: 개발/테스트용 (실제 결제 안됨)
- 라이브 키: 실제 서비스용

### 3. 웹훅 설정
토스페이먼츠 대시보드에서 웹훅 URL 등록:
```
https://your-domain.com/api/webhooks/tosspayments
```

## 📋 결제 플로우

### 일반 결제
```
1. 프론트엔드: 결제 버튼 클릭
2. 서버: POST /api/payments/prepare (주문ID 생성)
3. 프론트엔드: 토스페이먼츠 결제창 호출
4. 사용자: 결제 진행
5. 토스: successUrl로 리다이렉트 (paymentKey, orderId, amount 전달)
6. 서버: POST /api/payments/confirm (결제 승인)
7. 완료: 구독 활성화
```

### 정기결제 (구독)
```
1. 최초: 빌링키 발급 (카드 등록)
2. 매월: 스케줄러가 자동으로 결제 실행
3. 실패 시: 재시도 (최대 3회)
4. 3회 실패: 구독 일시정지 + 알림 발송
```

## 🗄️ 데이터베이스

현재는 인메모리 저장 (개발용)입니다.
실제 서비스에서는 아래 DB 사용을 권장합니다:

### PostgreSQL (권장)
```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 구독 테이블
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    payment_key VARCHAR(255),
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    type VARCHAR(20) DEFAULT 'one_time',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 빌링키 테이블
CREATE TABLE billing_keys (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    billing_key VARCHAR(255) NOT NULL,
    customer_key VARCHAR(255) NOT NULL,
    card_company VARCHAR(50),
    card_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 보안 체크리스트

- [ ] 환경변수로 API 키 관리 (코드에 하드코딩 금지)
- [ ] HTTPS 적용
- [ ] 결제 금액 서버 측 검증
- [ ] 웹훅 시그니처 검증
- [ ] Rate Limiting 적용
- [ ] SQL Injection 방지 (ORM 사용)
- [ ] XSS 방지

## 📱 알림 연동 (선택)

### 이메일 (SendGrid)
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### 알림톡 (카카오)
```javascript
// 카카오 비즈메시지 API 연동
```

## 🚢 배포

### Vercel (권장)
```bash
npm i -g vercel
vercel
```

### AWS EC2
```bash
# PM2로 프로세스 관리
npm i -g pm2
pm2 start server.js --name esg-backend
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📄 라이선스

MIT License

## 🤝 문의

- 이메일: support@esginsight.co.kr
- 웹사이트: https://esginsight.co.kr
