const express = require('express');
const {
    createInternship,
    getAllInternships,
    getInternshipById,
    applyInternship,
    getMyInternshipApplications,
    getInternshipApplicants,
    updateApplicationStatus,
    deleteInternship,
    getMyInternships,
    initiateInternshipPayment,
    verifyInternshipPayment
} = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

// Student Routes
router.get('/all', authorize('student'), getAllInternships);
router.get('/applications/mine', authorize('student'), getMyInternshipApplications);
router.post('/apply/:id', authorize('student'), applyInternship);
router.post('/applications/:id/pay', authorize('student'), initiateInternshipPayment);
router.post('/applications/:id/verify', authorize('student'), verifyInternshipPayment);

// Admin Routes
router.post('/create', authorize('admin'), createInternship);
router.get('/my-listings', authorize('admin'), getMyInternships);
router.get('/:id/applicants', authorize('admin'), getInternshipApplicants);
router.put('/applications/:id/status', authorize('admin'), updateApplicationStatus);
router.delete('/:id', authorize('admin'), deleteInternship);

// Shared Routes
router.get('/:id', getInternshipById);

module.exports = router;
