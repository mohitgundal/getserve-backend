const mongoose = require('mongoose');

const hourLogSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opportunity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    hours: {
        type: Number,
        required: true,
        min: 0.5
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HourLog', hourLogSchema);
