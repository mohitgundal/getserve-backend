const express = require('express');
const {
    getStudentProfile,
    updateStudentProfile,
    getDashboardStats,
    getMyApplications,
    getAllOpportunities,
    applyForOpportunity,
    logHours,
    getHoursHistory,
    getOpportunityById,
    uploadResume
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and for students only
router.use(protect);
router.use(authorize('student'));

router.route('/profile')
    .get(getStudentProfile)
    .put(updateStudentProfile);

const resumeUpload = require('../middleware/resumeUploadMiddleware');
router.post('/profile/resume', resumeUpload.single('resume'), uploadResume);

router.get('/stats', getDashboardStats);
router.get('/applications', getMyApplications);
router.get('/opportunities', getAllOpportunities);
router.get('/opportunity/:id', getOpportunityById);
router.post('/apply/:id', applyForOpportunity);

// Hours Tracking
router.post('/hours', logHours);
router.get('/hours', getHoursHistory);

module.exports = router;
