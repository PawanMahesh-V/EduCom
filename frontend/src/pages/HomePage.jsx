import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBookOpen,
  faUsers,
  faComments,
  faBell,
  faChalkboardTeacher,
  faUserShield,
  faArrowRight,
  faChartLine,
  faLaptopCode,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: faBookOpen,
      title: "Course Management",
      description:
        "Manage courses, departments, semesters, and faculty assignments from one centralized platform.",
    },
    {
      icon: faUsers,
      title: "Student Enrollment",
      description:
        "Enroll students efficiently with department validation and academic tracking.",
    },
    {
      icon: faChalkboardTeacher,
      title: "Teacher Dashboard",
      description:
        "Empower teachers with course control, student records, and workflow management.",
    },
    {
      icon: faComments,
      title: "Academic Communities",
      description:
        "Enable communication, discussions, and collaboration through dedicated communities.",
    },
    {
      icon: faBell,
      title: "Smart Notifications",
      description:
        "Send announcements and updates instantly based on academic roles and departments.",
    },
    {
      icon: faUserShield,
      title: "Secure Access",
      description:
        "Role-based authentication system for Admins, Students, HODs, and Teachers.",
    },
  ];

  const stats = [
    {
      number: "10+",
      label: "Departments",
    },
    {
      number: "5000+",
      label: "Students",
    },
    {
      number: "100+",
      label: "Faculty Members",
    },
    {
      number: "24/7",
      label: "Platform Access",
    },
  ];

  const roles = [
    {
      icon: faUserShield,
      title: "Admin",
      description:
        "Manage users, departments, and complete academic workflows.",
    },
    {
      icon: faChalkboardTeacher,
      title: "Teachers & HODs",
      description:
        "Monitor courses, student progress, attendance, and communications.",
    },
    {
      icon: faUsers,
      title: "Students",
      description:
        "Access courses, communities, schedules, and notifications anytime.",
    },
    {
      icon: faChartLine,
      title: "Program Managers",
      description:
        "Oversee academic performance and year-specific activities.",
    },
  ];

  return (
    <div className="hp-container">
      {/* ================= NAVBAR ================= */}
      <nav className="hp-navbar">
        <div className="hp-logo">
          <FontAwesomeIcon icon={faGraduationCap} />
          <h2>
            Edu<span>Com</span>
          </h2>
        </div>

        <div className="hp-nav-buttons">
          <button
            className="hp-btn-outline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="hp-btn-primary"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="hp-hero-section">
        <div className="hp-hero-left">
          <span className="hp-tag">
            <FontAwesomeIcon icon={faLaptopCode} />
            Modern Academic Management System
          </span>

          <h1>
            Simplify Your <span>Educational Workflow</span>
          </h1>

          <p>
            EduCom helps institutions manage courses, students, faculty,
            communication, and academic operations through one intelligent and
            scalable platform.
          </p>

          <div className="hp-hero-buttons">
            <button
              className="hp-btn-primary"
              onClick={() => navigate("/register")}
            >
              Start Now
              <FontAwesomeIcon icon={faArrowRight} />
            </button>

            <button
              className="hp-btn-outline"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>

          <div className="hp-hero-features">
            <div className="hp-feature-item">
              <FontAwesomeIcon icon={faCheckCircle} />
              Secure Access
            </div>

            <div className="hp-feature-item">
              <FontAwesomeIcon icon={faCheckCircle} />
              Role-Based Dashboards
            </div>

            <div className="hp-feature-item">
              <FontAwesomeIcon icon={faCheckCircle} />
              Real-Time Notifications
            </div>
          </div>
        </div>

        <div className="hp-hero-right">
          <div className="hp-hero-card">
            <div className="hp-card-top">
              <div className="hp-circle"></div>
              <div className="hp-circle"></div>
              <div className="hp-circle"></div>
            </div>

            <div className="hp-dashboard-preview">
              <div className="hp-preview-sidebar"></div>

              <div className="hp-preview-content">
                <div className="hp-preview-box hp-preview-large"></div>

                <div className="hp-preview-row">
                  <div className="hp-preview-box"></div>
                  <div className="hp-preview-box"></div>
                </div>

                <div className="hp-preview-box"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="hp-stats-section">
        <div className="hp-stats-grid">
          {stats.map((item, index) => (
            <div className="hp-stat-card" key={index}>
              <h2>{item.number}</h2>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="hp-features-section">
        <div className="hp-section-header">
          <span className="hp-section-tag">Core Features</span>

          <h2>Everything You Need in One Platform</h2>

          <p>
            Designed to streamline academic management and improve
            institutional productivity.
          </p>
        </div>

        <div className="hp-features-grid">
          {features.map((feature, index) => (
            <div className="hp-feature-card" key={index}>
              <div className="hp-feature-icon">
                <FontAwesomeIcon icon={feature.icon} />
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ROLES ================= */}
      <section className="hp-roles-section">
        <div className="hp-section-header">
          <span className="hp-section-tag">User Roles</span>

          <h2>Built for Every Academic Role</h2>

          <p>
            Customized dashboards and features for all institution members.
          </p>
        </div>

        <div className="hp-roles-grid">
          {roles.map((role, index) => (
            <div className="hp-role-card" key={index}>
              <div className="hp-role-icon">
                <FontAwesomeIcon icon={role.icon} />
              </div>

              <h3>{role.title}</h3>

              <p>{role.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="hp-cta-section">
        <div className="hp-cta-content">
          <h2>Ready to Modernize Your Institution?</h2>

          <p>
            Join EduCom today and experience seamless academic management with
            role-based access and smart workflows.
          </p>

          <button
            className="hp-btn-light"
            onClick={() => navigate("/register")}
          >
            Create Account
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="hp-footer">
        <div className="hp-footer-logo">
          <FontAwesomeIcon icon={faGraduationCap} />
          <h3>EduCom</h3>
        </div>

        <p>
          © {new Date().getFullYear()} EduCom. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;