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
-- Name: community_read_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_read_receipts (
    community_id integer NOT NULL,
    user_id integer NOT NULL,
    last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.community_read_receipts OWNER TO postgres;

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
1	1	CS001-B Community	N1MN20G7	active	2026-06-07 01:32:15.841565
2	2	Section E Community	5QYJQ6QF	active	2026-06-09 14:32:14.508411
\.


--
-- Data for Name: community_read_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_read_receipts (community_id, user_id, last_read_at) FROM stdin;
1	10	2026-06-30 00:25:04.392326
1	3	2026-07-01 11:00:56.664275
2	5	2026-06-29 22:30:50.873377
1	5	2026-06-29 22:30:52.307019
\.


--
-- Data for Name: course_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_requests (id, code, name, department, semester, teacher_id, requested_by, status, created_at) FROM stdin;
1	CS001-B	Fundamentals of Programming	CS	1	5	5	approved	2026-06-07 01:25:45.556124
2	Section E	Object Oriented Programming(OOPs)	CS	2	5	5	approved	2026-06-07 23:33:33.923605
3	CS404-E	Final Year Project	CS	8	5	5	pending	2026-06-29 00:12:57.553819
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, name, department, semester, teacher_id, created_at, deleted_at) FROM stdin;
1	CS001-B	Fundamentals of Programming	CS	1	5	2026-06-07 01:32:15.841565	\N
2	Section E	Object Oriented Programming(OOPs)	CS	2	5	2026-06-09 14:32:14.508411	\N
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, course_id, student_id, status, grade, enrolled_by, enrolled_on, updated_at) FROM stdin;
1	1	3	active	\N	\N	2026-06-07 01:32:52.174915	2026-06-07 01:32:52.174915
2	1	10	active	\N	\N	2026-06-29 22:30:00.353343	2026-06-29 22:30:00.353343
\.


--
-- Data for Name: login_verification_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_verification_codes (id, email, code, expires_at, used, created_at) FROM stdin;
1	student@szabist.pk	676532	2026-07-01 00:40:45.302	t	2026-07-01 00:30:45.345626
\.


--
-- Data for Name: marketplace_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_items (id, seller_id, title, description, price, image_url, status, created_at, category, quantity, tags) FROM stdin;
2	3	Test 2	Testing Product!!	500.00	data:image/png;base64,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	available	2026-06-07 02:10:32.886004	Other	3	{}
3	5	Test 3	Testing Product\r\n	700.00	data:image/png;base64,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	available	2026-06-07 02:11:09.667575	Other	3	{}
1	1	Test	This is testing\r\n	1000.00	data:image/jpeg;base64,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AAAAAAAAAAAABAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAABQAUAFAAABRAFAAWGKgAALtAF2bQBdoAAAAIAAAACAAAAiKgKACAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAKAAACgAAAoAAAAAKAAIAoAAAAgAAAACAAAAgAAAIAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAoAAAKIoAAKIAoAAAAAAAAAAAAgCoAIAAAAACAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoigAAAAAAoigAAAAoAAAAAKACAAogAAAACAAAAAAgAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAoAIACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAKAAAAAAAAACiAKIAogCiAAAAAAAIAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAKACAAAAoigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoigAAAAAAAAAAoAAAAAAAAAAAAAIAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAoAIAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAIACgAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAKACAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAACKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIACgAAAgAAAAAAAAAAAAAAAAAAAP/9k=	available	2026-06-07 01:49:10.22636	Other	2	{}
4	3	TEst 11	Testing 	100.00	data:image/jpeg;base64,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	available	2026-07-01 15:14:16.463102	Other	4	{}
\.


--
-- Data for Name: marketplace_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_order_items (id, order_id, item_id, title, price, quantity) FROM stdin;
1	1	1	Test	1000.00	1
2	2	3	Screw Driver	700.00	1
3	3	3	Screw Driver	700.00	1
4	4	2	Test 2	500.00	1
5	5	2	Test 2	500.00	1
6	6	1	Test	1000.00	1
7	7	1	Test	1000.00	1
8	8	1	Test	1000.00	1
9	9	4	TEst 11	100.00	1
\.


--
-- Data for Name: marketplace_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_orders (id, buyer_id, full_name, email, phone, campus, pickup_note, payment_method, total_amount, status, created_at, delivery_otp, payment_id, seller_id) FROM stdin;
2	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330303030	79 Campus		payfast	700.00	pending	2026-06-07 02:14:25.403795	761685	pay_1780780465403_509095	5
3	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330303030	79 Campus		payfast	700.00	pending	2026-06-08 14:00:23.774496	377541	pay_1780909223773_217005	5
4	5	Munesh Kumar	bcsbs2212260@szabist.pk	03302743615	98 Campus		payfast	500.00	completed	2026-06-08 16:14:26.371163	976743	pay_1780917266367_97910	3
5	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03330003320	79 Campus		payfast	500.00	pending	2026-06-09 15:06:47.11504	964759	pay_1780999607113_742065	3
7	10	Kashish Nankani	bcsbs2212148@szabist.pk	03302743615	79 Campus		payfast	1000.00	cancelled	2026-06-23 02:30:38.094016	540798	pay_1782163838093_103482	1
8	10	Kashish Nankani	bcsbs2212148@szabist.pk	03302743615	79 Campus		payfast	1000.00	pending_payment	2026-06-23 19:55:50.360149	697651	pay_1782226550363_691131	1
6	5	Munesh Kumar	bcsbs2212260@szabist.pk	03302743615	79 Campus		payfast	1000.00	cancelled	2026-06-22 01:07:12.775079	732162	pay_1782072432776_794406	1
1	3	Mahek Nankani	bcsbs2212151@szabist.pk	03330303030	79 Campus		payfast	1000.00	cancelled	2026-06-07 02:14:25.403795	415589	pay_1780780465403_509095	1
9	1	Pawan Mahesh	bcsbs2212263@szabist.pk	03330303030	172 Campus		payfast	100.00	completed	2026-07-01 15:15:36.839157	175544	pay_1782900936846_408934	3
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, community_id, receiver_id, sender_id, content, is_anonymous, is_read, status, flagged_reason, created_at, delivered_at, read_at) FROM stdin;
1	\N	3	1	Hey There!!	f	t	approved	\N	2026-06-06 16:21:02.566323	2026-06-06 16:25:20.428976	2026-06-06 16:25:20.40335
2	1	\N	3	hello	f	f	approved	\N	2026-06-07 01:34:39.761516	\N	\N
3	1	\N	3	..	f	f	approved	\N	2026-06-07 01:42:46.935207	\N	\N
4	\N	3	1	Ullu ka patha	f	t	pending_review	\N	2026-06-07 02:11:38.534974	\N	2026-06-07 02:11:52.6865
7	\N	3	1	Hello 	f	t	approved	\N	2026-06-08 15:07:14.812647	2026-06-08 15:07:14.829886	2026-06-08 15:07:28.79626
8	\N	3	1	ullu ka patha	f	t	rejected	\N	2026-06-08 15:21:16.50611	\N	2026-06-08 15:24:54.682072
9	\N	5	3	hello	t	t	approved	\N	2026-06-08 16:09:29.692563	2026-06-08 16:09:29.712151	2026-06-08 16:09:42.290514
10	\N	5	3	Hey there!	t	t	approved	\N	2026-06-08 17:10:17.748682	2026-06-08 17:10:17.755021	2026-06-08 17:10:28.084439
11	\N	3	5	ullu ka patha 01	f	t	rejected	\N	2026-06-08 17:11:02.016553	\N	2026-06-09 13:56:58.206498
12	\N	3	5	Hello	f	t	approved	\N	2026-06-09 13:57:38.364069	2026-06-09 13:57:38.373952	2026-06-09 13:57:38.852242
5	\N	3	1	ullu ki pathi	f	t	rejected	\N	2026-06-07 02:12:06.670639	\N	2026-06-07 02:12:14.20996
14	2	\N	5	 hello	f	f	approved	\N	2026-06-29 18:55:43.453156	\N	\N
15	1	\N	10	Hey there	f	f	approved	\N	2026-06-29 22:30:11.58717	\N	\N
16	1	\N	10	yes	f	f	approved	\N	2026-06-29 22:30:20.898947	\N	\N
17	1	\N	10	good	f	f	approved	\N	2026-06-29 22:30:26.371849	\N	\N
18	1	\N	10	no	f	f	approved	\N	2026-06-29 22:30:39.011187	\N	\N
20	\N	5	10	yes	t	t	approved	\N	2026-06-29 22:37:40.518126	2026-06-29 22:37:40.527659	2026-06-29 22:37:40.560496
13	\N	5	3	Yes	f	t	pending_review	\N	2026-06-09 13:57:45.14781	2026-06-09 13:57:45.150782	2026-06-22 00:49:45.060144
6	1	\N	3	Hello	f	f	pending_review	\N	2026-06-08 13:54:07.518075	\N	\N
22	\N	2	1	Hello	f	f	approved	\N	2026-07-01 00:35:02.458166	\N	\N
23	\N	5	3	ullu ka patha	t	t	pending_review	\N	2026-07-01 15:21:45.172085	\N	2026-07-01 15:24:36.576459
24	\N	5	3	yes?	t	t	approved	\N	2026-07-01 15:24:28.145226	2026-07-01 15:24:28.170094	2026-07-01 15:24:36.576459
25	\N	5	3	pawan	f	t	approved	\N	2026-07-01 15:24:46.956208	2026-07-01 15:24:46.96592	2026-07-01 15:24:50.186002
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, sender_id, title, message, type, is_read, target_role, course_id, created_at) FROM stdin;
1	5	1	Course Request Approved	Your course request for Fundamentals of Programming (CS001-B) has been approved! Join code: N1MN20G7	course_update	t	\N	\N	2026-06-07 01:32:15.841565
2	5	1	Course Request Approved	Your course request for Object Oriented Programming(OOPs) (Section E) has been approved! Join code: 5QYJQ6QF	course_update	t	\N	\N	2026-06-09 14:32:14.508411
3	11	1	Welcome to EduCom	Your account has been created. Your role is Student.	info	f	\N	\N	2026-07-07 02:18:11.550717
4	12	1	Welcome to EduCom	Your account has been created. Your role is Student.	info	f	\N	\N	2026-07-07 02:19:41.092353
\.


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_codes (id, email, code, created_at, expires_at, used) FROM stdin;
\.


--
-- Data for Name: registration_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_requests (id, reg_id, name, email, password, role, department, semester, program_year, status, created_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, message_id, reporter_id, reason, status, created_at) FROM stdin;
1	13	5	\N	Pending	2026-06-29 22:43:33.81477
2	6	10	\N	Pending	2026-06-29 22:46:10.933342
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
9	2212341	Hamza Ahmed Khan	bcsbs2212341@szabist.pk	$2b$10$VAFzewkXZk.7A.VIO6/L9e4l.NwR4Y8lUk.PhTGxxjGy1sgyxQCpu	Student	CS	2	\N	\N	\N	2026-04-02 23:39:41.171598	2026-04-02 23:39:41.171598	\N	t
10	2212148	Kashish Nankani	bcsbs2212148@szabist.pk	$2b$10$0y2egYnQt3nDOpf.7bnItugMo8QwPwIFWxE8EpN4b1lAdpp5mdduS	Student	CS	1	\N	\N	\N	2026-04-15 18:25:26.434495	2026-04-15 18:25:26.434495	\N	t
6	HOD001	Ahmed Ali Khokhar	bcsbs2212243@szabist.pk	$2b$10$ipg49iSFA8RaoH.hYOedZupjMBYqsTYvMbTdPUDdww/UfJ3n0MSCu	HOD	CS	\N	\N	\N	\N	2026-01-27 08:47:37.682425	2026-01-27 08:47:37.682425	\N	t
3	2212151	Mahek Nankani	bcsbs2212151@szabist.pk	$2b$10$khO6GocvKebvnlnJzkljTeVb5l4K2jZr2Xb6M.4J7KD1.Oedkv.yy	Student	CS	4	\N	\N	\N	2026-01-27 08:42:09.309937	2026-01-27 08:42:09.309937	\N	t
5	T001	Munesh Kumar	bcsbs2212260@szabist.pk	$2b$10$gUST0Q77xkslittfcbM9KeBQ0Jhd4d7N5n5yosGFnYo8irrMFMAHO	Teacher	CS	\N	\N	\N	\N	2026-01-27 08:44:01.741629	2026-01-27 08:44:01.741629	\N	t
1	A001	Pawan Mahesh	bcsbs2212263@szabist.pk	$2b$10$epPrUPVci4.HPZCiH3W2QOJ88nQ9cbstIUSq3pdUssHP51pDtlxbu	Admin	IT	\N	\N	\N	\N	2026-01-27 01:49:56.328672	2026-05-24 16:30:18.829065	\N	f
11	123456	Student	student@szabist.pk	$2b$10$gKVfIEqvx02C2hZIwNb2TeYoLF0EecAnAmHJBpQUj784/ip51vF5K	Student	CS	1	\N	\N	\N	2026-07-07 02:18:11.338211	2026-07-07 02:18:11.338211	\N	t
12	12345	Admin	admin@szabist.pk	$2b$10$7/EW8GSJLcXLcyIZgA1RM.d/0CDM61xHqy3chzmIz.c8.T4Xh1lt2	Admin	IT	\N	\N	\N	\N	2026-07-07 02:19:40.856821	2026-07-07 02:19:40.856821	\N	t
2	A002	Anmol Kumari	bcsbs2212141@szabist.pk	$2b$10$c/uUrCVtmQMczhxu/Co09ey5OTvdeJZAgBz/X0dWCyXimPhvzQfXG	Student	IT	1	\N	\N	\N	2026-01-27 01:49:56.328672	2026-01-27 01:49:56.328672	\N	t
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

SELECT pg_catalog.setval('public.cart_items_id_seq', 9, true);


--
-- Name: communities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communities_id_seq', 2, true);


--
-- Name: course_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_requests_id_seq', 3, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 2, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 2, true);


--
-- Name: login_verification_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_verification_codes_id_seq', 1, true);


--
-- Name: marketplace_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_items_id_seq', 4, true);


--
-- Name: marketplace_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_order_items_id_seq', 9, true);


--
-- Name: marketplace_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_orders_id_seq', 9, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 25, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_codes_id_seq', 1, false);


--
-- Name: registration_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_requests_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 2, true);


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

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


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
-- Name: community_read_receipts community_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_read_receipts
    ADD CONSTRAINT community_read_receipts_pkey PRIMARY KEY (community_id, user_id);


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
-- Name: community_read_receipts community_read_receipts_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_read_receipts
    ADD CONSTRAINT community_read_receipts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_read_receipts community_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_read_receipts
    ADD CONSTRAINT community_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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

