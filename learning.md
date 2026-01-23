# Learning Guide for EduCom Project

This guide will help you understand the structure of the EduCom project and suggest a sequence for exploring the codebase to maximize your learning. The project is divided into two main parts: **backend** and **frontend**.

---

## 1. Backend (Node.js/Express)

### Start Here:
- **backend/server.js**
  - Entry point for the backend. Sets up the Express server and connects middleware, routes, and database.

### Next, Understand Configuration:
- **backend/config/constants.js**
  - Project-wide constants.
- **backend/config/database.js**
  - Database connection logic.
- **backend/config/emailConfig.js**
  - Email service configuration.

### Explore Models:
- **backend/models/User.js**
  - User schema/model. Central to authentication and user management.

### Learn About Middleware:
- **backend/middleware/auth.js**
  - Handles authentication and authorization logic.

### Study Controllers:
- **backend/controllers/AuthController.js**
  - Handles authentication (login, register, etc.).
- **backend/controllers/UserController.js**
  - Handles user-related operations.

### Review API Routes:
- **backend/routes/auth.js**
  - Authentication endpoints.
- **backend/routes/users.js**
  - User management endpoints.
- **backend/routes/communities.js, courses.js, dashboard.js, directMessages.js, notifications.js**
  - Endpoints for other features.

---

## 2. Frontend (React + Vite)

### Start Here:
- **frontend/src/main.jsx**
  - Entry point for the React app. Sets up the root component and context providers.
- **frontend/src/App.jsx**
  - Main app component. Handles routing and layout.

### Understand Project Structure:
- **frontend/src/pages/**
  - Contains main pages for different user roles (Admin, Student, Teacher) and authentication.
- **frontend/src/components/**
  - Reusable UI components (e.g., ConfirmDialog, DashboardLayout).

### Explore API Layer:
- **frontend/src/api/**
  - Contains files for making API requests to the backend (auth.js, users.js, etc.).

### Learn About Context and State Management:
- **frontend/src/context/NotificationContext.jsx**
  - Handles notification state.
- **frontend/src/context/SocketContext.jsx**
  - Manages WebSocket connections.

### Review Utilities and Hooks:
- **frontend/src/hooks/useSocket.js**
  - Custom hook for socket logic.
- **frontend/src/utils/alert.js**
  - Utility for showing alerts.

### Check Styles and Config:
- **frontend/src/styles/global.css**
  - Global CSS styles.
- **frontend/src/config/api.js**
  - API base URL and config.

---

## Suggested Learning Sequence

### Backend:
1. server.js
2. config/constants.js, database.js, emailConfig.js
3. models/User.js
4. middleware/auth.js
5. controllers/AuthController.js, UserController.js
6. routes/auth.js, users.js, (then other route files)

### Frontend:
1. src/main.jsx
2. src/App.jsx
3. src/pages/ (start with HomePage.jsx, LoginPage.jsx, RegisterPage.jsx, then role-based pages)
4. src/components/ (start with DashboardLayout.jsx, ConfirmDialog.jsx, ProtectedRoute.jsx)
5. src/api/
6. src/context/
7. src/hooks/
8. src/utils/
9. src/styles/global.css
10. src/config/api.js

---

## Tips
- Start with entry points to understand the app flow.
- Move from general (app setup, routing) to specific (features, utilities).
- Use the README.md files for setup and high-level overview.
- Explore role-based pages to see how different user types interact with the system.

Happy learning!