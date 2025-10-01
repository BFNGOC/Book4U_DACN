const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        firstName: { type: String, default: 'user' },
        lastName: {
            type: String,
            default: function () {
                return this.userId.toString().slice(-5);
            },
        },
        dateOfBirth: { type: Date, default: null },
        primaryPhone: { type: String, trim: true, default: null },

        avatar: {
            type: String,
            default: `/uploads/default-avatar.png`,
        },

        addresses: [
            {
                fullName: { type: String, trim: true, default: null },
                receiverPhone: { type: String, trim: true, default: null },
                street: { type: String, trim: true, default: null },
                city: { type: String, trim: true, default: null },
                state: { type: String, trim: true, default: null },
                country: { type: String, trim: true, default: 'Vietnam' },
                postalCode: { type: String, trim: true, default: null },
                isDefault: { type: Boolean, default: false },
            },
        ],
        default: [],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
