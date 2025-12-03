const StudentHourPackage = require('../models/StudentHourPackage');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn('Razorpay keys not found. Package payment features will be disabled.');
}

// @desc    Get my hour package status
// @route   GET /api/packages/my-status
// @access  Private (Student)
exports.getPackageStatus = async (req, res) => {
    try {
        let package = await StudentHourPackage.findOne({ student: req.user.id });

        if (!package) {
            // Create a default empty package if none exists
            package = await StudentHourPackage.create({
                student: req.user.id,
                totalHours: 0,
                hoursUsed: 0,
                status: 'exhausted' // Start as exhausted until purchased
            });
        }

        res.status(200).json({
            success: true,
            data: package
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Initiate Package Purchase
// @route   POST /api/packages/purchase
// @access  Private (Student)
// @desc    Initiate Package Purchase
// @route   POST /api/packages/purchase
// @access  Private (Student)
exports.initiatePackagePurchase = async (req, res) => {
    try {
        // Define Package: 60 Hours for e.g. 1000 INR
        // In a real app, fetch this from a 'PackageType' model or config
        const HOURS_TO_ADD = 60;
        const AMOUNT_INR = 1000;

        if (!razorpay) {
            return res.status(503).json({ message: 'Payment service unavailable' });
        }

        if (!razorpay) {
            return res.status(503).json({ message: 'Payment service unavailable' });
        }

        const options = {
            amount: AMOUNT_INR * 100, // paise
            currency: 'INR',
            receipt: `pkg_${req.user.id}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
            packageDetails: {
                hours: HOURS_TO_ADD,
                amount: AMOUNT_INR
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment initiation failed' });
    }
};

// @desc    Verify Package Payment
// @route   POST /api/packages/verify
// @access  Private (Student)
// @desc    Verify Package Payment
// @route   POST /api/packages/verify
// @access  Private (Student)
exports.verifyPackagePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, hours, amount } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            let package = await StudentHourPackage.findOne({ student: req.user.id });

            if (!package) {
                package = new StudentHourPackage({ student: req.user.id });
            }

            // Add transaction
            package.transactions.push({
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: amount,
                currency: 'INR',
                hoursAdded: hours
            });

            // Update totals
            package.totalHours += hours;
            // Status will auto-update via middleware or we can force it
            if (package.hoursUsed < package.totalHours) {
                package.status = 'active';
            }

            await package.save();

            res.status(200).json({
                success: true,
                message: 'Payment verified and hours added',
                data: package
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};
