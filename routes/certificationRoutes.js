const express = require('express');
const {
    getCertifications,
    getCertification,
    createCertification,
    updateCertification,
    deleteCertification,
    initiatePayment,
    verifyPayment,
    downloadCertificate,
    getMyCertifications
} = require('../controllers/certificationController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public/Student routes
router.get('/', protect, getCertifications); // Protect to get user role for filtering
router.get('/my', protect, getMyCertifications);
router.get('/:id', protect, getCertification);
router.post('/:id/pay', protect, authorize('student'), initiatePayment);
router.post('/:id/verify', protect, authorize('student'), verifyPayment);
router.get('/:id/download', protect, downloadCertificate);

// Admin routes
router.post('/', protect, authorize('admin'), createCertification);
router.put('/:id', protect, authorize('admin'), updateCertification);
router.delete('/:id', protect, authorize('admin'), deleteCertification);

module.exports = router;
