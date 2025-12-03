
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // If user exists but not verified, update OTP and resend
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('\n==================================================');
            console.log(`GENERATED OTP (Resend): ${otp}`);
            console.log('==================================================\n');
            const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            user.otp = otp;
            user.otpExpires = otpExpires;
            user.name = name; // Update name if changed
            user.password = password; // Update password if changed
            user.role = role; // Update role if changed
            await user.save();

            // Send OTP via email
            const message = `Your OTP for GETSERVE.in is ${otp}. It expires in 10 minutes.`;


            await sendEmail({
                email: user.email,
                subject: 'GETSERVE.in Account Verification OTP',
                message
            });

            return res.status(200).json({
                success: true,
                message: 'OTP resent. Please check your email.',
                userId: user._id
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('\n==================================================');
        console.log(`GENERATED OTP (New User): ${otp}`);
        console.log('==================================================\n');
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Create user
        const verificationStatus = role === 'ngo' ? 'pending' : 'approved';
        const verificationDocument = req.file ? req.file.path : undefined;

        if (role === 'ngo' && !verificationDocument) {
            return res.status(400).json({ message: 'NGOs must upload a verification document' });
        }

        user = await User.create({
            name,
            email,
            password,
            role,
            otp,
            otpExpires,
            verificationStatus,
            verificationDocument
        });

        // Send OTP via email
        const message = `Your OTP for GETSERVE.in is ${otp}. It expires in 10 minutes.`;


        await sendEmail({
            email: user.email,
            subject: 'GETSERVE.in Account Verification OTP',
            message
        });

        res.status(201).json({
            success: true,
            message: 'User registered. Please check your email for OTP.',
            userId: user._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log(`[VerifyOTP] Request for: ${email}, OTP: ${otp}`);

        const user = await User.findOne({ email });

        if (!user) {
            console.log('[VerifyOTP] User not found');
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            console.log('[VerifyOTP] User already verified');
            return res.status(400).json({ message: 'User already verified' });
        }

        console.log(`[VerifyOTP] Stored OTP: ${user.otp}, Expires: ${user.otpExpires}`);

        if (String(user.otp) !== String(otp)) {
            console.log('[VerifyOTP] Invalid OTP');
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            console.log('[VerifyOTP] OTP expired');
            return res.status(400).json({ message: 'OTP expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`[Login] User not found: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log(`[Login] Password mismatch for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            console.log(`[Login] User not verified: ${email}`);
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus
            }
        });
};
// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log('\n==================================================');
        console.log(`FORGOT PASSWORD OTP: ${otp}`);
        console.log('==================================================\n');

        const message = `Your password reset OTP is ${otp}. It expires in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message
            });

            res.status(200).json({ success: true, message: 'OTP sent to email' });
        } catch (error) {
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or expired' });
        }

        user.password = password;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
