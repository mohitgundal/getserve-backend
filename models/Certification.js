const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    company: {
        type: String,
        required: [true, 'Please add a company name']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    skill_category: {
        type: String,
        required: [true, 'Please add a skill category']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    link: {
        type: String,
        required: [true, 'Please add a course link']
    },
    resources: {
        type: String // Could be a link to a drive or a list of resources
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: 'no-photo.jpg'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Certification', certificationSchema);
