const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const HourLog = require('../models/HourLog');
const generateCertificate = require('../utils/generateCertificate');
const { sendCertificateEmail } = require('../utils/emailService');

// @desc    Get NGO profile
// @route   GET /api/ngo/profile
// @access  Private (NGO)
exports.getNGOProfile = async (req, res) => {
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

// @desc    Get dashboard stats
// @route   GET /api/ngo/stats
// @access  Private (NGO)
exports.getDashboardStats = async (req, res) => {
    try {
        const opportunitiesCount = await Opportunity.countDocuments({ organization: req.user.id });

        // Get all opportunities IDs to find related applications
        const opportunities = await Opportunity.find({ organization: req.user.id }).select('_id');
        const opportunityIds = opportunities.map(op => op._id);

        const applicationsCount = await Application.countDocuments({ opportunity: { $in: opportunityIds } });

        res.status(200).json({
            success: true,
            data: {
                activeOpportunities: opportunitiesCount,
                totalApplications: applicationsCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new opportunity
// @route   POST /api/ngo/opportunities
// @access  Private (NGO)
exports.createOpportunity = async (req, res) => {
    try {
        const { title, type, description, location, startDate, endDate, duration, skillsRequired, stipend } = req.body;

        const opportunity = await Opportunity.create({
            organization: req.user.id,
            title,
            type,
            description,
            location,
            startDate,
            endDate,
            duration,
            skillsRequired,
            stipend
        });

        res.status(201).json({
            success: true,
            data: opportunity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my opportunities
// @route   GET /api/ngo/opportunities
// @access  Private (NGO)
exports.getMyOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find({ organization: req.user.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            data: opportunities
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete opportunity
// @route   DELETE /api/ngo/opportunities/:id
// @access  Private (NGO)
exports.deleteOpportunity = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        // Make sure user owns the opportunity
        if (opportunity.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await opportunity.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get applications for an opportunity
// @route   GET /api/ngo/opportunities/:id/applications
// @access  Private (NGO)
exports.getOpportunityApplications = async (req, res) => {
    try {
        const applications = await Application.find({ opportunity: req.params.id })
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
// @route   PUT /api/ngo/applications/:id/status
// @access  Private (NGO)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Verify ownership via opportunity
        const opportunity = await Opportunity.findById(application.opportunity);
        if (opportunity.organization.toString() !== req.user.id) {
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

// @desc    Get hour logs for my opportunities
// @route   GET /api/ngo/hours
// @access  Private (NGO)
exports.getHourLogs = async (req, res) => {
    try {
        // Find all opportunities created by this NGO
        const opportunities = await Opportunity.find({ organization: req.user.id }).select('_id');
        const opportunityIds = opportunities.map(op => op._id);

        // Find logs for these opportunities
        const logs = await HourLog.find({ opportunity: { $in: opportunityIds } })
            .populate('student', 'name email')
            .populate('opportunity', 'title')
            .sort('-date');

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve hour log
// @route   PATCH /api/ngo/hours/approve/:id
// @access  Private (NGO)
exports.approveHours = async (req, res) => {
    try {
        const log = await HourLog.findById(req.params.id).populate('opportunity');

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        // Verify ownership
        if (log.opportunity.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        log.status = 'approved';
        await log.save();

        res.status(200).json({
            success: true,
            data: log
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject hour log
// @route   PATCH /api/ngo/hours/reject/:id
// @access  Private (NGO)
exports.rejectHours = async (req, res) => {
    try {
        const log = await HourLog.findById(req.params.id).populate('opportunity');

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        // Verify ownership
        if (log.opportunity.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (log.status === 'rejected') {
            return res.status(400).json({ message: 'Log already rejected' });
        }

        // Refund hours if previously pending or approved (though approved usually final, but for safety)
        if (log.status !== 'rejected') {
            const StudentHourPackage = require('../models/StudentHourPackage');
            const pkg = await StudentHourPackage.findOne({ student: log.student });
            if (pkg) {
                pkg.hoursUsed = Math.max(0, pkg.hoursUsed - log.hours);
                await pkg.save();
            }
        }

        log.status = 'rejected';
        await log.save();

        res.status(200).json({
            success: true,
            data: log
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Issue Certificate for Volunteering
// @route   POST /api/ngo/certificate/issue
// @access  Private (NGO)
exports.issueCertificate = async (req, res) => {
    try {
        const { studentId, opportunityId } = req.body;

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        // Verify ownership
        if (opportunity.organization.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const ngo = await User.findById(req.user.id);

        // Calculate total approved hours
        const logs = await HourLog.find({
            student: studentId,
            opportunity: opportunityId,
            status: 'approved'
        });

        const totalHours = logs.reduce((acc, log) => acc + log.hours, 0);

        if (totalHours === 0) {
            return res.status(400).json({ message: 'No approved hours found for this student in this opportunity' });
        }

        // Generate Certificate
        // Params: (res, studentName, courseName, dateText, location, organizationName, issueDate)

        let dateText = `${totalHours} Hours`;
        if (opportunity.startDate && opportunity.endDate) {
            const start = new Date(opportunity.startDate).toLocaleDateString();
            const end = new Date(opportunity.endDate).toLocaleDateString();
            dateText = `${start} - ${end} (${totalHours} Hours)`;
        }

        const issueDate = new Date().toLocaleDateString();
        const location = opportunity.location || 'Remote';
        const organizationName = ngo.name || 'GETSERVE.in';

        const doc = generateCertificate(null, student.name, opportunity.title, dateText, location, organizationName, issueDate);

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);

            // Save to database
            try {
                let userCert = await require('../models/UserCertification').findOne({
                    student: studentId,
                    opportunity: opportunityId
                });

                if (!userCert) {
                    await require('../models/UserCertification').create({
                        student: studentId,
                        opportunity: opportunityId,
                        status: 'completed',
                        completedAt: Date.now()
                    });
                } else {
                    userCert.status = 'completed';
                    userCert.completedAt = Date.now();
                    await userCert.save();
                }

                // Send Email
                // Mock certification object for email template compatibility
                const mockCertification = {
                    title: opportunity.title,
                    price: 0 // Free/Volunteering
                };

                await sendCertificateEmail(student, mockCertification, pdfBuffer);

                res.status(200).json({
                    success: true,
                    message: `Certificate issued for ${totalHours} hours and sent to ${student.email}`
                });
            } catch (error) {
                console.error('Failed to save certificate or send email:', error);
                res.status(500).json({ message: 'Certificate generation failed' });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
