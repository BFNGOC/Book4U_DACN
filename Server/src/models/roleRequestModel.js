const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['seller', 'shipper'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        reason: { type: String, default: null },
        details: { type: Object, default: {} },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
