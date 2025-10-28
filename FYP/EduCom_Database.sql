
-- EduCom Database Schema (PostgreSQL)
-- ===================================

-- Drop existing tables to reset schema
DROP TABLE IF EXISTS reports, anonymous_feedback, notifications, transactions, marketplace_items, submissions, assignments, messages, communities, enrollments, courses, users CASCADE;

-- ===================================
-- USERS TABLE
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  reg_id VARCHAR(20) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('Admin', 'Teacher', 'Student', 'HOD', 'PM')),
  department VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (reg_id, full_name, email, password_hash, role, department) VALUES
('2212141', 'Anmol Kumari', 'bcsbs2212141@szabist.pk', 'hashed_pwd', 'Student', 'BBA'),
('2212263', 'Pawan Mahesh', 'bcsbs2212263@szabist.pk', 'hashed_pwd', 'Student', 'CS'),
('T001', 'Ali Mobin', 'ali.mobin@szabist.pk', 'hashed_pwd', 'Teacher', 'CS'),
('A001', 'Admin User', 'admin@szabist.pk', 'hashed_pwd', 'Admin', 'IT');

-- ===================================
-- COURSES TABLE
CREATE TABLE courses (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  semester VARCHAR(20),
  teacher_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses (course_code, course_name, department, semester, teacher_id) VALUES
('CS101', 'Intro to Programming', 'CS', 'Fall 2025', 3),
('BBA201', 'Marketing Principles', 'BBA', 'Fall 2025', NULL);

-- ===================================
-- ENROLLMENTS TABLE
CREATE TABLE enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
  student_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  enrolled_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, student_id)
);

INSERT INTO enrollments (course_id, student_id) VALUES
(1, 2),
(2, 1);

-- ===================================
-- COMMUNITIES TABLE
CREATE TABLE communities (
  community_id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO communities (course_id, name) VALUES
(1, 'CS101 Community'),
(2, 'BBA201 Community');

-- ===================================
-- MESSAGES TABLE
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  community_id INT REFERENCES communities(community_id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'approved',
  flagged_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO messages (community_id, sender_id, content, is_anonymous) VALUES
(1, 2, 'Hello everyone!', FALSE),
(2, 1, 'Can we reschedule our class?', TRUE);

-- ===================================
-- ASSIGNMENTS TABLE
CREATE TABLE assignments (
  assignment_id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
  title VARCHAR(100),
  description TEXT,
  deadline TIMESTAMP,
  created_by INT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO assignments (course_id, title, description, deadline, created_by) VALUES
(1, 'Project Proposal', 'Submit your project proposal.', '2025-11-15 23:59:00', 3);

-- ===================================
-- SUBMISSIONS TABLE
CREATE TABLE submissions (
  submission_id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  student_id INT REFERENCES users(user_id),
  file_url TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(10),
  feedback TEXT
);

INSERT INTO submissions (assignment_id, student_id, file_url, grade, feedback) VALUES
(1, 2, 'uploads/proposal_pawan.pdf', 'A', 'Well written!');

-- ===================================
-- MARKETPLACE TABLES
CREATE TABLE marketplace_items (
  item_id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES users(user_id),
  title VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO marketplace_items (seller_id, title, description, price, status) VALUES
(2, 'Used Laptop', 'Dell Inspiron 15, good condition', 55000, 'approved');

CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  item_id INT REFERENCES marketplace_items(item_id),
  buyer_id INT REFERENCES users(user_id),
  payment_ref VARCHAR(100),
  amount NUMERIC(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (item_id, buyer_id, payment_ref, amount, status) VALUES
(1, 1, 'PAYFAST-12345', 55000, 'Completed');

-- ===================================
-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(user_id),
  subject VARCHAR(150),
  message TEXT,
  target_role VARCHAR(20),
  course_id INT REFERENCES courses(course_id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notifications (sender_id, subject, message, target_role, course_id) VALUES
(4, 'Welcome to EduCom', 'Platform access is now open.', 'All', NULL);

-- ===================================
-- ANONYMOUS FEEDBACK TABLE
CREATE TABLE anonymous_feedback (
  feedback_id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(user_id),
  receiver_id INT REFERENCES users(user_id),
  category VARCHAR(50),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO anonymous_feedback (sender_id, receiver_id, category, message) VALUES
(2, 3, 'Suggestion', 'Please share lecture slides earlier.');

-- ===================================
-- REPORTS TABLE
CREATE TABLE reports (
  report_id SERIAL PRIMARY KEY,
  message_id INT REFERENCES messages(message_id),
  reporter_id INT REFERENCES users(user_id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO reports (message_id, reporter_id, reason, status) VALUES
(2, 4, 'Inappropriate language', 'Reviewed');
