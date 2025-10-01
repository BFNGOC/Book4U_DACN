const mongoose = require('mongoose');
const Profile = require('./profileModel');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, default: null },
        googleId: { type: String, default: null },
        role: {
            type: String,
            enum: ['customer', 'seller', 'admin', 'shipper'],
            default: 'customer',
        },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    try {
        await Profile.create({ userId: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);
