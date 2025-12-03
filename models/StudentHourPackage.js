const mongoose = require('mongoose');

const studentHourPackageSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One active package tracking per student (can extend to history later if needed)
    },
    totalHours: {
        type: Number,
        default: 0
    },
    hoursUsed: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'exhausted', 'expired'],
        default: 'active'
    },
    transactions: [{
        paymentId: String,
        orderId: String,
        amount: Number,
        currency: String,
        hoursAdded: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update status based on usage
studentHourPackageSchema.pre('save', function (next) {
    if (this.hoursUsed >= this.totalHours && this.totalHours > 0) {
        this.status = 'exhausted';
    } else if (this.hoursUsed < this.totalHours) {
        this.status = 'active';
    }
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('StudentHourPackage', studentHourPackageSchema);
