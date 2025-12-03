const User = require('../models/User');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const HourLog = require('../models/HourLog');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student)
exports.getStudentProfile = async (req, res) => {
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

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student)
exports.updateStudentProfile = async (req, res) => {
    try {
        const { name, bio, skills, education } = req.body;

        const user = await User.findById(req.user.id);

        if (name) user.name = name;

        if (!user.profile) user.profile = {};

        if (bio) user.profile.bio = bio;
        if (skills) user.profile.skills = skills;
        if (education) user.profile.education = education;

        await user.save();

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
// @route   GET /api/student/stats
// @access  Private (Student)
exports.getDashboardStats = async (req, res) => {
    try {
        const applicationsCount = await Application.countDocuments({ student: req.user.id });

        // Calculate total approved hours
        const hourLogs = await HourLog.find({ student: req.user.id, status: 'approved' });
        const totalHours = hourLogs.reduce((acc, log) => acc + log.hours, 0);

        const certificatesCount = 0; // Placeholder

        res.status(200).json({
            success: true,
            data: {
                applications: applicationsCount,
                hours: totalHours,
                certificates: certificatesCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my applications
// @route   GET /api/student/applications
// @access  Private (Student)
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user.id })
            .populate('opportunity', 'title organization type')
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

// @desc    Get all volunteering opportunities
// @route   GET /api/student/opportunities
// @access  Private (Student)
exports.getAllOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find({
            type: 'volunteering',
            status: 'open'
        })
            .populate('organization', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: opportunities
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Apply for an opportunity
// @route   POST /api/student/apply/:id
// @access  Private (Student)
exports.applyForOpportunity = async (req, res) => {
    try {
        const opportunityId = req.params.id;
        const studentId = req.user.id;

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        if (opportunity.status !== 'open') {
            return res.status(400).json({ message: 'Opportunity is not open for applications' });
        }

        const existingApplication = await Application.findOne({
            student: studentId,
            opportunity: opportunityId
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied for this opportunity' });
        }

        const application = await Application.create({
            student: studentId,
            opportunity: opportunityId,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Log volunteering hours
// @route   POST /api/student/hours
// @access  Private (Student)
exports.logHours = async (req, res) => {
    try {
        const { opportunityId, date, hours, description } = req.body;
        const studentId = req.user.id;
        const hoursToLog = parseFloat(hours);

        // 1. Check if student has an accepted application for this opportunity
        const application = await Application.findOne({
            student: studentId,
            opportunity: opportunityId,
            status: 'accepted'
        });

        if (!application) {
            return res.status(403).json({
                success: false,
                message: 'You can only log hours for opportunities you have been accepted into.'
            });
        }

        // 2. Check Hour Package Balance
        const StudentHourPackage = require('../models/StudentHourPackage');
        let package = await StudentHourPackage.findOne({ student: studentId });

        if (!package || package.status !== 'active' || (package.hoursUsed + hoursToLog > package.totalHours)) {
            return res.status(402).json({ // 402 Payment Required
                success: false,
                message: 'Insufficient hour balance. Please purchase an hour package to log more hours.',
                code: 'PACKAGE_EXHAUSTED'
            });
        }

        // 3. Create Log
        const newLog = await HourLog.create({
            student: studentId,
            opportunity: opportunityId,
            date,
            hours: hoursToLog,
            description,
            status: 'pending' // Default to pending approval
        });

        // 4. Deduct hours (increment used) immediately? 
        // Strategy: Deduct immediately. If rejected, refund.
        package.hoursUsed += hoursToLog;
        await package.save();

        res.status(201).json({
            success: true,
            message: 'Hours logged successfully',
            data: newLog
        });
    } catch (error) {
        console.error('Error logging hours:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get hours history
// @route   GET /api/student/hours
// @access  Private (Student)
exports.getHoursHistory = async (req, res) => {
    try {
        const logs = await HourLog.find({ student: req.user.id })
            .populate('opportunity', 'title organization')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching hours history:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single opportunity by ID
// @route   GET /api/student/opportunity/:id
// @access  Private (Student)
exports.getOpportunityById = async (req, res) => {
    try {
        console.log('Fetching opportunity with ID:', req.params.id); // Debug log
        const opportunity = await Opportunity.findById(req.params.id)
            .select('title organization type')
            .populate('organization', 'name');

        if (!opportunity) {
            console.log('Opportunity not found for ID:', req.params.id); // Debug log
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        res.status(200).json({
            success: true,
            data: opportunity
        });
    } catch (error) {
        console.error('Error fetching opportunity:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload resume
// @route   POST /api/student/profile/resume
// @access  Private (Student)
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const user = await User.findById(req.user.id);

        // Store relative path
        const relativePath = `uploads/resumes/${req.file.filename}`;

        if (!user.profile) user.profile = {};
        user.profile.resume = relativePath;

        await user.save();

        res.status(200).json({
            success: true,
            data: relativePath,
            message: 'Resume uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
