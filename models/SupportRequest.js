const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestName: {
        type: String
    },
    email: {
        type: String
    },
    source: {
        type: String,
        enum: ['user', 'guest'],
        default: 'user'
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject']
    },
    message: {
        type: String,
        required: [true, 'Please add a message']
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    thread: [{
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

supportRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
