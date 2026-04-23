-- ============================================================
-- PostgreSQL Database Schema (Structure Only)
-- Dumped from database version 17.4
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;


-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.users (
    id            SERIAL PRIMARY KEY,
    reg_id        VARCHAR(20) UNIQUE,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(72) NOT NULL,
    role          VARCHAR(20),
    department    VARCHAR(50),
    semester      SMALLINT,
    program_year  SMALLINT,
    section       VARCHAR(10),
    last_login    TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP,
    is_active     BOOLEAN DEFAULT TRUE,
    CONSTRAINT users_role_check            CHECK (role = ANY (ARRAY['Admin','Teacher','Student','HOD','PM'])),
    CONSTRAINT users_semester_check        CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT users_program_year_check    CHECK (program_year BETWEEN 1 AND 4),
    CONSTRAINT check_student_has_semester  CHECK (role <> 'Student' OR semester IS NOT NULL),
    CONSTRAINT check_pm_has_program_year   CHECK (role <> 'PM' OR program_year IS NOT NULL)
);

CREATE TABLE public.courses (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(20) NOT NULL UNIQUE,
    name         VARCHAR(100) NOT NULL,
    department   VARCHAR(50),
    semester     VARCHAR(20),
    teacher_id   INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP
);

CREATE TABLE public.communities (
    id          SERIAL PRIMARY KEY,
    course_id   INTEGER,
    name        VARCHAR(100),
    join_code   VARCHAR(8) NOT NULL UNIQUE,
    status      VARCHAR(20) DEFAULT 'active',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.enrollments (
    id          SERIAL PRIMARY KEY,
    course_id   INTEGER,
    student_id  INTEGER,
    status      VARCHAR(20) DEFAULT 'active',
    grade       VARCHAR(5),
    enrolled_by INTEGER,
    enrolled_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_course_student_unique UNIQUE (course_id, student_id),
    CONSTRAINT enrollments_status_check CHECK (status = ANY (ARRAY['active','dropped','completed']))
);

CREATE TABLE public.assignments (
    id          SERIAL PRIMARY KEY,
    course_id   INTEGER,
    title       VARCHAR(100),
    description TEXT,
    deadline    TIMESTAMP,
    created_by  INTEGER,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.submissions (
    id             SERIAL PRIMARY KEY,
    assignment_id  INTEGER,
    student_id     INTEGER,
    file_url       TEXT NOT NULL,
    submitted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade          VARCHAR(10),
    feedback       TEXT
);

CREATE TABLE public.messages (
    id             SERIAL PRIMARY KEY,
    community_id   INTEGER,
    receiver_id    INTEGER,
    sender_id      INTEGER,
    content        TEXT NOT NULL,
    is_anonymous   BOOLEAN DEFAULT FALSE,
    is_read        BOOLEAN DEFAULT FALSE,
    status         VARCHAR(20) DEFAULT 'approved',
    flagged_reason TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at   TIMESTAMP,
    read_at        TIMESTAMP,
    CONSTRAINT chk_message_type CHECK (
        (community_id IS NOT NULL AND receiver_id IS NULL) OR
        (community_id IS NULL AND receiver_id IS NOT NULL)
    )
);

CREATE TABLE public.notifications (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER,
    sender_id    INTEGER,
    title        VARCHAR(150) NOT NULL,
    message      TEXT NOT NULL,
    type         VARCHAR(20) DEFAULT 'info',
    is_read      BOOLEAN DEFAULT FALSE,
    target_role  VARCHAR(20),
    course_id    INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.anonymous_feedback (
    id           SERIAL PRIMARY KEY,
    sender_id    INTEGER,
    receiver_id  INTEGER,
    category     VARCHAR(50),
    message      TEXT,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.reports (
    id           SERIAL PRIMARY KEY,
    message_id   INTEGER,
    reporter_id  INTEGER,
    reason       TEXT,
    status       VARCHAR(20) DEFAULT 'Pending',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.marketplace_items (
    id          SERIAL PRIMARY KEY,
    seller_id   INTEGER,
    title       VARCHAR(100),
    description TEXT,
    price       NUMERIC(10,2),
    image_url   TEXT,
    status      VARCHAR(20) DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.transactions (
    id           SERIAL PRIMARY KEY,
    item_id      INTEGER,
    buyer_id     INTEGER,
    payment_ref  VARCHAR(100),
    amount       NUMERIC(10,2),
    status       VARCHAR(20),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.course_requests (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(20) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    department    VARCHAR(50),
    semester      VARCHAR(20),
    teacher_id    INTEGER,
    requested_by  INTEGER,
    status        VARCHAR(20) DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_requests_status_check CHECK (status = ANY (ARRAY['pending','approved','rejected']))
);

CREATE TABLE public.registration_requests (
    id            SERIAL PRIMARY KEY,
    reg_id        VARCHAR(20) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password      VARCHAR(72) NOT NULL,
    role          VARCHAR(20),
    department    VARCHAR(50),
    semester      SMALLINT,
    program_year  SMALLINT,
    status        VARCHAR(20) DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registration_requests_role_check         CHECK (role = ANY (ARRAY['Teacher','Student','HOD','PM'])),
    CONSTRAINT registration_requests_semester_check     CHECK (semester BETWEEN 1 AND 8),
    CONSTRAINT registration_requests_program_year_check CHECK (program_year BETWEEN 1 AND 4),
    CONSTRAINT registration_requests_status_check       CHECK (status = ANY (ARRAY['pending','approved','rejected']))
);

CREATE TABLE public.login_verification_codes (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.password_reset_codes (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.activity_logs (
    id           SERIAL PRIMARY KEY,
    action_type  VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INTEGER,
    entity_name  VARCHAR(255),
    performed_by VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE public.courses
    ADD CONSTRAINT courses_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.communities
    ADD CONSTRAINT communities_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
    ADD CONSTRAINT enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT enrollments_enrolled_by_fkey
    FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.assignments
    ADD CONSTRAINT assignments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
    ADD CONSTRAINT assignments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE,
    ADD CONSTRAINT submissions_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.users(id);

ALTER TABLE public.messages
    ADD CONSTRAINT messages_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE,
    ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT notifications_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.users(id),
    ADD CONSTRAINT notifications_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.users(id),
    ADD CONSTRAINT anonymous_feedback_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.users(id);

ALTER TABLE public.reports
    ADD CONSTRAINT reports_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES public.messages(id),
    ADD CONSTRAINT reports_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.users(id);

ALTER TABLE public.marketplace_items
    ADD CONSTRAINT marketplace_items_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.users(id);

ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id),
    ADD CONSTRAINT transactions_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES public.users(id);

ALTER TABLE public.course_requests
    ADD CONSTRAINT course_requests_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL,
    ADD CONSTRAINT course_requests_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email        ON public.users        (email);
CREATE INDEX idx_users_role         ON public.users        (role);
CREATE INDEX idx_users_department   ON public.users        (department);

CREATE INDEX idx_courses_teacher    ON public.courses      (teacher_id);
CREATE INDEX idx_courses_department ON public.courses      (department);

CREATE INDEX idx_enrollments_course  ON public.enrollments (course_id);
CREATE INDEX idx_enrollments_student ON public.enrollments (student_id);
CREATE INDEX idx_enrollments_status  ON public.enrollments (status);

CREATE INDEX idx_messages_community    ON public.messages (community_id);
CREATE INDEX idx_messages_sender       ON public.messages (sender_id);
CREATE INDEX idx_messages_receiver     ON public.messages (receiver_id);
CREATE INDEX idx_messages_delivered_at ON public.messages (delivered_at);
CREATE INDEX idx_messages_read_at      ON public.messages (read_at);
CREATE INDEX idx_messages_direct       ON public.messages (sender_id, receiver_id) WHERE community_id IS NULL;

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications (is_read);

CREATE INDEX idx_course_requests_teacher ON public.course_requests (teacher_id);
CREATE INDEX idx_course_requests_status  ON public.course_requests (status);

CREATE INDEX idx_registration_requests_email  ON public.registration_requests (email);
CREATE INDEX idx_registration_requests_status ON public.registration_requests (status);

CREATE INDEX idx_login_verification_email   ON public.login_verification_codes (email);
CREATE INDEX idx_login_verification_code    ON public.login_verification_codes (code);
CREATE INDEX idx_login_verification_expires ON public.login_verification_codes (expires_at);

CREATE INDEX idx_reset_code_email   ON public.password_reset_codes (email);
CREATE INDEX idx_reset_code_expires ON public.password_reset_codes (expires_at);



-- 1. Add Category column for filtering (e.g., 'Textbook', 'Hardware', 'Notes')
ALTER TABLE public.marketplace_items 
ADD COLUMN category VARCHAR(50);

-- 2. Add Quantity column to track stock
ALTER TABLE public.marketplace_items 
ADD COLUMN quantity INTEGER DEFAULT 1;

-- 3. Add index for faster filtering by category
CREATE INDEX idx_marketplace_category ON public.marketplace_items (category);

-- 4. (Optional) Add a 'tags' column for better searchability
ALTER TABLE public.marketplace_items 
ADD COLUMN tags TEXT[];

ALTER TABLE public.marketplace_items 
DROP CONSTRAINT IF EXISTS marketplace_status_check;

ALTER TABLE public.marketplace_items 
ADD CONSTRAINT marketplace_status_check 
CHECK (status = ANY (ARRAY['pending', 'available', 'out_of_stock', 'sold']));