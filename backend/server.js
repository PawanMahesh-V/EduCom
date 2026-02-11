//import required modules
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

//load environment variables
const result = dotenv.config({ debug: false, quiet: true });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1); // Exit if .env cannot be loaded
}
// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);// Initialize Socket.IO server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
});
// Database pool
const pool = require('./config/database');
// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const dashboardRoutes = require('./routes/dashboard');
const communityRoutes = require('./routes/communities');
const notificationRoutes = require('./routes/notifications');
const directMessageRoutes = require('./routes/directMessages');

// Middleware
const helmet = require('helmet');
const compression = require('compression');

app.use(helmet());
app.use(compression());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/direct-messages', directMessageRoutes);

// Error Handling Middleware (Must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Socket.IO connection handling
const { initSocket } = require('./sockets/socketHandler');
initSocket(io);

// Make io accessible to routes
app.set('io', io);
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Socket.IO is ready for connections`);
});