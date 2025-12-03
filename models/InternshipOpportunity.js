const mongoose = require('mongoose');

const internshipOpportunitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        default: 'internship'
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: Date,
    duration: String,
    stipend: String,
    skillsRequired: [String],
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InternshipOpportunity', internshipOpportunitySchema);
