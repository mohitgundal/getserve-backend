const InternalTicket = require('../models/InternalTicket');
const User = require('../models/User');

// @desc    Get all internal tickets
// @route   GET /api/admin/tickets
// @access  Private/Admin
exports.getTickets = async (req, res, next) => {
    try {
        const tickets = await InternalTicket.find()
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new internal ticket
// @route   POST /api/admin/tickets
// @access  Private/Admin
exports.createTicket = async (req, res, next) => {
    try {
        const { category, description, assignedTo, priority, tags } = req.body;

        const ticket = await InternalTicket.create({
            createdBy: req.user.id,
            assignedTo: assignedTo || undefined, // Fix: Handle empty string
            category,
            description,
            priority,
            tags,
            timeline: [{
                action: 'created',
                user: req.user.id,
                details: 'Ticket created',
                createdAt: Date.now()
            }]
        });

        const populatedTicket = await InternalTicket.findById(ticket._id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');

        res.status(201).json({
            success: true,
            data: populatedTicket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update ticket
// @route   PUT /api/admin/tickets/:id
// @access  Private/Admin
exports.updateTicket = async (req, res, next) => {
    try {
        const { category, description, assignedTo, priority, status, tags } = req.body;
        const ticket = await InternalTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Track changes for timeline
        let changes = [];
        if (status && status !== ticket.status) changes.push(`Status changed to ${status}`);
        if (priority && priority !== ticket.priority) changes.push(`Priority changed to ${priority}`);
        if (assignedTo && assignedTo !== ticket.assignedTo?.toString()) changes.push('Assigned user changed');

        ticket.category = category || ticket.category;
        ticket.description = description || ticket.description;
        ticket.assignedTo = assignedTo || ticket.assignedTo;
        ticket.priority = priority || ticket.priority;
        ticket.status = status || ticket.status;
        ticket.tags = tags || ticket.tags;

        if (changes.length > 0) {
            ticket.timeline.push({
                action: 'updated',
                user: req.user.id,
                details: changes.join(', '),
                createdAt: Date.now()
            });
        }

        await ticket.save();

        const populatedTicket = await InternalTicket.findById(ticket._id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');

        res.status(200).json({
            success: true,
            data: populatedTicket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/admin/tickets/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res, next) => {
    try {
        const ticket = await InternalTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        await ticket.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add comment to ticket
// @route   POST /api/admin/tickets/:id/comments
// @access  Private/Admin
exports.addTicketComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        const ticket = await InternalTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const comment = {
            user: req.user.id,
            text,
            createdAt: Date.now()
        };

        ticket.comments.push(comment);

        // Add to timeline
        ticket.timeline.push({
            action: 'commented',
            user: req.user.id,
            details: 'Added a comment',
            createdAt: Date.now()
        });

        await ticket.save();

        const populatedTicket = await InternalTicket.findById(ticket._id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('comments.user', 'name email');

        res.status(200).json({
            success: true,
            data: populatedTicket
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
