const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
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
        enum: ['volunteering', 'internship'],
        required: true
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
    endDate: Date,
    duration: String, // e.g. "3 Months", "2 Weeks"
    skillsRequired: [String],
    stipend: String, // Only for internships
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

module.exports = mongoose.model('Opportunity', opportunitySchema);
