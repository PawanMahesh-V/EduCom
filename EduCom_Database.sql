DROP TABLE IF EXISTS reports, anonymous_feedback, notifications, transactions, marketplace_items, submissions, assignments, messages, communities, enrollments, courses, users, password_reset_codes, login_verification_codes CASCADE;

-- ===================================
-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  reg_id VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(72) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('Admin', 'Teacher', 'Student', 'HOD', 'PM')),
  department VARCHAR(50),
  semester SMALLINT CHECK (semester BETWEEN 1 AND 8),
  program_year SMALLINT CHECK (program_year BETWEEN 1 AND 4),
  section VARCHAR(10),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT check_student_has_semester CHECK (role != 'Student' OR semester IS NOT NULL),
  CONSTRAINT check_pm_has_program_year CHECK (role != 'PM' OR program_year IS NOT NULL)
);

INSERT INTO users (reg_id, name, email, password, role, department, semester, program_year, section) VALUES
('A001', 'Pawan Mahesh', 'bcsbs2212263@szabist.pk', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8hBy06SnVAk0/fWznuaCG2lLBVmO6', 'Admin', 'IT', NULL, NULL, NULL),
('A002', 'Anmol Kumari', 'bcsbs2212141@szabist.pk', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8hBy06SnVAk0/fWznuaCG2lLBVmO6', 'Admin', 'IT', NULL, NULL, NULL);

-- Create indexes for users table
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_email ON users(email);

-- ===================================
-- COURSES TABLE
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  semester VARCHAR(20),
  teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);



-- Create indexes for courses table
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_department ON courses(department);

-- ===================================
-- ENROLLMENTS TABLE
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  grade VARCHAR(5),
  enrolled_by INT REFERENCES users(id) ON DELETE SET NULL,
  enrolled_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, student_id)
);



-- Create indexes for enrollments table
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ===================================
-- COMMUNITIES TABLE
CREATE TABLE communities (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(100),
  join_code VARCHAR(8) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- MESSAGES TABLE
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  community_id INT REFERENCES communities(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE SET NULL,
  sender_id INT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'approved',
  flagged_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_message_type CHECK (
    (community_id IS NOT NULL AND receiver_id IS NULL) OR 
    (community_id IS NULL AND receiver_id IS NOT NULL)
  )
);

-- Create indexes for messages table
CREATE INDEX idx_messages_community ON messages(community_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_direct ON messages(sender_id, receiver_id) WHERE community_id IS NULL;



-- ===================================
-- ASSIGNMENTS TABLE
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(100),
  description TEXT,
  deadline TIMESTAMP,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- SUBMISSIONS TABLE
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id),
  file_url TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(10),
  feedback TEXT
);



-- ===================================
-- MARKETPLACE TABLE
CREATE TABLE marketplace_items (
  id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES users(id),
  title VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- TRANSACTIONS TABLE
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES marketplace_items(id),
  buyer_id INT REFERENCES users(id),
  payment_ref VARCHAR(100),
  amount NUMERIC(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id),
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  target_role VARCHAR(20),
  course_id INT REFERENCES courses(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);



-- ===================================
-- ANONYMOUS FEEDBACK TABLE
CREATE TABLE anonymous_feedback (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id),
  receiver_id INT REFERENCES users(id),
  category VARCHAR(50),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- REPORTS TABLE
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES messages(id),
  reporter_id INT REFERENCES users(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ===================================
-- PASSWORD RESET CODES
CREATE TABLE password_reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_reset_code_email ON password_reset_codes(email);
CREATE INDEX idx_reset_code_expires ON password_reset_codes(expires_at);

-- ===================================
-- LOGIN VERIFICATION CODES
CREATE TABLE login_verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_verification_email ON login_verification_codes(email);
CREATE INDEX idx_login_verification_code ON login_verification_codes(code);
CREATE INDEX idx_login_verification_expires ON login_verification_codes(expires_at);
