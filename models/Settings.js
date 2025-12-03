const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    general: {
        platformName: { type: String, default: 'GETSERVE.in' },
        supportEmail: { type: String, default: 'support@getserve.in' },
        supportPhone: { type: String, default: '' },
        bannerMessage: { type: String, default: '' },
        maintenanceMode: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: 'We are currently undergoing scheduled maintenance. We will be back shortly.' }
        }
    },
    payment: {
        fees: {
            volunteering: { type: Number, default: 0 },
            internship: { type: Number, default: 0 },
            certification: { type: Number, default: 0 }
        },
        razorpay: {
            keyId: { type: String, default: '' },
            keySecret: { type: String, default: '' }
        },
        refunds: {
            enabled: { type: Boolean, default: false },
            rules: { type: String, default: '' }
        }
    },
    certificate: {
        minHours: { type: Number, default: 10 },
        allowPartial: { type: Boolean, default: false },
        allowTransfer: { type: Boolean, default: false },
        maxHoursBeforePurchase: { type: Number, default: 60 }
    },
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        web: { type: Boolean, default: true },
        templates: {
            success: { type: String, default: 'Operation successful.' },
            approval: { type: String, default: 'Your request has been approved.' },
            rejection: { type: String, default: 'Your request has been rejected.' }
        }
    },
    security: {
        otpRequired: { type: Boolean, default: false },
        documentReuploadInterval: { type: Number, default: 6 }, // months
        ipRestriction: { type: String, default: '' } // Comma separated IPs
    }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

module.exports = mongoose.model('Settings', settingsSchema);
