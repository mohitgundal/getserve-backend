const express = require('express');
const {
    getNGOProfile,
    getDashboardStats,
    createOpportunity,
    getMyOpportunities,
    deleteOpportunity,
    getOpportunityApplications,
    updateApplicationStatus,
    getHourLogs,
    approveHours,
    rejectHours,
    issueCertificate
} = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and for NGOs only
router.use(protect);
router.use(authorize('ngo'));

router.get('/profile', getNGOProfile);
router.get('/stats', getDashboardStats);

router.route('/opportunities')
    .get(getMyOpportunities)
    .post(createOpportunity);

router.delete('/opportunities/:id', deleteOpportunity);

router.get('/opportunities/:id/applications', getOpportunityApplications);
router.put('/applications/:id/status', updateApplicationStatus);

// Hours Management
router.get('/hours', getHourLogs);
router.patch('/hours/approve/:id', approveHours);
router.patch('/hours/reject/:id', rejectHours);
router.post('/certificate/issue', issueCertificate);

module.exports = router;
