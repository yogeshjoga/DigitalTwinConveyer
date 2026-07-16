-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Identity & Access Management (Auth)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fleet Configuration
CREATE TABLE IF NOT EXISTS belts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL,
    width NUMERIC NOT NULL,
    thickness NUMERIC NOT NULL,
    length NUMERIC NOT NULL,
    speed NUMERIC NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    tensile_strength NUMERIC NOT NULL,
    hardness NUMERIC NOT NULL,
    elastic_modulus NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. IoT Sensor Data (TimescaleDB Hypertables)
CREATE TABLE IF NOT EXISTS sensor_readings (
    timestamp TIMESTAMPTZ NOT NULL,
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    load_cell NUMERIC,
    impact_force NUMERIC,
    belt_speed NUMERIC,
    temperature NUMERIC,
    vibration NUMERIC,
    udl NUMERIC,
    PRIMARY KEY (timestamp, belt_id)
);
-- Create hypertable for time-series data
SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS thermal_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    position NUMERIC NOT NULL,
    temperature NUMERIC NOT NULL,
    friction_index NUMERIC NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'normal'
);

-- 4. AI Vision Analytics & Object Storage
CREATE TABLE IF NOT EXISTS vision_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    defect_type VARCHAR(100) NOT NULL,
    confidence NUMERIC NOT NULL,
    severity VARCHAR(50) NOT NULL,
    bounding_box JSONB,
    media_url VARCHAR(1024), -- MinIO S3 URL
    feature_vector VECTOR(1536) -- Assuming 1536 dimensions (e.g., OpenAI/standard embeddings)
);

-- 5. SCADA & PLC Controls
CREATE TABLE IF NOT EXISTS plc_states (
    belt_id UUID PRIMARY KEY REFERENCES belts(id) ON DELETE CASCADE,
    belt_state VARCHAR(50) NOT NULL,
    speed_setpoint NUMERIC NOT NULL,
    actual_speed NUMERIC NOT NULL,
    auto_response_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plc_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    command VARCHAR(100) NOT NULL,
    value NUMERIC,
    reason TEXT,
    accepted BOOLEAN NOT NULL,
    reject_reason TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plc_auto_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    condition TEXT,
    action TEXT,
    metric VARCHAR(100) NOT NULL,
    operator VARCHAR(10) NOT NULL,
    threshold NUMERIC NOT NULL,
    trigger_action VARCHAR(100) NOT NULL,
    reduce_speed_to NUMERIC,
    cooldown_seconds INTEGER NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER NOT NULL DEFAULT 0
);

-- 6. Maintenance & Work Orders
CREATE TABLE IF NOT EXISTS engineers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    belt_id UUID NOT NULL REFERENCES belts(id) ON DELETE CASCADE,
    engineer_id UUID REFERENCES engineers(id) ON DELETE SET NULL,
    task_title TEXT NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_tags (
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL, -- 'alert' or 'vision_detection'
    reference_id UUID NOT NULL,
    PRIMARY KEY (work_order_id, reference_type, reference_id)
);
