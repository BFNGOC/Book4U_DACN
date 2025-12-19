import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/userContext';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile, updateUserProfile } from '../../services/api/userApi';
import { updateSellerProfile, getSellerDashboard } from '../../services/api/sellerApi';
import { Store, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import Loading from '../../components/common/Loading';

function SellerProfile() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        primaryPhone: '',
        storeName: '',
        storeDescription: '',
        businessAddress: {
            street: '',
            ward: '',
            district: '',
            province: '',
        },
    });

    useEffect(() => {
        if (user?.role !== 'seller') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const profileRes = await getCurrentUserProfile();
                if (profileRes.success) {
                    setProfile(profileRes.data);
                    setFormData({
                        firstName: profileRes.data.firstName || '',
                        lastName: profileRes.data.lastName || '',
                        primaryPhone: profileRes.data.primaryPhone || '',
                        storeName: profileRes.data.storeName || profileRes.data.firstName,
                        storeDescription: profileRes.data.storeDescription || '',
                        businessAddress: profileRes.data.businessAddress || {
                            street: '',
                            ward: '',
                            district: '',
                            province: '',
                        },
                    });
                }

                const dashboardRes = await getSellerDashboard();
                if (dashboardRes.success) {
                    setDashboard(dashboardRes.data);
                }
            } catch (err) {
                console.error('Lỗi:', err);
                setError('Đã xảy ra lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('address_')) {
            const addressField = name.replace('address_', '');
            setFormData((prev) => ({
                ...prev,
                businessAddress: {
                    ...prev.businessAddress,
                    [addressField]: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await updateSellerProfile(formData);
            if (res.success) {
                setProfile(res.data);
                setIsEditing(false);
                alert('Cập nhật hồ sơ bán hàng thành công!');
            } else {
                alert(res.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            alert('Đã xảy ra lỗi khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                primaryPhone: profile.primaryPhone || '',
                storeName: profile.storeName || profile.firstName,
                storeDescription: profile.storeDescription || '',
                businessAddress: profile.businessAddress || {
                    street: '',
                    ward: '',
                    district: '',
                    province: '',
                },
            });
        }
    };

    if (loading) return <Loading context="Đang tải hồ sơ bán hàng..." />;

    if (!profile)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Không thể tải hồ sơ bán hàng</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ bán hàng</h1>
                    <p className="text-gray-600">
                        Quản lý thông tin cửa hàng và tài liệu kinh doanh
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden mb-6">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-24"></div>

                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-12 relative z-10 mb-6">
                            {/* Store Logo */}
                            <img
                                src={profile.storeLogo || '/img/default-logo.png'}
                                alt={profile.storeName}
                                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                            />

                            {/* Store Info */}
                            <div className="flex-grow">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {profile.storeName}
                                </h2>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <Store className="w-4 h-4" />
                                    {profile.firstName} {profile.lastName}
                                </p>
                            </div>

                            {/* Edit Button */}
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                    isEditing
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        : 'bg-amber-600 text-white hover:bg-amber-700'
                                }`}
                            >
                                <Edit2 className="w-4 h-4" />
                                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b mb-6 overflow-x-auto">
                            {[
                                { id: 'profile', label: 'Hồ sơ', icon: '🏪' },
                                { id: 'stats', label: 'Thống kê', icon: '📊' },
                                { id: 'documents', label: 'Tài liệu', icon: '📄' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'text-amber-600 border-amber-600'
                                            : 'text-gray-600 border-transparent hover:text-gray-900'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'profile' && (
                            <div>
                                {isEditing ? (
                                    // Edit Form
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Họ
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tên
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Số điện thoại
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="primaryPhone"
                                                    value={formData.primaryPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tên cửa hàng
                                                </label>
                                                <input
                                                    type="text"
                                                    name="storeName"
                                                    value={formData.storeName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mô tả cửa hàng
                                            </label>
                                            <textarea
                                                name="storeDescription"
                                                value={formData.storeDescription}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                placeholder="Giới thiệu về cửa hàng của bạn"
                                            ></textarea>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <MapPin className="w-5 h-5" />
                                                Địa chỉ kinh doanh
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    name="address_street"
                                                    value={formData.businessAddress.street}
                                                    onChange={handleInputChange}
                                                    placeholder="Số nhà, tên đường"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                                <input
                                                    type="text"
                                                    name="address_ward"
                                                    value={formData.businessAddress.ward}
                                                    onChange={handleInputChange}
                                                    placeholder="Xã/Phường"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                                <input
                                                    type="text"
                                                    name="address_district"
                                                    value={formData.businessAddress.district}
                                                    onChange={handleInputChange}
                                                    placeholder="Quận/Huyện"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                                <input
                                                    type="text"
                                                    name="address_province"
                                                    value={formData.businessAddress.province}
                                                    onChange={handleInputChange}
                                                    placeholder="Tỉnh/Thành phố"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t">
                                            <button
                                                onClick={handleSave}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Lưu
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-gray-900">
                                                Thông tin cá nhân
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Họ tên:</p>
                                                    <p className="font-medium text-gray-900">
                                                        {profile.firstName} {profile.lastName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        Email:
                                                    </p>
                                                    <p className="font-medium text-gray-900">
                                                        {profile.userId?.email}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        Số điện thoại:
                                                    </p>
                                                    <p className="font-medium text-gray-900">
                                                        {profile.primaryPhone || 'Chưa cập nhật'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-gray-900">
                                                Thông tin cửa hàng
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Tên cửa hàng:</p>
                                                    <p className="font-medium text-gray-900">
                                                        {profile.storeName}
                                                    </p>
                                                </div>
                                                {profile.storeDescription && (
                                                    <div>
                                                        <p className="text-gray-600">Mô tả:</p>
                                                        <p className="text-gray-700">
                                                            {profile.storeDescription}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {profile.businessAddress && (
                                            <div className="md:col-span-2 space-y-3">
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <MapPin className="w-5 h-5" />
                                                    Địa chỉ kinh doanh
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                                    <p className="text-gray-900">
                                                        {profile.businessAddress.street}
                                                    </p>
                                                    <p className="text-gray-900">
                                                        {profile.businessAddress.ward},{' '}
                                                        {profile.businessAddress.district}
                                                    </p>
                                                    <p className="text-gray-900">
                                                        {profile.businessAddress.province}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats Tab */}
                        {activeTab === 'stats' && dashboard && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: 'Tổng sản phẩm',
                                        value: dashboard.stats?.totalProducts || 0,
                                        color: 'from-blue-500 to-blue-600',
                                    },
                                    {
                                        label: 'Đơn hàng',
                                        value: dashboard.stats?.totalOrders || 0,
                                        color: 'from-green-500 to-green-600',
                                    },
                                    {
                                        label: 'Doanh số',
                                        value: dashboard.stats?.totalSales || 0,
                                        color: 'from-orange-500 to-orange-600',
                                    },
                                    {
                                        label: 'Doanh thu',
                                        value: `${(
                                            dashboard.stats?.totalRevenue || 0
                                        ).toLocaleString()}₫`,
                                        color: 'from-red-500 to-red-600',
                                    },
                                ].map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200"
                                    >
                                        <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-4">
                                {profile.taxId && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="font-semibold text-gray-900 mb-2">
                                            Mã số thuế
                                        </p>
                                        <p className="text-gray-700">{profile.taxId}</p>
                                    </div>
                                )}

                                {profile.businessRegistration && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="font-semibold text-gray-900 mb-2">
                                            Số đăng ký kinh doanh
                                        </p>
                                        <p className="text-gray-700">
                                            {profile.businessRegistration}
                                        </p>
                                    </div>
                                )}

                                {!profile.taxId && !profile.businessRegistration && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                        <p className="text-gray-600">Chưa có tài liệu nào</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerProfile;
