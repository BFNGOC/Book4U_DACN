const mongoose = require('mongoose');
const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('./profileModel');
const createProfileForRole = require('../helpers/createProfileForRoleHelper');

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
        const user = this;
        const oldProfile = await Profile.findOne({ userId: user._id });
        const roleChanged = user.isModified('role');

        if (!oldProfile) {
            await createProfileForRole(user);
        } else if (roleChanged) {
            const base = oldProfile.toObject();
            await oldProfile.deleteOne();
            await createProfileForRole(user, base);
        }

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);
