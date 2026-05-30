-- =============================================================================
-- EduCom Database Schema
-- PostgreSQL 17 | Schema only (no data)
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- =============================================================================
-- SEQUENCES
-- =============================================================================

CREATE SEQUENCE public.activity_logs_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.anonymous_feedback_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.assignments_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.cart_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.communities_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.community_members_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.course_requests_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.courses_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.enrollments_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.login_verification_codes_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.marketplace_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.marketplace_order_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.marketplace_orders_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.messages_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.notifications_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.password_reset_codes_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.registration_requests_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.reports_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.submissions_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.transactions_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE public.users_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE public.activity_logs (
    id          integer NOT NULL DEFAULT nextval('public.activity_logs_id_seq'),
    action_type character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id   integer,
    entity_name character varying(255),
    performed_by character varying(255),
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.anonymous_feedback (
    id          integer NOT NULL DEFAULT nextval('public.anonymous_feedback_id_seq'),
    sender_id   integer,
    receiver_id integer,
    category    character varying(50),
    message     text,
    is_anonymous boolean DEFAULT true,
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.assignments (
    id          integer NOT NULL DEFAULT nextval('public.assignments_id_seq'),
    course_id   integer,
    title       character varying(100),
    description text,
    deadline    timestamp without time zone,
    created_by  integer,
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.cart_items (
    id         integer NOT NULL DEFAULT nextval('public.cart_items_id_seq'),
    user_id    integer,
    item_id    integer,
    quantity   integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.communities (
    id         integer NOT NULL DEFAULT nextval('public.communities_id_seq'),
    course_id  integer,
    name       character varying(100),
    join_code  character varying(8) NOT NULL,
    status     character varying(20) DEFAULT 'active',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.community_members (
    id           integer NOT NULL DEFAULT nextval('public.community_members_id_seq'),
    community_id integer,
    user_id      integer,
    role         character varying(20) DEFAULT 'member',
    joined_at    timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.course_requests (
    id           integer NOT NULL DEFAULT nextval('public.course_requests_id_seq'),
    code         character varying(20) NOT NULL,
    name         character varying(100) NOT NULL,
    department   character varying(50),
    semester     character varying(20),
    teacher_id   integer,
    requested_by integer,
    status       character varying(20) DEFAULT 'pending',
    created_at   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE public.courses (
    id          integer NOT NULL DEFAULT nextval('public.courses_id_seq'),
    code        character varying(20) NOT NULL,
    name        character varying(100) NOT NULL,
    department  character varying(50),
    semester    character varying(20),
    teacher_id  integer,
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at  timestamp without time zone
);

CREATE TABLE public.enrollments (
    id          integer NOT NULL DEFAULT nextval('public.enrollments_id_seq'),
    course_id   integer,
    student_id  integer,
    status      character varying(20) DEFAULT 'active',
    grade       character varying(5),
    enrolled_by integer,
    enrolled_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_status_check CHECK (status IN ('active', 'dropped', 'completed'))
);

CREATE TABLE public.login_verification_codes (
    id         integer NOT NULL DEFAULT nextval('public.login_verification_codes_id_seq'),
    email      character varying(255) NOT NULL,
    code       character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used       boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.marketplace_items (
    id          integer NOT NULL DEFAULT nextval('public.marketplace_items_id_seq'),
    seller_id   integer,
    title       character varying(100),
    description text,
    price       numeric(10,2),
    image_url   text,
    status      character varying(20) DEFAULT 'pending',
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category    character varying(50),
    quantity    integer DEFAULT 1,
    tags        text[],
    CONSTRAINT marketplace_status_check CHECK (status IN ('pending', 'available', 'out_of_stock', 'sold'))
);

CREATE TABLE public.marketplace_order_items (
    id       integer NOT NULL DEFAULT nextval('public.marketplace_order_items_id_seq'),
    order_id integer,
    item_id  integer,
    title    character varying(255) NOT NULL,
    price    numeric(10,2) NOT NULL,
    quantity integer NOT NULL
);

CREATE TABLE public.marketplace_orders (
    id             integer NOT NULL DEFAULT nextval('public.marketplace_orders_id_seq'),
    buyer_id       integer,
    full_name      character varying(255) NOT NULL,
    email          character varying(255) NOT NULL,
    phone          character varying(50) NOT NULL,
    campus         character varying(255) NOT NULL,
    pickup_note    text,
    payment_method character varying(50) NOT NULL,
    total_amount   numeric(10,2) NOT NULL,
    status         character varying(50) DEFAULT 'pending',
    created_at     timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_otp   character varying(10)
);

CREATE TABLE public.messages (
    id           integer NOT NULL DEFAULT nextval('public.messages_id_seq'),
    community_id integer,
    receiver_id  integer,
    sender_id    integer,
    content      text NOT NULL,
    is_anonymous boolean DEFAULT false,
    is_read      boolean DEFAULT false,
    status       character varying(20) DEFAULT 'approved',
    flagged_reason text,
    created_at   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivered_at timestamp without time zone,
    read_at      timestamp without time zone,
    CONSTRAINT chk_message_type CHECK (
        (community_id IS NOT NULL AND receiver_id IS NULL) OR
        (community_id IS NULL AND receiver_id IS NOT NULL)
    )
);

CREATE TABLE public.notifications (
    id          integer NOT NULL DEFAULT nextval('public.notifications_id_seq'),
    user_id     integer,
    sender_id   integer,
    title       character varying(150) NOT NULL,
    message     text NOT NULL,
    type        character varying(20) DEFAULT 'info',
    is_read     boolean DEFAULT false,
    target_role character varying(20),
    course_id   integer,
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.password_reset_codes (
    id         integer NOT NULL DEFAULT nextval('public.password_reset_codes_id_seq'),
    email      character varying(255) NOT NULL,
    code       character varying(6) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    used       boolean DEFAULT false
);

CREATE TABLE public.registration_requests (
    id           integer NOT NULL DEFAULT nextval('public.registration_requests_id_seq'),
    reg_id       character varying(20) NOT NULL,
    name         character varying(100) NOT NULL,
    email        character varying(100) NOT NULL,
    password     character varying(72) NOT NULL,
    role         character varying(20),
    department   character varying(50),
    semester     smallint,
    program_year smallint,
    status       character varying(20) DEFAULT 'pending',
    created_at   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registration_requests_role_check CHECK (role IN ('Teacher', 'Student', 'HOD', 'PM')),
    CONSTRAINT registration_requests_semester_check CHECK (semester >= 1 AND semester <= 8),
    CONSTRAINT registration_requests_program_year_check CHECK (program_year >= 1 AND program_year <= 4),
    CONSTRAINT registration_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE public.reports (
    id          integer NOT NULL DEFAULT nextval('public.reports_id_seq'),
    message_id  integer,
    reporter_id integer,
    reason      text,
    status      character varying(20) DEFAULT 'Pending',
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.submissions (
    id            integer NOT NULL DEFAULT nextval('public.submissions_id_seq'),
    assignment_id integer,
    student_id    integer,
    file_url      text NOT NULL,
    submitted_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grade         character varying(10),
    feedback      text
);

CREATE TABLE public.transactions (
    id          integer NOT NULL DEFAULT nextval('public.transactions_id_seq'),
    item_id     integer,
    buyer_id    integer,
    payment_ref character varying(100),
    amount      numeric(10,2),
    status      character varying(20),
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.users (
    id           integer NOT NULL DEFAULT nextval('public.users_id_seq'),
    reg_id       character varying(20),
    name         character varying(100) NOT NULL,
    email        character varying(100) NOT NULL,
    password     character varying(72) NOT NULL,
    role         character varying(20),
    department   character varying(50),
    semester     smallint,
    program_year smallint,
    is_active    boolean DEFAULT true,
    created_at   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    join_code    character varying(8),
    CONSTRAINT users_role_check CHECK (role IN ('Student', 'Teacher', 'HOD', 'PM', 'Admin')),
    CONSTRAINT users_semester_check CHECK (semester >= 1 AND semester <= 8),
    CONSTRAINT users_program_year_check CHECK (program_year >= 1 AND program_year <= 4)
);

-- =============================================================================
-- PRIMARY KEYS
-- =============================================================================

ALTER TABLE ONLY public.activity_logs           ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.anonymous_feedback       ADD CONSTRAINT anonymous_feedback_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assignments              ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items               ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.communities              ADD CONSTRAINT communities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.community_members        ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.course_requests          ADD CONSTRAINT course_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.courses                  ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.enrollments              ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.login_verification_codes ADD CONSTRAINT login_verification_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.marketplace_items        ADD CONSTRAINT marketplace_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.marketplace_order_items  ADD CONSTRAINT marketplace_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.marketplace_orders       ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages                 ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications            ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.password_reset_codes     ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.registration_requests    ADD CONSTRAINT registration_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reports                  ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.submissions              ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transactions             ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users                    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users                    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.communities              ADD CONSTRAINT communities_join_code_key UNIQUE (join_code);
ALTER TABLE ONLY public.courses                  ADD CONSTRAINT courses_code_key UNIQUE (code);

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

ALTER TABLE ONLY public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_sender_id_fkey   FOREIGN KEY (sender_id)   REFERENCES public.users(id);
ALTER TABLE ONLY public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey   FOREIGN KEY (course_id)   REFERENCES public.courses(id);
ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey  FOREIGN KEY (created_by)  REFERENCES public.users(id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id);

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_user_id_fkey      FOREIGN KEY (user_id)      REFERENCES public.users(id);

ALTER TABLE ONLY public.course_requests
    ADD CONSTRAINT course_requests_teacher_id_fkey   FOREIGN KEY (teacher_id)   REFERENCES public.users(id);
ALTER TABLE ONLY public.course_requests
    ADD CONSTRAINT course_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey   FOREIGN KEY (course_id)   REFERENCES public.courses(id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey  FOREIGN KEY (student_id)  REFERENCES public.users(id);
ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id);
ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_item_id_fkey  FOREIGN KEY (item_id)  REFERENCES public.marketplace_items(id);

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey    FOREIGN KEY (sender_id)    REFERENCES public.users(id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey  FOREIGN KEY (receiver_id)  REFERENCES public.users(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey   FOREIGN KEY (user_id)   REFERENCES public.users(id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_message_id_fkey   FOREIGN KEY (message_id)  REFERENCES public.messages(id);
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey  FOREIGN KEY (reporter_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);
ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_student_id_fkey    FOREIGN KEY (student_id)    REFERENCES public.users(id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_item_id_fkey  FOREIGN KEY (item_id)  REFERENCES public.marketplace_items(id);
ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_messages_community_id ON public.messages(community_id);
CREATE INDEX idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id  ON public.messages(receiver_id);
CREATE INDEX idx_messages_status       ON public.messages(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX idx_community_members_user_id      ON public.community_members(user_id);
CREATE INDEX idx_reports_message_id    ON public.reports(message_id);
CREATE INDEX idx_reports_status        ON public.reports(status);
 