const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const Settings = require('./models/Settings');
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const packageRoutes = require('./routes/packageRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database Connection
connectDB().then(async () => {
    try {
        const settings = await Settings.findOne();
        if (settings) {
            console.log('\n\x1b[36m----------------------------------------\x1b[0m');
            console.log('\x1b[32mGETSERVE.in - Platform Settings Verified\x1b[0m');
            console.log(`Platform Name: ${settings.general.platformName}`);
            console.log(`Status: ${settings.general.maintenanceMode.enabled ? '\x1b[31mMaintenance\x1b[0m' : '\x1b[32mOnline\x1b[0m'}`);
            console.log(`Payments Enabled: ${settings.payment.razorpay.keyId ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
            console.log('Verification Status: \x1b[32mSUCCESS\x1b[0m');
            console.log('\x1b[36m----------------------------------------\x1b[0m\n');
        } else {
            console.log('\n\x1b[31mWARNING: Platform Settings not initialized!\x1b[0m\n');
        }
    } catch (err) {
        console.error('Settings verification failed:', err);
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/ngo', require('./routes/ngoRoutes'));
app.use('/api/internships', internshipRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

const PORT = parseInt(process.env.PORT) || 5000;
startServer(PORT);
