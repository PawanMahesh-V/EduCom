import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedo } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the caught crash data directly to system administration tools
    console.error("Uncaught crash exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-screen-viewport">
          <div className="eb-container-card fade-in">
            {/* Visual Icon Alert Head */}
            <div className="eb-icon-badge">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            
            <h2 className="eb-title">Something went wrong</h2>
            <p className="eb-subtitle">
              We're sorry, but an unexpected system exception occurred. Please try refreshing the portal workspace layout.
            </p>
            
            {/* Conditional Stack Dump Rendering (Only builds during development instances) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="eb-stack-trace-box">
                <p className="eb-stack-error-string">{this.state.error.toString()}</p>
                <p className="eb-stack-component-tree">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}

            {/* Reload Trigger Button */}
            <button
              onClick={this.handleReset}
              className="eb-submit-button"
            >
              <FontAwesomeIcon icon={faRedo} />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;