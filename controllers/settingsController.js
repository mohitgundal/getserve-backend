const Settings = require('../models/Settings');


// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        console.log('Settings fetched successfully');
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    try {
        console.log('Updating settings:', req.body);
        let settings = await Settings.getSettings();

        // Deep merge or specific update logic
        // For simplicity, we'll update top-level sections if provided
        // In a real app, we might want more granular updates or use a library like lodash.merge

        const { general, payment, certificate, notifications, security } = req.body;

        if (general) settings.general = { ...settings.general, ...general };
        if (payment) settings.payment = { ...settings.payment, ...payment };
        if (certificate) settings.certificate = { ...settings.certificate, ...certificate };
        if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
        if (security) settings.security = { ...settings.security, ...security };

        await settings.save();
        console.log('Settings updated successfully');

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Error updating settings:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
