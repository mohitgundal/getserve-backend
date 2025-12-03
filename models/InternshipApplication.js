const mongoose = require('mongoose');

const internshipApplicationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InternshipOpportunity',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'selected_pending_payment', 'hired', 'rejected'],
        default: 'pending'
    },
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String,
    paymentDate: Date,
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InternshipApplication', internshipApplicationSchema);
