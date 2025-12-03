const Certification = require('../models/Certification');
const UserCertification = require('../models/UserCertification');
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
    console.warn('Razorpay keys not found. Certification payment features will be disabled.');
}

// @desc    Get all certifications
// @route   GET /api/certifications
// @access  Public (Active only) / Admin (All)
exports.getCertifications = async (req, res) => {
    try {
        let query = {};

        // If not admin, only show active certifications
        if (!req.user || req.user.role !== 'admin') {
            query.isActive = true;
        }

        // Filtering
        if (req.query.category) query.skill_category = req.query.category;
        if (req.query.difficulty) query.difficulty = req.query.difficulty;
        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' };
        }

        const certifications = await Certification.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: certifications.length,
            data: certifications
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }

};

// @desc    Get my certifications
// @route   GET /api/certifications/my
// @access  Private (Student)
exports.getMyCertifications = async (req, res) => {
    try {
        const myCertifications = await UserCertification.find({ student: req.user.id })
            .populate('certification')
            .populate({
                path: 'opportunity',
                populate: { path: 'organization', select: 'name' }
            })
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: myCertifications.length,
            data: myCertifications
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single certification
// @route   GET /api/certifications/:id
// @access  Public
exports.getCertification = async (req, res) => {
    try {
        const certification = await Certification.findById(req.params.id);

        if (!certification) {
            return res.status(404).json({ success: false, message: 'Certification not found' });
        }

        // Check if user has purchased
        let isPurchased = false;
        if (req.user) {
            const userCert = await UserCertification.findOne({
                student: req.user.id,
                certification: req.params.id,
                status: 'completed' // Assuming 'completed' means paid/access granted for now, or we use a new status 'purchased'
            });
            if (userCert) isPurchased = true;
        }

        // Hide resources/link if not purchased and not admin
        if (!isPurchased && (!req.user || req.user.role !== 'admin')) {
            certification.resources = undefined;
            certification.link = undefined;
        }

        res.status(200).json({
            success: true,
            data: certification,
            isPurchased
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create certification
// @route   POST /api/certifications
// @access  Private (Admin)
exports.createCertification = async (req, res) => {
    try {
        const { title, provider, description, price, difficulty, skill_category } = req.body;

        if (!title || !description || !price || !difficulty || !skill_category) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields' });
        }

        const certification = await Certification.create(req.body);
        res.status(201).json({ success: true, data: certification });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update certification
// @route   PUT /api/certifications/:id
// @access  Private (Admin)
exports.updateCertification = async (req, res) => {
    try {
        const certification = await Certification.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!certification) {
            return res.status(404).json({ success: false, message: 'Certification not found' });
        }

        res.status(200).json({ success: true, data: certification });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete certification
// @route   DELETE /api/certifications/:id
// @access  Private (Admin)
exports.deleteCertification = async (req, res) => {
    try {
        const certification = await Certification.findByIdAndDelete(req.params.id);

        if (!certification) {
            return res.status(404).json({ success: false, message: 'Certification not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Initiate Payment for Certification
// @route   POST /api/certifications/:id/pay
// @access  Private (Student)
// @desc    Initiate Payment for Certification
// @route   POST /api/certifications/:id/pay
// @access  Private (Student)
exports.initiatePayment = async (req, res) => {
    try {
        const certification = await Certification.findById(req.params.id);
        if (!certification) {
            return res.status(404).json({ message: 'Certification not found' });
        }

        // Check if already purchased
        const existingCert = await UserCertification.findOne({
            student: req.user.id,
            certification: req.params.id,
            status: 'completed'
        });

        if (existingCert) {
            return res.status(400).json({ message: 'Already purchased' });
        }

        if (!razorpay) {
            return res.status(503).json({ message: 'Payment service unavailable (Missing API Keys)' });
        }

        const options = {
            amount: certification.price * 100, // Amount in paise
            currency: 'INR',
            receipt: `cert_${req.params.id}_${Date.now()}`
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

// @desc    Verify Payment
// @route   POST /api/certifications/:id/verify
// @access  Private (Student)
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const certificationId = req.params.id;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const certification = await Certification.findById(certificationId);
            const user = await User.findById(req.user.id);

            // Check if already recorded to prevent duplicates
            const existingRecord = await UserCertification.findOne({
                orderId: razorpay_order_id
            });

            if (existingRecord) {
                return res.status(200).json({ success: true, message: 'Payment already verified' });
            }

            // Create UserCertification record
            const userCert = await UserCertification.create({
                student: req.user.id,
                certification: certificationId,
                status: 'completed', // Mark as completed/purchased
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: certification.price,
                currency: 'INR',
                appliedAt: Date.now()
            });

            // Generate and send certificate email
            try {
                // Generate PDF
                // Params: (res, studentName, courseName, dateText, location, organizationName, issueDate)
                const doc = generateCertificate(null, user.name, certification.title, 'Self-Paced', 'Online', certification.provider || 'GETSERVE.in', new Date().toLocaleDateString());
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', async () => {
                    const pdfBuffer = Buffer.concat(buffers);

                    // Save to file system (optional, but good for caching)
                    const fileName = `cert-${user._id}-${certification._id}.pdf`;
                    const filePath = path.join(__dirname, '../certificates', fileName);
                    // Ensure directory exists
                    if (!fs.existsSync(path.join(__dirname, '../certificates'))) {
                        fs.mkdirSync(path.join(__dirname, '../certificates'));
                    }
                    fs.writeFileSync(filePath, pdfBuffer);

                    // Update record with URL
                    userCert.certificateUrl = `/certificates/${fileName}`;
                    await userCert.save();

                    // Send Email
                    await sendCertificateEmail(user, certification, pdfBuffer);
                });
            } catch (emailError) {
                console.error('Failed to send certificate email:', emailError);
                // Don't fail the response if email fails, as payment is done
            }

            res.status(200).json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

// @desc    Download Certificate
// @route   GET /api/certifications/:id/download
// @access  Private (Student)
exports.downloadCertificate = async (req, res) => {
    try {
        const userCertId = req.params.id; // This is the ID of the Certification/Opportunity, NOT UserCertification ID in the route?
        // Wait, the route is /:id/download. In MyCertificates.jsx, it passes item.certification._id or item.opportunity._id.
        // But we need the UserCertification record to check status and store URL.

        // Let's find the UserCertification record first.
        // The ID passed from frontend is the Certification ID or Opportunity ID.
        // We need to find the UserCertification based on student ID and this ID.

        let userCert = await UserCertification.findOne({
            student: req.user.id,
            $or: [
                { certification: userCertId },
                { opportunity: userCertId }
            ],
            status: 'completed'
        }).populate('student')
            .populate('certification')
            .populate({
                path: 'opportunity',
                populate: { path: 'organization' }
            });

        if (!userCert) {
            return res.status(404).json({ message: 'Certificate not found or not completed' });
        }

        const fs = require('fs');
        const path = require('path');
        const generateCertificate = require('../utils/generateCertificate');

        // Check if certificate already exists
        if (userCert.certificateUrl) {
            const filePath = path.join(__dirname, '..', userCert.certificateUrl);
            if (fs.existsSync(filePath)) {
                return res.download(filePath);
            }
        }

        // Generate new certificate
        const studentName = userCert.student.name;
        const title = userCert.certification ? userCert.certification.title : userCert.opportunity.title;

        let dateText = 'Self-Paced';
        let location = 'Online';
        let organizationName = 'GETSERVE.in';

        if (userCert.opportunity) {
            const op = userCert.opportunity;
            dateText = `${op.duration} Hours`;
            if (op.startDate && op.endDate) {
                const start = new Date(op.startDate).toLocaleDateString();
                const end = new Date(op.endDate).toLocaleDateString();
                dateText = `${start} - ${end} (${op.duration} Hours)`;
            }
            location = op.location || 'Remote';
            organizationName = op.organization?.name || 'GETSERVE.in';
        } else if (userCert.certification) {
            organizationName = userCert.certification.provider || 'GETSERVE.in';
        }

        const issueDate = new Date(userCert.completedAt || userCert.appliedAt).toLocaleDateString();

        const fileName = `cert-${userCert._id}.pdf`;
        const relativePath = path.join('certificates', fileName);
        const absolutePath = path.join(__dirname, '..', 'certificates', fileName);

        const doc = generateCertificate(null, studentName, title, dateText, location, organizationName, issueDate);
        const writeStream = fs.createWriteStream(absolutePath);

        doc.pipe(writeStream);

        writeStream.on('finish', async () => {
            // Update DB with URL
            userCert.certificateUrl = relativePath; // Store relative path
            await userCert.save();

            res.download(absolutePath);
        });

        writeStream.on('error', (err) => {
            console.error('Error writing PDF:', err);
            res.status(500).json({ message: 'Error generating certificate' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
