CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_role CHECK (role IN ('hr', 'manager', 'employee'))
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    phone VARCHAR(20),
    joining_date DATE,
    onboarding_status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_onboarding_status CHECK (
        onboarding_status IN ('pending', 'in_progress', 'completed')
    )
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    document_type VARCHAR(100) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,

    status VARCHAR(20) DEFAULT 'pending',
    remarks TEXT,

    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_document_status CHECK (
        status IN ('pending', 'approved', 'rejected')
    )
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'pending',
    due_date DATE,

    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_task_priority CHECK (
        priority IN ('low', 'medium', 'high')
    ),

    CONSTRAINT valid_task_status CHECK (
        status IN ('pending', 'in_progress', 'completed')
    )
);

CREATE TABLE IF NOT EXISTS trainings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_hours INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_assignments (
    id SERIAL PRIMARY KEY,
    training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    status VARCHAR(30) DEFAULT 'assigned',
    progress_percent INTEGER DEFAULT 0,
    due_date DATE,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_training_status CHECK (
        status IN ('assigned', 'in_progress', 'completed')
    ),

    CONSTRAINT valid_progress_percent CHECK (
        progress_percent >= 0 AND progress_percent <= 100
    ),

    CONSTRAINT unique_training_employee UNIQUE (training_id, employee_id)
);

CREATE TABLE IF NOT EXISTS offer_letters (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    title VARCHAR(150) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,

    status VARCHAR(30) DEFAULT 'issued',
    remarks TEXT,

    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_offer_status CHECK (
        status IN ('issued', 'accepted', 'rejected', 'revoked')
    )
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_notification_type CHECK (
        type IN ('general', 'task', 'document', 'training', 'offer', 'reminder', 'progress')
    )
);