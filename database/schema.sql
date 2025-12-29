-- ============================================================
-- ESG Insight 데이터베이스 스키마
-- PostgreSQL 14+
-- ============================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- 구독 정보
    plan VARCHAR(50) DEFAULT 'free',  -- free, starter, professional, enterprise
    trial_ends_at TIMESTAMP,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 구독 테이블
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    plan VARCHAR(50) NOT NULL,  -- starter, professional, enterprise
    status VARCHAR(20) DEFAULT 'active',  -- active, cancelled, paused, payment_failed
    
    -- 결제 주기
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    
    -- 취소 정보
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    
    -- 결제 실패 추적
    failed_attempts INTEGER DEFAULT 0,
    last_payment_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- 주문 정보
    order_id VARCHAR(100) UNIQUE NOT NULL,
    order_name VARCHAR(255) NOT NULL,
    
    -- 결제 정보
    payment_key VARCHAR(255),
    amount INTEGER NOT NULL,
    vat INTEGER DEFAULT 0,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, cancelled, refunded
    type VARCHAR(20) DEFAULT 'one_time',  -- one_time, recurring
    
    -- 토스페이먼츠 응답 데이터
    receipt_url TEXT,
    card_company VARCHAR(50),
    card_number VARCHAR(20),
    
    -- 실패 정보
    failure_code VARCHAR(50),
    failure_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 빌링키 테이블 (정기결제용)
CREATE TABLE billing_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 토스페이먼츠 빌링 정보
    billing_key VARCHAR(255) NOT NULL,
    customer_key VARCHAR(255) NOT NULL,
    
    -- 카드 정보 (마스킹됨)
    card_company VARCHAR(50),
    card_number VARCHAR(20),  -- 1234-****-****-5678
    
    -- 상태
    is_default BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ESG 데이터 테이블
CREATE TABLE esg_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 기간
    period_year INTEGER NOT NULL,
    period_quarter INTEGER,  -- NULL이면 연간 데이터
    
    -- 환경 (E)
    energy_usage DECIMAL(15,2),  -- kWh
    carbon_emission DECIMAL(15,2),  -- tCO2e
    waste_recycling DECIMAL(5,2),  -- %
    renewable_energy DECIMAL(5,2),  -- %
    water_usage DECIMAL(15,2),  -- 톤
    
    -- 사회 (S)
    employee_count INTEGER,
    female_ratio DECIMAL(5,2),  -- %
    female_manager_ratio DECIMAL(5,2),  -- %
    training_hours DECIMAL(5,1),  -- 인당 시간
    industrial_accidents INTEGER,
    customer_satisfaction DECIMAL(5,2),  -- %
    
    -- 지배구조 (G)
    board_independence DECIMAL(5,2),  -- 사외이사 비율 %
    ethics_violations INTEGER,
    anti_corruption_training DECIMAL(5,2),  -- %
    audit_committee BOOLEAN DEFAULT false,
    esg_committee BOOLEAN DEFAULT false,
    
    -- 계산된 점수
    e_score DECIMAL(5,2),
    s_score DECIMAL(5,2),
    g_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    grade VARCHAR(2),  -- A+, A, A-, B+, B, B-, C+, C
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, period_year, period_quarter)
);

-- 보고서 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    template VARCHAR(50) NOT NULL,  -- k-esg, gri, tcfd
    
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, generating, completed
    progress INTEGER DEFAULT 0,  -- 0-100
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 웹훅 로그 테이블
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source VARCHAR(50) NOT NULL,  -- tosspayments
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_billing_keys_user_id ON billing_keys(user_id);
CREATE INDEX idx_esg_data_user_id ON esg_data(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esg_data_updated_at BEFORE UPDATE ON esg_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (테스트용)
INSERT INTO users (email, password_hash, company_name, contact_name, phone, plan)
VALUES (
    'test@company.com',
    'hashed_password_here',
    '그린테크 주식회사',
    '김지원',
    '010-1234-5678',
    'professional'
);

-- 뷰: 활성 구독 현황
CREATE VIEW active_subscriptions AS
SELECT 
    u.id as user_id,
    u.email,
    u.company_name,
    s.plan,
    s.status,
    s.current_period_end,
    CASE 
        WHEN s.current_period_end < NOW() THEN '만료됨'
        WHEN s.current_period_end < NOW() + INTERVAL '7 days' THEN '곧 만료'
        ELSE '활성'
    END as period_status
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active';

-- 뷰: 월별 매출 현황
CREATE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    SUM(CASE WHEN type = 'recurring' THEN amount ELSE 0 END) as recurring_revenue,
    SUM(CASE WHEN type = 'one_time' THEN amount ELSE 0 END) as one_time_revenue
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
