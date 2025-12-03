const express = require('express');
const {
    createTicket,
    getMyTickets,
    getTicketById,
    replyToTicket,
    getAllTickets,
    updateTicketStatus,
    createPublicTicket
} = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/public', createPublicTicket);

router.use(protect);

// User routes
router.post('/', createTicket);
router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicketById);
router.post('/:id/reply', replyToTicket);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllTickets);
router.put('/:id/status', authorize('admin'), updateTicketStatus);

module.exports = router;
