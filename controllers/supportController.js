const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { subject, category, description, priority } = req.body;

        const ticket = await SupportTicket.create({
            user: req.user.id,
            subject,
            category,
            description,
            priority
        });

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new public support ticket (Contact Form)
// @route   POST /api/support/public
// @access  Public
exports.createPublicTicket = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const ticket = await SupportTicket.create({
            guestName: name,
            email,
            subject,
            description: message,
            source: 'guest',
            category: 'General', // Default category
            priority: 'Medium'   // Default priority
        });

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my tickets
// @route   GET /api/support/my-tickets
// @access  Private
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single ticket
// @route   GET /api/support/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('user', 'name email role')
            .populate('messages.sender', 'name role');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Access control: User can see their own, Admin can see all
        if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to ticket
// @route   POST /api/support/:id/reply
// @access  Private
exports.replyToTicket = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const isOwner = ticket.user && ticket.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        ticket.messages.push({
            sender: req.user.id,
            message
        });

        // Auto-update status if admin replies
        if (req.user.role === 'admin' && ticket.status === 'Open') {
            ticket.status = 'In Progress';
        }

        await ticket.save();

        const updatedTicket = await SupportTicket.findById(req.params.id)
            .populate('messages.sender', 'name role');

        res.status(200).json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin/all
// @access  Private (Admin)
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('user', 'name email role')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update ticket status (Admin)
// @route   PUT /api/support/:id/status
// @access  Private (Admin)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status, priority } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;

        await ticket.save();

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
