import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBook,
  faUsers,
  faComments,
  faBell,
  faChalkboardTeacher,
  faUserShield,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: faBook,
      title: "Course Management",
      description: "Create and manage courses with course codes, departments, semesters, and teacher assignments.",
    },
    {
      icon: faUsers,
      title: "Student Enrollment",
      description: "Assign students to courses with department validation and track enrollment records.",
    },
    {
      icon: faChalkboardTeacher,
      title: "Teacher Dashboard",
      description: "View assigned courses, student lists, and manage course-related activities.",
    },
    {
      icon: faComments,
      title: "Course Communities",
      description: "Organize course-specific communities for communication and collaboration.",
    },
    {
      icon: faBell,
      title: "Notifications",
      description: "Broadcast system notifications and course updates to users based on roles.",
    },
    {
      icon: faUserShield,
      title: "Role-Based Access",
      description: "Secure dashboards for Students, Teachers, HODs, Program Managers, and Admins.",
    },
  ];

  const roles = [
    {
      title: "Admin",
      description: "Full system management, user creation, course oversight",
    },
    {
      title: "Teachers & HODs",
      description: "Course management, student tracking, community access",
    },
    {
      title: "Students",
      description: "View enrolled courses, access communities, receive notifications",
    },
    {
      title: "Program Managers",
      description: "Oversee program-level operations and year-specific activities",
    },
  ];

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="nav">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <FontAwesomeIcon icon={faGraduationCap} />
          <span>
            Edu<span className="accent">Com</span>
          </span>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate("/register")}>
            Register
          </button>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content fade-up">
          <h1>
            Academic Management <span className="accent">Platform</span>
          </h1>
          <p>
            A comprehensive system for course management, student enrollment,
            and institutional communication across departments.
          </p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/register")}
            >
              Register Now <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="features-section fade-up">
        <h2>Core Functionality</h2>
        <p className="subtitle">
          Streamlined education management system
        </p>

        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="benefits-section fade-up">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>Built for Educational Institutions</h2>
            <p>
              EduCom provides role-based dashboards and comprehensive tools for
              managing academic workflows across departments (CS, BBA, IT).
            </p>
            <div className="role-info">
              <h3>User Roles</h3>
              <div className="role-grid">
                {roles.map((role, i) => (
                  <div key={i} className="role-item">
                    <strong>{role.title}</strong>
                    <p>{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section fade-up">
        <h2 className="text-white">Access Your Dashboard</h2>
        <p className="text-white">
          Sign in to access your role-based dashboard and manage your academic activities.
        </p>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Sign In Now <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} EduCom. Educational Management Platform.</p>
      </footer>
    </div>
  );
};

export default HomePage;
