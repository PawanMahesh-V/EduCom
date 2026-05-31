--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer,
    entity_name character varying(255),
    performed_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: anonymous_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anonymous_feedback (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    category character varying(50),
    message text,
    is_anonymous boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.anonymous_feedback OWNER TO postgres;

--
-- Name: anonymous_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anonymous_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anonymous_feedback_id_seq OWNER TO postgres;

--
-- Name: anonymous_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anonymous_feedback_id_seq OWNED BY public.anonymous_feedback.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    course_id integer,
    title character varying(100),
    description text,
    deadline timestamp without time zone,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id integer,
    item_id integer,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communities (
    id integer NOT NULL,
    course_id integer,
    name character varying(100),
    join_code character varying(8) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.communities OWNER TO postgres;

--
-- Name: communities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communities_id_seq OWNER TO postgres;

--
-- Name: communities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communities_id_seq OWNED BY public.communities.id;


--
-- Name: course_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_requests (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    department character varying(50),
    semester character varying(20),
    teacher_id integer,
    requested_by integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.course_requests OWNER TO postgres;

--
-- Name: course_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_requests_id_seq OWNER TO postgres;

--
-- Name: course_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_requests_id_seq OWNED BY public.course_requests.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    department character varying(50),
    semester character varying(20),
    teacher_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    course_id integer,
    student_id integer,
    status character varying(20) DEFAULT 'active'::character varying,
    grade character varying(5),
    enrolled_by integer,
    enrolled_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'dropped'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: login_verification_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_verification_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.login_verification_codes OWNER TO postgres;

--
-- Name: login_verification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_verification_codes_id_seq OWNER TO postgres;

--
-- Name: login_verification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_verification_codes_id_seq OWNED BY public.login_verification_codes.id;


--
-- Name: marketplace_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_items (
    id integer NOT NULL,
    seller_id integer,
    title character varying(100),
    description text,
    price numeric(10,2),
    image_url text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(50),
    quantity integer DEFAULT 1,
    tags text[],
    CONSTRAINT marketplace_status_check CHECK (((status)::text = ANY (ARRAY['pending'::text, 'available'::text, 'out_of_stock'::text, 'sold'::text])))
);


ALTER TABLE public.marketplace_items OWNER TO postgres;

--
-- Name: marketplace_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_items_id_seq OWNER TO postgres;

--
-- Name: marketplace_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_items_id_seq OWNED BY public.marketplace_items.id;


--
-- Name: marketplace_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_order_items (
    id integer NOT NULL,
    order_id integer,
    item_id integer,
    title character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE public.marketplace_order_items OWNER TO postgres;

--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_order_items_id_seq OWNER TO postgres;

--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_order_items_id_seq OWNED BY public.marketplace_order_items.id;


--
-- Name: marketplace_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_orders (
    id integer NOT NULL,
    buyer_id integer,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    campus character varying(255) NOT NULL,
    pickup_note text,
    payment_method character varying(50) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_otp character varying(10),
    payment_id character varying(255),
    seller_id integer
);


ALTER TABLE public.marketplace_orders OWNER TO postgres;

--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.marketplace_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marketplace_orders_id_seq OWNER TO postgres;

--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.marketplace_orders_id_seq OWNED BY public.marketplace_orders.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    community_id integer,
    receiver_id integer,
    sender_id integer,
    content text NOT NULL,
    is_anonymous boolean DEFAULT false,
    is_read boolean DEFAULT false,
    status character varying(20) DEFAULT 'approved'::character varying,
    flagged_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    CONSTRAINT chk_message_type CHECK ((((community_id IS NOT NULL) AND (receiver_id IS NULL)) OR ((community_id IS NULL) AND (receiver_id IS NOT NULL))))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    sender_id integer,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    type character varying(20) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    target_role character varying(20),
    course_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false
);


ALTER TABLE public.password_reset_codes OWNER TO postgres;

--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_codes_id_seq OWNER TO postgres;

--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_codes_id_seq OWNED BY public.password_reset_codes.id;


--
-- Name: registration_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_requests (
    id integer NOT NULL,
    reg_id character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(72) NOT NULL,
    role character varying(20),
    department character varying(50),
    semester smallint,
    program_year smallint,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT registration_requests_program_year_check CHECK (((program_year >= 1) AND (program_year <= 4))),
    CONSTRAINT registration_requests_role_check CHECK (((role)::text = ANY ((ARRAY['Teacher'::character varying, 'Student'::character varying, 'HOD'::character varying, 'PM'::character varying])::text[]))),
    CONSTRAINT registration_requests_semester_check CHECK (((semester >= 1) AND (semester <= 8))),
    CONSTRAINT registration_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.registration_requests OWNER TO postgres;

--
-- Name: registration_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registration_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registration_requests_id_seq OWNER TO postgres;

--
-- Name: registration_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registration_requests_id_seq OWNED BY public.registration_requests.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    message_id integer,
    reporter_id integer,
    reason text,
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    assignment_id integer,
    student_id integer,
    file_url text NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grade character varying(10),
    feedback text
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    item_id integer,
    buyer_id integer,
    payment_ref character varying(100),
    amount numeric(10,2),
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    reg_id character varying(20),
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(72) NOT NULL,
    role character varying(20),
    department character varying(50),
    semester smallint,
    program_year smallint,
    section character varying(10),
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    is_active boolean DEFAULT true,
    CONSTRAINT check_pm_has_program_year CHECK ((((role)::text <> 'PM'::text) OR (program_year IS NOT NULL))),
    CONSTRAINT check_student_has_semester CHECK ((((role)::text <> 'Student'::text) OR (semester IS NOT NULL))),
    CONSTRAINT users_program_year_check CHECK (((program_year >= 1) AND (program_year <= 4))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Admin'::character varying, 'Teacher'::character varying, 'Student'::character varying, 'HOD'::character varying, 'PM'::character varying])::text[]))),
    CONSTRAINT users_semester_check CHECK (((semester >= 1) AND (semester <= 8)))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    id integer NOT NULL,
    user_id integer,
    item_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Name: wishlists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wishlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wishlists_id_seq OWNER TO postgres;

--
-- Name: wishlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wishlists_id_seq OWNED BY public.wishlists.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: anonymous_feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anonymous_feedback ALTER COLUMN id SET DEFAULT nextval('public.anonymous_feedback_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: communities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities ALTER COLUMN id SET DEFAULT nextval('public.communities_id_seq'::regclass);


--
-- Name: course_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_requests ALTER COLUMN id SET DEFAULT nextval('public.course_requests_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: login_verification_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_verification_codes ALTER COLUMN id SET DEFAULT nextval('public.login_verification_codes_id_seq'::regclass);


--
-- Name: marketplace_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_items ALTER COLUMN id SET DEFAULT nextval('public.marketplace_items_id_seq'::regclass);


--
-- Name: marketplace_order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_order_items ALTER COLUMN id SET DEFAULT nextval('public.marketplace_order_items_id_seq'::regclass);


--
-- Name: marketplace_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_orders ALTER COLUMN id SET DEFAULT nextval('public.marketplace_orders_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: password_reset_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_codes ALTER COLUMN id SET DEFAULT nextval('public.password_reset_codes_id_seq'::regclass);


--
-- Name: registration_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_requests ALTER COLUMN id SET DEFAULT nextval('public.registration_requests_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wishlists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists ALTER COLUMN id SET DEFAULT nextval('public.wishlists_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: anonymous_feedback anonymous_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_user_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_item_id_key UNIQUE (user_id, item_id);


--
-- Name: communities communities_join_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_join_code_key UNIQUE (join_code);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: course_requests course_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_requests
    ADD CONSTRAINT course_requests_pkey PRIMARY KEY (id);


--
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_course_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: login_verification_codes login_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_verification_codes
    ADD CONSTRAINT login_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: marketplace_items marketplace_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_order_items marketplace_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_orders marketplace_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: registration_requests registration_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_requests
    ADD CONSTRAINT registration_requests_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_reg_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_reg_id_key UNIQUE (reg_id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_user_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_item_id_key UNIQUE (user_id, item_id);


--
-- Name: idx_course_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_requests_status ON public.course_requests USING btree (status);


--
-- Name: idx_course_requests_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_requests_teacher ON public.course_requests USING btree (teacher_id);


--
-- Name: idx_courses_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_department ON public.courses USING btree (department);


--
-- Name: idx_courses_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_teacher ON public.courses USING btree (teacher_id);


--
-- Name: idx_enrollments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id);


--
-- Name: idx_login_verification_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_verification_code ON public.login_verification_codes USING btree (code);


--
-- Name: idx_login_verification_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_verification_email ON public.login_verification_codes USING btree (email);


--
-- Name: idx_login_verification_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_verification_expires ON public.login_verification_codes USING btree (expires_at);


--
-- Name: idx_marketplace_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_marketplace_category ON public.marketplace_items USING btree (category);


--
-- Name: idx_messages_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_community ON public.messages USING btree (community_id);


--
-- Name: idx_messages_delivered_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_delivered_at ON public.messages USING btree (delivered_at);


--
-- Name: idx_messages_direct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_direct ON public.messages USING btree (sender_id, receiver_id) WHERE (community_id IS NULL);


--
-- Name: idx_messages_read_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_read_at ON public.messages USING btree (read_at);


--
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_registration_requests_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registration_requests_email ON public.registration_requests USING btree (email);


--
-- Name: idx_registration_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registration_requests_status ON public.registration_requests USING btree (status);


--
-- Name: idx_reset_code_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_code_email ON public.password_reset_codes USING btree (email);


--
-- Name: idx_reset_code_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_code_expires ON public.password_reset_codes USING btree (expires_at);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department ON public.users USING btree (department);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: anonymous_feedback anonymous_feedback_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: anonymous_feedback anonymous_feedback_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anonymous_feedback
    ADD CONSTRAINT anonymous_feedback_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cart_items cart_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: communities communities_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_requests course_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_requests
    ADD CONSTRAINT course_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: course_requests course_requests_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_requests
    ADD CONSTRAINT course_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: courses courses_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_enrolled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_items marketplace_items_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: marketplace_order_items marketplace_order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) ON DELETE SET NULL;


--
-- Name: marketplace_order_items marketplace_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: marketplace_orders marketplace_orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id);


--
-- Name: wishlists wishlists_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

