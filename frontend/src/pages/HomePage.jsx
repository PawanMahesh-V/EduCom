import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faComments,
  faUsers,
  faChartLine,
  faShieldAlt,
  faRobot,
  faArrowRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import Threads from "../components/Threads";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: faUsers,
      title: "Communities",
      description: "Separate spaces for departments, courses, and discussions.",
    },
    {
      icon: faComments,
      title: "Real-time Chat",
      description: "Instant communication powered by Socket.IO.",
    },
    {
      icon: faShieldAlt,
      title: "Anonymity",
      description: "Safe and transparent feedback system for students.",
    },
    {
      icon: faRobot,
      title: "AI Moderation",
      description: "Smart content moderation for healthy discussions.",
    },
    {
      icon: faChartLine,
      title: "Analytics",
      description: "Visual insights into engagement and performance.",
    },
  ];

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="nav">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <FontAwesomeIcon icon={faBookOpen} />
          <span>
            Edu<span className="accent">Com</span>
          </span>
        </div>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </nav>

      <section className="hero">
        <div className="threads-background">
          <Threads
            amplitude={1}
            distance={0}
            color={[0, 0, 0]}
          />
        </div>
        <div className="hero-content fade-up">
          <h1>
            A Smarter Way to <span className="accent">Connect & Learn</span>
          </h1>
          <p>
            EduCom connects students, teachers, and administrators in one
            seamless communication platform for modern education.
          </p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
            >
              Get Started <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button
              className="btn-outline"
              onClick={() =>
                document.getElementById("features").scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="features-section fade-up">
        <h2>Core Features</h2>
        <p className="subtitle">
          Simplify communication and boost collaboration across your institution
        </p>

        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * 100}ms` }}>
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
            <h2>Empowering Academic Collaboration</h2>
            <p>
              Manage courses, share ideas, and give feedback in a transparent,
              engaging, and structured way.
            </p>
            <ul>
              <li>
                <FontAwesomeIcon icon={faCheckCircle} /> Course Communities
              </li>
              <li>
                <FontAwesomeIcon icon={faCheckCircle} /> Real-time Messaging
              </li>
              <li>
                <FontAwesomeIcon icon={faCheckCircle} /> Transparent Feedback
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta-section fade-up">
        <h2 style={{color:"white"}}>Ready to Get Started?</h2>
        <p style={{color:"white"}}>
          Join thousands of students and educators already using EduCom to
          connect and collaborate better.
        </p>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Sign In Now <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} EduCom. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
