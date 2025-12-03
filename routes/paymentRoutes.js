const express = require('express');
const { createOrder, verifyPayment, getPayments, getMyPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/all', protect, authorize('admin'), getPayments);
router.get('/my', protect, getMyPayments);

module.exports = router;
