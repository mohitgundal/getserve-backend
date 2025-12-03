const InternshipOpportunity = require('../models/InternshipOpportunity');
const InternshipApplication = require('../models/InternshipApplication');
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
    console.warn('Razorpay keys not found. Internship payment features will be disabled.');
}

// @desc    Create new internship
// @route   POST /api/internships/create
// @access  Private (Admin)
exports.createInternship = async (req, res) => {
    try {
        const { title, description, location, startDate, duration, stipend, skillsRequired } = req.body;

        if (!title || !description || !location || !startDate || !duration) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const internship = await InternshipOpportunity.create({
            organization: req.user.id,
            title,
            description,
            location,
            startDate,
            duration,
            stipend,
            skillsRequired
        });

        res.status(201).json({
            success: true,
            data: internship
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all open internships
// @route   GET /api/internships/all
// @access  Private (Student)
exports.getAllInternships = async (req, res) => {
    try {
        const internships = await InternshipOpportunity.find({ status: 'open' })
            .populate('organization', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: internships
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get internship by ID
// @route   GET /api/internships/:id
// @access  Private
exports.getInternshipById = async (req, res) => {
    try {
        const internship = await InternshipOpportunity.findById(req.params.id)
            .populate('organization', 'name email');

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        res.status(200).json({
            success: true,
            data: internship
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Apply for internship
// @route   POST /api/internships/apply/:id
// @access  Private (Student)
exports.applyInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;
        const studentId = req.user.id;

        const internship = await InternshipOpportunity.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const existingApplication = await InternshipApplication.findOne({
            student: studentId,
            internship: internshipId
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'Already applied' });
        }

        const application = await InternshipApplication.create({
            student: studentId,
            internship: internshipId
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted',
            data: application
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my internship applications
// @route   GET /api/internships/applications/mine
// @access  Private (Student)
exports.getMyInternshipApplications = async (req, res) => {
    try {
        const applications = await InternshipApplication.find({ student: req.user.id })
            .populate({
                path: 'internship',
                populate: { path: 'organization', select: 'name' }
            })
            .sort('-appliedAt');

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get applicants for an internship
// @route   GET /api/internships/:id/applicants
// @access  Private (NGO)
exports.getInternshipApplicants = async (req, res) => {
    try {
        const internship = await InternshipOpportunity.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        // Allow Admin to view applicants for any internship
        if (req.user.role !== 'admin' && internship.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const applications = await InternshipApplication.find({ internship: req.params.id })
            .populate('student', 'name email profile')
            .sort('-appliedAt');

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update application status
// @route   PUT /api/internships/applications/:id/status
// @access  Private (NGO)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await InternshipApplication.findById(req.params.id)
            .populate('internship');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Allow Admin to update status
        if (req.user.role !== 'admin' && application.internship.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        application.status = status;
        await application.save();

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private (NGO)
exports.deleteInternship = async (req, res) => {
    try {
        const internship = await InternshipOpportunity.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        // Allow Admin to delete
        if (req.user.role !== 'admin' && internship.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await internship.deleteOne();
        res.status(200).json({ success: true, message: 'Internship deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my posted internships
// @route   GET /api/internships/my-listings
// @access  Private (NGO)
exports.getMyInternships = async (req, res) => {
    try {
        // If admin, show all internships? Or just ones they created?
        // Requirement says "admin can post instership and accpet the appplications".
        // Let's show all internships for Admin so they can manage everything.
        let query = {};
        if (req.user.role !== 'admin') {
            query = { organization: req.user.id };
        }

        const internships = await InternshipOpportunity.find(query)
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: internships
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Initiate Payment for Internship
// @route   POST /api/internships/applications/:id/pay
// @access  Private (Student)
exports.initiateInternshipPayment = async (req, res) => {
    try {
        const application = await InternshipApplication.findById(req.params.id)
            .populate('internship');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (application.student.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (application.status !== 'selected_pending_payment') {
            return res.status(400).json({ message: 'Application not eligible for payment' });
        }

        // Fixed fee for internship confirmation (e.g., 500 INR) or dynamic if needed
        const amount = 500;

        if (!razorpay) {
            return res.status(503).json({ message: 'Payment service unavailable (Missing API Keys)' });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `intern_${application._id}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment initiation failed' });
    }
};

// @desc    Verify Internship Payment
// @route   POST /api/internships/applications/:id/verify
// @access  Private (Student)
exports.verifyInternshipPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const applicationId = req.params.id;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const application = await InternshipApplication.findById(applicationId);

            if (application.status === 'hired' && application.paymentId) {
                return res.status(200).json({ success: true, message: 'Payment already verified' });
            }

            application.status = 'hired';
            application.paymentId = razorpay_payment_id;
            application.orderId = razorpay_order_id;
            application.amount = 500; // Should match the initiated amount
            application.currency = 'INR';
            application.paymentDate = Date.now();

            await application.save();

            res.status(200).json({ success: true, message: 'Payment verified and internship confirmed' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};
