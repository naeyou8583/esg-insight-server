// ============================================================
// ESG Insight - Node.js 백엔드 서버
// 토스페이먼츠 결제 연동 + 정기구독 관리 + K-ESG PDF 파싱
// ============================================================

// .env 파일 로드 (가장 먼저 실행되어야 함)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// PDF 파싱 관련 (npm install multer pdf-parse 필요)
let multer, pdfParse;
try {
    multer = require('multer');
    pdfParse = require('pdf-parse');
} catch (e) {
    console.log('⚠️  PDF 파싱 기능을 사용하려면: npm install multer pdf-parse');
}

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// API 키 설정 (실제 서비스에서는 환경변수로 관리하세요)
// ============================================================
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

// Claude API 키 (https://console.anthropic.com 에서 발급)
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

// OpenAI API 키 (대안으로 사용 가능)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ============================================================
// 외부 데이터 API 키들
// ============================================================

// 공공데이터포털 API 키 (https://www.data.go.kr)
// 기상청, 고용노동부, 한국전력 등 공공 API 공통 사용
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || '';

// DART API 키 (https://opendart.fss.or.kr)
const DART_API_KEY = process.env.DART_API_KEY || '';

// 통계청 KOSIS API 키 (https://kosis.kr/openapi)
const KOSIS_API_KEY = process.env.KOSIS_API_KEY || '';

// Carbon Interface API 키 (https://www.carboninterface.com)
const CARBON_INTERFACE_API_KEY = process.env.CARBON_INTERFACE_API_KEY || '';

// Google API (Sheets, Drive 등)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // PDF 텍스트가 클 수 있으므로 크기 제한 늘림
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// ============================================================
// 페이지 라우팅
// ============================================================

// 기본 경로 → 랜딩 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 대시보드 (로그인 필요)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 결제 페이지
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

// 마이페이지
app.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mypage.html'));
});

// 이용약관
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// 개인정보처리방침
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// 환불 정책
app.get('/refund', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'refund.html'));
});

// 고객센터
app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

// 비밀번호 찾기
app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// 회원가입 완료
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// 결제 성공 페이지
app.get('/payment/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

// 결제 실패 페이지
app.get('/payment/fail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-fail.html'));
});

// 공지사항
app.get('/notices', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notices.html'));
});

// 회사 소개
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 회원가입 페이지
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// 블로그/인사이트
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

// 연동 시스템
app.get('/integrations', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'integrations.html'));
});

// ESG 자가진단
app.get('/assessment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'assessment.html'));
});

// 보고서 샘플
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// 웨비나
app.get('/webinars', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webinars.html'));
});

// 업데이트 이력
app.get('/changelog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'changelog.html'));
});

// 비교 페이지
app.get('/comparison', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'comparison.html'));
});

// ============================================================
// 관리자 페이지
// ============================================================

// 관리자 로그인
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// 관리자 대시보드 (K-ESG 기준 관리)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================================
// 간단한 인메모리 데이터베이스 (실제로는 MySQL/PostgreSQL 사용)
// ============================================================
const database = {
    users: [],
    subscriptions: [],
    payments: [],
    billingKeys: []
};

// 유틸리티 함수
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

function generateOrderId() {
    return 'ESG_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

// ============================================================
// API 라우트
// ============================================================

// 1. 회원가입
app.post('/api/users/register', (req, res) => {
    const { email, password, companyName, contactName, phone } = req.body;

    // 이메일 중복 체크
    if (database.users.find(u => u.email === email)) {
        return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }

    const user = {
        id: generateId(),
        email,
        password: crypto.createHash('sha256').update(password).digest('hex'),
        companyName,
        contactName,
        phone,
        createdAt: new Date().toISOString(),
        plan: 'free',  // 무료 체험
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()  // 14일 후
    };

    database.users.push(user);

    res.json({
        success: true,
        user: { id: user.id, email: user.email, companyName: user.companyName, plan: user.plan }
    });
});

// 2. 로그인
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const user = database.users.find(u => u.email === email && u.password === hashedPassword);

    if (!user) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 간단한 토큰 생성 (실제로는 JWT 사용)
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, companyName: user.companyName, plan: user.plan }
    });
});

// 3. 결제 준비 (주문 ID 생성)
app.post('/api/payments/prepare', (req, res) => {
    const { userId, plan } = req.body;

    const plans = {
        starter: { name: 'Starter', price: 99000 },
        professional: { name: 'Professional', price: 299000 },
        enterprise: { name: 'Enterprise', price: 599000 }
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
        return res.status(400).json({ error: '유효하지 않은 요금제입니다.' });
    }

    const vat = Math.round(selectedPlan.price * 0.1);
    const totalAmount = selectedPlan.price + vat;
    const orderId = generateOrderId();

    // 결제 정보 임시 저장
    const paymentInfo = {
        orderId,
        userId,
        plan,
        planName: selectedPlan.name,
        amount: totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    database.payments.push(paymentInfo);

    res.json({
        success: true,
        orderId,
        amount: totalAmount,
        orderName: `ESG Insight ${selectedPlan.name} 월 구독`,
        clientKey: TOSS_CLIENT_KEY
    });
});

// 4. 결제 승인 (토스페이먼츠 콜백)
app.post('/api/payments/confirm', async (req, res) => {
    const { paymentKey, orderId, amount } = req.body;

    // 결제 정보 확인
    const payment = database.payments.find(p => p.orderId === orderId);
    if (!payment) {
        return res.status(400).json({ error: '주문 정보를 찾을 수 없습니다.' });
    }

    // 금액 검증
    if (payment.amount !== amount) {
        return res.status(400).json({ error: '결제 금액이 일치하지 않습니다.' });
    }

    try {
        // 토스페이먼츠 결제 승인 API 호출
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentKey, orderId, amount })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({ error: data.message || '결제 승인 실패' });
        }

        // 결제 성공 처리
        payment.status = 'completed';
        payment.paymentKey = paymentKey;
        payment.completedAt = new Date().toISOString();
        payment.receiptUrl = data.receipt?.url;

        // 사용자 플랜 업데이트
        const user = database.users.find(u => u.id === payment.userId);
        if (user) {
            user.plan = payment.plan;
            user.planStartedAt = new Date().toISOString();
        }

        // 구독 정보 생성
        const subscription = {
            id: generateId(),
            userId: payment.userId,
            plan: payment.plan,
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
        };
        database.subscriptions.push(subscription);

        res.json({
            success: true,
            payment: {
                orderId: payment.orderId,
                amount: payment.amount,
                status: payment.status,
                receiptUrl: payment.receiptUrl
            },
            subscription
        });

    } catch (error) {
        console.error('결제 승인 오류:', error);
        res.status(500).json({ error: '결제 처리 중 오류가 발생했습니다.' });
    }
});

// 5. 빌링키 발급 (정기결제용 카드 등록)
app.post('/api/billing/register', async (req, res) => {
    const { userId, authKey, customerKey } = req.body;

    try {
        // 토스페이먼츠 빌링키 발급 API
        const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authKey, customerKey })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({ error: data.message || '빌링키 발급 실패' });
        }

        // 빌링키 저장
        const billingInfo = {
            id: generateId(),
            userId,
            billingKey: data.billingKey,
            customerKey: data.customerKey,
            cardCompany: data.card?.company,
            cardNumber: data.card?.number,
            createdAt: new Date().toISOString()
        };
        database.billingKeys.push(billingInfo);

        res.json({
            success: true,
            billingKey: {
                id: billingInfo.id,
                cardCompany: billingInfo.cardCompany,
                cardNumber: billingInfo.cardNumber
            }
        });

    } catch (error) {
        console.error('빌링키 발급 오류:', error);
        res.status(500).json({ error: '카드 등록 중 오류가 발생했습니다.' });
    }
});

// 6. 정기결제 실행 (서버에서 자동 호출)
app.post('/api/billing/charge', async (req, res) => {
    const { subscriptionId } = req.body;

    const subscription = database.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
        return res.status(400).json({ error: '구독 정보를 찾을 수 없습니다.' });
    }

    const billingInfo = database.billingKeys.find(b => b.userId === subscription.userId);
    if (!billingInfo) {
        return res.status(400).json({ error: '등록된 결제 수단이 없습니다.' });
    }

    const plans = {
        starter: { price: 99000 },
        professional: { price: 299000 },
        enterprise: { price: 599000 }
    };

    const amount = plans[subscription.plan].price + Math.round(plans[subscription.plan].price * 0.1);
    const orderId = generateOrderId();

    try {
        // 토스페이먼츠 자동결제 API
        const response = await fetch('https://api.tosspayments.com/v1/billing/' + billingInfo.billingKey, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerKey: billingInfo.customerKey,
                amount,
                orderId,
                orderName: `ESG Insight ${subscription.plan} 월 구독`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // 결제 실패 처리
            subscription.status = 'payment_failed';
            return res.status(400).json({ error: data.message || '정기결제 실패' });
        }

        // 결제 성공 - 구독 기간 연장
        subscription.currentPeriodStart = new Date().toISOString();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        subscription.lastPaymentAt = new Date().toISOString();

        // 결제 내역 저장
        database.payments.push({
            orderId,
            userId: subscription.userId,
            plan: subscription.plan,
            amount,
            status: 'completed',
            paymentKey: data.paymentKey,
            type: 'recurring',
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            payment: { orderId, amount },
            subscription
        });

    } catch (error) {
        console.error('정기결제 오류:', error);
        res.status(500).json({ error: '정기결제 처리 중 오류가 발생했습니다.' });
    }
});

// 7. 구독 취소
app.post('/api/subscriptions/cancel', (req, res) => {
    const { subscriptionId, userId } = req.body;

    const subscription = database.subscriptions.find(s => s.id === subscriptionId && s.userId === userId);
    if (!subscription) {
        return res.status(400).json({ error: '구독 정보를 찾을 수 없습니다.' });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date().toISOString();

    // 현재 결제 기간까지는 서비스 이용 가능
    res.json({
        success: true,
        message: `구독이 취소되었습니다. ${subscription.currentPeriodEnd}까지 서비스를 이용하실 수 있습니다.`,
        subscription
    });
});

// 8. 결제 내역 조회
app.get('/api/payments/history/:userId', (req, res) => {
    const { userId } = req.params;

    const payments = database.payments
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, payments });
});

// 9. 구독 정보 조회
app.get('/api/subscriptions/:userId', (req, res) => {
    const { userId } = req.params;

    const subscription = database.subscriptions.find(s => s.userId === userId && s.status === 'active');

    res.json({ success: true, subscription: subscription || null });
});

// 10. 웹훅 처리 (토스페이먼츠에서 호출)
app.post('/api/webhooks/tosspayments', (req, res) => {
    const { eventType, data } = req.body;

    console.log('웹훅 수신:', eventType, data);

    switch (eventType) {
        case 'PAYMENT_STATUS_CHANGED':
            // 결제 상태 변경 처리
            const payment = database.payments.find(p => p.paymentKey === data.paymentKey);
            if (payment) {
                payment.status = data.status.toLowerCase();
            }
            break;

        case 'BILLING_KEY_DELETED':
            // 빌링키 삭제 처리
            const billingIndex = database.billingKeys.findIndex(b => b.billingKey === data.billingKey);
            if (billingIndex > -1) {
                database.billingKeys.splice(billingIndex, 1);
            }
            break;
    }

    res.json({ success: true });
});

// 11. 결제 성공 페이지
app.get('/payment/success', (req, res) => {
    const { paymentKey, orderId, amount } = req.query;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>결제 완료</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
            <div class="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
                <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
                <p class="text-gray-500 mb-6">ESG Insight 서비스를 이용해주셔서 감사합니다.</p>
                <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <p class="text-sm text-gray-600 mb-2">주문번호: <span class="font-mono">${orderId}</span></p>
                    <p class="text-sm text-gray-600">결제금액: <span class="font-bold">₩${Number(amount).toLocaleString()}</span></p>
                </div>
                <a href="/dashboard" class="block w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">
                    대시보드로 이동
                </a>
            </div>
            <script>
                // 서버에 결제 승인 요청
                fetch('/api/payments/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentKey: '${paymentKey}',
                        orderId: '${orderId}',
                        amount: ${amount}
                    })
                });
            </script>
        </body>
        </html>
    `);
});

// 12. 결제 실패 페이지
app.get('/payment/fail', (req, res) => {
    const { code, message } = req.query;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>결제 실패</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
            <div class="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
                <p class="text-gray-500 mb-6">${message || '알 수 없는 오류가 발생했습니다.'}</p>
                <p class="text-sm text-gray-400 mb-6">오류 코드: ${code || 'UNKNOWN'}</p>
                <a href="/pricing" class="block w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800">
                    다시 시도하기
                </a>
            </div>
        </body>
        </html>
    `);
});

// ============================================================
// K-ESG PDF 파싱 API
// ============================================================

// 파일 업로드 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

let upload = null;
if (multer) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.pdf';
            cb(null, uniqueName);
        }
    });
    upload = multer({ 
        storage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
            }
        }
    });
}

// ============================================================
// 영구 저장 기능 (JSON 파일)
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
const KESG_CRITERIA_FILE = path.join(DATA_DIR, 'kesg-criteria.json');
const ASSESSMENT_RESULTS_FILE = path.join(DATA_DIR, 'assessment-results.json');
const MONTHLY_BILL_FILE = path.join(DATA_DIR, 'monthly-bill-data.json');

// data 폴더 생성
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 data 폴더 생성됨');
}

// K-ESG 기준 저장
function saveKesgCriteria() {
    try {
        fs.writeFileSync(KESG_CRITERIA_FILE, JSON.stringify(kesgCriteria, null, 2), 'utf-8');
        console.log('💾 K-ESG 기준 저장됨:', KESG_CRITERIA_FILE);
    } catch (error) {
        console.error('K-ESG 기준 저장 오류:', error);
    }
}

// K-ESG 기준 로드
function loadKesgCriteria() {
    try {
        if (fs.existsSync(KESG_CRITERIA_FILE)) {
            const data = fs.readFileSync(KESG_CRITERIA_FILE, 'utf-8');
            const loaded = JSON.parse(data);
            console.log('📂 K-ESG 기준 로드됨:', loaded.version);
            return loaded;
        }
    } catch (error) {
        console.error('K-ESG 기준 로드 오류:', error);
    }
    return null;
}

// Assessment 결과 저장
function saveAssessmentResults() {
    try {
        fs.writeFileSync(ASSESSMENT_RESULTS_FILE, JSON.stringify(assessmentResults, null, 2), 'utf-8');
        console.log('💾 Assessment 결과 저장됨');
    } catch (error) {
        console.error('Assessment 결과 저장 오류:', error);
    }
}

// Assessment 결과 로드
function loadAssessmentResults() {
    try {
        if (fs.existsSync(ASSESSMENT_RESULTS_FILE)) {
            const data = fs.readFileSync(ASSESSMENT_RESULTS_FILE, 'utf-8');
            const loaded = JSON.parse(data);
            if (loaded.companyInfo) {
                console.log('📂 Assessment 결과 로드됨:', loaded.companyInfo.name);
                return loaded;
            }
        }
    } catch (error) {
        console.error('Assessment 결과 로드 오류:', error);
    }
    return null;
}

// 월별 고지서 데이터 저장
function saveMonthlyBillData(data) {
    try {
        fs.writeFileSync(MONTHLY_BILL_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('💾 월별 고지서 데이터 저장됨');
    } catch (error) {
        console.error('월별 고지서 데이터 저장 오류:', error);
    }
}

// 월별 고지서 데이터 로드
function loadMonthlyBillData() {
    try {
        if (fs.existsSync(MONTHLY_BILL_FILE)) {
            const data = fs.readFileSync(MONTHLY_BILL_FILE, 'utf-8');
            console.log('📂 월별 고지서 데이터 로드됨');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('월별 고지서 데이터 로드 오류:', error);
    }
    return null;
}

// K-ESG 기준 데이터 저장소 (샘플 데이터 포함)
let kesgCriteria = {
    version: 'K-ESG 가이드라인 v1.0 (샘플)',
    lastUpdated: new Date().toISOString(),
    criteria: {
        E: [
            { code: 'E-1-1', name: '환경경영 목표 수립', category: '환경경영', description: '환경경영 방침 및 목표 수립 여부' },
            { code: 'E-1-2', name: '환경경영 추진체계', category: '환경경영', description: '환경경영 전담조직 및 책임자 지정' },
            { code: 'E-2-1', name: '온실가스 배출량 관리', category: '기후변화', description: '온실가스 배출량 산정 및 관리' },
            { code: 'E-2-2', name: '온실가스 감축 목표', category: '기후변화', description: '온실가스 감축 목표 설정 및 이행' },
            { code: 'E-2-3', name: '에너지 사용량 관리', category: '기후변화', description: '에너지 사용량 모니터링 및 효율화' },
            { code: 'E-3-1', name: '재생에너지 사용', category: '친환경', description: '재생에너지 사용 비율 및 확대 계획' },
            { code: 'E-3-2', name: '폐기물 관리', category: '친환경', description: '폐기물 발생량 및 재활용률 관리' },
            { code: 'E-3-3', name: '용수 사용 관리', category: '친환경', description: '용수 사용량 절감 및 재이용' },
            { code: 'E-4-1', name: '환경법규 준수', category: '환경리스크', description: '환경 관련 법규 준수 여부' },
            { code: 'E-4-2', name: '환경 사고 대응', category: '환경리스크', description: '환경 사고 예방 및 대응 체계' }
        ],
        S: [
            { code: 'S-1-1', name: '인권정책 수립', category: '인권경영', description: '인권정책 및 인권영향평가 실시' },
            { code: 'S-1-2', name: '차별금지 정책', category: '인권경영', description: '고용 및 업무상 차별 금지' },
            { code: 'S-2-1', name: '안전보건 관리체계', category: '산업안전', description: '안전보건경영시스템 구축' },
            { code: 'S-2-2', name: '산업재해 예방', category: '산업안전', description: '산업재해 발생률 관리 및 예방' },
            { code: 'S-3-1', name: '공정거래 준수', category: '공정운영', description: '공정거래 관련 법규 준수' },
            { code: 'S-3-2', name: '협력사 ESG 관리', category: '공정운영', description: '협력사 ESG 리스크 평가 및 지원' },
            { code: 'S-4-1', name: '고객정보 보호', category: '고객보호', description: '개인정보보호 정책 및 관리' },
            { code: 'S-4-2', name: '제품/서비스 안전', category: '고객보호', description: '제품 및 서비스 안전성 관리' },
            { code: 'S-5-1', name: '지역사회 공헌', category: '사회공헌', description: '지역사회 발전 기여 활동' },
            { code: 'S-5-2', name: '사회공헌 프로그램', category: '사회공헌', description: '사회공헌 투자 및 프로그램 운영' }
        ],
        G: [
            { code: 'G-1-1', name: '이사회 구성', category: '이사회', description: '이사회 독립성 및 전문성' },
            { code: 'G-1-2', name: '이사회 운영', category: '이사회', description: '이사회 개최 및 참석률' },
            { code: 'G-1-3', name: 'ESG 위원회', category: '이사회', description: 'ESG 전담 위원회 설치' },
            { code: 'G-2-1', name: '윤리경영 체계', category: '윤리경영', description: '윤리강령 및 행동규범 수립' },
            { code: 'G-2-2', name: '반부패 정책', category: '윤리경영', description: '부패방지 정책 및 교육' },
            { code: 'G-2-3', name: '내부고발 제도', category: '윤리경영', description: '내부고발자 보호 및 제보채널 운영' },
            { code: 'G-3-1', name: '감사기구 운영', category: '감사', description: '감사위원회 또는 감사 운영' },
            { code: 'G-3-2', name: '내부통제 시스템', category: '감사', description: '내부통제 및 위험관리 체계' },
            { code: 'G-4-1', name: 'ESG 정보공개', category: '정보공시', description: 'ESG 관련 정보 공시' },
            { code: 'G-4-2', name: '이해관계자 소통', category: '정보공시', description: '이해관계자 의견수렴 및 소통' }
        ]
    }
};

// Assessment 결과 저장소
let assessmentResults = {
    companyInfo: null,
    scores: null,
    totalScore: null,
    grade: null,
    evaluationDetails: null,
    aiReport: null,
    savedAt: null
};

// 업로드 이력 저장소
let uploadHistory = [];
let lastPdfText = ''; // 마지막 업로드된 PDF 전체 텍스트

// ★★★ 서버 시작 시 저장된 데이터 로드 ★★★
const loadedKesg = loadKesgCriteria();
if (loadedKesg) {
    kesgCriteria = loadedKesg;
    console.log('✅ 저장된 K-ESG 기준 복원됨');
}

const loadedAssessment = loadAssessmentResults();
if (loadedAssessment) {
    assessmentResults = loadedAssessment;
    console.log('✅ 저장된 Assessment 결과 복원됨');
}

// 월별 고지서 데이터 저장소
let monthlyBillData = loadMonthlyBillData() || {
    2024: { electricity: Array(12).fill(null), water: Array(12).fill(null), gas: Array(12).fill(null), waste: Array(12).fill(null), employees: Array(12).fill(null) },
    2025: { electricity: Array(12).fill(null), water: Array(12).fill(null), gas: Array(12).fill(null), waste: Array(12).fill(null), employees: Array(12).fill(null) }
};

// 1. PDF 업로드 및 텍스트 추출
app.post('/api/admin/pdf/upload', (req, res, next) => {
    // multer 미설치 체크
    if (!upload) {
        return res.status(500).json({ 
            success: false,
            error: 'multer가 설치되지 않았습니다.',
            hint: 'npm install multer pdf-parse 실행 후 서버를 재시작하세요.'
        });
    }
    // multer 미들웨어 실행
    upload.single('pdf')(req, res, next);
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'PDF 파일이 필요합니다.',
                hint: 'FormData에 "pdf" 필드로 파일을 전송하세요.'
            });
        }

        const filePath = req.file.path;
        // 한글 파일명 인코딩 수정
        let fileName = req.file.originalname;
        try {
            fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        } catch (e) {
            console.log('파일명 인코딩 변환 실패, 원본 사용:', e.message);
        }

        // PDF 텍스트 추출
        if (!pdfParse) {
            return res.status(500).json({ 
                success: false,
                error: 'pdf-parse가 설치되지 않았습니다.'
            });
        }

        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        // 전체 텍스트 저장 (AI 파싱용)
        lastPdfText = pdfData.text;
        console.log('PDF 텍스트 추출 완료. 총 길이:', pdfData.text.length, '글자');

        // 업로드 정보 저장
        const uploadInfo = {
            id: generateId(),
            fileName,
            filePath,
            uploadDate: new Date().toISOString(),
            pageCount: pdfData.numpages,
            textLength: pdfData.text.length,
            versionName: req.body.versionName || 'K-ESG 가이드라인',
            notes: req.body.notes || '',
            status: 'uploaded'
        };

        // 이력에 추가
        uploadHistory.unshift(uploadInfo);

        res.json({
            success: true,
            message: 'PDF 업로드 및 텍스트 추출 완료',
            upload: uploadInfo,
            preview: pdfData.text.substring(0, 500) + '...',
            fullText: pdfData.text,
            fullTextLength: pdfData.text.length
        });

    } catch (error) {
        console.error('PDF 업로드 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// SSE 방식 AI 파싱 (실시간 진행 상황 전송)
let sseClients = new Map(); // SSE 클라이언트 저장

app.post('/api/admin/pdf/parse-init', (req, res) => {
    // PDF 텍스트를 임시 저장
    const { pdfText, versionName } = req.body;
    lastPdfText = pdfText;
    res.json({ success: true, message: '파싱 준비 완료' });
});

app.get('/api/admin/pdf/parse-stream', async (req, res) => {
    const { versionName } = req.query;
    
    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    try {
        const textToAnalyze = lastPdfText;
        
        if (!textToAnalyze) {
            sendEvent({ type: 'error', error: 'PDF 텍스트가 없습니다.' });
            return res.end();
        }
        
        if (!CLAUDE_API_KEY) {
            // 시뮬레이션 모드
            const simCriteria = generateSimulatedCriteria();
            sendEvent({ type: 'progress', current: 1, total: 1, status: '시뮬레이션 완료' });
            sendEvent({ 
                type: 'complete', 
                result: {
                    success: true,
                    simulated: true,
                    criteria: simCriteria,
                    stats: { E: simCriteria.E.length, S: simCriteria.S.length, G: simCriteria.G.length, total: simCriteria.E.length + simCriteria.S.length + simCriteria.G.length }
                }
            });
            return res.end();
        }
        
        // 텍스트를 청크로 분할
        const CHUNK_SIZE = 40000;
        const chunks = [];
        for (let i = 0; i < textToAnalyze.length; i += CHUNK_SIZE) {
            chunks.push(textToAnalyze.substring(i, i + CHUNK_SIZE));
        }
        
        sendEvent({ type: 'progress', current: 0, total: chunks.length, status: '분석 시작...' });
        
        const allCriteria = { E: [], S: [], G: [] };
        const seenCodes = new Set();
        
        for (let i = 0; i < chunks.length; i++) {
            sendEvent({ type: 'progress', current: i + 1, total: chunks.length, status: `청크 ${i + 1}/${chunks.length} 분석 중...` });
            
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 8192,
                        messages: [{
                            role: 'user',
                            content: `K-ESG 가이드라인 PDF에서 ESG 평가 항목을 추출해주세요. (청크 ${i + 1}/${chunks.length})

## 반드시 지켜야 할 규칙:
1. 순수 JSON만 출력하세요. 마크다운 코드블록(\`\`\`) 사용 금지!
2. { 로 시작해서 } 로 끝나야 합니다
3. 항목이 없으면 빈 배열 반환: {"E":[],"S":[],"G":[]}

## K-ESG 진단항목 분류 기준:

### E (환경) - 다음 키워드가 포함된 항목:
- 환경경영, 환경 목표, 환경 추진체계, 환경 리스크
- 온실가스, 탄소배출, 에너지, 재생에너지
- 용수, 폐기물, 오염물질, 환경법규
- 친환경, 녹색, 기후변화

### S (사회) - 다음 키워드가 포함된 항목:
- 고용, 채용, 이직, 다양성, 청년인턴
- 육아휴직, 산업재해, 안전보건
- 제품안전, 소비자, 개인정보, 정보보호
- 협력사, 공정거래, 하도급
- 지역사회, 사회공헌, 인권

### G (지배구조) - 다음 키워드가 포함된 항목:
- 이사회, 사외이사, 대표이사
- 주주권리, 배당, 의결권
- 윤리경영, 윤리강령, 부패방지
- 감사, 내부통제, 공시

## 출력 형식:
{"E":[{"id":"E1","code":"항목코드","name":"항목명","category":"세부분류","weight":10,"method":"qualitative","description":"설명"}],"S":[...],"G":[...]}

## 텍스트:
${chunks[i]}`
                        }]
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const aiResponse = data.content[0].text.trim();
                    console.log(`청크 ${i + 1} AI 응답 길이:`, aiResponse.length);
                    console.log(`청크 ${i + 1} AI 응답 시작:`, aiResponse.substring(0, 300));
                    
                    let cleanedResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                    
                    try {
                        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const chunkCriteria = JSON.parse(jsonMatch[0]);
                            console.log(`청크 ${i + 1} 파싱 결과: E=${chunkCriteria.E?.length || 0}, S=${chunkCriteria.S?.length || 0}, G=${chunkCriteria.G?.length || 0}`);
                            
                            ['E', 'S', 'G'].forEach(type => {
                                if (chunkCriteria[type] && Array.isArray(chunkCriteria[type])) {
                                    chunkCriteria[type].forEach(item => {
                                        const code = item.code || item.name || item.id;
                                        if (code && !seenCodes.has(code)) {
                                            seenCodes.add(code);
                                            item.id = type + (allCriteria[type].length + 1);
                                            allCriteria[type].push(item);
                                        }
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        console.error(`청크 ${i + 1} 파싱 오류:`, e.message);
                    }
                }
                
                // API 호출 간 딜레이
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (chunkError) {
                console.error(`청크 ${i + 1} 오류:`, chunkError.message);
            }
        }
        
        const totalItems = allCriteria.E.length + allCriteria.S.length + allCriteria.G.length;
        
        // ★★★ 전역 kesgCriteria에 저장 ★★★
        kesgCriteria = {
            version: 'K-ESG 가이드라인 (AI 추출)',
            lastUpdated: new Date().toISOString(),
            criteria: allCriteria
        };
        console.log('kesgCriteria 저장 완료 (SSE)');
        saveKesgCriteria();  // 파일에 영구 저장
        
        // 업로드 이력 업데이트
        if (uploadHistory.length > 0) {
            uploadHistory[0].status = 'parsed';
            uploadHistory[0].criteriaCount = totalItems;
        }
        
        sendEvent({
            type: 'complete',
            result: {
                success: true,
                message: `AI 파싱 완료 (${chunks.length}개 청크)`,
                criteria: allCriteria,
                stats: { E: allCriteria.E.length, S: allCriteria.S.length, G: allCriteria.G.length, total: totalItems }
            }
        });
        
    } catch (error) {
        console.error('SSE 파싱 오류:', error);
        sendEvent({ type: 'error', error: error.message });
    }
    
    res.end();
});

// 2. Claude API로 K-ESG 기준 추출 (청크 분할 방식)
app.post('/api/admin/pdf/parse-with-ai', async (req, res) => {
    try {
        const { pdfText, versionName } = req.body;

        // pdfText가 없으면 마지막 업로드된 텍스트 사용
        const textToAnalyze = pdfText || lastPdfText;

        if (!textToAnalyze) {
            return res.status(400).json({ error: 'PDF 텍스트가 필요합니다. 먼저 PDF를 업로드하세요.' });
        }

        // Claude API 키 확인
        if (!CLAUDE_API_KEY) {
            // API 키가 없으면 시뮬레이션 결과 반환
            const simCriteria = generateSimulatedCriteria();
            return res.json({
                success: true,
                message: 'AI 파싱 시뮬레이션 (API 키 설정 필요)',
                simulated: true,
                criteria: simCriteria,
                stats: {
                    E: simCriteria.E.length,
                    S: simCriteria.S.length,
                    G: simCriteria.G.length,
                    total: simCriteria.E.length + simCriteria.S.length + simCriteria.G.length
                }
            });
        }

        console.log('Claude API 호출 중... 전체 텍스트 길이:', textToAnalyze.length);

        // 텍스트를 청크로 분할 (각 40,000자)
        const CHUNK_SIZE = 40000;
        const chunks = [];
        for (let i = 0; i < textToAnalyze.length; i += CHUNK_SIZE) {
            chunks.push(textToAnalyze.substring(i, i + CHUNK_SIZE));
        }
        console.log(`텍스트를 ${chunks.length}개 청크로 분할`);

        // 모든 청크에서 추출한 기준을 저장
        const allCriteria = { E: [], S: [], G: [] };
        const seenCodes = new Set(); // 중복 방지

        // 각 청크를 순차적으로 처리 (재시도 로직 포함)
        for (let i = 0; i < chunks.length; i++) {
            console.log(`청크 ${i + 1}/${chunks.length} 처리 중... (${chunks[i].length}자)`);
            
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;
            
            while (!success && retryCount < maxRetries) {
                try {
                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: 'claude-sonnet-4-20250514',
                            max_tokens: 8192,
                            messages: [{
                                role: 'user',
                                content: `당신은 K-ESG 가이드라인 분석 전문가입니다.

아래는 K-ESG 가이드라인 PDF의 일부입니다 (청크 ${i + 1}/${chunks.length}).
이 텍스트에서 ESG 평가 항목들을 추출해서 JSON으로 반환해주세요.

## 매우 중요한 규칙:
1. 반드시 순수한 JSON만 출력하세요 (마크다운 코드 블록 사용 금지)
2. 이 청크에 있는 평가 항목만 추출하세요
3. { 로 시작해서 } 로 끝나야 합니다

## 출력 형식:
{"E":[{"id":"E1","code":"E-1-1","name":"항목명","category":"환경경영","weight":10,"method":"qualitative","description":"설명"}],"S":[...],"G":[...]}

## 카테고리:
- E(환경): 환경경영목표, 환경경영추진, 환경성과, 이해관계자, 온실가스, 에너지, 용수, 폐기물, 오염물질
- S(사회): 근로자, 협력사, 지역사회, 소비자, 인권, 안전보건, 정보보호
- G(지배구조): 이사회, 주주, 윤리경영, 감사, 공시

평가 항목이 없으면 {"E":[],"S":[],"G":[]}를 반환하세요.

## PDF 텍스트 (청크 ${i + 1}):
${chunks[i]}`
                            }]
                        })
                    });

                    if (response.status === 429) {
                        // Rate limit - 재시도
                        retryCount++;
                        const waitTime = Math.pow(2, retryCount) * 5000; // 10초, 20초, 40초
                        console.log(`청크 ${i + 1} Rate limit (429). ${waitTime/1000}초 후 재시도... (${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    if (!response.ok) {
                        console.error(`청크 ${i + 1} API 오류:`, response.status);
                        break; // 다른 오류는 재시도 안 함
                    }

                    const data = await response.json();
                    const aiResponse = data.content[0].text.trim();
                    
                    // JSON 파싱
                    let chunkCriteria;
                    let cleanedResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                    
                    try {
                        // { 부터 } 까지 추출
                        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            chunkCriteria = JSON.parse(jsonMatch[0]);
                        }
                    } catch (parseError) {
                        console.error(`청크 ${i + 1} JSON 파싱 실패:`, parseError.message);
                    }

                    // 결과 병합 (중복 제거)
                    if (chunkCriteria) {
                        ['E', 'S', 'G'].forEach(type => {
                            if (chunkCriteria[type] && Array.isArray(chunkCriteria[type])) {
                                chunkCriteria[type].forEach(item => {
                                    const code = item.code || item.name || item.id;
                                    if (code && !seenCodes.has(code)) {
                                        seenCodes.add(code);
                                        // ID 재할당
                                        item.id = type + (allCriteria[type].length + 1);
                                        allCriteria[type].push(item);
                                    }
                                });
                            }
                        });
                    }

                    console.log(`청크 ${i + 1} 완료. 현재까지: E=${allCriteria.E.length}, S=${allCriteria.S.length}, G=${allCriteria.G.length}`);
                    success = true;

                } catch (chunkError) {
                    console.error(`청크 ${i + 1} 처리 오류:`, chunkError.message);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        const waitTime = Math.pow(2, retryCount) * 5000;
                        console.log(`${waitTime/1000}초 후 재시도...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
            }
            
            // API 호출 간 딜레이 (rate limit 방지) - 5초로 증가
            if (i < chunks.length - 1) {
                console.log('다음 청크 처리 전 5초 대기...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        const totalItems = allCriteria.E.length + allCriteria.S.length + allCriteria.G.length;
        console.log(`전체 추출 완료: E=${allCriteria.E.length}, S=${allCriteria.S.length}, G=${allCriteria.G.length}, 총 ${totalItems}개`);

        // ★★★ 전역 kesgCriteria에 저장 ★★★
        kesgCriteria = {
            version: versionName || 'K-ESG 가이드라인 (AI 추출)',
            lastUpdated: new Date().toISOString(),
            criteria: allCriteria
        };
        console.log('kesgCriteria 저장 완료');
        saveKesgCriteria();  // 파일에 영구 저장

        // 업로드 이력 업데이트
        if (uploadHistory.length > 0) {
            uploadHistory[0].status = 'parsed';
            uploadHistory[0].criteriaCount = totalItems;
        }

        res.json({
            success: true,
            message: `AI 파싱 완료 (${chunks.length}개 청크 분석)`,
            criteria: allCriteria,
            stats: {
                E: allCriteria.E.length,
                S: allCriteria.S.length,
                G: allCriteria.G.length,
                total: totalItems
            },
            chunksProcessed: chunks.length
        });

    } catch (error) {
        console.error('AI 파싱 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. OpenAI API로 K-ESG 기준 추출 (대안)
app.post('/api/admin/pdf/parse-with-openai', async (req, res) => {
    try {
        const { pdfText, versionName } = req.body;

        if (!OPENAI_API_KEY) {
            return res.status(400).json({ 
                error: 'OpenAI API 키가 설정되지 않았습니다.',
                hint: '환경변수 OPENAI_API_KEY를 설정하세요.'
            });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'system',
                    content: 'K-ESG 가이드라인에서 평가 항목을 추출하는 전문가입니다. JSON 형식으로만 응답합니다.'
                }, {
                    role: 'user',
                    content: `다음 K-ESG 문서에서 평가 항목을 추출하세요. JSON으로 응답:
{"E": [...], "S": [...], "G": [...]}

각 항목: {"id", "code", "name", "category", "weight", "method", "description", "standard"}

텍스트:
${pdfText.substring(0, 15000)}`
                }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API 오류: ${response.status}`);
        }

        const data = await response.json();
        const criteria = JSON.parse(data.choices[0].message.content);

        kesgCriteria = {
            version: versionName || 'K-ESG 가이드라인',
            lastUpdated: new Date().toISOString(),
            criteria
        };
        
        saveKesgCriteria();  // 파일에 영구 저장

        res.json({
            success: true,
            message: 'OpenAI 파싱 완료',
            criteria,
            stats: {
                E: criteria.E?.length || 0,
                S: criteria.S?.length || 0,
                G: criteria.G?.length || 0
            }
        });

    } catch (error) {
        console.error('OpenAI 파싱 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. 현재 K-ESG 기준 조회
app.get('/api/admin/criteria', (req, res) => {
    res.json(kesgCriteria);
});

// 5. 업로드 이력 조회
app.get('/api/admin/uploads', (req, res) => {
    res.json({
        success: true,
        uploads: uploadHistory
    });
});

// 6. K-ESG 기준 수동 업데이트
app.put('/api/admin/criteria', (req, res) => {
    const { version, criteria } = req.body;
    
    if (criteria) {
        kesgCriteria = {
            version: version || kesgCriteria.version,
            lastUpdated: new Date().toISOString(),
            criteria
        };
        
        saveKesgCriteria();  // 파일에 영구 저장
    }

    res.json({ success: true, message: '기준이 업데이트되었습니다.', data: kesgCriteria });
});

// 6. 기준 내보내기 (JSON)
app.get('/api/admin/criteria/export', (req, res) => {
    res.setHeader('Content-Disposition', `attachment; filename=k-esg-criteria-${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(kesgCriteria);
});

// 시뮬레이션용 K-ESG 기준 생성
function generateSimulatedCriteria() {
    return {
        E: [
            { id: 'E1', code: 'E-1-1', name: '환경경영 목표 수립', category: '환경경영', weight: 10, method: 'qualitative', description: '환경경영 목표 및 추진계획 수립 여부', standard: '목표 수립: 5점, 추진계획: 5점' },
            { id: 'E2', code: 'E-1-2', name: '환경경영 추진체계', category: '환경경영', weight: 10, method: 'qualitative', description: '환경경영 담당조직 및 책임자 지정', standard: '전담조직: 10점, 담당자: 5점' },
            { id: 'E3', code: 'E-2-1', name: '온실가스 배출량 관리', category: '환경성과', weight: 15, method: 'quantitative', description: 'Scope 1, 2 배출량 측정', standard: 'Scope1,2 측정: 10점, 감축목표: 5점' },
            { id: 'E4', code: 'E-2-2', name: '에너지 사용량 관리', category: '환경성과', weight: 10, method: 'quantitative', description: '에너지 사용량 및 효율', standard: '사용량 측정: 5점, 효율개선: 5점' },
            { id: 'E5', code: 'E-2-3', name: '폐기물 관리', category: '환경성과', weight: 10, method: 'quantitative', description: '폐기물 발생량 및 재활용률', standard: '발생량 관리: 5점, 재활용: 5점' }
        ],
        S: [
            { id: 'S1', code: 'S-1-1', name: '인권정책 수립', category: '근로자', weight: 10, method: 'qualitative', description: '인권정책 수립 및 실행', standard: '정책 수립: 5점, 실행: 5점' },
            { id: 'S2', code: 'S-1-2', name: '산업안전 관리체계', category: '근로자', weight: 15, method: 'qualitative', description: '산업안전보건 관리체계', standard: 'ISO 45001: 15점, 자체체계: 10점' },
            { id: 'S3', code: 'S-2-1', name: '협력사 ESG 평가', category: '협력사', weight: 10, method: 'qualitative', description: '협력사 ESG 평가 체계', standard: '평가체계 운영: 10점' },
            { id: 'S4', code: 'S-3-1', name: '지역사회 공헌', category: '지역사회', weight: 10, method: 'qualitative', description: '지역사회 공헌 활동', standard: '활동 실적 평가' },
            { id: 'S5', code: 'S-4-1', name: '고객정보 보호', category: '소비자', weight: 10, method: 'qualitative', description: '개인정보 보호 체계', standard: 'ISO 27001: 10점, 자체: 5점' }
        ],
        G: [
            { id: 'G1', code: 'G-1-1', name: '이사회 구성', category: '이사회', weight: 10, method: 'qualitative', description: '이사회 구성의 다양성', standard: '사외이사 비율, 다양성' },
            { id: 'G2', code: 'G-1-2', name: '이사회 운영', category: '이사회', weight: 10, method: 'quantitative', description: '이사회 활동 및 참석률', standard: '개최횟수, 참석률' },
            { id: 'G3', code: 'G-2-1', name: '주주권리 보호', category: '주주권리', weight: 10, method: 'qualitative', description: '주주권리 보호 정책', standard: '전자투표, 배당정책' },
            { id: 'G4', code: 'G-3-1', name: '윤리강령', category: '윤리경영', weight: 10, method: 'qualitative', description: '윤리경영 체계 구축', standard: '윤리강령: 5점, 교육: 5점' },
            { id: 'G5', code: 'G-3-2', name: '내부고발제도', category: '윤리경영', weight: 10, method: 'qualitative', description: '내부고발자 보호제도', standard: '제도 운영: 5점, 보호: 5점' }
        ]
    };
}

// ============================================
// AI 리포트 생성 API
// ============================================

app.post('/api/assessment/report', async (req, res) => {
    try {
        const { companyInfo, scores, totalScore, evaluationDetails } = req.body;
        
        if (!companyInfo || !scores) {
            return res.status(400).json({ error: '평가 데이터가 필요합니다.' });
        }
        
        // Claude API 키가 없으면 시뮬레이션
        if (!CLAUDE_API_KEY) {
            const simulatedReport = generateSimulatedReport(companyInfo, scores, totalScore, evaluationDetails);
            return res.json({
                success: true,
                report: simulatedReport,
                simulated: true
            });
        }
        
        // 낮은 점수 항목 추출
        const weakPoints = { E: [], S: [], G: [] };
        const strongPoints = { E: [], S: [], G: [] };
        
        ['E', 'S', 'G'].forEach(cat => {
            if (evaluationDetails[cat]) {
                evaluationDetails[cat].forEach(item => {
                    if (item.score <= 2) {
                        weakPoints[cat].push(`${item.code}: ${item.name} (${item.score}점)`);
                    } else if (item.score >= 4) {
                        strongPoints[cat].push(`${item.code}: ${item.name} (${item.score}점)`);
                    }
                });
            }
        });
        
        const prompt = `당신은 K-ESG 전문 컨설턴트입니다. 아래 기업의 ESG 자가진단 결과를 분석하고 맞춤형 개선 방안을 제시해주세요.

## 기업 정보
- 회사명: ${companyInfo.name}
- 업종: ${companyInfo.industry || '미입력'}
- 직원 수: ${companyInfo.employees || '미입력'}

## 진단 결과
- 종합 점수: ${totalScore}점
- 환경(E): ${scores.E}점
- 사회(S): ${scores.S}점
- 지배구조(G): ${scores.G}점

## 취약 항목 (개선 필요)
- 환경(E): ${weakPoints.E.length > 0 ? weakPoints.E.join(', ') : '없음'}
- 사회(S): ${weakPoints.S.length > 0 ? weakPoints.S.join(', ') : '없음'}
- 지배구조(G): ${weakPoints.G.length > 0 ? weakPoints.G.join(', ') : '없음'}

## 우수 항목
- 환경(E): ${strongPoints.E.length > 0 ? strongPoints.E.join(', ') : '없음'}
- 사회(S): ${strongPoints.S.length > 0 ? strongPoints.S.join(', ') : '없음'}
- 지배구조(G): ${strongPoints.G.length > 0 ? strongPoints.G.join(', ') : '없음'}

## 요청사항
1. 전체적인 ESG 수준 평가 (2-3문장)
2. 각 영역별 분석 (E, S, G 각각)
3. 우선 개선이 필요한 항목 3가지와 구체적 개선 방안
4. 중장기 ESG 전략 제언

한국어로 작성하고, 구체적이고 실행 가능한 조언을 제공해주세요.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Claude API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        const report = data.content[0].text;
        
        res.json({
            success: true,
            report: report
        });
        
    } catch (error) {
        console.error('리포트 생성 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 시뮬레이션 리포트 생성
function generateSimulatedReport(companyInfo, scores, totalScore, evaluationDetails) {
    let grade;
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B+';
    else if (totalScore >= 60) grade = 'B';
    else if (totalScore >= 50) grade = 'C';
    else grade = 'D';
    
    return `# ${companyInfo.name} K-ESG 진단 리포트

## 1. 종합 평가

${companyInfo.name}의 ESG 종합 점수는 **${totalScore}점**으로, **${grade} 등급**에 해당합니다. ${
    totalScore >= 70 
        ? '전반적으로 양호한 ESG 경영 수준을 보이고 있으며, 몇 가지 개선점을 보완하면 선도 기업 수준으로 도약할 수 있습니다.'
        : 'ESG 경영 체계 구축이 필요한 단계입니다. 아래 개선 방안을 참고하여 단계적으로 ESG 역량을 강화하시기 바랍니다.'
}

## 2. 영역별 분석

### 환경 (E) - ${scores.E}점
${scores.E >= 70 
    ? '환경 경영 체계가 비교적 잘 구축되어 있습니다. 온실가스 감축 목표 설정 및 에너지 효율화 활동을 지속하시기 바랍니다.'
    : '환경 경영 체계 구축이 필요합니다. 환경 목표 설정, 폐기물 관리, 에너지 절감 활동부터 시작하시길 권장합니다.'}

### 사회 (S) - ${scores.S}점
${scores.S >= 70
    ? '사회적 책임 경영이 양호한 수준입니다. 협력사 ESG 관리와 지역사회 공헌 활동을 더욱 강화하시기 바랍니다.'
    : '근로자 안전보건, 다양성 존중, 협력사 상생 협력 등 사회적 가치 창출 활동을 확대할 필요가 있습니다.'}

### 지배구조 (G) - ${scores.G}점
${scores.G >= 70
    ? '지배구조가 비교적 투명하게 운영되고 있습니다. ESG 위원회 설치와 정기적인 정보 공시를 통해 더욱 개선할 수 있습니다.'
    : '이사회 다양성, 윤리경영 체계, ESG 정보 공시 등 지배구조 개선이 필요합니다.'}

## 3. 우선 개선 필요 항목

1. **환경경영 목표 수립**: 정량적인 환경 목표(온실가스 감축률, 에너지 효율 등)를 설정하고 이행 계획을 수립하세요.
2. **협력사 ESG 평가 체계**: 주요 협력사에 대한 ESG 평가 기준을 마련하고 정기적으로 점검하세요.
3. **ESG 정보 공시**: 지속가능경영보고서 또는 ESG 보고서를 발간하여 이해관계자와 소통하세요.

## 4. 중장기 ESG 전략 제언

- **1단계 (1년 내)**: ESG 전담 조직 구성 및 중요성 평가(Materiality Assessment) 실시
- **2단계 (2년 내)**: 영역별 개선 과제 이행 및 성과 측정 체계 구축
- **3단계 (3년 내)**: ESG 정보 공시 확대 및 외부 인증 획득

---
*본 리포트는 K-ESG 가이드라인 기반 자가진단 결과를 바탕으로 생성되었습니다.*
*정확한 ESG 등급 평가를 위해서는 전문 평가기관의 진단을 받으시기 바랍니다.*
`;
}

// ============================================
// PDF 리포트 생성 API
// ============================================

app.post('/api/assessment/pdf', async (req, res) => {
    try {
        const { companyInfo, scores, totalScore, aiReport } = req.body;
        
        if (!companyInfo || !scores) {
            return res.status(400).json({ error: '데이터가 필요합니다.' });
        }

        // 등급 계산
        let grade, gradeDesc;
        if (totalScore >= 90) { grade = 'A+'; gradeDesc = '최우수'; }
        else if (totalScore >= 80) { grade = 'A'; gradeDesc = '우수'; }
        else if (totalScore >= 70) { grade = 'B+'; gradeDesc = '양호'; }
        else if (totalScore >= 60) { grade = 'B'; gradeDesc = '보통'; }
        else if (totalScore >= 50) { grade = 'C'; gradeDesc = '미흡'; }
        else { grade = 'D'; gradeDesc = '취약'; }

        // AI 리포트 텍스트 정리
        let cleanAiReport = '';
        if (aiReport) {
            cleanAiReport = aiReport
                .replace(/^# /gm, '\n★ ')
                .replace(/^## /gm, '\n▶ ')
                .replace(/^### /gm, '\n• ')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '');
        }

        // 텍스트 기반 PDF 내용 생성
        const today = new Date().toLocaleDateString('ko-KR');
        
        let pdfText = `
════════════════════════════════════════════════════════════
                K-ESG 자가진단 결과 리포트
                      ESG Insight
════════════════════════════════════════════════════════════

[기업 정보]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  기업명: ${companyInfo.name}
  업  종: ${companyInfo.industry || '미입력'}
  직원수: ${companyInfo.employees || '미입력'}
  진단일: ${today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[종합 평가]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           종합 점수: ${totalScore}점 / 100점
           종합 등급: ${grade} (${gradeDesc})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[영역별 점수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌱 환경 (E):     ${scores.E}점  ${'█'.repeat(Math.floor(scores.E/5))}${'░'.repeat(20-Math.floor(scores.E/5))}
  👥 사회 (S):     ${scores.S}점  ${'█'.repeat(Math.floor(scores.S/5))}${'░'.repeat(20-Math.floor(scores.S/5))}
  🏛 지배구조 (G): ${scores.G}점  ${'█'.repeat(Math.floor(scores.G/5))}${'░'.repeat(20-Math.floor(scores.G/5))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        if (cleanAiReport) {
            pdfText += `

[AI 분석 리포트]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cleanAiReport}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }

        pdfText += `

════════════════════════════════════════════════════════════
  본 리포트는 K-ESG 가이드라인 기반 자가진단 결과입니다.
  정확한 ESG 등급 평가를 위해서는 전문 평가기관의 진단을 받으시기 바랍니다.
  
  © ${new Date().getFullYear()} ESG Insight. All rights reserved.
════════════════════════════════════════════════════════════
`;

        // UTF-8 텍스트 파일을 PDF처럼 제공 (실제로는 .txt지만 PDF로 변환 가능)
        // 실용적인 접근: HTML을 PDF로 변환하는 대신 잘 포맷된 텍스트 제공
        
        // 간단한 해결책: HTML 파일 생성 후 다운로드
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>K-ESG 진단 결과 - ${companyInfo.name}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #059669; }
        .subtitle { color: #888; margin-top: 5px; }
        .section { background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .section-title { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .info-table td { padding: 8px 0; }
        .info-label { color: #666; width: 80px; }
        .score-box { text-align: center; padding: 30px; background: linear-gradient(135deg, #ecfdf5, #e0f2fe); border-radius: 10px; margin-bottom: 20px; }
        .total-score { font-size: 60px; font-weight: bold; color: #059669; }
        .grade { font-size: 48px; font-weight: bold; color: #059669; margin-left: 40px; }
        .category-scores { display: flex; gap: 15px; margin-bottom: 20px; }
        .cat-box { flex: 1; text-align: center; padding: 20px; border-radius: 10px; }
        .cat-e { background: #f0fdf4; color: #16a34a; }
        .cat-s { background: #eff6ff; color: #2563eb; }
        .cat-g { background: #faf5ff; color: #9333ea; }
        .cat-score { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .ai-report { white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
        .print-btn:hover { background: #047857; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ PDF로 저장 (인쇄)</button>
    
    <div class="header">
        <div class="title">K-ESG 자가진단 결과 리포트</div>
        <div class="subtitle">ESG Insight</div>
    </div>

    <div class="section">
        <div class="section-title">📋 기업 정보</div>
        <table class="info-table">
            <tr><td class="info-label">기업명</td><td><strong>${companyInfo.name}</strong></td></tr>
            <tr><td class="info-label">업종</td><td>${companyInfo.industry || '미입력'}</td></tr>
            <tr><td class="info-label">직원 수</td><td>${companyInfo.employees || '미입력'}</td></tr>
            <tr><td class="info-label">진단일</td><td>${today}</td></tr>
        </table>
    </div>

    <div class="score-box">
        <div class="section-title" style="border: none; text-align: center;">🏆 종합 평가</div>
        <span class="total-score">${totalScore}점</span>
        <span class="grade">${grade}</span>
        <div style="color: #666; margin-top: 10px;">${gradeDesc}</div>
    </div>

    <div class="section-title">📊 영역별 점수</div>
    <div class="category-scores">
        <div class="cat-box cat-e">
            <div>🌱 환경 (E)</div>
            <div class="cat-score">${scores.E}점</div>
        </div>
        <div class="cat-box cat-s">
            <div>👥 사회 (S)</div>
            <div class="cat-score">${scores.S}점</div>
        </div>
        <div class="cat-box cat-g">
            <div>🏛️ 지배구조 (G)</div>
            <div class="cat-score">${scores.G}점</div>
        </div>
    </div>

    ${cleanAiReport ? `
    <div class="section">
        <div class="section-title">🤖 AI 분석 리포트</div>
        <div class="ai-report">${cleanAiReport}</div>
    </div>
    ` : ''}

    <div class="footer">
        <p>본 리포트는 K-ESG 가이드라인 기반 자가진단 결과입니다.</p>
        <p>정확한 ESG 등급 평가를 위해서는 전문 평가기관의 진단을 받으시기 바랍니다.</p>
        <p style="margin-top: 10px;">© ${new Date().getFullYear()} ESG Insight. All rights reserved.</p>
    </div>

    <script>
        // 자동으로 인쇄 다이얼로그 표시 (PDF 저장 가능)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>`;

        // HTML 파일로 응답 (브라우저에서 인쇄하여 PDF 저장)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="K-ESG_${encodeURIComponent(companyInfo.name)}_${new Date().toISOString().split('T')[0]}.html"`);
        res.send(htmlContent);

    } catch (error) {
        console.error('PDF 생성 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Assessment 결과 저장/조회 API
// ============================================

// 결과 저장
app.post('/api/assessment/save', (req, res) => {
    try {
        const { companyInfo, scores, totalScore, evaluationDetails, aiReport } = req.body;
        
        if (!companyInfo || !scores) {
            return res.status(400).json({ error: '필수 데이터가 없습니다.' });
        }

        // 등급 계산
        let grade;
        if (totalScore >= 90) grade = 'A+';
        else if (totalScore >= 80) grade = 'A';
        else if (totalScore >= 70) grade = 'B+';
        else if (totalScore >= 60) grade = 'B';
        else if (totalScore >= 50) grade = 'C';
        else grade = 'D';

        assessmentResults = {
            companyInfo,
            scores,
            totalScore,
            grade,
            evaluationDetails: evaluationDetails || null,
            aiReport: aiReport || null,
            savedAt: new Date().toISOString()
        };
        
        saveAssessmentResults();  // 파일에 영구 저장

        console.log('Assessment 결과 저장 완료:', companyInfo.name);
        
        res.json({ 
            success: true, 
            message: '결과가 저장되었습니다.',
            savedAt: assessmentResults.savedAt
        });
    } catch (error) {
        console.error('Assessment 저장 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 결과 조회
app.get('/api/assessment/results', (req, res) => {
    try {
        if (!assessmentResults.companyInfo) {
            return res.json({ 
                success: false, 
                message: '저장된 평가 결과가 없습니다.',
                data: null
            });
        }

        res.json({
            success: true,
            data: assessmentResults
        });
    } catch (error) {
        console.error('Assessment 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard용 통합 데이터 API (K-ESG 기준 + Assessment 결과)
app.get('/api/dashboard/data', (req, res) => {
    try {
        const hasCriteria = kesgCriteria.criteria.E.length > 0 || 
                          kesgCriteria.criteria.S.length > 0 || 
                          kesgCriteria.criteria.G.length > 0;

        res.json({
            success: true,
            kesgCriteria: hasCriteria ? kesgCriteria : null,
            assessmentResults: assessmentResults.companyInfo ? assessmentResults : null,
            summary: {
                hasCriteria,
                hasAssessment: !!assessmentResults.companyInfo,
                criteriaCount: {
                    E: kesgCriteria.criteria.E.length,
                    S: kesgCriteria.criteria.S.length,
                    G: kesgCriteria.criteria.G.length
                }
            }
        });
    } catch (error) {
        console.error('Dashboard 데이터 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dashboard PDF 데이터 추출 API
app.post('/api/dashboard/pdf/extract', (req, res, next) => {
    if (!upload) {
        return res.status(500).json({ 
            success: false,
            error: 'multer가 설치되지 않았습니다. npm install multer pdf-parse 실행 후 재시작하세요.'
        });
    }
    upload.single('file')(req, res, next);
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'PDF 파일이 필요합니다.' });
        }

        let pdfText = '';
        
        // PDF 텍스트 추출
        if (pdfParse) {
            try {
                const pdfData = await pdfParse(req.file.buffer);
                pdfText = pdfData.text;
            } catch (e) {
                console.error('PDF 파싱 오류:', e);
            }
        }

        // Claude API로 데이터 추출 (API 키가 있는 경우)
        if (CLAUDE_API_KEY && pdfText.length > 100) {
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': CLAUDE_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 2000,
                        messages: [{
                            role: 'user',
                            content: `다음 ESG/지속가능경영 보고서에서 ESG 데이터를 추출해주세요. 반드시 아래 JSON 형식으로만 응답하세요:

{
  "environment": {
    "energyUsage": 숫자(kWh),
    "carbonEmission": 숫자(tCO2e),
    "wasteRecycling": 숫자(%),
    "renewableEnergy": 숫자(%),
    "waterUsage": 숫자(톤)
  },
  "social": {
    "employeeCount": 숫자(명),
    "femaleRatio": 숫자(%),
    "femaleManagerRatio": 숫자(%),
    "trainingHours": 숫자(시간),
    "industrialAccidents": 숫자(건),
    "customerSatisfaction": 숫자(%)
  },
  "governance": {
    "boardIndependence": 숫자(%),
    "ethicsViolations": 숫자(건),
    "antiCorruptionTraining": 숫자(%),
    "auditCommittee": true/false,
    "esgCommittee": true/false
  }
}

찾을 수 없는 항목은 null로 표시하세요.

보고서 내용:
${pdfText.substring(0, 15000)}`
                        }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.content[0].text;
                    
                    // JSON 추출
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const extractedData = JSON.parse(jsonMatch[0]);
                        return res.json({
                            success: true,
                            data: extractedData,
                            source: 'ai'
                        });
                    }
                }
            } catch (aiError) {
                console.error('AI 추출 오류:', aiError);
            }
        }

        // API 없거나 실패시 시뮬레이션 데이터 반환
        const simulatedData = {
            environment: {
                energyUsage: Math.round(1000000 + Math.random() * 2000000),
                carbonEmission: Math.round(800 + Math.random() * 1500),
                wasteRecycling: Math.round(50 + Math.random() * 40),
                renewableEnergy: Math.round(10 + Math.random() * 40),
                waterUsage: Math.round(30000 + Math.random() * 100000)
            },
            social: {
                employeeCount: Math.round(100 + Math.random() * 400),
                femaleRatio: Math.round(30 + Math.random() * 20),
                femaleManagerRatio: Math.round(15 + Math.random() * 20),
                trainingHours: Math.round(30 + Math.random() * 40),
                industrialAccidents: Math.round(Math.random() * 5),
                customerSatisfaction: Math.round(75 + Math.random() * 20)
            },
            governance: {
                boardIndependence: Math.round(30 + Math.random() * 40),
                ethicsViolations: Math.round(Math.random() * 3),
                antiCorruptionTraining: Math.round(70 + Math.random() * 25),
                auditCommittee: Math.random() > 0.3,
                esgCommittee: Math.random() > 0.5
            }
        };

        res.json({
            success: true,
            data: simulatedData,
            source: 'simulation',
            message: 'Claude API 미설정으로 시뮬레이션 데이터가 생성되었습니다.'
        });

    } catch (error) {
        console.error('PDF 데이터 추출 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Dashboard Excel/CSV 데이터 추출 API
app.post('/api/dashboard/excel/extract', (req, res, next) => {
    if (!upload) {
        return res.status(500).json({ 
            success: false,
            error: 'multer가 설치되지 않았습니다.'
        });
    }
    upload.single('file')(req, res, next);
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '파일이 필요합니다.' });
        }

        const fileName = req.file.originalname.toLowerCase();
        let extractedData = {
            environment: {},
            social: {},
            governance: {}
        };

        // CSV 파일 처리
        if (fileName.endsWith('.csv')) {
            const csvText = req.file.buffer.toString('utf-8');
            const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
            
            // 헤더 건너뛰기
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < 3) continue;
                
                const category = cols[0];
                const item = cols[1];
                const value = cols[2];
                
                // 값 파싱
                const numValue = parseFloat(value) || 0;
                const boolValue = value.toUpperCase() === 'TRUE';
                
                // 항목별 매핑
                if (category === '환경') {
                    if (item.includes('에너지')) extractedData.environment.energyUsage = numValue;
                    else if (item.includes('탄소')) extractedData.environment.carbonEmission = numValue;
                    else if (item.includes('폐기물') || item.includes('재활용')) extractedData.environment.wasteRecycling = numValue;
                    else if (item.includes('재생에너지')) extractedData.environment.renewableEnergy = numValue;
                    else if (item.includes('용수')) extractedData.environment.waterUsage = numValue;
                } else if (category === '사회') {
                    if (item.includes('임직원 수') || item.includes('직원 수')) extractedData.social.employeeCount = numValue;
                    else if (item.includes('여성 임직원')) extractedData.social.femaleRatio = numValue;
                    else if (item.includes('여성 관리자')) extractedData.social.femaleManagerRatio = numValue;
                    else if (item.includes('교육')) extractedData.social.trainingHours = numValue;
                    else if (item.includes('산업재해') || item.includes('재해')) extractedData.social.industrialAccidents = numValue;
                    else if (item.includes('고객만족')) extractedData.social.customerSatisfaction = numValue;
                } else if (category === '지배구조') {
                    if (item.includes('사외이사')) extractedData.governance.boardIndependence = numValue;
                    else if (item.includes('윤리') || item.includes('위반')) extractedData.governance.ethicsViolations = numValue;
                    else if (item.includes('반부패')) extractedData.governance.antiCorruptionTraining = numValue;
                    else if (item.includes('감사위원회')) extractedData.governance.auditCommittee = boolValue;
                    else if (item.includes('ESG 위원회') || item.includes('ESG위원회')) extractedData.governance.esgCommittee = boolValue;
                }
            }
            
            return res.json({
                success: true,
                data: extractedData,
                source: 'excel'
            });
        }
        
        // XLSX 파일 처리 (xlsx 패키지 필요)
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            try {
                // xlsx 패키지 동적 로드 시도
                const XLSX = require('xlsx');
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                // 헤더 건너뛰기
                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length < 3) continue;
                    
                    const category = String(row[0] || '').trim();
                    const item = String(row[1] || '').trim();
                    const value = row[2];
                    
                    const numValue = parseFloat(value) || 0;
                    const boolValue = String(value).toUpperCase() === 'TRUE';
                    
                    if (category === '환경') {
                        if (item.includes('에너지')) extractedData.environment.energyUsage = numValue;
                        else if (item.includes('탄소')) extractedData.environment.carbonEmission = numValue;
                        else if (item.includes('폐기물') || item.includes('재활용')) extractedData.environment.wasteRecycling = numValue;
                        else if (item.includes('재생에너지')) extractedData.environment.renewableEnergy = numValue;
                        else if (item.includes('용수')) extractedData.environment.waterUsage = numValue;
                    } else if (category === '사회') {
                        if (item.includes('임직원 수') || item.includes('직원 수')) extractedData.social.employeeCount = numValue;
                        else if (item.includes('여성 임직원')) extractedData.social.femaleRatio = numValue;
                        else if (item.includes('여성 관리자')) extractedData.social.femaleManagerRatio = numValue;
                        else if (item.includes('교육')) extractedData.social.trainingHours = numValue;
                        else if (item.includes('산업재해') || item.includes('재해')) extractedData.social.industrialAccidents = numValue;
                        else if (item.includes('고객만족')) extractedData.social.customerSatisfaction = numValue;
                    } else if (category === '지배구조') {
                        if (item.includes('사외이사')) extractedData.governance.boardIndependence = numValue;
                        else if (item.includes('윤리') || item.includes('위반')) extractedData.governance.ethicsViolations = numValue;
                        else if (item.includes('반부패')) extractedData.governance.antiCorruptionTraining = numValue;
                        else if (item.includes('감사위원회')) extractedData.governance.auditCommittee = boolValue;
                        else if (item.includes('ESG 위원회') || item.includes('ESG위원회')) extractedData.governance.esgCommittee = boolValue;
                    }
                }
                
                return res.json({
                    success: true,
                    data: extractedData,
                    source: 'excel'
                });
            } catch (xlsxError) {
                console.error('XLSX 파싱 오류:', xlsxError);
                return res.status(400).json({
                    success: false,
                    error: 'XLSX 파일을 처리하려면 npm install xlsx를 실행하세요. 또는 CSV 형식으로 업로드해주세요.'
                });
            }
        }

        return res.status(400).json({
            success: false,
            error: '지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 업로드해주세요.'
        });

    } catch (error) {
        console.error('Excel 데이터 추출 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 고지서 OCR API (Claude Vision 사용)
// ============================================================

// 고지서 업로드용 multer 설정
const billUpload = multer ? multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('이미지 또는 PDF 파일만 업로드 가능합니다.'));
        }
    }
}) : null;

// 고지서 OCR 분석 API
app.post('/api/ocr/bill', (req, res, next) => {
    if (!billUpload) {
        return res.status(500).json({ success: false, error: 'multer 패키지가 설치되어 있지 않습니다.' });
    }
    billUpload.single('bill')(req, res, next);
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '파일이 업로드되지 않았습니다.' });
        }

        const billType = req.body.billType || 'electricity';
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        console.log(`📄 고지서 OCR 요청: ${billType}, 파일 크기: ${req.file.size} bytes`);

        // Claude API가 설정되어 있으면 실제 OCR 수행
        if (CLAUDE_API_KEY) {
            const result = await performBillOCR(imageBase64, mimeType, billType);
            return res.json({ success: true, data: result });
        }

        // API 키가 없으면 시뮬레이션 모드
        console.log('⚠️ Claude API 키 미설정 - 시뮬레이션 모드');
        const simulatedData = generateSimulatedBillData(billType);
        return res.json({ success: true, data: simulatedData, simulated: true });

    } catch (error) {
        console.error('고지서 OCR 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Claude Vision으로 고지서 OCR 수행
async function performBillOCR(imageBase64, mimeType, billType) {
    const billTypePrompts = {
        electricity: `이 전기요금 고지서에서 다음 정보를 추출해주세요:
- 사용 기간 (년월)
- 전기 사용량 (kWh)
- 청구 금액 (원)
- 고객번호 (있다면)

JSON 형식으로만 응답해주세요:
{"period": "2024년 06월", "month": 6, "usage": 307, "amount": 26710, "customerNo": "01-****-1711"}`,

        water: `이 수도요금 고지서에서 다음 정보를 추출해주세요:
- 사용 기간 (년월)
- 수도 사용량 (톤 또는 ㎥)
- 청구 금액 (원)

JSON 형식으로만 응답해주세요:
{"period": "2024년 06월", "month": 6, "usage": 45, "amount": 12500}`,

        gas: `이 가스요금 고지서에서 다음 정보를 추출해주세요:
- 사용 기간 (년월)
- 가스 사용량 (㎥)
- 청구 금액 (원)

JSON 형식으로만 응답해주세요:
{"period": "2024년 06월", "month": 6, "usage": 23, "amount": 35000}`,

        maintenance: `이 관리비 고지서에서 다음 정보를 추출해주세요:
- 귀속 년월
- 전기 사용량 (kWh) 및 금액
- 수도 사용량 (톤) 및 금액
- 가스/난방 사용량 및 금액
- 총 관리비

JSON 형식으로만 응답해주세요:
{"period": "2024년 06월", "month": 6, "electricity": {"usage": 181, "amount": 25310}, "water": {"usage": 11, "amount": 7850}, "gas": {"usage": 0, "amount": 3123}, "totalAmount": 90880}`,

        insurance: `이 4대보험 고지서에서 다음 정보를 추출해주세요:
- 귀속 년월
- 가입자 수 (직원 수)
- 총 보험료

JSON 형식으로만 응답해주세요:
{"period": "2024년 06월", "month": 6, "employeeCount": 25, "totalAmount": 5230000}`,

        waste: `이 폐기물 처리 영수증에서 다음 정보를 추출해주세요:
- 처리 일자
- 폐기물 배출량 (kg)
- 처리 비용 (원)

JSON 형식으로만 응답해주세요:
{"date": "2024-06-15", "month": 6, "usage": 120, "amount": 45000}`
    };

    const prompt = billTypePrompts[billType] || billTypePrompts.electricity;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mimeType,
                                data: imageBase64
                            }
                        },
                        {
                            type: 'text',
                            text: prompt
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Claude API 오류: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.content[0].text;

        // JSON 추출
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('📊 OCR 추출 결과:', parsed);
            return parsed;
        }

        throw new Error('OCR 결과에서 JSON을 찾을 수 없습니다.');

    } catch (error) {
        console.error('Claude Vision OCR 오류:', error);
        throw error;
    }
}

// 시뮬레이션 데이터 생성 (API 키 없을 때)
function generateSimulatedBillData(billType) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const simulations = {
        electricity: {
            period: `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`,
            month: currentMonth,
            usage: Math.floor(Math.random() * 500) + 200,
            amount: Math.floor(Math.random() * 50000) + 20000,
            customerNo: `01-****-${Math.floor(Math.random() * 9000) + 1000}`
        },
        water: {
            period: `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`,
            month: currentMonth,
            usage: Math.floor(Math.random() * 50) + 10,
            amount: Math.floor(Math.random() * 30000) + 10000
        },
        gas: {
            period: `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`,
            month: currentMonth,
            usage: Math.floor(Math.random() * 100) + 20,
            amount: Math.floor(Math.random() * 80000) + 30000
        },
        maintenance: {
            period: `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`,
            month: currentMonth,
            electricity: { usage: Math.floor(Math.random() * 300) + 100, amount: Math.floor(Math.random() * 30000) + 15000 },
            water: { usage: Math.floor(Math.random() * 20) + 5, amount: Math.floor(Math.random() * 10000) + 5000 },
            gas: { usage: Math.floor(Math.random() * 30) + 0, amount: Math.floor(Math.random() * 20000) + 5000 },
            totalAmount: Math.floor(Math.random() * 100000) + 80000
        },
        insurance: {
            period: `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`,
            month: currentMonth,
            employeeCount: Math.floor(Math.random() * 50) + 10,
            totalAmount: Math.floor(Math.random() * 5000000) + 2000000
        },
        waste: {
            date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
            month: currentMonth,
            usage: Math.floor(Math.random() * 200) + 50,
            amount: Math.floor(Math.random() * 100000) + 30000
        }
    };

    return simulations[billType] || simulations.electricity;
}

// ============================================================
// 월별 고지서 데이터 저장/조회 API
// ============================================================

// 월별 데이터 저장 API
app.post('/api/bill/data/save', (req, res) => {
    try {
        const { year, type, month, value } = req.body;
        
        if (!year || !type || !month || value === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: '필수 파라미터가 누락되었습니다. (year, type, month, value)' 
            });
        }
        
        // 연도별 데이터 초기화
        if (!monthlyBillData[year]) {
            monthlyBillData[year] = {
                electricity: Array(12).fill(null),
                water: Array(12).fill(null),
                gas: Array(12).fill(null),
                waste: Array(12).fill(null),
                employees: Array(12).fill(null)
            };
        }
        
        // 데이터 타입 확인
        if (!monthlyBillData[year][type]) {
            monthlyBillData[year][type] = Array(12).fill(null);
        }
        
        // 월별 데이터 저장 (1-12 → 0-11 인덱스)
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            monthlyBillData[year][type][monthIndex] = value;
        }
        
        // 파일에 영구 저장
        saveMonthlyBillData(monthlyBillData);
        
        res.json({ 
            success: true, 
            message: '데이터가 저장되었습니다.',
            saved: { year, type, month, value }
        });
    } catch (error) {
        console.error('월별 데이터 저장 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 월별 데이터 일괄 저장 API
app.post('/api/bill/data/bulk-save', (req, res) => {
    try {
        const { year, data } = req.body;
        
        if (!year || !data) {
            return res.status(400).json({ 
                success: false, 
                error: '필수 파라미터가 누락되었습니다. (year, data)' 
            });
        }
        
        // 연도별 데이터 저장
        monthlyBillData[year] = data;
        
        // 파일에 영구 저장
        saveMonthlyBillData(monthlyBillData);
        
        res.json({ 
            success: true, 
            message: '데이터가 일괄 저장되었습니다.',
            year
        });
    } catch (error) {
        console.error('월별 데이터 일괄 저장 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 월별 데이터 조회 API
app.get('/api/bill/data/:year', (req, res) => {
    try {
        const year = req.params.year;
        
        if (!monthlyBillData[year]) {
            return res.json({
                success: true,
                year,
                data: {
                    electricity: Array(12).fill(null),
                    water: Array(12).fill(null),
                    gas: Array(12).fill(null),
                    waste: Array(12).fill(null),
                    employees: Array(12).fill(null)
                }
            });
        }
        
        res.json({
            success: true,
            year,
            data: monthlyBillData[year]
        });
    } catch (error) {
        console.error('월별 데이터 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 전체 월별 데이터 조회
app.get('/api/bill/data', (req, res) => {
    try {
        res.json({
            success: true,
            data: monthlyBillData
        });
    } catch (error) {
        console.error('월별 데이터 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 외부 데이터 API 통합 (ESG 데이터 자동 수집)
// ============================================================

// API 연동 상태 확인
app.get('/api/external/status', (req, res) => {
    res.json({
        success: true,
        apis: {
            dataGoKr: !!DATA_GO_KR_API_KEY,
            dart: !!DART_API_KEY,
            kosis: !!KOSIS_API_KEY,
            carbonInterface: !!CARBON_INTERFACE_API_KEY,
            googleSheets: !!GOOGLE_API_KEY
        }
    });
});

// ==================== 1. 기상청 API (공공데이터포털) ====================
// 기후 데이터 조회 - ESG 환경 리스크 분석용
app.get('/api/external/weather', async (req, res) => {
    try {
        if (!DATA_GO_KR_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: '공공데이터포털 API 키가 설정되지 않았습니다.',
                guide: 'https://www.data.go.kr 에서 API 키를 발급받아 .env에 DATA_GO_KR_API_KEY를 설정하세요.'
            });
        }

        const { nx, ny, baseDate, baseTime } = req.query;
        
        // 기본값: 서울 (nx=60, ny=127)
        const params = new URLSearchParams({
            serviceKey: DATA_GO_KR_API_KEY,
            numOfRows: '100',
            pageNo: '1',
            dataType: 'JSON',
            base_date: baseDate || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            base_time: baseTime || '0600',
            nx: nx || '60',
            ny: ny || '127'
        });

        const response = await fetch(
            `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?${params}`
        );

        const data = await response.json();
        
        // 기상 데이터 파싱
        const items = data?.response?.body?.items?.item || [];
        const weatherData = {
            temperature: null,
            humidity: null,
            precipitation: null,
            windSpeed: null
        };

        items.forEach(item => {
            switch(item.category) {
                case 'TMP': weatherData.temperature = parseFloat(item.fcstValue); break;
                case 'REH': weatherData.humidity = parseFloat(item.fcstValue); break;
                case 'PCP': weatherData.precipitation = item.fcstValue; break;
                case 'WSD': weatherData.windSpeed = parseFloat(item.fcstValue); break;
            }
        });

        res.json({ 
            success: true, 
            data: weatherData,
            raw: items.slice(0, 20), // 일부 원본 데이터
            usage: 'ESG 환경 리스크 분석, 기후변화 영향 평가에 활용'
        });

    } catch (error) {
        console.error('기상청 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 2. DART API (금융감독원 전자공시) ====================
// 기업 공시 정보 조회 - ESG 지배구조 분석용
app.get('/api/external/dart/company', async (req, res) => {
    try {
        if (!DART_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: 'DART API 키가 설정되지 않았습니다.',
                guide: 'https://opendart.fss.or.kr 에서 API 키를 발급받아 .env에 DART_API_KEY를 설정하세요.'
            });
        }

        const { corpCode, corpName } = req.query;

        if (!corpCode && !corpName) {
            return res.status(400).json({ 
                success: false, 
                error: '기업코드(corpCode) 또는 기업명(corpName)을 입력해주세요.' 
            });
        }

        // 기업 개황 조회
        const params = new URLSearchParams({
            crtfc_key: DART_API_KEY,
            corp_code: corpCode || ''
        });

        const response = await fetch(
            `https://opendart.fss.or.kr/api/company.json?${params}`
        );

        const data = await response.json();

        res.json({ 
            success: true, 
            data: {
                corpName: data.corp_name,
                corpNameEng: data.corp_name_eng,
                stockCode: data.stock_code,
                ceoName: data.ceo_nm,
                corpClass: data.corp_cls,
                address: data.adres,
                homepageUrl: data.hm_url,
                establishDate: data.est_dt,
                accountMonth: data.acc_mt
            },
            usage: 'ESG 지배구조 분석, 기업 기본정보 자동 수집'
        });

    } catch (error) {
        console.error('DART API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DART - 재무제표 조회
app.get('/api/external/dart/financial', async (req, res) => {
    try {
        if (!DART_API_KEY) {
            return res.status(400).json({ success: false, error: 'DART API 키가 설정되지 않았습니다.' });
        }

        const { corpCode, bsnsYear, reprtCode } = req.query;

        const params = new URLSearchParams({
            crtfc_key: DART_API_KEY,
            corp_code: corpCode,
            bsns_year: bsnsYear || new Date().getFullYear().toString(),
            reprt_code: reprtCode || '11011' // 11011: 사업보고서
        });

        const response = await fetch(
            `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?${params}`
        );

        const data = await response.json();
        const items = data.list || [];

        // 주요 재무지표 추출
        const financialData = {
            revenue: null,
            operatingProfit: null,
            netIncome: null,
            totalAssets: null,
            totalEquity: null
        };

        items.forEach(item => {
            if (item.account_nm.includes('매출액')) financialData.revenue = item.thstrm_amount;
            if (item.account_nm.includes('영업이익')) financialData.operatingProfit = item.thstrm_amount;
            if (item.account_nm.includes('당기순이익')) financialData.netIncome = item.thstrm_amount;
            if (item.account_nm.includes('자산총계')) financialData.totalAssets = item.thstrm_amount;
            if (item.account_nm.includes('자본총계')) financialData.totalEquity = item.thstrm_amount;
        });

        res.json({ 
            success: true, 
            data: financialData,
            raw: items.slice(0, 20),
            usage: 'ESG 지배구조 - 재무 건전성 분석'
        });

    } catch (error) {
        console.error('DART 재무제표 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DART - 임원 현황 조회 (지배구조 분석용)
app.get('/api/external/dart/executives', async (req, res) => {
    try {
        if (!DART_API_KEY) {
            return res.status(400).json({ success: false, error: 'DART API 키가 설정되지 않았습니다.' });
        }

        const { corpCode, bsnsYear } = req.query;

        const params = new URLSearchParams({
            crtfc_key: DART_API_KEY,
            corp_code: corpCode,
            bsns_year: bsnsYear || new Date().getFullYear().toString(),
            reprt_code: '11011'
        });

        const response = await fetch(
            `https://opendart.fss.or.kr/api/exctvSttus.json?${params}`
        );

        const data = await response.json();
        const executives = data.list || [];

        // 이사회 구성 분석
        const boardAnalysis = {
            totalExecutives: executives.length,
            insideDirectors: 0,
            outsideDirectors: 0,
            femaleExecutives: 0,
            executives: []
        };

        executives.forEach(exec => {
            if (exec.rgist_exctv_at === 'Y') {
                if (exec.fte_at === 'Y') boardAnalysis.insideDirectors++;
                else boardAnalysis.outsideDirectors++;
            }
            // 성별 분석 (이름 기반 추정 - 실제로는 더 정확한 데이터 필요)
            boardAnalysis.executives.push({
                name: exec.nm,
                position: exec.ofcps,
                isRegistered: exec.rgist_exctv_at === 'Y',
                isFullTime: exec.fte_at === 'Y'
            });
        });

        boardAnalysis.outsideDirectorRatio = boardAnalysis.totalExecutives > 0 
            ? Math.round((boardAnalysis.outsideDirectors / boardAnalysis.totalExecutives) * 100)
            : 0;

        res.json({ 
            success: true, 
            data: boardAnalysis,
            usage: 'ESG 지배구조 - 이사회 독립성, 다양성 분석'
        });

    } catch (error) {
        console.error('DART 임원현황 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 3. 통계청 KOSIS API ====================
// 산업별 통계 조회 - ESG 벤치마킹용
app.get('/api/external/kosis/stats', async (req, res) => {
    try {
        if (!KOSIS_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: '통계청 KOSIS API 키가 설정되지 않았습니다.',
                guide: 'https://kosis.kr/openapi 에서 API 키를 발급받아 .env에 KOSIS_API_KEY를 설정하세요.'
            });
        }

        const { orgId, tblId, objL1, objL2 } = req.query;

        // 기본: 산업별 에너지 사용량 통계
        const params = new URLSearchParams({
            method: 'getList',
            apiKey: KOSIS_API_KEY,
            format: 'json',
            jsonVD: 'Y',
            orgId: orgId || '101',
            tblId: tblId || 'DT_1J22112',
            objL1: objL1 || 'ALL',
            objL2: objL2 || 'ALL'
        });

        const response = await fetch(
            `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params}`
        );

        const data = await response.json();

        res.json({ 
            success: true, 
            data: data,
            usage: 'ESG 벤치마킹 - 동종업계 평균 대비 분석'
        });

    } catch (error) {
        console.error('KOSIS API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// KOSIS - 고용 통계 조회
app.get('/api/external/kosis/employment', async (req, res) => {
    try {
        if (!KOSIS_API_KEY) {
            return res.status(400).json({ success: false, error: 'KOSIS API 키가 설정되지 않았습니다.' });
        }

        const { industryCode } = req.query;

        // 산업별 고용 현황 통계
        const params = new URLSearchParams({
            method: 'getList',
            apiKey: KOSIS_API_KEY,
            format: 'json',
            jsonVD: 'Y',
            orgId: '118',
            tblId: 'DT_118N_PAYM32',
            objL1: industryCode || 'ALL'
        });

        const response = await fetch(
            `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params}`
        );

        const data = await response.json();

        res.json({ 
            success: true, 
            data: data,
            usage: 'ESG 사회 - 고용 현황 벤치마킹'
        });

    } catch (error) {
        console.error('KOSIS 고용통계 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 4. Carbon Interface API ====================
// 탄소 배출량 계산 - 다양한 활동별 탄소 발자국
app.post('/api/external/carbon/estimate', async (req, res) => {
    try {
        if (!CARBON_INTERFACE_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: 'Carbon Interface API 키가 설정되지 않았습니다.',
                guide: 'https://www.carboninterface.com 에서 API 키를 발급받아 .env에 CARBON_INTERFACE_API_KEY를 설정하세요.'
            });
        }

        const { type, data } = req.body;

        // type: electricity, flight, shipping, vehicle, fuel_combustion
        let endpoint = 'estimates';
        let requestBody = { type };

        switch(type) {
            case 'electricity':
                requestBody = {
                    type: 'electricity',
                    electricity_unit: data.unit || 'kwh',
                    electricity_value: data.value,
                    country: data.country || 'kr'
                };
                break;
            case 'fuel_combustion':
                requestBody = {
                    type: 'fuel_combustion',
                    fuel_source_type: data.fuelType || 'ng', // natural gas
                    fuel_source_unit: data.unit || 'thousand_cubic_feet',
                    fuel_source_value: data.value
                };
                break;
            case 'shipping':
                requestBody = {
                    type: 'shipping',
                    weight_value: data.weight,
                    weight_unit: data.weightUnit || 'kg',
                    distance_value: data.distance,
                    distance_unit: data.distanceUnit || 'km',
                    transport_method: data.method || 'truck'
                };
                break;
            case 'vehicle':
                requestBody = {
                    type: 'vehicle',
                    distance_value: data.distance,
                    distance_unit: data.distanceUnit || 'km',
                    vehicle_model_id: data.vehicleModelId || null
                };
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: '지원하지 않는 유형입니다. (electricity, fuel_combustion, shipping, vehicle)'
                });
        }

        const response = await fetch('https://www.carboninterface.com/api/v1/estimates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CARBON_INTERFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Carbon Interface API 오류');
        }

        res.json({
            success: true,
            data: {
                carbonKg: result.data?.attributes?.carbon_kg,
                carbonMt: result.data?.attributes?.carbon_mt,
                carbonLb: result.data?.attributes?.carbon_lb,
                estimatedAt: result.data?.attributes?.estimated_at
            },
            raw: result.data,
            usage: 'Scope 1, 3 배출량 계산, 공급망 탄소 발자국'
        });

    } catch (error) {
        console.error('Carbon Interface API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 6. 고용노동부 API (공공데이터포털) ====================
// 산업재해 통계 조회 - ESG 사회 안전보건 지표
app.get('/api/external/moel/accident', async (req, res) => {
    try {
        if (!DATA_GO_KR_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: '공공데이터포털 API 키가 설정되지 않았습니다.'
            });
        }

        const { industryCode, year } = req.query;

        const params = new URLSearchParams({
            serviceKey: DATA_GO_KR_API_KEY,
            numOfRows: '100',
            pageNo: '1',
            dataType: 'JSON',
            year: year || new Date().getFullYear().toString()
        });

        // 산업재해 통계 API
        const response = await fetch(
            `http://apis.data.go.kr/B490001/sjOccasStatsService/getStatsInfo?${params}`
        );

        const data = await response.json();

        res.json({ 
            success: true, 
            data: data?.response?.body?.items || data,
            usage: 'ESG 사회 - 산업재해율 벤치마킹'
        });

    } catch (error) {
        console.error('고용노동부 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 고용 현황 조회
app.get('/api/external/moel/employment', async (req, res) => {
    try {
        if (!DATA_GO_KR_API_KEY) {
            return res.status(400).json({ success: false, error: '공공데이터포털 API 키가 설정되지 않았습니다.' });
        }

        const { bizNo } = req.query; // 사업자등록번호

        const params = new URLSearchParams({
            serviceKey: DATA_GO_KR_API_KEY,
            numOfRows: '10',
            pageNo: '1',
            dataType: 'JSON'
        });

        // 사업장 고용정보 API
        const response = await fetch(
            `http://apis.data.go.kr/B490001/wkplcInfoService/getWkplcInfo?${params}`
        );

        const data = await response.json();

        res.json({ 
            success: true, 
            data: data?.response?.body?.items || data,
            usage: 'ESG 사회 - 고용 현황 자동 수집'
        });

    } catch (error) {
        console.error('고용노동부 고용정보 API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 7. Google Sheets API ====================
// 스프레드시트 데이터 읽기 - ESG 데이터 연동
app.get('/api/external/sheets/read', async (req, res) => {
    try {
        if (!GOOGLE_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: 'Google API 키가 설정되지 않았습니다.',
                guide: 'https://console.cloud.google.com 에서 API 키를 발급받아 .env에 GOOGLE_API_KEY를 설정하세요.'
            });
        }

        const { spreadsheetId, range } = req.query;

        if (!spreadsheetId) {
            return res.status(400).json({ success: false, error: 'spreadsheetId를 입력해주세요.' });
        }

        const sheetRange = range || 'Sheet1!A1:Z100';

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetRange)}?key=${GOOGLE_API_KEY}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Google Sheets API 오류');
        }

        res.json({ 
            success: true, 
            data: {
                range: data.range,
                values: data.values,
                rowCount: data.values?.length || 0
            },
            usage: 'ESG 데이터 외부 스프레드시트 연동'
        });

    } catch (error) {
        console.error('Google Sheets API 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 스프레드시트로 데이터 내보내기 (쓰기)
// OAuth2 인증 필요 - 여기서는 API 키로 읽기만 지원
app.post('/api/external/sheets/export', async (req, res) => {
    try {
        // OAuth2 인증이 필요한 기능임을 안내
        res.json({ 
            success: false, 
            error: 'Google Sheets 쓰기는 OAuth2 인증이 필요합니다.',
            guide: '현재는 읽기(GET /api/external/sheets/read)만 지원됩니다. 쓰기 기능은 OAuth2 설정 후 사용 가능합니다.',
            alternative: 'CSV 다운로드 기능을 사용하거나, 클라이언트에서 Google Picker API를 활용하세요.'
        });

    } catch (error) {
        console.error('Google Sheets 내보내기 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ESG 데이터 통합 조회 ====================
// 사업자등록번호로 ESG 관련 데이터 일괄 조회
app.post('/api/external/esg-data-collect', async (req, res) => {
    try {
        const { bizNo, corpCode, corpName } = req.body;

        const results = {
            company: null,
            financial: null,
            executives: null,
            weather: null,
            errors: []
        };

        // 1. DART - 기업정보 조회
        if (DART_API_KEY && corpCode) {
            try {
                const dartRes = await fetch(
                    `https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}`
                );
                const dartData = await dartRes.json();
                results.company = {
                    corpName: dartData.corp_name,
                    ceoName: dartData.ceo_nm,
                    address: dartData.adres,
                    establishDate: dartData.est_dt
                };
            } catch (e) {
                results.errors.push({ api: 'DART', error: e.message });
            }
        }

        // 2. 기상청 - 기후 데이터
        if (DATA_GO_KR_API_KEY) {
            try {
                const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const weatherRes = await fetch(
                    `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${DATA_GO_KR_API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${today}&base_time=0600&nx=60&ny=127`
                );
                const weatherData = await weatherRes.json();
                results.weather = weatherData?.response?.body?.items?.item?.[0] || null;
            } catch (e) {
                results.errors.push({ api: 'Weather', error: e.message });
            }
        }

        res.json({
            success: true,
            data: results,
            message: 'ESG 데이터 통합 조회 완료',
            collectedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('ESG 데이터 통합 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// Claude AI API 프록시 (보안: API Key를 서버에서 관리)
// ============================================================

// AI 리포트 생성 (일반)
app.post('/api/ai/generate', async (req, res) => {
    try {
        const { prompt, model, maxTokens } = req.body;
        
        if (!CLAUDE_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: 'Claude API 키가 설정되지 않았습니다. 서버의 .env 파일에 CLAUDE_API_KEY를 설정해주세요.' 
            });
        }
        
        const claudeModel = model || 'claude-sonnet-4-20250514';
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: claudeModel,
                max_tokens: maxTokens || 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Claude API 호출 실패');
        }
        
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        
        res.json({ success: true, text });
        
    } catch (error) {
        console.error('Claude AI 생성 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI 리포트 생성 (스트리밍)
app.post('/api/ai/stream', async (req, res) => {
    try {
        const { prompt, model, maxTokens } = req.body;
        
        if (!CLAUDE_API_KEY) {
            return res.status(400).json({ 
                success: false, 
                error: 'Claude API 키가 설정되지 않았습니다.' 
            });
        }
        
        const claudeModel = model || 'claude-sonnet-4-20250514';
        
        // SSE 헤더 설정
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: claudeModel,
                max_tokens: maxTokens || 4096,
                stream: true,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            res.write(`data: ${JSON.stringify({ error: errorData.error?.message || 'API 오류' })}\n\n`);
            res.end();
            return;
        }
        
        // 스트림 전달 (Claude 형식 → SSE 변환)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        // content_block_delta 이벤트에서 텍스트 추출
                        if (data.type === 'content_block_delta' && data.delta?.text) {
                            res.write(`data: ${JSON.stringify({ text: data.delta.text })}\n\n`);
                        }
                        // 메시지 완료
                        else if (data.type === 'message_stop') {
                            res.write(`data: [DONE]\n\n`);
                        }
                    } catch (e) {
                        // JSON 파싱 실패 시 무시
                    }
                }
            }
        }
        
        res.end();
        
    } catch (error) {
        console.error('Claude 스트리밍 오류:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

// API 키 상태 확인
app.get('/api/ai/status', (req, res) => {
    res.json({
        claude: !!CLAUDE_API_KEY,
        openai: !!OPENAI_API_KEY
    });
});

// ============================================================
// 404 에러 핸들러 (모든 라우트 맨 마지막에 배치)
// ============================================================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 서버 시작
app.listen(PORT, () => {
    const multerStatus = multer ? '✅ 설치됨' : '❌ 미설치';
    const pdfParseStatus = pdfParse ? '✅ 설치됨' : '❌ 미설치';
    const claudeStatus = CLAUDE_API_KEY ? '✅ 설정됨' : '⚠️ 미설정';
    
    // 외부 API 상태
    const dataGoKrStatus = DATA_GO_KR_API_KEY ? '✅' : '⚪';
    const dartStatus = DART_API_KEY ? '✅' : '⚪';
    const kosisStatus = KOSIS_API_KEY ? '✅' : '⚪';
    const carbonStatus = CARBON_INTERFACE_API_KEY ? '✅' : '⚪';
    const googleStatus = GOOGLE_API_KEY ? '✅' : '⚪';
    
    // 영구 저장 상태 확인
    const kesgStatus = fs.existsSync(KESG_CRITERIA_FILE) ? '✅ 로드됨' : '⚪ 없음';
    const assessmentStatus = fs.existsSync(ASSESSMENT_RESULTS_FILE) ? '✅ 로드됨' : '⚪ 없음';
    const billStatus = fs.existsSync(MONTHLY_BILL_FILE) ? '✅ 로드됨' : '⚪ 없음';
    
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║     ESG Insight 백엔드 서버가 시작되었습니다!             ║
    ║                                                           ║
    ║     🌐 서버 주소: http://localhost:${PORT}                   ║
    ║     📖 API 문서: http://localhost:${PORT}/api-docs            ║
    ║     🔐 관리자: http://localhost:${PORT}/admin-login           ║
    ║                                                           ║
    ║     💳 토스페이먼츠 테스트 모드로 실행 중                 ║
    ║                                                           ║
    ║     🤖 AI API:                                            ║
    ║        Claude: ${claudeStatus}                              
    ║                                                           ║
    ║     🌐 외부 데이터 API:                                   ║
    ║        공공데이터포털: ${dataGoKrStatus} (기상청/고용)         
    ║        DART: ${dartStatus} (기업공시/재무제표)              
    ║        KOSIS: ${kosisStatus} (통계청)                       
    ║        Carbon Interface: ${carbonStatus} (탄소계산)         
    ║        Google Sheets: ${googleStatus}                       
    ║                                                           ║
    ║     📦 패키지 상태:                                       ║
    ║        multer: ${multerStatus}                              
    ║        pdf-parse: ${pdfParseStatus}                          
    ║                                                           ║
    ║     💾 영구 저장 데이터 (data/ 폴더):                     ║
    ║        K-ESG 기준: ${kesgStatus}                           
    ║        Assessment 결과: ${assessmentStatus}                
    ║        월별 고지서: ${billStatus}                          
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
    
    if (!CLAUDE_API_KEY) {
        console.log('    ⚠️  AI 기능을 사용하려면 .env에 CLAUDE_API_KEY를 설정하세요');
        console.log('       발급: https://console.anthropic.com\n');
    }
    
    // 외부 API 안내
    const missingApis = [];
    if (!DATA_GO_KR_API_KEY) missingApis.push('DATA_GO_KR_API_KEY (공공데이터포털)');
    if (!DART_API_KEY) missingApis.push('DART_API_KEY (전자공시)');
    if (!KOSIS_API_KEY) missingApis.push('KOSIS_API_KEY (통계청)');
    if (!CARBON_INTERFACE_API_KEY) missingApis.push('CARBON_INTERFACE_API_KEY (탄소계산)');
    
    if (missingApis.length > 0) {
        console.log('    💡 추가 기능 활성화를 위해 다음 API 키를 설정하세요:');
        missingApis.forEach(api => console.log(`       - ${api}`));
        console.log('');
    }
    
    if (!multer || !pdfParse) {
        console.log('    ⚠️  PDF 파싱 기능을 사용하려면: npm install multer pdf-parse\n');
    }
});

module.exports = app;
