import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">EduCom</div>
          <button className="nav-login" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </nav>
      {/* Features Section */}
      <section className="features">
        <h2>Why Choose EduCom?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Seamless Integration</h3>
            <p>Unified platform for academic and administrative operations</p>
          </div>
          <div className="feature-card">
            <h3>Data Security</h3>
            <p>Advanced encryption and secure data management protocols</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Analytics</h3>
            <p>Comprehensive insights for informed decision making</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-content">
          <h2>Empowering Education</h2>
          <p>Streamline administrative tasks, enhance communication, and improve learning outcomes with our integrated solution.</p>
          <ul className="benefits-list">
            <li>Automated Academic Management</li>
            <li>Enhanced Communication Tools</li>
            <li>Comprehensive Resource Planning</li>
            <li>Advanced Analytics Dashboard</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HomePage;