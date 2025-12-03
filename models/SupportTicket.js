const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
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
    category: {
        type: String,
        enum: ['General', 'Technical', 'Payment', 'Account', 'Other'],
        default: 'General'
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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

supportTicketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
