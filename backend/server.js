const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const result = dotenv.config({ debug: false, quiet: true });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const app = express();
const pool = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const dashboardRoutes = require('./routes/dashboard');
const communityRoutes = require('./routes/communities');
const notificationRoutes = require('./routes/notifications');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Access from network: http://172.16.165.165:${PORT}`);
});