const express = require('express');
const {
    getPackageStatus,
    initiatePackagePurchase,
    verifyPackagePayment
} = require('../controllers/packageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-status', authorize('student'), getPackageStatus);
router.post('/purchase', authorize('student'), initiatePackagePurchase);
router.post('/verify', authorize('student'), verifyPackagePayment);

module.exports = router;
