// ============================================================
// 정기결제 스케줄러
// 매일 새벽 2시에 실행되어 결제일이 된 구독을 처리
// ============================================================

const cron = require('node-cron');

// 정기결제 처리 함수
async function processRecurringPayments(database, TOSS_SECRET_KEY) {
    console.log('[스케줄러] 정기결제 처리 시작:', new Date().toISOString());

    const today = new Date();
    
    // 결제가 필요한 구독 찾기 (currentPeriodEnd가 오늘 이전인 활성 구독)
    const subscriptionsToCharge = database.subscriptions.filter(sub => {
        if (sub.status !== 'active') return false;
        const periodEnd = new Date(sub.currentPeriodEnd);
        return periodEnd <= today;
    });

    console.log(`[스케줄러] 처리할 구독 수: ${subscriptionsToCharge.length}`);

    for (const subscription of subscriptionsToCharge) {
        try {
            await chargeSubscription(subscription, database, TOSS_SECRET_KEY);
            console.log(`[스케줄러] 결제 성공: ${subscription.id}`);
        } catch (error) {
            console.error(`[스케줄러] 결제 실패: ${subscription.id}`, error.message);
            
            // 결제 실패 시 재시도 로직
            subscription.failedAttempts = (subscription.failedAttempts || 0) + 1;
            
            if (subscription.failedAttempts >= 3) {
                // 3회 실패 시 구독 일시정지
                subscription.status = 'payment_failed';
                subscription.pausedAt = new Date().toISOString();
                
                // 알림 발송 (이메일/알림톡)
                await sendPaymentFailedNotification(subscription, database);
            }
        }
    }

    console.log('[스케줄러] 정기결제 처리 완료');
}

// 개별 구독 결제 처리
async function chargeSubscription(subscription, database, TOSS_SECRET_KEY) {
    const billingInfo = database.billingKeys.find(b => b.userId === subscription.userId);
    
    if (!billingInfo) {
        throw new Error('등록된 결제 수단 없음');
    }

    const plans = {
        starter: { price: 99000 },
        professional: { price: 299000 },
        enterprise: { price: 599000 }
    };

    const planPrice = plans[subscription.plan]?.price || 299000;
    const amount = planPrice + Math.round(planPrice * 0.1);  // VAT 포함
    const orderId = 'ESG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 토스페이먼츠 자동결제 API 호출
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
        throw new Error(data.message || '결제 실패');
    }

    // 결제 성공 처리
    subscription.currentPeriodStart = new Date().toISOString();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    subscription.lastPaymentAt = new Date().toISOString();
    subscription.failedAttempts = 0;

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

    // 결제 완료 알림 발송
    await sendPaymentSuccessNotification(subscription, database, amount);

    return data;
}

// 결제 성공 알림
async function sendPaymentSuccessNotification(subscription, database, amount) {
    const user = database.users.find(u => u.id === subscription.userId);
    if (!user) return;

    console.log(`[알림] 결제 완료 알림 발송: ${user.email}, ₩${amount.toLocaleString()}`);
    
    // 실제 구현 시:
    // - 이메일 발송 (nodemailer, SendGrid 등)
    // - 알림톡 발송 (카카오 비즈메시지 API)
    // - 앱 푸시 알림
}

// 결제 실패 알림
async function sendPaymentFailedNotification(subscription, database) {
    const user = database.users.find(u => u.id === subscription.userId);
    if (!user) return;

    console.log(`[알림] 결제 실패 알림 발송: ${user.email}`);
    
    // 실제 구현 시:
    // - 결제 수단 업데이트 요청 이메일
    // - 서비스 일시정지 안내
}

// 스케줄러 설정
function setupScheduler(database, TOSS_SECRET_KEY) {
    // 매일 새벽 2시에 실행
    cron.schedule('0 2 * * *', () => {
        processRecurringPayments(database, TOSS_SECRET_KEY);
    });

    // 결제 실패 재시도: 매일 오전 10시
    cron.schedule('0 10 * * *', () => {
        retryFailedPayments(database, TOSS_SECRET_KEY);
    });

    console.log('[스케줄러] 정기결제 스케줄러 설정 완료');
    console.log('  - 정기결제: 매일 02:00');
    console.log('  - 재시도: 매일 10:00');
}

// 실패한 결제 재시도
async function retryFailedPayments(database, TOSS_SECRET_KEY) {
    console.log('[스케줄러] 결제 실패 재시도 시작');

    const failedSubscriptions = database.subscriptions.filter(sub => 
        sub.status === 'active' && sub.failedAttempts > 0 && sub.failedAttempts < 3
    );

    for (const subscription of failedSubscriptions) {
        try {
            await chargeSubscription(subscription, database, TOSS_SECRET_KEY);
            console.log(`[스케줄러] 재시도 성공: ${subscription.id}`);
        } catch (error) {
            console.error(`[스케줄러] 재시도 실패: ${subscription.id}`);
        }
    }
}

module.exports = { setupScheduler, processRecurringPayments };
