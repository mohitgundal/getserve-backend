const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const Certification = require('../models/Certification');
const InternshipOpportunity = require('../models/InternshipOpportunity');
const InternshipApplication = require('../models/InternshipApplication');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const ngoCount = await User.countDocuments({ role: 'ngo' });
        const activeNgoCount = await User.countDocuments({ role: 'ngo', isVerified: true });
        const pendingNgoCount = await User.countDocuments({ role: 'ngo', isVerified: false });

        const opportunityCount = await Opportunity.countDocuments();
        const internshipCount = await InternshipOpportunity.countDocuments();
        const certificationCount = await Certification.countDocuments();

        const volAppCount = await Application.countDocuments();
        const internAppCount = await InternshipApplication.countDocuments();

        // Calculate total hours logged (mock calculation if model not ready, or aggregate)
        // For now returning 0 or mock
        const totalHours = 0;

        res.status(200).json({
            success: true,
            data: {
                students: studentCount,
                ngos: ngoCount,
                activeNgos: activeNgoCount,
                pendingNgos: pendingNgoCount,
                opportunities: opportunityCount,
                internships: internshipCount,
                certifications: certificationCount,
                applications: volAppCount + internAppCount,
                totalHours: totalHours,
                revenue: 0 // Mock revenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get analytics data for charts
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalyticsData = async (req, res) => {
    try {
        // Mock data for charts - in real app, use aggregation
        const monthlyData = [
            { name: 'Jan', students: 40, ngos: 24, applications: 24 },
            { name: 'Feb', students: 30, ngos: 13, applications: 22 },
            { name: 'Mar', students: 20, ngos: 58, applications: 22 },
            { name: 'Apr', students: 27, ngos: 39, applications: 20 },
            { name: 'May', students: 18, ngos: 48, applications: 21 },
            { name: 'Jun', students: 23, ngos: 38, applications: 25 },
            { name: 'Jul', students: 34, ngos: 43, applications: 21 },
        ];

        const roleDistribution = [
            { name: 'Students', value: await User.countDocuments({ role: 'student' }) },
            { name: 'NGOs', value: await User.countDocuments({ role: 'ngo' }) },
        ];

        res.status(200).json({
            success: true,
            data: {
                monthly: monthlyData,
                roles: roleDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        let query = {};

        if (role) query.role = role;
        if (status === 'verified') query.isVerified = true;
        if (status === 'pending') query.isVerified = false;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update user status (Block/Unblock/Verify)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
    try {
        const { isVerified, isBlocked } = req.body;
        const updateData = {};

        if (isVerified !== undefined) updateData.isVerified = isVerified;
        // Assuming User model has isBlocked field, if not we might need to add it or use another field
        // For now, let's assume we can toggle verification as a way to approve NGOs

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get pending NGOs
// @route   GET /api/admin/ngos/pending
// @access  Private (Admin)
exports.getPendingNGOs = async (req, res) => {
    try {
        const ngos = await User.find({ role: 'ngo', verificationStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, count: ngos.length, data: ngos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Approve NGO
// @route   PUT /api/admin/ngos/:id/approve
// @access  Private (Admin)
exports.approveNGO = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            verificationStatus: 'approved',
            isVerified: true // Also set email verification to true if we treat this as full verification
        }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Send email notification (optional but good practice)
        // await sendEmail(...) 

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Reject NGO
// @route   PUT /api/admin/ngos/:id/reject
// @access  Private (Admin)
exports.rejectNGO = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            verificationStatus: 'rejected'
        }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get NGO verification document
// @route   GET /api/admin/ngos/:id/document
// @access  Private (Admin)
exports.getNGOVerificationDocument = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.verificationDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const path = require('path');
        const fs = require('fs');

        // Construct absolute path. user.verificationDocument is relative or absolute depending on how it was saved.
        // Multer saves full path usually or relative to cwd. 
        // Let's assume it's the path stored by multer.

        if (fs.existsSync(user.verificationDocument)) {
            res.sendFile(path.resolve(user.verificationDocument));
        } else {
            res.status(404).json({ message: 'File not found on server' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find()
            .populate('organization', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: opportunities.length,
            data: opportunities
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all applications (Volunteering & Internships)
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getAllApplications = async (req, res) => {
    try {
        // Fetch Volunteering Applications
        const volApps = await Application.find()
            .populate('student', 'name email')
            .populate('opportunity', 'title')
            .sort('-appliedAt');

        // Fetch Internship Applications
        const internApps = await InternshipApplication.find()
            .populate('student', 'name email')
            .populate('internship', 'title')
            .sort('-appliedAt');

        // Normalize and merge
        const volunteering = volApps.map(app => ({
            _id: app._id,
            applicant: app.student?.name || 'Unknown',
            type: 'Volunteering',
            opportunity: app.opportunity?.title || 'Unknown',
            status: app.status,
            date: app.appliedAt,
            email: app.student?.email
        }));

        const internships = internApps.map(app => ({
            _id: app._id,
            applicant: app.student?.name || 'Unknown',
            type: 'Internship',
            opportunity: app.internship?.title || 'Unknown',
            status: app.status,
            date: app.appliedAt,
            email: app.student?.email
        }));

        const allApplications = [...volunteering, ...internships].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            data: allApplications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
