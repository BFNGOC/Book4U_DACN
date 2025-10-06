const mongoose = require('mongoose');
const {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
} = require('./profileModel');
const {
    createProfileForRole,
} = require('../helpers/createProfileForRoleHelper');
const {
    updateProfileForRole,
} = require('../helpers/updateProfileForRoleHelper');

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
        const roleChanged = user.isModified('role');
        const existingProfile = await Profile.findOne({ userId: user._id });

        if (!existingProfile) {
            await createProfileForRole(user);
        } else if (roleChanged) {
            await updateProfileForRole(user);
        }

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);
