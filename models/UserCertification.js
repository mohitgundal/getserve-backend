const mongoose = require('mongoose');

const userCertificationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    certification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certification'
    },
    opportunity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity'
    },
    status: {
        type: String,
        enum: ['applied', 'completed'],
        default: 'applied'
    },
    proof: {
        type: String // URL to uploaded proof
    },
    certificateUrl: {
        type: String // Path to generated certificate
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String
});

module.exports = mongoose.model('UserCertification', userCertificationSchema);
