const mongoose = require('mongoose');

const baseOptions = {
    discriminatorKey: 'profileType',
    collection: 'profiles',
    timestamps: true,
};

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
    { ...baseOptions }
);

const Profile = mongoose.model('Profile', profileSchema);

const sellerSchema = new mongoose.Schema({
    businessName: { type: String, required: true, trim: true },
    businessRegistration: { type: String, trim: true, default: null },
    taxId: { type: String, trim: true, required: true },
    storeLogo: { type: String, default: `/uploads/default-logo.png` },
    storeDescription: { type: String, default: null },
    businessAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, default: 'Vietnam' },
        postalCode: { type: String, trim: true },
    },
    bankDetails: {
        accountName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        bankName: { type: String, trim: true },
        swiftCode: { type: String, trim: true },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10 },
    isVerified: { type: Boolean, default: false },
    verificationDate: { type: Date, default: null },
});

const adminSchema = new mongoose.Schema({
    department: {
        type: String,
        enum: ['operations', 'customer_service', 'technical', 'management'],
        default: 'operations',
    },
    permissions: [
        {
            type: String,
            enum: [
                'manage_users',
                'manage_products',
                'manage_orders',
                'manage_sellers',
                'manage_shippers',
                'view_analytics',
                'manage_settings',
            ],
        },
    ],
    employeeId: { type: String, unique: true, sparse: true },
    hireDate: { type: Date, default: Date.now },
});

const shipperSchema = new mongoose.Schema({
    licenseNumber: { type: String, required: true, unique: true },
    vehicleType: {
        type: String,
        enum: ['motorcycle', 'car', 'van', 'truck'],
        required: true,
    },
    vehicleRegistration: { type: String, trim: true },
    serviceArea: [
        {
            city: { type: String, trim: true },
            districts: [{ type: String, trim: true }],
        },
    ],
    availability: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'offline',
    },
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    completedDeliveries: { type: Number, default: 0 },
    bankDetails: {
        accountName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        bankName: { type: String, trim: true },
    },
    isVerified: { type: Boolean, default: false },
    verificationDate: { type: Date, default: null },
});

const SellerProfile = Profile.discriminator('seller', sellerSchema);
const AdminProfile = Profile.discriminator('admin', adminSchema);
const ShipperProfile = Profile.discriminator('shipper', shipperSchema);

module.exports = {
    Profile,
    SellerProfile,
    AdminProfile,
    ShipperProfile,
};
