const Razorpay = require('razorpay');
const crypto = require('crypto');
const UserCertification = require('../models/UserCertification');
const Certification = require('../models/Certification');
const { sendCertificateEmail } = require('../utils/emailService');
const generateCertificate = require('../utils/generateCertificate');
const User = require('../models/User');

// Initialize Razorpay
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn('Razorpay keys not found. Payment features will be disabled.');
}

// @desc    Create Razorpay Order
// @route   POST /api/payment/order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ success: false, error: 'Payment service unavailable (Missing API Keys)' });
        }

        const { certificationId } = req.body;

        const certification = await Certification.findById(certificationId);
        if (!certification) {
            return res.status(404).json({ success: false, error: 'Certification not found' });
        }

        // Check if already enrolled
        const existing = await UserCertification.findOne({
            student: req.user.id,
            certification: certificationId
        });

        if (existing) {
            return res.status(400).json({ success: false, error: 'Already enrolled in this certification' });
        }

        const options = {
            amount: certification.price * 100, // Amount in paise
            currency: 'INR',
            receipt: `cert_${certificationId}_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Verify Payment and Enroll
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            certificationId
        } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Payment successful, enroll user
            const certification = await Certification.findById(certificationId);

            await UserCertification.create({
                student: req.user.id,
                certification: certificationId,
                status: 'completed', // Auto-complete for paid certs
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: certification.price,
                currency: 'INR',
                completedAt: Date.now()
            });

            // Generate and send certificate email
            try {
                const user = await User.findById(req.user.id);
                const date = new Date().toLocaleDateString();

                // Generate PDF buffer
                const doc = generateCertificate(null, user.name, certification.title, date);

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', async () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    await sendCertificateEmail(user, certification, pdfBuffer);
                });

            } catch (emailError) {
                console.error('Failed to send certificate email:', emailError);
                // Don't fail the request if email fails, just log it
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and enrolled successfully. Certificate sent to email.'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payment/all
// @access  Private (Admin)
exports.getPayments = async (req, res) => {
    try {
        const payments = await UserCertification.find({
            paymentId: { $exists: true }
        })
            .populate('student', 'name email')
            .populate('certification', 'title price')
            .sort('-completedAt');

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get my payments (Student)
// @route   GET /api/payment/my
// @access  Private (Student)
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await UserCertification.find({
            student: req.user.id,
            paymentId: { $exists: true }
        })
            .populate('certification', 'title price')
            .sort('-completedAt');

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
