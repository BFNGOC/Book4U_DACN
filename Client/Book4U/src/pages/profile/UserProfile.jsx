import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../../contexts/userContext';
import { getUserProfile, updateUserProfile } from '../../services/api/userApi';
import { Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import Loading from '../../components/common/Loading';

function UserProfile() {
    const { profileId } = useParams();
    const { user: currentUser } = useUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        primaryPhone: '',
    });

    const isOwnProfile = currentUser?._id === profile?.userId?._id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await getUserProfile(profileId);
                if (res.success) {
                    setProfile(res.data);
                    setFormData({
                        firstName: res.data.firstName || '',
                        lastName: res.data.lastName || '',
                        dateOfBirth: res.data.dateOfBirth
                            ? new Date(res.data.dateOfBirth).toISOString().split('T')[0]
                            : '',
                        primaryPhone: res.data.primaryPhone || '',
                    });
                } else {
                    setError(res.message || 'Không thể tải profile');
                }
            } catch (err) {
                console.error('Lỗi:', err);
                setError('Đã xảy ra lỗi khi tải profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [profileId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await updateUserProfile(formData);
            if (res.success) {
                setProfile(res.data);
                setIsEditing(false);
                alert('Cập nhật profile thành công!');
            } else {
                alert(res.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            console.error('Lỗi:', err);
            alert('Đã xảy ra lỗi khi cập nhật profile');
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
                dateOfBirth: profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
                    : '',
                primaryPhone: profile.primaryPhone || '',
            });
        }
    };

    if (loading) return <Loading context="Đang tải thông tin cá nhân..." />;
    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    if (!profile)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Không tìm thấy profile</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Trang cá nhân</h1>
                    <p className="text-gray-600">Quản lý thông tin cá nhân và địa chỉ của bạn</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden mb-6">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-24"></div>

                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-12 relative z-10 mb-6">
                            {/* Avatar */}
                            <img
                                src={profile.avatar || '/img/default-avatar.png'}
                                alt={`${profile.firstName} ${profile.lastName}`}
                                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                            />

                            {/* Info */}
                            <div className="flex-grow">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {profile.firstName} {profile.lastName}
                                </h2>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4" />
                                    {profile.userId?.email}
                                </p>
                            </div>

                            {/* Edit Button */}
                            {isOwnProfile && (
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                                        isEditing
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        {isEditing ? (
                            // Edit Mode
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày sinh
                                        </label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Thông tin cá nhân
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Họ</p>
                                            <p className="font-medium text-gray-900">
                                                {profile.firstName || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tên</p>
                                            <p className="font-medium text-gray-900">
                                                {profile.lastName || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        {profile.dateOfBirth && (
                                            <div>
                                                <p className="text-sm text-gray-600">Ngày sinh</p>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(
                                                        profile.dateOfBirth
                                                    ).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Thông tin liên hệ
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </p>
                                            <p className="font-medium text-gray-900">
                                                {profile.userId?.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Số điện thoại
                                            </p>
                                            <p className="font-medium text-gray-900">
                                                {profile.primaryPhone || 'Chưa cập nhật'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Xác minh số điện thoại
                                            </p>
                                            <p
                                                className={`font-medium ${
                                                    profile.isPhoneVerified
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {profile.isPhoneVerified
                                                    ? '✓ Đã xác minh'
                                                    : '✗ Chưa xác minh'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Addresses */}
                {profile.addresses && profile.addresses.length > 0 && (
                    <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Địa chỉ ({profile.addresses.length})
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.addresses.map((addr, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                >
                                    {addr.isDefault && (
                                        <p className="text-xs font-semibold text-blue-600 mb-2">
                                            ⭐ Mặc định
                                        </p>
                                    )}
                                    <p className="font-medium text-gray-900">
                                        {addr.fullName || 'Không có tên'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                                    <p className="text-sm text-gray-600">
                                        {addr.ward}, {addr.district}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {addr.province}, {addr.country}
                                    </p>
                                    {addr.receiverPhone && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            📱 {addr.receiverPhone}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
