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
    delivery_otp character varying(10)
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
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, action_type, entity_type, entity_id, entity_name, performed_by, created_at) FROM stdin;
\.


--
-- Data for Name: anonymous_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anonymous_feedback (id, sender_id, receiver_id, category, message, is_anonymous, created_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, course_id, title, description, deadline, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, user_id, item_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communities (id, course_id, name, join_code, status, created_at) FROM stdin;
1	1	CS101-A Community	KVKELZJ5	active	2026-01-27 08:51:52.940456
2	2	CS402-A Community	I1RW7TGI	active	2026-01-27 08:52:21.211595
3	3	CS404-C Community	XPI7RNEP	active	2026-04-29 13:46:18.129774
4	4	CS201-A Community	EDF7IMYP	active	2026-04-29 13:46:20.574154
\.


--
-- Data for Name: course_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_requests (id, code, name, department, semester, teacher_id, requested_by, status, created_at) FROM stdin;
2	CS404-C	Final Year Project	CS	8	5	5	approved	2026-01-27 09:05:16.882356
1	CS201-A	Object Oriented Programming	CS	8	5	5	approved	2026-01-27 09:04:28.024785
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, name, department, semester, teacher_id, created_at, deleted_at) FROM stdin;
1	CS101-A	Intro to Programing	CS	1	5	2026-01-27 08:51:52.940456	\N
2	CS402-A	Physics	CS	5	5	2026-01-27 08:52:21.211595	\N
3	CS404-C	Final Year Project	CS	8	5	2026-04-29 13:46:18.129774	\N
4	CS201-A	Object Oriented Programming	CS	8	5	2026-04-29 13:46:20.574154	\N
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, course_id, student_id, status, grade, enrolled_by, enrolled_on, updated_at) FROM stdin;
1	2	3	active	\N	\N	2026-01-27 08:54:46.900493	2026-01-27 08:54:46.900493
7	1	9	active	\N	\N	2026-04-03 00:02:02.941621	2026-04-03 00:02:02.941621
8	4	3	active	\N	\N	2026-05-24 17:51:21.620195	2026-05-24 17:51:21.620195
\.


--
-- Data for Name: login_verification_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_verification_codes (id, email, code, expires_at, used, created_at) FROM stdin;
1	bcsbs2212148@szabist.pk	460966	2026-01-27 08:46:51.102	t	2026-01-27 08:36:55.652864
2	bcsbs2212341@szabist.pk	233297	2026-01-27 08:49:00.775	t	2026-01-27 08:39:04.113508
3	bcsbs2212271@szabist.pk	263878	2026-01-27 08:49:43.07	t	2026-01-27 08:39:48.029336
4	bcsbs2212260@szabist.pk	212770	2026-01-27 09:02:58.908	t	2026-01-27 08:52:58.909815
5	bcsbs2212151@szabist.pk	890613	2026-01-27 09:03:58.765	t	2026-01-27 08:53:58.766276
6	bsse2280156@szabist.pk	277920	2026-01-27 09:16:28.069	t	2026-01-27 09:06:31.387347
7	admin@szabist.pk	635012	2026-01-27 10:30:32.958	t	2026-01-27 10:20:36.497825
8	bcsbs2212263@szabist.pk	695706	2026-01-27 12:10:14.614	t	2026-01-27 12:00:14.618922
9	bcsbs2212151@szabist.pk	236330	2026-01-27 12:14:01.303	t	2026-01-27 12:04:01.304561
10	bcsbs2212260@szabist.pk	640650	2026-01-27 12:18:22.451	t	2026-01-27 12:08:22.453274
11	bcsbs2212340@szabist.pk	609113	2026-03-12 21:19:14.636	t	2026-03-12 21:09:14.711409
12	testuser@szabist.pk	193714	2026-04-29 12:34:35.698	f	2026-04-29 12:24:35.749382
13	admin@szabist.pk	825570	2026-04-29 15:37:48.559	t	2026-04-29 15:27:48.608167
14	admin1@szabist.pk	928436	2026-05-24 16:32:36.631	t	2026-05-24 16:22:36.70938
\.


--
-- Data for Name: marketplace_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_items (id, seller_id, title, description, price, image_url, status, created_at, category, quantity, tags) FROM stdin;
1	6	Demo	amazing item	100.00	http://localhost:5000/uploads/marketplace/image-1776964355349-421543464.png	available	2026-04-23 22:12:35.445724	Equipment	3	{}
7	1	Book 	Demo Testing \r\n	10000.00	\N	available	2026-05-08 21:27:01.130797	Other	3	{}
\.


--
-- Data for Name: marketplace_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_order_items (id, order_id, item_id, title, price, quantity) FROM stdin;
2	1	1	Demo	100.00	1
3	2	1	Demo	100.00	1
4	3	1	Demo	100.00	1
1	1	\N	clas	1000.00	1
5	4	\N	clas	1000.00	1
6	5	\N	clas	1000.00	1
7	6	\N	clas	1000.00	1
8	7	\N	DEmo	1000.00	1
9	8	\N	DEmo	1000.00	1
10	9	\N	Test	1000.00	1
12	10	\N	Test	1000.00	1
11	10	\N	demo	10000.00	2
13	11	7	Book 	10000.00	1
14	12	7	Book 	10000.00	1
15	13	7	Book 	10000.00	1
16	14	7	Book 	10000.00	1
17	15	1	Demo	100.00	1
18	16	1	Demo	100.00	1
19	17	1	Demo	100.00	1
20	18	1	Demo	100.00	1
21	19	1	Demo	100.00	1
22	20	1	Demo	100.00	1
23	21	1	Demo	100.00	1
24	22	1	Demo	100.00	1
25	23	1	Demo	100.00	1
26	24	1	Demo	100.00	1
27	25	7	Book 	10000.00	1
28	26	7	Book 	10000.00	1
29	27	7	Book 	10000.00	1
30	28	7	Book 	10000.00	1
31	29	7	Book 	10000.00	1
32	30	7	Book 	10000.00	1
33	31	7	Book 	10000.00	1
34	32	7	Book 	10000.00	1
35	33	1	Demo	100.00	1
36	34	1	Demo	100.00	1
37	34	7	Book 	10000.00	1
38	35	7	Book 	10000.00	1
\.


--
-- Data for Name: marketplace_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_orders (id, buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, status, created_at, delivery_otp) FROM stdin;
12	5	Munesh Kumar	bcsbs2212260@szabist.pk	03333333333	SZABIST Campus		payfast	10000.00	cancelled	2026-05-11 04:45:51.747037	562866
16	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	100.00	refunded	2026-05-18 12:56:21.094779	904339
1	5	Munesh Kumar	bcsbs2212260@szabist.pk	56454	SZABIST Campus		cod	1100.00	cancelled_by_buyer	2026-04-29 12:34:36.319295	\N
25	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	pending_payment	2026-05-21 14:21:41.238256	617593
2	5	Munesh Kumar	bcsbs2212260@szabist.pk	ADDSAD	SZABIST Campus		cod	100.00	completed	2026-04-29 12:54:53.658924	\N
3	5	Munesh Kumar	bcsbs2212260@szabist.pk	sdfsfd	SZABIST Campus		cod	100.00	completed	2026-04-29 13:06:04.583321	\N
26	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	pending_payment	2026-05-21 14:24:17.711588	410646
27	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	pending_payment	2026-05-21 14:36:42.285362	907600
28	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	pending_payment	2026-05-21 15:16:03.252365	658757
4	5	Munesh Kumar	bcsbs2212260@szabist.pk	03000	SZABIST Campus		cod	1000.00	cancelled	2026-04-29 13:11:54.831724	\N
5	5	Munesh Kumar	bcsbs2212260@szabist.pk	asdasd	SZABIST Campus		cod	1000.00	completed	2026-04-29 13:20:11.984254	360212
6	5	Munesh Kumar	bcsbs2212260@szabist.pk	sd	SZABIST Campus		cod	1000.00	completed	2026-04-29 13:24:08.263296	980923
7	5	Munesh Kumar	bcsbs2212260@szabist.pk	0303303	SZABIST Campus		cod	1000.00	completed	2026-04-29 16:13:19.019588	380290
8	5	Munesh Kumar	bcsbs2212260@szabist.pk	03330303030	SZABIST Campus		cod	1000.00	delivered	2026-04-29 20:05:21.179329	822651
9	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	Main Library		payfast	1000.00	completed	2026-05-04 12:40:34.693421	937519
10	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	100 Campus		cod	21000.00	completed	2026-05-04 15:27:48.975844	501800
11	5	Munesh Kumar	bcsbs2212260@szabist.pk	03333333333	SZABIST Campus		payfast	10000.00	pending_payment	2026-05-11 04:35:25.87669	685737
17	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		cod	100.00	completed	2026-05-18 12:57:44.514436	327302
32	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	cancelled_by_buyer	2026-05-21 15:45:15.823402	723529
31	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	cancelled_by_buyer	2026-05-21 15:33:29.318538	445912
15	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	100.00	cancelled	2026-05-18 12:49:15.366661	144724
14	5	Munesh Kumar	bcsbs2212260@szabist.pk	03330303030	SZABIST Campus		payfast	10000.00	cancelled	2026-05-11 04:50:01.087098	183424
13	5	Munesh Kumar	bcsbs2212260@szabist.pk	03330303030	SZABIST Campus		payfast	10000.00	cancelled	2026-05-11 04:47:31.590694	434377
33	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	completed	2026-05-21 16:48:46.725645	492480
30	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	cancelled_by_buyer	2026-05-21 15:26:25.976715	859231
29	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330003320	SZABIST Campus		payfast	10000.00	cancelled_by_buyer	2026-05-21 15:22:26.325812	940746
24	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	completed	2026-05-21 14:14:48.322968	850433
22	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	cancelled	2026-05-21 14:04:39.347837	290404
21	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	cancelled	2026-05-21 13:56:06.967865	687176
20	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	cancelled	2026-05-21 13:35:47.71825	676849
19	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	cancelled	2026-05-21 13:33:06.952002	880713
18	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	99 Campus		payfast	100.00	cancelled	2026-05-21 12:51:52.574294	854381
23	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03302743615	SZABIST Campus		payfast	100.00	cancelled	2026-05-21 14:10:07.950272	741791
34	5	Munesh Kumar	bcsbs2212260@szabist.pk	03330303030	79 Campus		payfast	10100.00	completed	2026-05-24 18:34:17.334426	440669
35	6	Ahmed Ali Khokhar	bcsbs2212243@szabist.pk	03330003320	79 Campus		payfast	10000.00	completed	2026-05-24 20:04:00.802365	269466
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, community_id, receiver_id, sender_id, content, is_anonymous, is_read, status, flagged_reason, created_at, delivered_at, read_at) FROM stdin;
179	2	\N	5	ok	f	t	approved	\N	2026-04-13 21:17:33.638777	\N	\N
218	1	\N	5	.	f	t	approved	\N	2026-04-15 19:54:15.86621	\N	\N
180	2	\N	5	hello	f	t	approved	\N	2026-04-13 21:17:59.543497	\N	\N
238	\N	1	3	bc	f	t	rejected	\N	2026-04-20 10:26:18.680822	2026-04-20 10:26:54.700422	2026-04-20 10:26:54.678033
219	1	\N	3	mc	f	t	approved	\N	2026-04-16 19:18:27.805651	\N	\N
182	2	\N	5	helllo	f	t	approved	\N	2026-04-13 21:19:54.606043	\N	\N
130	1	\N	3	HELLO	f	t	approved	\N	2026-04-10 00:52:58.87343	\N	\N
221	1	\N	3	BC	f	t	rejected	\N	2026-04-16 19:20:14.447476	\N	\N
132	1	\N	3	BITCH	f	t	approved	\N	2026-04-10 00:53:28.025475	\N	\N
31	\N	1	2	hey	f	t	approved	\N	2026-03-05 21:31:15.153235	2026-03-12 22:39:01.439608	2026-03-05 21:31:15.153235
34	\N	1	2	are you serious	f	t	approved	\N	2026-03-05 21:34:34.293659	2026-03-12 22:39:01.440209	2026-03-05 21:34:34.293659
35	\N	1	2	yes	f	t	approved	\N	2026-03-05 21:37:05.583071	2026-03-12 22:39:01.590416	2026-03-05 21:37:05.583071
38	\N	1	2	.	f	t	approved	\N	2026-03-05 21:38:22.521126	2026-03-12 22:39:01.623757	2026-03-05 21:38:22.521126
40	\N	1	2	?	f	t	approved	\N	2026-03-05 21:41:12.720199	2026-03-12 22:39:01.630832	2026-03-05 21:41:12.720199
48	\N	1	2	hello	f	t	approved	\N	2026-03-06 02:16:45.517413	2026-03-12 22:39:01.63403	2026-03-06 02:16:45.517413
282	\N	5	1	teacher	f	t	approved	\N	2026-04-22 13:16:47.994364	2026-04-22 13:17:32.810875	2026-04-22 13:17:32.774809
79	1	\N	\N	hello	f	f	approved	\N	2026-03-13 01:18:58.294781	\N	\N
80	2	\N	\N	why	f	f	approved	\N	2026-03-13 01:19:13.579404	\N	\N
184	2	\N	5	hello	f	t	approved	\N	2026-04-13 21:29:07.898495	\N	\N
21	1	\N	\N	hwllo	f	f	approved	\N	2026-01-28 22:54:12.053853	\N	\N
22	1	\N	\N	hello	f	f	approved	\N	2026-01-28 22:54:16.752259	\N	\N
23	1	\N	\N	hello	f	f	approved	\N	2026-01-28 22:54:22.41983	\N	\N
107	1	\N	3	hey	f	t	approved	\N	2026-03-26 16:43:42.938547	\N	\N
19	2	\N	3	thank god	f	t	approved	\N	2026-01-27 12:13:38.842653	\N	\N
228	1	\N	5	yes	f	t	approved	\N	2026-04-16 19:35:11.04531	\N	\N
28	\N	8	3	hello	f	f	approved	\N	2026-02-11 18:57:22.439342	\N	\N
29	\N	8	3	hey there	t	f	approved	\N	2026-02-11 18:57:27.889574	\N	\N
226	1	\N	3	You are bitch	f	t	approved	\N	2026-04-16 19:23:55.806393	\N	\N
224	1	\N	3	mc	f	t	rejected	\N	2026-04-16 19:23:22.301794	\N	\N
231	\N	2	3	heek	f	f	approved	\N	2026-04-16 19:40:18.255103	\N	\N
223	1	\N	3	BC	f	t	rejected	\N	2026-04-16 19:23:19.031039	\N	\N
284	\N	1	5	hello	f	t	approved	\N	2026-04-22 13:17:36.555005	2026-04-22 13:17:36.586942	2026-04-22 13:17:36.683403
285	\N	1	5	.	f	t	approved	\N	2026-04-22 13:17:37.672436	2026-04-22 13:17:37.691613	2026-04-22 13:17:37.87556
117	1	\N	3	@munesh	f	t	approved	\N	2026-04-02 23:35:33.831318	\N	\N
119	1	\N	3	good	f	t	approved	\N	2026-04-03 00:03:43.138556	\N	\N
189	1	\N	5	kya	f	t	approved	\N	2026-04-13 21:47:39.337097	\N	\N
191	1	\N	5	kya	f	t	approved	\N	2026-04-13 21:47:51.883216	\N	\N
186	2	\N	3	chitiye	f	t	approved	\N	2026-04-13 21:46:43.480625	\N	\N
193	1	\N	5	ha	f	t	approved	\N	2026-04-13 21:53:14.995537	\N	\N
187	2	\N	3	chutiye	f	t	rejected	\N	2026-04-13 21:46:51.699266	\N	\N
236	\N	1	3	bc	f	t	rejected	\N	2026-04-19 22:18:54.307537	\N	2026-04-19 22:19:26.284099
287	\N	1	5	good	f	t	approved	\N	2026-04-22 13:17:51.495387	2026-04-22 13:17:51.514165	2026-04-22 13:17:51.568275
266	\N	2	1	bc	f	f	rejected	\N	2026-04-22 09:53:31.772997	\N	\N
289	\N	1	5	.	f	t	approved	\N	2026-04-22 13:23:31.848798	2026-04-22 13:23:31.863973	2026-04-22 13:30:29.250527
115	2	\N	3	hello	f	t	approved	\N	2026-04-02 22:15:35.601263	\N	\N
140	2	\N	3	yes	f	t	approved	\N	2026-04-10 01:34:30.798267	\N	\N
141	2	\N	3	fuck	f	t	rejected	\N	2026-04-10 01:34:34.267179	\N	\N
241	\N	1	3	hello	f	t	approved	\N	2026-04-20 11:13:04.676325	2026-04-20 11:13:04.687282	2026-04-20 11:13:17.757665
291	\N	5	1	.	f	t	approved	\N	2026-04-23 20:07:28.873324	2026-04-23 20:21:24.271045	2026-04-23 20:21:24.249044
295	\N	5	1	bc	f	t	rejected	\N	2026-04-23 20:20:24.884672	\N	2026-04-23 20:21:24.249044
246	\N	9	5	KVKELZJ5	f	f	approved	\N	2026-04-20 11:18:54.922459	\N	\N
247	\N	9	5	.	f	f	approved	\N	2026-04-20 11:19:00.140717	\N	\N
274	\N	5	3	hello	t	t	approved	\N	2026-04-22 12:55:30.850781	2026-04-22 12:55:30.86323	2026-04-22 12:55:30.891149
292	\N	5	1	m	f	t	approved	\N	2026-04-23 20:07:33.503488	2026-04-23 20:21:24.271151	2026-04-23 20:21:24.249044
59	\N	8	3	hello	f	f	approved	\N	2026-03-12 21:29:55.358025	\N	\N
234	\N	1	3	.	f	t	approved	\N	2026-04-19 22:16:04.913934	2026-04-19 22:16:04.926656	2026-04-19 22:16:41.357106
240	\N	1	3	bc	f	t	rejected	\N	2026-04-20 11:13:01.013383	\N	2026-04-20 11:13:17.757665
297	\N	1	5	bc	f	t	rejected	\N	2026-04-23 20:21:48.06183	\N	2026-04-23 21:35:17.767856
301	\N	1	5	bc	f	t	pending_review	\N	2026-04-29 14:33:14.026894	\N	2026-04-29 14:46:47.090393
5	2	\N	5	hey class	f	t	approved	\N	2026-01-27 09:02:59.705287	\N	2026-01-27 09:02:59.705287
8	2	\N	3	yes	f	t	approved	\N	2026-01-27 10:06:20.179583	\N	2026-01-27 10:06:20.179583
10	2	\N	5	hello	f	t	approved	\N	2026-01-27 12:10:25.516546	\N	2026-01-27 12:10:25.516546
12	2	\N	3	hello	f	t	approved	\N	2026-01-27 12:11:02.144695	\N	2026-01-27 12:11:02.144695
11	2	\N	5	hello	f	t	approved	\N	2026-01-27 12:10:35.047561	\N	2026-01-27 12:10:35.047561
13	2	\N	5	yes?	f	t	approved	\N	2026-01-27 12:12:14.381512	\N	2026-01-27 12:12:14.381512
17	1	\N	3	hello	f	t	approved	\N	2026-01-27 12:13:04.617795	\N	2026-01-27 12:13:04.617795
18	1	\N	3	is this code working	f	t	approved	\N	2026-01-27 12:13:18.214471	\N	2026-01-27 12:13:18.214471
14	2	\N	3	yes?	f	t	approved	\N	2026-01-27 12:12:29.424723	\N	2026-01-27 12:12:29.424723
15	2	\N	5	ok	f	t	approved	\N	2026-01-27 12:12:33.128085	\N	2026-01-27 12:12:33.128085
16	2	\N	5	done	f	t	approved	\N	2026-01-27 12:12:34.851834	\N	2026-01-27 12:12:34.851834
233	\N	1	3	hello	f	t	approved	\N	2026-04-19 22:16:00.939989	2026-04-19 22:16:00.97059	2026-04-19 22:16:41.357106
260	\N	1	5	.	f	t	rejected	\N	2026-04-20 22:47:17.711925	2026-04-20 22:47:17.714084	2026-04-20 22:49:42.503745
249	\N	1	3	hello	f	t	approved	\N	2026-04-20 11:26:11.790174	2026-04-20 11:26:11.806437	2026-04-20 11:26:24.449235
261	\N	1	5	bc	f	t	rejected	\N	2026-04-20 22:47:42.238682	\N	2026-04-20 22:49:42.503745
305	\N	5	1	mc	f	t	rejected	\N	2026-04-29 16:09:42.87311	\N	2026-04-29 20:13:44.783158
275	\N	5	3	.	f	t	approved	\N	2026-04-22 12:55:32.512359	2026-04-22 12:55:32.527625	2026-04-22 12:55:36.292061
258	\N	1	5	hello	f	t	rejected	\N	2026-04-20 22:47:08.546933	2026-04-20 22:47:08.574527	2026-04-20 22:49:42.503745
299	\N	6	1	hello	f	t	approved	\N	2026-04-23 23:42:05.472577	2026-05-18 13:11:44.610207	2026-05-18 13:11:44.592222
272	\N	10	3	.	f	f	approved	\N	2026-04-22 12:43:32.252912	\N	\N
268	\N	5	3	.	f	t	approved	\N	2026-04-22 12:43:03.641911	2026-04-22 12:43:03.659955	2026-04-22 12:43:43.6672
269	\N	5	3	.	f	t	approved	\N	2026-04-22 12:43:06.79503	2026-04-22 12:43:06.812907	2026-04-22 12:43:43.6672
265	\N	5	1	BC	f	t	rejected	\N	2026-04-21 13:40:26.79112	\N	2026-04-22 12:43:49.151711
263	\N	5	1	BC	f	t	rejected	\N	2026-04-21 11:41:36.410106	\N	2026-04-22 12:43:49.151711
277	\N	5	3	.	f	t	approved	\N	2026-04-22 13:06:27.007553	2026-04-22 13:06:27.028133	2026-04-22 13:06:27.085476
310	\N	2	1	HELLO	f	f	approved	\N	2026-05-24 16:57:38.74812	\N	\N
307	3	\N	6	 n	f	t	approved	\N	2026-05-21 20:55:24.173386	\N	\N
280	\N	5	3	testing	f	t	approved	\N	2026-04-22 13:06:41.0588	2026-04-22 13:06:41.062381	2026-04-22 13:06:41.114713
309	3	\N	6	fck	f	t	pending_review	\N	2026-05-21 20:55:34.626719	\N	\N
281	\N	5	3	good	f	t	approved	\N	2026-04-22 13:07:03.731431	2026-04-22 13:07:03.735283	2026-04-22 13:07:06.863236
312	4	\N	3	hello	f	t	approved	\N	2026-05-24 17:54:16.861521	\N	\N
253	\N	6	3	hello	f	t	approved	\N	2026-04-20 13:23:08.072221	2026-05-24 20:16:01.703734	2026-05-24 20:16:01.676152
306	\N	5	1	ullu ka patha	f	t	rejected	\N	2026-05-04 15:23:38.535958	\N	2026-05-24 21:25:58.978963
178	2	\N	5	yes	f	t	approved	\N	2026-04-13 21:17:32.010879	\N	\N
257	\N	9	3	hrllo	f	f	approved	\N	2026-04-20 13:23:53.136392	\N	\N
220	1	\N	3	bc	f	t	rejected	\N	2026-04-16 19:18:46.064497	\N	\N
222	1	\N	3	.	f	t	approved	\N	2026-04-16 19:20:38.998492	\N	\N
181	2	\N	5	hello	f	t	approved	\N	2026-04-13 21:19:36.959602	\N	\N
225	1	\N	3	You are btich 	f	t	approved	\N	2026-04-16 19:23:38.972088	\N	\N
129	1	\N	3	GANDU	f	t	rejected	\N	2026-04-10 00:51:19.301777	\N	\N
131	1	\N	3	GANDU	f	t	approved	\N	2026-04-10 00:53:04.115915	\N	\N
227	1	\N	3	hello	f	t	approved	\N	2026-04-16 19:34:59.130937	\N	\N
134	1	\N	3	BITCH 2	f	t	approved	\N	2026-04-10 01:01:11.102164	\N	\N
133	1	\N	3	BITCH	f	t	approved	\N	2026-04-10 01:01:06.627291	\N	\N
283	\N	5	1	.	f	t	approved	\N	2026-04-22 13:16:49.857568	2026-04-22 13:17:32.812925	2026-04-22 13:17:32.774809
135	1	\N	3	?	f	t	approved	\N	2026-04-10 01:01:28.412238	\N	\N
229	1	\N	5	mc	f	t	rejected	\N	2026-04-16 19:35:22.083471	\N	\N
230	1	\N	5	yes	f	t	approved	\N	2026-04-16 19:35:35.718915	\N	\N
232	\N	2	3	hello	f	f	approved	\N	2026-04-16 19:40:27.185216	\N	\N
286	\N	1	5	helo	f	t	approved	\N	2026-04-22 13:17:48.277979	2026-04-22 13:17:48.285849	2026-04-22 13:17:48.383095
136	1	\N	3	?	f	t	approved	\N	2026-04-10 01:01:30.733658	\N	\N
50	\N	1	2	yes ik	f	t	approved	\N	2026-03-06 02:16:56.026548	2026-03-12 22:39:01.637125	2026-03-06 02:16:56.026548
49	\N	1	2	no	f	t	approved	\N	2026-03-06 02:16:48.066834	2026-03-12 22:39:01.64617	2026-03-06 02:16:48.066834
112	2	\N	5	hello	f	t	approved	\N	2026-03-27 00:00:33.910556	\N	\N
77	2	\N	\N	yess	f	f	approved	\N	2026-03-13 01:18:45.906313	\N	\N
78	2	\N	\N	why?	f	f	approved	\N	2026-03-13 01:18:53.791839	\N	\N
137	1	\N	3	BITCH	f	t	approved	\N	2026-04-10 01:01:40.233964	\N	\N
118	1	\N	3	hey	f	t	approved	\N	2026-04-02 23:35:42.313394	\N	\N
120	1	\N	3	hello	f	t	approved	\N	2026-04-03 00:07:40.604085	\N	\N
139	1	\N	3	HELLO	f	t	approved	\N	2026-04-10 01:24:21.619155	\N	\N
235	\N	1	3	bc	f	t	rejected	\N	2026-04-19 22:16:09.461765	2026-04-19 22:16:41.377283	2026-04-19 22:16:41.357106
142	1	\N	3	chutiye	f	t	rejected	\N	2026-04-10 02:53:12.550859	\N	\N
237	\N	1	3	bc	f	t	rejected	\N	2026-04-19 22:45:13.092246	\N	2026-04-19 22:45:22.591471
185	2	\N	3	hello	f	t	approved	\N	2026-04-13 21:44:06.082611	\N	\N
300	\N	1	5	hello	f	t	pending_review	\N	2026-04-23 23:48:25.018908	2026-04-23 23:48:25.03681	2026-04-24 00:55:21.271453
290	\N	5	1	bc	f	t	rejected	\N	2026-04-22 13:30:44.54576	\N	2026-04-23 20:21:24.249044
196	1	\N	3	ok	f	t	approved	\N	2026-04-13 21:55:10.486642	\N	\N
197	1	\N	5	yes	f	t	approved	\N	2026-04-13 23:19:58.963015	\N	\N
294	\N	5	1	hello	f	t	approved	\N	2026-04-23 20:11:45.279056	2026-04-23 20:21:24.32496	2026-04-23 20:21:24.249044
293	\N	5	1	.	f	t	approved	\N	2026-04-23 20:11:43.241854	2026-04-23 20:21:24.325982	2026-04-23 20:21:24.249044
296	\N	1	5	bc	f	t	rejected	\N	2026-04-23 20:21:29.435698	\N	2026-04-23 21:35:17.767856
298	\N	1	5	bc	f	t	pending_review	\N	2026-04-23 21:35:34.226575	\N	2026-04-23 21:35:40.751804
245	\N	5	3	teacher	t	t	rejected	\N	2026-04-20 11:15:20.596229	2026-04-20 11:15:40.036896	2026-04-20 11:15:40.020594
116	2	\N	3	hello	f	t	approved	\N	2026-04-02 22:38:35.848234	\N	\N
243	\N	3	1	bc	f	t	rejected	\N	2026-04-20 11:13:47.435542	\N	2026-04-20 11:14:50.830985
188	1	\N	5	kya	f	t	approved	\N	2026-04-13 21:47:10.420349	\N	\N
190	1	\N	5	kya	f	t	approved	\N	2026-04-13 21:47:50.883979	\N	\N
192	1	\N	5	ha	f	t	approved	\N	2026-04-13 21:53:07.995033	\N	\N
248	\N	3	1	bc	f	t	rejected	\N	2026-04-20 11:24:55.022387	\N	2026-04-20 11:25:59.292812
200	1	\N	5	hello	f	t	approved	\N	2026-04-13 23:25:07.352702	\N	\N
201	1	\N	5	hello	f	t	approved	\N	2026-04-13 23:27:44.678949	\N	\N
239	\N	1	3	bc	f	t	rejected	\N	2026-04-20 11:01:34.145977	\N	2026-04-20 11:01:38.075797
203	2	\N	3	ok	f	t	approved	\N	2026-04-13 23:28:02.839495	\N	\N
204	1	\N	5	yes	f	t	approved	\N	2026-04-13 23:28:17.891444	\N	\N
259	\N	1	5	.	f	t	approved	\N	2026-04-20 22:47:12.8046	2026-04-20 22:47:12.817369	2026-04-20 22:49:42.503745
242	\N	3	1	hello	f	t	approved	\N	2026-04-20 11:13:46.015686	2026-04-20 11:13:46.037192	2026-04-20 11:13:46.082201
262	2	\N	5	bc	f	t	rejected	\N	2026-04-20 22:52:35.949964	\N	\N
304	\N	5	1	bc	f	t	pending_review	\N	2026-04-29 16:09:40.397381	\N	2026-04-29 20:13:44.783158
302	\N	5	1	hello	f	t	approved	\N	2026-04-29 15:44:19.64154	2026-04-29 20:13:44.812548	2026-04-29 20:13:44.783158
270	\N	9	3	hello	f	f	approved	\N	2026-04-22 12:43:14.696717	\N	\N
271	\N	10	3	hrlo	f	f	approved	\N	2026-04-22 12:43:30.865614	\N	\N
267	\N	5	3	helo	f	t	approved	\N	2026-04-22 12:43:02.333017	2026-04-22 12:43:02.354259	2026-04-22 12:43:43.6672
264	\N	5	1	bc	f	t	rejected	\N	2026-04-21 13:20:35.763471	\N	2026-04-22 12:43:49.151711
211	2	\N	3	good	f	t	approved	\N	2026-04-14 21:26:05.776715	\N	\N
212	2	\N	3	good	f	t	approved	\N	2026-04-14 21:26:15.463888	\N	\N
213	2	\N	3	ok	f	t	approved	\N	2026-04-14 21:26:20.297638	\N	\N
52	\N	1	2	yea	f	t	approved	\N	2026-03-06 02:17:20.948065	2026-03-12 22:39:01.647024	2026-03-06 02:17:20.948065
273	\N	5	3	hllo	f	t	approved	\N	2026-04-22 12:48:32.598528	2026-04-22 12:48:32.604494	2026-04-22 12:48:36.240706
215	1	\N	3	good	f	t	approved	\N	2026-04-14 21:26:39.419462	\N	\N
217	1	\N	3	hello	f	t	approved	\N	2026-04-14 21:34:45.943525	\N	\N
308	3	\N	6	vgpood	f	t	approved	\N	2026-05-21 20:55:29.956261	\N	\N
276	\N	5	3	hello	f	t	approved	\N	2026-04-22 13:06:23.176187	2026-04-22 13:06:23.188285	2026-04-22 13:06:23.553358
313	4	\N	5	yes	f	t	approved	\N	2026-05-24 17:54:30.803345	\N	\N
278	\N	5	3	hello	f	t	approved	\N	2026-04-22 13:06:31.606692	2026-04-22 13:06:31.61054	2026-04-22 13:06:31.680682
314	4	\N	3	good 	f	t	approved	\N	2026-05-24 17:54:37.620161	\N	\N
279	\N	5	3	good	f	t	approved	\N	2026-04-22 13:06:38.080427	2026-04-22 13:06:38.08465	2026-04-22 13:06:38.130761
255	\N	6	3	yes	f	t	approved	\N	2026-04-20 13:23:16.686894	2026-05-24 20:16:01.704459	2026-05-24 20:16:01.676152
254	\N	6	3	.	f	t	approved	\N	2026-04-20 13:23:11.321783	2026-05-24 20:16:01.704102	2026-05-24 20:16:01.676152
256	\N	6	3	hello	t	t	approved	\N	2026-04-20 13:23:21.924482	2026-05-24 20:18:25.112723	2026-05-24 20:16:01.676152
315	\N	6	3	good	f	t	approved	\N	2026-05-24 20:18:29.814799	2026-05-24 20:18:29.825248	2026-05-24 20:18:32.963882
316	\N	6	3	eys	t	t	approved	\N	2026-05-24 20:18:43.479507	2026-05-24 20:18:43.489315	2026-05-24 20:18:43.524454
317	\N	6	3	hello	t	t	approved	\N	2026-05-24 20:18:58.530964	2026-05-24 20:18:58.541833	2026-05-24 20:18:58.639059
318	\N	6	3	hello there	t	t	approved	\N	2026-05-24 20:19:05.809075	2026-05-24 20:19:05.819402	2026-05-24 20:19:05.875014
322	\N	3	6	hello	f	t	approved	\N	2026-05-24 20:47:44.121701	2026-05-24 20:47:44.126509	2026-05-24 20:47:54.119514
323	\N	3	1	hello	f	t	approved	\N	2026-05-24 21:02:59.094224	2026-05-24 21:02:59.107579	2026-05-24 21:21:58.656154
324	\N	3	1	helllo	f	t	approved	\N	2026-05-24 21:03:12.337232	2026-05-24 21:03:12.341488	2026-05-24 21:21:58.656154
325	\N	3	6	good	f	t	approved	\N	2026-05-24 21:03:32.276094	2026-05-24 21:03:32.289632	2026-05-24 21:22:01.614005
326	\N	5	3	hello	t	t	approved	\N	2026-05-24 21:22:11.235792	2026-05-24 21:22:11.253354	2026-05-24 21:22:19.130226
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, sender_id, title, message, type, is_read, target_role, course_id, created_at) FROM stdin;
6	8	1	Welcome to EduCom	Your account has been created. Your role is Teacher.	info	f	\N	\N	2026-01-27 10:16:01.862674
13	9	5	New message in CS101-A	Munesh Kumar: "kya"	info	f	\N	1	2026-04-13 21:47:10.474906
15	9	5	New message in CS101-A	Munesh Kumar: "kya"	info	f	\N	1	2026-04-13 21:47:39.351469
17	9	5	New message in CS101-A	Munesh Kumar: "kya"	info	f	\N	1	2026-04-13 21:47:50.960899
19	9	5	New message in CS101-A	Munesh Kumar: "kya"	info	f	\N	1	2026-04-13 21:47:51.906059
21	9	5	New message in CS101-A	Munesh Kumar: "ha"	info	f	\N	1	2026-04-13 21:53:08.056849
23	9	5	New message in CS101-A	Munesh Kumar: "ha"	info	f	\N	1	2026-04-13 21:53:15.003068
26	9	3	New message in CS101-A	Mahek Nankani: "ok"	info	f	\N	1	2026-04-13 21:55:10.509795
29	9	5	New message in CS101-A	Munesh Kumar: "yes"	info	f	\N	1	2026-04-13 23:19:59.027555
32	9	5	New message in CS101-A	Munesh Kumar: "hello"	info	f	\N	1	2026-04-13 23:25:07.432859
34	9	5	New message in CS101-A	Munesh Kumar: "hello"	info	f	\N	1	2026-04-13 23:27:44.775482
38	9	5	New message in CS101-A	Munesh Kumar: "yes"	info	f	\N	1	2026-04-13 23:28:17.971972
49	9	3	New message in CS101-A	Mahek Nankani: "good"	info	f	\N	1	2026-04-14 21:26:39.437866
52	9	3	New message in CS101-A	Mahek Nankani: "hello"	info	f	\N	1	2026-04-14 21:34:45.965818
27	5	3	New message in CS101-A	Mahek Nankani: "ok"	info	t	\N	1	2026-04-13 21:55:10.561583
50	5	3	New message in CS101-A	Mahek Nankani: "good"	info	t	\N	1	2026-04-14 21:26:39.438097
5	5	1	University Closed (CS402-A)	Pawan Mahesh: "University will be closed tommorow"	info	t	\N	2	2026-01-27 10:08:19.382989
10	5	3	New message in CS402-A	Mahek Nankani: "hello"	info	t	\N	2	2026-04-13 21:44:06.0882
11	5	3	New message in CS402-A	Mahek Nankani: "chitiye"	info	t	\N	2	2026-04-13 21:46:43.496589
36	5	3	New message in CS402-A	Mahek Nankani: "ok"	info	t	\N	2	2026-04-13 23:28:02.852949
45	5	3	New message in CS402-A	Mahek Nankani: "good"	info	t	\N	2	2026-04-14 21:26:05.78742
46	5	3	New message in CS402-A	Mahek Nankani: "good"	info	t	\N	2	2026-04-14 21:26:15.467784
47	5	3	New message in CS402-A	Mahek Nankani: "ok"	info	t	\N	2	2026-04-14 21:26:20.301983
53	5	3	New message in CS101-A	Mahek Nankani: "hello"	info	t	\N	1	2026-04-14 21:34:45.966003
55	5	1	hello (CS402-A)	Pawan Mahesh: "onthins"	info	t	\N	2	2026-04-15 18:54:18.825173
54	3	1	hello (CS402-A)	Pawan Mahesh: "onthins"	info	t	\N	2	2026-04-15 18:54:18.788589
1	3	1	Welcome to EduCom	Your account has been created. Your role is Student.	info	t	\N	\N	2026-01-27 08:42:09.441811
4	3	1	University Closed (CS402-A)	Pawan Mahesh: "University will be closed tommorow"	info	t	\N	2	2026-01-27 10:08:19.31324
7	3	5	New message in CS402-A	Munesh Kumar: "hello"	info	t	\N	2	2026-04-13 21:19:36.987144
8	3	5	New message in CS402-A	Munesh Kumar: "helllo"	info	t	\N	2	2026-04-13 21:19:54.611559
9	3	5	New message in CS402-A	Munesh Kumar: "hello"	info	t	\N	2	2026-04-13 21:29:07.913392
12	3	5	New message in CS101-A	Munesh Kumar: "kya"	info	t	\N	1	2026-04-13 21:47:10.434695
14	3	5	New message in CS101-A	Munesh Kumar: "kya"	info	t	\N	1	2026-04-13 21:47:39.351345
16	3	5	New message in CS101-A	Munesh Kumar: "kya"	info	t	\N	1	2026-04-13 21:47:50.910191
18	3	5	New message in CS101-A	Munesh Kumar: "kya"	info	t	\N	1	2026-04-13 21:47:51.905867
20	3	5	New message in CS101-A	Munesh Kumar: "ha"	info	t	\N	1	2026-04-13 21:53:08.010686
22	3	5	New message in CS101-A	Munesh Kumar: "ha"	info	t	\N	1	2026-04-13 21:53:15.002915
2	5	1	Welcome to EduCom	Your account has been created. Your role is Teacher.	info	t	\N	\N	2026-01-27 08:44:01.852359
3	6	1	Welcome to EduCom	Your account has been created. Your role is HOD.	info	t	\N	\N	2026-01-27 08:47:37.815609
24	3	5	New message in CS402-A	Munesh Kumar: "hdllo"	info	t	\N	2	2026-04-13 21:54:51.03641
25	3	5	New message in CS402-A	Munesh Kumar: "hdllo"	info	t	\N	2	2026-04-13 21:54:55.261356
28	3	5	New message in CS101-A	Munesh Kumar: "yes"	info	t	\N	1	2026-04-13 23:19:58.988167
30	3	5	New message in CS402-A	Munesh Kumar: "hello"	info	t	\N	2	2026-04-13 23:24:42.322483
31	3	5	New message in CS101-A	Munesh Kumar: "hello"	info	t	\N	1	2026-04-13 23:25:07.372159
33	3	5	New message in CS101-A	Munesh Kumar: "hello"	info	t	\N	1	2026-04-13 23:27:44.7065
35	3	5	New message in CS402-A	Munesh Kumar: "yes"	info	t	\N	2	2026-04-13 23:27:52.89861
37	3	5	New message in CS101-A	Munesh Kumar: "yes"	info	t	\N	1	2026-04-13 23:28:17.916478
39	3	5	New message in CS402-A	Munesh Kumar: "hello"	info	t	\N	2	2026-04-14 21:18:11.446019
40	3	5	New message in CS402-A	Munesh Kumar: "hello?"	info	t	\N	2	2026-04-14 21:19:36.96107
41	3	5	New message in CS402-A	Munesh Kumar: "hello?"	info	t	\N	2	2026-04-14 21:19:42.238768
42	3	5	New message in CS402-A	Munesh Kumar: "okay"	info	t	\N	2	2026-04-14 21:22:30.010408
43	3	5	New message in CS402-A	Munesh Kumar: "okay"	info	t	\N	2	2026-04-14 21:24:37.993425
44	3	5	New message in CS402-A	Munesh Kumar: "ok"	info	t	\N	2	2026-04-14 21:25:39.351603
48	3	5	New message in CS402-A	Munesh Kumar: "good"	info	t	\N	2	2026-04-14 21:26:31.28678
51	3	5	New message in CS402-A	Munesh Kumar: "good"	info	t	\N	2	2026-04-14 21:26:46.07356
57	9	5	New message in CS101-A	Munesh Kumar: "."	info	f	\N	1	2026-04-15 19:54:15.888973
56	3	5	New message in CS101-A	Munesh Kumar: "."	info	t	\N	1	2026-04-15 19:54:15.888885
58	9	3	New message in CS101-A	Mahek Nankani: "."	info	f	\N	1	2026-04-16 19:20:39.031309
59	5	3	New message in CS101-A	Mahek Nankani: "."	info	t	\N	1	2026-04-16 19:20:39.128275
60	9	3	New message in CS101-A	Mahek Nankani: "You are btich "	info	f	\N	1	2026-04-16 19:23:38.988487
62	9	3	New message in CS101-A	Mahek Nankani: "hello"	info	f	\N	1	2026-04-16 19:34:59.160355
61	5	3	New message in CS101-A	Mahek Nankani: "You are btich "	info	t	\N	1	2026-04-16 19:23:39.137354
63	5	3	New message in CS101-A	Mahek Nankani: "hello"	info	t	\N	1	2026-04-16 19:34:59.245584
65	9	5	New message in CS101-A	Munesh Kumar: "yes"	info	f	\N	1	2026-04-16 19:35:11.051614
67	9	5	New message in CS101-A	Munesh Kumar: "yes"	info	f	\N	1	2026-04-16 19:35:35.899975
64	3	5	New message in CS101-A	Munesh Kumar: "yes"	info	t	\N	1	2026-04-16 19:35:11.050714
66	3	5	New message in CS101-A	Munesh Kumar: "yes"	info	t	\N	1	2026-04-16 19:35:35.743632
68	3	1	class rescheduked (CS402-A)	Pawan Mahesh: "hello"	info	t	\N	2	2026-04-20 11:21:07.160346
69	5	1	class rescheduked (CS402-A)	Pawan Mahesh: "hello"	info	t	\N	2	2026-04-20 11:21:07.223665
70	5	1	Course Request Approved	Your course request for Final Year Project (CS404-C) has been approved! Join code: XPI7RNEP	course_update	t	\N	\N	2026-04-29 13:46:18.129774
71	5	1	Course Request Approved	Your course request for Object Oriented Programming (CS201-A) has been approved! Join code: EDF7IMYP	course_update	t	\N	\N	2026-04-29 13:46:20.574154
72	5	6	New message in CS404-C	Ahmed Ali Khokhar: " n"	info	t	\N	3	2026-05-21 20:55:24.199949
73	5	6	New message in CS404-C	Ahmed Ali Khokhar: "vgpood"	info	t	\N	3	2026-05-21 20:55:29.962708
74	5	3	New message in CS201-A	Mahek Nankani: "hello"	info	t	\N	4	2026-05-24 17:54:16.871239
75	3	5	New message in CS201-A	Munesh Kumar: "yes"	info	t	\N	4	2026-05-24 17:54:30.819193
79	3	1	aisdjaj (CS201-A)	Pawan Mahesh: "hello"	info	t	\N	4	2026-05-24 21:20:51.154154
81	3	1	helleod (CS201-A)	Pawan Mahesh: "asdasd"	info	t	\N	4	2026-05-24 21:21:15.433767
77	3	1	University Closed (CS201-A)	Pawan Mahesh: "hello"	info	t	\N	4	2026-05-24 21:20:22.41557
78	5	1	University Closed (CS201-A)	Pawan Mahesh: "hello"	info	t	\N	4	2026-05-24 21:20:22.460304
80	5	1	aisdjaj (CS201-A)	Pawan Mahesh: "hello"	info	t	\N	4	2026-05-24 21:20:51.191924
82	5	1	helleod (CS201-A)	Pawan Mahesh: "asdasd"	info	t	\N	4	2026-05-24 21:21:15.433783
76	5	3	New message in CS201-A	Mahek Nankani: "good "	info	t	\N	4	2026-05-24 17:54:37.64694
\.


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_codes (id, email, code, created_at, expires_at, used) FROM stdin;
1	bcsbs2212263@szabist.pk	600242	2026-01-27 11:59:28.578419	2026-01-27 12:09:28.573	t
2	bcsbs2212151@szabist.pk	589514	2026-03-12 00:59:55.191399	2026-03-12 01:09:55.186	f
3	bcsbs2212151@szabist.pk	869869	2026-03-13 01:14:13.88835	2026-03-13 01:24:13.814	t
4	bcsbs2212141@szabist.pk	629906	2026-04-21 09:02:24.290717	2026-04-21 09:12:24.209	f
5	bcsbs2212263@szabist.pk	876994	2026-04-21 09:03:16.912797	2026-04-21 09:13:16.907	f
6	bcsbs2212263@szabist.pk	498446	2026-04-21 21:03:31.707775	2026-04-21 21:13:31.612	f
7	bcsbs2212263@szabist.pk	435764	2026-05-24 16:29:53.660299	2026-05-24 16:39:53.654	t
\.


--
-- Data for Name: registration_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_requests (id, reg_id, name, email, password, role, department, semester, program_year, status, created_at) FROM stdin;
3	2212271	Sibtain Ahmed	bcsbs2212271@szabist.pk	$2b$10$Kcw967IyWedZFNUHhhytH.vFdUeTq4vQvOxGWrCrff5FmgMkDC8Nu	Student	CS	7	\N	pending	2026-01-27 08:40:18.163881
4	PM001	Om Kumar Rohra	bsse2280156@szabist.pk	$2b$10$yKJcOf8T2rMjYAkReUMYRuoQ0cIalbzzHy2HZwwTu5Vxy4Ut7s8WC	PM	CS	\N	4	approved	2026-01-27 09:08:07.256851
2	2212341	Hamza Ahmed Khan	bcsbs2212341@szabist.pk	$2b$10$VAFzewkXZk.7A.VIO6/L9e4l.NwR4Y8lUk.PhTGxxjGy1sgyxQCpu	Student	CS	2	\N	approved	2026-01-27 08:39:26.735639
1	2212148	Kashish Nankani	bcsbs2212148@szabist.pk	$2b$10$0y2egYnQt3nDOpf.7bnItugMo8QwPwIFWxE8EpN4b1lAdpp5mdduS	Student	CS	1	\N	approved	2026-01-27 08:38:39.125079
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, message_id, reporter_id, reason, status, created_at) FROM stdin;
1	235	1	abusive	Pending	2026-04-19 22:16:53.550944
2	238	1	abusive content	Pending	2026-04-20 10:27:28.626713
3	233	1	\N	Pending	2026-04-20 11:01:42.435545
4	241	1	\N	Pending	2026-04-20 11:13:23.727524
5	242	3	\N	Pending	2026-04-20 11:14:18.987199
6	245	5	\N	Pending	2026-04-20 11:15:56.483518
7	234	1	\N	Pending	2026-04-20 11:25:23.133709
8	249	1	\N	Pending	2026-04-20 11:26:29.323128
9	260	1	abusive toxic	Pending	2026-04-20 22:49:56.195085
10	259	1	abusive	Pending	2026-04-20 22:50:50.06656
11	262	3	remo	Pending	2026-04-20 22:53:29.55993
12	258	1	Absive	Pending	2026-04-21 13:41:25.572611
13	289	1	\N	Pending	2026-04-22 13:34:15.01759
14	300	1	\N	Pending	2026-04-29 16:10:28.805861
15	52	1	\N	Pending	2026-05-04 15:25:16.000352
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, assignment_id, student_id, file_url, submitted_at, grade, feedback) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, item_id, buyer_id, payment_ref, amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, reg_id, name, email, password, role, department, semester, program_year, section, last_login, created_at, updated_at, deleted_at, is_active) FROM stdin;
8	T002	Asim Riaz	asim.riaz@szabist.pk	$2b$10$z3guvsoZGqBXEJi0fJqAmO0FvylGt7zRG0.4BGdYjgmluw9keiirS	Teacher	CS	\N	\N	\N	\N	2026-01-27 10:16:01.692862	2026-01-27 10:16:01.692862	\N	t
2	A002	Anmol Kumari	bcsbs2212141@szabist.pk	$2b$10$c/uUrCVtmQMczhxu/Co09ey5OTvdeJZAgBz/X0dWCyXimPhvzQfXG	Admin	IT	\N	\N	\N	\N	2026-01-27 01:49:56.328672	2026-01-27 01:49:56.328672	\N	t
9	2212341	Hamza Ahmed Khan	bcsbs2212341@szabist.pk	$2b$10$VAFzewkXZk.7A.VIO6/L9e4l.NwR4Y8lUk.PhTGxxjGy1sgyxQCpu	Student	CS	2	\N	\N	\N	2026-04-02 23:39:41.171598	2026-04-02 23:39:41.171598	\N	t
5	T001	Munesh Kumar	bcsbs2212260@szabist.pk	$2b$10$gUST0Q77xkslittfcbM9KeBQ0Jhd4d7N5n5yosGFnYo8irrMFMAHO	Teacher	CS	\N	\N	\N	\N	2026-01-27 08:44:01.741629	2026-01-27 08:44:01.741629	\N	t
10	2212148	Kashish Nankani	bcsbs2212148@szabist.pk	$2b$10$0y2egYnQt3nDOpf.7bnItugMo8QwPwIFWxE8EpN4b1lAdpp5mdduS	Student	CS	1	\N	\N	\N	2026-04-15 18:25:26.434495	2026-04-15 18:25:26.434495	\N	t
6	HOD001	Ahmed Ali Khokhar	bcsbs2212243@szabist.pk	$2b$10$ipg49iSFA8RaoH.hYOedZupjMBYqsTYvMbTdPUDdww/UfJ3n0MSCu	HOD	CS	\N	\N	\N	\N	2026-01-27 08:47:37.682425	2026-01-27 08:47:37.682425	\N	t
1	A001	Pawan Mahesh	bcsbs2212263@szabist.pk	$2b$10$epPrUPVci4.HPZCiH3W2QOJ88nQ9cbstIUSq3pdUssHP51pDtlxbu	Admin	IT	\N	\N	\N	\N	2026-01-27 01:49:56.328672	2026-05-24 16:30:18.829065	\N	t
3	2212151	Mahek Nankani	bcsbs2212151@szabist.pk	$2b$10$khO6GocvKebvnlnJzkljTeVb5l4K2jZr2Xb6M.4J7KD1.Oedkv.yy	Student	CS	4	\N	\N	\N	2026-01-27 08:42:09.309937	2026-01-27 08:42:09.309937	\N	t
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlists (id, user_id, item_id, created_at) FROM stdin;
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: anonymous_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anonymous_feedback_id_seq', 1, false);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_id_seq', 1, false);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 26, true);


--
-- Name: communities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communities_id_seq', 4, true);


--
-- Name: course_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_requests_id_seq', 2, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 4, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 8, true);


--
-- Name: login_verification_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_verification_codes_id_seq', 14, true);


--
-- Name: marketplace_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_items_id_seq', 7, true);


--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_order_items_id_seq', 38, true);


--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_orders_id_seq', 35, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 326, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 82, true);


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_codes_id_seq', 7, true);


--
-- Name: registration_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_requests_id_seq', 4, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 15, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: wishlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlists_id_seq', 1, false);


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

