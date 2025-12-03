const express = require('express');
const {
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getAnalyticsData,
    updateUserStatus,
    getAllOpportunities,
    getAllApplications
} = require('../controllers/adminController');

const {
    getAllTickets,
    getTicketById,
    replyToTicket,
    updateTicketStatus
} = require('../controllers/supportController');

const {
    getTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    addTicketComment
} = require('../controllers/ticketController');

const {
    getSettings,
    updateSettings
} = require('../controllers/settingsController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalyticsData);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/opportunities', getAllOpportunities);
router.get('/applications', getAllApplications);

// NGO Verification Routes
const { getPendingNGOs, approveNGO, rejectNGO, getNGOVerificationDocument } = require('../controllers/adminController');
router.get('/ngos/pending', getPendingNGOs);
router.put('/ngos/:id/approve', approveNGO);
router.put('/ngos/:id/reject', rejectNGO);
router.get('/ngos/:id/document', getNGOVerificationDocument);

// Support Request Routes
router.get('/support', getAllTickets);
router.get('/support/:id', getTicketById);
router.post('/support/:id/reply', replyToTicket);
router.put('/support/:id/status', updateTicketStatus);

// Internal Ticket Routes
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.put('/tickets/:id', updateTicket);
router.delete('/tickets/:id', deleteTicket);
router.post('/tickets/:id/comments', addTicketComment);

// Platform Settings Routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
