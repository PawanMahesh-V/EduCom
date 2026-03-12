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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communities (id, course_id, name, join_code, status, created_at) FROM stdin;
1	1	CS101-A Community	KVKELZJ5	active	2026-01-27 08:51:52.940456
2	2	CS402-A Community	I1RW7TGI	active	2026-01-27 08:52:21.211595
\.


--
-- Data for Name: course_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_requests (id, code, name, department, semester, teacher_id, requested_by, status, created_at) FROM stdin;
1	CS201-A	Object Oriented Programming	CS	8	5	5	pending	2026-01-27 09:04:28.024785
2	CS404-C	Final Year Project	CS	8	5	5	pending	2026-01-27 09:05:16.882356
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, name, department, semester, teacher_id, created_at, deleted_at) FROM stdin;
1	CS101-A	Intro to Programing	CS	1	5	2026-01-27 08:51:52.940456	\N
2	CS402-A	Physics	CS	5	5	2026-01-27 08:52:21.211595	\N
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, course_id, student_id, status, grade, enrolled_by, enrolled_on, updated_at) FROM stdin;
1	2	3	active	\N	\N	2026-01-27 08:54:46.900493	2026-01-27 08:54:46.900493
2	1	3	active	\N	\N	2026-01-27 08:55:26.665624	2026-01-27 08:55:26.665624
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
\.


--
-- Data for Name: marketplace_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_items (id, seller_id, title, description, price, image_url, status, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, community_id, receiver_id, sender_id, content, is_anonymous, is_read, status, flagged_reason, created_at) FROM stdin;
4	\N	5	1	hello Sir!	f	t	approved	\N	2026-01-27 08:58:03.429355
55	\N	1	3	yes?	f	t	approved	\N	2026-03-11 23:17:50.762156
5	2	\N	5	hey class	f	t	approved	\N	2026-01-27 09:02:59.705287
8	2	\N	3	yes	f	t	approved	\N	2026-01-27 10:06:20.179583
10	2	\N	5	hello	f	t	approved	\N	2026-01-27 12:10:25.516546
12	2	\N	3	hello	f	t	approved	\N	2026-01-27 12:11:02.144695
11	2	\N	5	hello	f	t	approved	\N	2026-01-27 12:10:35.047561
13	2	\N	5	yes?	f	t	approved	\N	2026-01-27 12:12:14.381512
17	1	\N	3	hello	f	t	approved	\N	2026-01-27 12:13:04.617795
18	1	\N	3	is this code working	f	t	approved	\N	2026-01-27 12:13:18.214471
14	2	\N	3	yes?	f	t	approved	\N	2026-01-27 12:12:29.424723
15	2	\N	5	ok	f	t	approved	\N	2026-01-27 12:12:33.128085
16	2	\N	5	done	f	t	approved	\N	2026-01-27 12:12:34.851834
19	2	\N	3	thank god	f	f	approved	\N	2026-01-27 12:13:38.842653
21	1	\N	\N	hwllo	f	f	approved	\N	2026-01-28 22:54:12.053853
22	1	\N	\N	hello	f	f	approved	\N	2026-01-28 22:54:16.752259
23	1	\N	\N	hello	f	f	approved	\N	2026-01-28 22:54:22.41983
28	\N	8	3	hello	f	f	approved	\N	2026-02-11 18:57:22.439342
29	\N	8	3	hey there	t	f	approved	\N	2026-02-11 18:57:27.889574
27	\N	1	3	hey	f	t	approved	\N	2026-02-11 18:38:08.115965
1	\N	2	1	Hey there!!	f	t	approved	\N	2026-01-27 08:34:42.302382
31	\N	1	2	hey	f	t	approved	\N	2026-03-05 21:31:15.153235
32	\N	2	1	yea	f	t	approved	\N	2026-03-05 21:33:56.540138
33	\N	2	1	no	f	t	approved	\N	2026-03-05 21:34:12.219708
34	\N	1	2	are you serious	f	t	approved	\N	2026-03-05 21:34:34.293659
35	\N	1	2	yes	f	t	approved	\N	2026-03-05 21:37:05.583071
36	\N	2	1	no	f	t	approved	\N	2026-03-05 21:37:10.006007
38	\N	1	2	.	f	t	approved	\N	2026-03-05 21:38:22.521126
37	\N	2	1	yes	f	t	approved	\N	2026-03-05 21:38:17.741217
39	\N	2	1	 Հայերեն Shqip ‫العربية Български Català 中文简体 Hrvatski Česky Dansk Nederlands English Eesti Filipino Suomi Français ქართული Deutsch Ελληνικά ‫עברית हिन्दी Magyar Indonesia Italiano Latviski Lietuviškai македонски Melayu Norsk Polski Português Româna Pyccкий Српски Slovenčina Slovenščina Español Svenska ไทย Türkçe Українська Tiếng Việt Lorem Ipsum "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..." "There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain..." What is Lorem Ipsum? Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.  Why do we use it? It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).   Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.  The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.  Where can I get some? There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.  5 \tparagraphs \twords \tbytes \tlists \tStart with 'Lorem ipsum dolor sit amet...'  Donate: If you use this site regularly and would like to help keep the site on the Internet, please consider donating a small sum to help pay for the hosting and bandwidth bill. There is no minimum donation, any sum is appreciated - click here to donate using PayPal. Thank you for your support. Donate bitcoin: 16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF Translations: Can you help translate this site into a foreign language ? Please email us with details if you can help. There is a set of mock banners available here in three colours and in a range of standard banner sizes: BannersBannersBanners NodeJS Python Interface GTK Lipsum Rails .NET The standard Lorem Ipsum passage, used since the 1500s "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."  Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"  1914 translation by H. Rackham "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"  Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."  1914 translation by H. Rackham "On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."  help@lipsum.com Privacy Policy ·   Freestar	f	t	approved	\N	2026-03-05 21:41:03.690852
40	\N	1	2	?	f	t	approved	\N	2026-03-05 21:41:12.720199
41	\N	2	1	no	f	t	approved	\N	2026-03-05 21:43:32.10253
42	\N	2	1	okay	f	t	approved	\N	2026-03-05 21:43:35.312219
43	\N	2	1	its wokring now	f	t	approved	\N	2026-03-05 21:43:41.990046
44	\N	2	1	yes'	f	t	approved	\N	2026-03-05 21:44:07.268135
45	\N	2	1	yes	f	t	approved	\N	2026-03-05 21:44:16.26454
46	\N	2	1	new message	f	t	approved	\N	2026-03-05 21:44:21.631413
47	\N	2	1	>	f	t	approved	\N	2026-03-05 21:44:27.581715
48	\N	1	2	hello	f	t	approved	\N	2026-03-06 02:16:45.517413
49	\N	1	2	no	f	t	approved	\N	2026-03-06 02:16:48.066834
50	\N	1	2	yes ik	f	t	approved	\N	2026-03-06 02:16:56.026548
51	\N	2	1	okay	f	t	approved	\N	2026-03-06 02:17:01.177165
52	\N	1	2	yea	f	t	approved	\N	2026-03-06 02:17:20.948065
53	\N	2	1	okay	f	t	approved	\N	2026-03-06 02:17:27.185571
30	\N	3	1	heu	f	t	approved	\N	2026-03-05 20:41:56.567939
54	\N	3	1	hello	f	t	approved	\N	2026-03-11 23:17:46.320546
56	\N	1	3	hey	f	t	approved	\N	2026-03-12 00:45:04.917221
57	\N	1	3	bithch	f	t	approved	\N	2026-03-12 00:45:32.305964
58	\N	1	3	bitch	f	t	approved	\N	2026-03-12 00:45:43.310645
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, sender_id, title, message, type, is_read, target_role, course_id, created_at) FROM stdin;
1	3	1	Welcome to EduCom	Your account has been created. Your role is Student.	info	f	\N	\N	2026-01-27 08:42:09.441811
2	5	1	Welcome to EduCom	Your account has been created. Your role is Teacher.	info	f	\N	\N	2026-01-27 08:44:01.852359
3	6	1	Welcome to EduCom	Your account has been created. Your role is HOD.	info	f	\N	\N	2026-01-27 08:47:37.815609
4	3	1	University Closed (CS402-A)	Pawan Mahesh: "University will be closed tommorow"	info	f	\N	2	2026-01-27 10:08:19.31324
5	5	1	University Closed (CS402-A)	Pawan Mahesh: "University will be closed tommorow"	info	f	\N	2	2026-01-27 10:08:19.382989
6	8	1	Welcome to EduCom	Your account has been created. Your role is Teacher.	info	f	\N	\N	2026-01-27 10:16:01.862674
\.


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_codes (id, email, code, created_at, expires_at, used) FROM stdin;
1	bcsbs2212263@szabist.pk	600242	2026-01-27 11:59:28.578419	2026-01-27 12:09:28.573	t
2	bcsbs2212151@szabist.pk	589514	2026-03-12 00:59:55.191399	2026-03-12 01:09:55.186	f
\.


--
-- Data for Name: registration_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registration_requests (id, reg_id, name, email, password, role, department, semester, program_year, status, created_at) FROM stdin;
1	2212148	Kashish Nankani	bcsbs2212148@szabist.pk	$2b$10$0y2egYnQt3nDOpf.7bnItugMo8QwPwIFWxE8EpN4b1lAdpp5mdduS	Student	CS	1	\N	pending	2026-01-27 08:38:39.125079
2	2212341	Hamza Ahmed Khan	bcsbs2212341@szabist.pk	$2b$10$VAFzewkXZk.7A.VIO6/L9e4l.NwR4Y8lUk.PhTGxxjGy1sgyxQCpu	Student	CS	2	\N	pending	2026-01-27 08:39:26.735639
3	2212271	Sibtain Ahmed	bcsbs2212271@szabist.pk	$2b$10$Kcw967IyWedZFNUHhhytH.vFdUeTq4vQvOxGWrCrff5FmgMkDC8Nu	Student	CS	7	\N	pending	2026-01-27 08:40:18.163881
4	PM001	Om Kumar Rohra	bsse2280156@szabist.pk	$2b$10$yKJcOf8T2rMjYAkReUMYRuoQ0cIalbzzHy2HZwwTu5Vxy4Ut7s8WC	PM	CS	\N	4	approved	2026-01-27 09:08:07.256851
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, message_id, reporter_id, reason, status, created_at) FROM stdin;
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

COPY public.users (id, reg_id, name, email, password, role, department, semester, program_year, section, last_login, created_at, updated_at, deleted_at) FROM stdin;
3	2212151	Mahek Nankani	bcsbs2212151@szabist.pk	$2b$10$khO6GocvKebvnlnJzkljTeVb5l4K2jZr2Xb6M.4J7KD1.Oedkv.yy	Student	CS	4	\N	\N	\N	2026-01-27 08:42:09.309937	2026-01-27 08:42:09.309937	\N
5	T001	Munesh Kumar	bcsbs2212260@szabist.pk	$2b$10$BNVmkFR2.eELrr.OS0/71.rYbhjx.4BQU/aHExEDIvzTGeCRMQVO2	Teacher	CS	\N	\N	\N	\N	2026-01-27 08:44:01.741629	2026-01-27 08:44:01.741629	\N
6	HOD001	Ahmed Ali Khokhar	bcsbs2212243@szabist.pk	$2b$10$wN2DAsMq1nmynJRNw9Mh3.6Q2mKJi412OIyOk7NTzzD3pP0A3iiI.	HOD	CS	\N	\N	\N	\N	2026-01-27 08:47:37.682425	2026-01-27 08:47:37.682425	\N
7	PM001	Om Kumar Rohra	bsse2280156@szabist.pk	$2b$10$yKJcOf8T2rMjYAkReUMYRuoQ0cIalbzzHy2HZwwTu5Vxy4Ut7s8WC	PM	CS	\N	4	\N	\N	2026-01-27 09:10:28.545386	2026-01-27 09:10:28.545386	\N
8	T002	Asim Riaz	asim.riaz@szabist.pk	$2b$10$z3guvsoZGqBXEJi0fJqAmO0FvylGt7zRG0.4BGdYjgmluw9keiirS	Teacher	CS	\N	\N	\N	\N	2026-01-27 10:16:01.692862	2026-01-27 10:16:01.692862	\N
1	A001	Pawan Mahesh	bcsbs2212263@szabist.pk	$2b$10$kfX2qHSr1.6y8s2ZeTC0wOyj8JHqUAnGIrm5HNnAK9OVGGzGQ7wTy	Admin	IT	\N	\N	\N	\N	2026-01-27 01:49:56.328672	2026-01-27 12:00:07.356183	\N
2	A002	Anmol Kumari	bcsbs2212141@szabist.pk	$2b$10$c/uUrCVtmQMczhxu/Co09ey5OTvdeJZAgBz/X0dWCyXimPhvzQfXG	Admin	IT	\N	\N	\N	\N	2026-01-27 01:49:56.328672	2026-01-27 01:49:56.328672	\N
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
-- Name: communities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.communities_id_seq', 2, true);


--
-- Name: course_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_requests_id_seq', 2, true);


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

SELECT pg_catalog.setval('public.login_verification_codes_id_seq', 10, true);


--
-- Name: marketplace_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.marketplace_items_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 58, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: password_reset_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_codes_id_seq', 2, true);


--
-- Name: registration_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registration_requests_id_seq', 4, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


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
-- Name: idx_messages_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_community ON public.messages USING btree (community_id);


--
-- Name: idx_messages_direct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_direct ON public.messages USING btree (sender_id, receiver_id) WHERE (community_id IS NULL);


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
-- PostgreSQL database dump complete
--

-- Add delivery and read timestamp columns to messages table
-- WhatsApp-style message status tracking

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index for faster queries on delivery status
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Update read_at for already read messages
UPDATE messages 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;
