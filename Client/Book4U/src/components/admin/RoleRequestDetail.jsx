import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import {
    getRoleRequestById,
    approveRoleRequest,
    rejectRoleRequest,
} from '../../services/api/roleRequestApi';
import API_URL from '../../configs/api';
import toast from 'react-hot-toast';
import Loading from '../common/Loading';
import ConfirmModal from '../ui/modals/ConfirmModal';

function RoleRequestDetail({ requestId, onBack }) {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);

    useEffect(() => {
        const fetchRequestDetail = async () => {
            try {
                setLoading(true);
                const response = await getRoleRequestById(requestId);
                if (response.success) {
                    setRequest(response.data);
                } else {
                    toast.error(
                        response.message || 'Lỗi khi tải chi tiết yêu cầu'
                    );
                    onBack();
                }
            } catch (error) {
                console.error('Fetch detail error:', error);
                toast.error('Lỗi khi tải chi tiết yêu cầu');
                onBack();
            } finally {
                setLoading(false);
            }
        };
        fetchRequestDetail();
    }, [requestId, onBack]);

    const handleApprove = async () => {
        setShowApproveConfirm(true);
    };

    const handleApproveConfirm = async () => {
        setShowApproveConfirm(false);
        try {
            setActionLoading(true);
            const response = await approveRoleRequest(requestId);
            if (response.success) {
                toast.success('Phê duyệt yêu cầu thành công');
                onBack();
            } else {
                toast.error(response.message || 'Lỗi khi phê duyệt yêu cầu');
            }
        } catch (error) {
            console.error('Approve error:', error);
            toast.error('Lỗi khi phê duyệt yêu cầu');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }
        setShowRejectConfirm(true);
    };

    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false);
        try {
            setActionLoading(true);
            const response = await rejectRoleRequest(requestId, {
                reason: rejectReason,
            });
            if (response.success) {
                toast.success('Từ chối yêu cầu thành công');
                onBack();
            } else {
                toast.error(response.message || 'Lỗi khi từ chối');
            }
        } catch (error) {
            console.error('Reject error:', error);
            toast.error('Lỗi khi từ chối yêu cầu');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loading />;
    if (!request) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Không tìm thấy yêu cầu</p>
            </div>
        );
    }

    const { details, role, status } = request;
    const isSeller = role === 'seller';
    const isShipper = role === 'shipper';
    const isIndividual = isSeller && details.businessType === 'individual';
    const isBusiness = isSeller && details.businessType === 'business';
    const canApprove = status === 'pending';
    const canReject = status === 'pending';

    const Section = ({ title, children }) => (
        <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                {title}
            </h2>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0FAFB] from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium">Quay lại</span>
                        </button>
                        <div className="flex items-center gap-3">
                            {status === 'pending' && (
                                <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                                    ⏳ Chờ xử lý
                                </span>
                            )}
                            {status === 'approved' && (
                                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                    ✓ Đã chấp thuận
                                </span>
                            )}
                            {status === 'rejected' && (
                                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                    ✗ Đã từ chối
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {details.lastName} {details.firstName}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isSeller ? 'Người bán hàng' : 'Người giao hàng'} •{' '}
                            {request?.userId?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8 mb-32">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Personal Info */}
                    <Section title="Thông tin cá nhân">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Họ
                                </p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {details.lastName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Tên
                                </p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {details.firstName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Số điện thoại
                                </p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {details.primaryPhone}
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* ID Card Info */}
                    <Section title="Chứng minh nhân dân">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Số CCCD
                                </p>
                                <p className="text-gray-900">
                                    {details.identificationNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Mặt trước
                                </p>
                                {details.identificationImages?.front && (
                                    <img
                                        src={`${API_URL}${details.identificationImages.front}`}
                                        alt="CCCD mặt trước"
                                        className="w-full h-32 object-cover rounded border border-gray-200"
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Mặt sau
                                </p>
                                {details.identificationImages?.back && (
                                    <img
                                        src={`${API_URL}${details.identificationImages.back}`}
                                        alt="CCCD mặt sau"
                                        className="w-full h-32 object-cover rounded border border-gray-200"
                                    />
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* Seller Specific */}
                    {isSeller && (
                        <>
                            <Section title="Thông tin cửa hàng">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Tên cửa hàng
                                        </p>
                                        <p className="text-gray-900">
                                            {details.storeName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Mã số thuế
                                        </p>
                                        <p className="text-gray-900">
                                            {details.taxId}
                                        </p>
                                    </div>
                                    {details.storeLogo && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                Logo
                                            </p>
                                            <img
                                                src={`${API_URL}${details.storeLogo}`}
                                                alt="Logo"
                                                className="w-24 h-24 object-cover rounded border border-gray-200"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {isBusiness && (
                                <Section title="Thông tin doanh nghiệp">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                Tên doanh nghiệp
                                            </p>
                                            <p className="text-gray-900">
                                                {details.businessName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                Số đăng ký
                                            </p>
                                            <p className="text-gray-900">
                                                {details.businessRegistration}
                                            </p>
                                        </div>
                                    </div>
                                    {details.businessLicenseImages?.length >
                                        0 && (
                                        <div className="mt-6">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                                                Giấy phép kinh doanh
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {details.businessLicenseImages.map(
                                                    (img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={`${API_URL}${img}`}
                                                            alt={`Giấy phép ${
                                                                idx + 1
                                                            }`}
                                                            className="w-full h-40 object-cover rounded border border-gray-200"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Section>
                            )}

                            <Section title="Địa chỉ kinh doanh">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Đường
                                        </p>
                                        <p className="text-gray-900">
                                            {details.businessAddress?.street}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Phường/Xã
                                        </p>
                                        <p className="text-gray-900">
                                            {details.businessAddress?.ward}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Quận/Huyện
                                        </p>
                                        <p className="text-gray-900">
                                            {details.businessAddress?.district}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Tỉnh
                                        </p>
                                        <p className="text-gray-900">
                                            {details.businessAddress?.province}
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            {details.warehouses?.length > 0 && (
                                <Section title="Kho hàng">
                                    {details.warehouses.map(
                                        (warehouse, idx) => (
                                            <div
                                                key={idx}
                                                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <h4 className="font-semibold text-gray-900 mb-3">
                                                    Kho {idx + 1}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                                            Địa chỉ
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {warehouse.street},{' '}
                                                            {warehouse.ward}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                                            Quận/Huyện
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {warehouse.district}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                                            Tỉnh
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {warehouse.province}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                                            Quản lý
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {
                                                                warehouse.managerName
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-xs text-gray-500 uppercase mb-1">
                                                            SĐT quản lý
                                                        </p>
                                                        <p className="text-gray-900">
                                                            {
                                                                warehouse.managerPhone
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </Section>
                            )}
                        </>
                    )}

                    {/* Shipper Specific */}
                    {isShipper && (
                        <>
                            {details.portraitImage && (
                                <Section title="Ảnh chân dung">
                                    <div className="flex justify-center">
                                        <img
                                            src={`${API_URL}${details.portraitImage}`}
                                            alt="Ảnh chân dung"
                                            className="w-40 h-48 object-cover rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </Section>
                            )}

                            <Section title="Bằng lái xe">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Số bằng lái
                                        </p>
                                        <p className="text-gray-900">
                                            {details.driverLicenseNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Mặt trước
                                        </p>
                                        {details.driverLicenseImages?.front && (
                                            <img
                                                src={`${API_URL}${details.driverLicenseImages.front}`}
                                                alt="Bằng lái mặt trước"
                                                className="w-full h-32 object-cover rounded border border-gray-200"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Mặt sau
                                        </p>
                                        {details.driverLicenseImages?.back && (
                                            <img
                                                src={`${API_URL}${details.driverLicenseImages.back}`}
                                                alt="Bằng lái mặt sau"
                                                className="w-full h-32 object-cover rounded border border-gray-200"
                                            />
                                        )}
                                    </div>
                                </div>
                            </Section>

                            <Section title="Phương tiện">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Loại phương tiện
                                        </p>
                                        <p className="text-gray-900">
                                            {details.vehicleType ===
                                            'motorcycle'
                                                ? 'Xe máy'
                                                : 'Xe ô tô'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                            Biển kiểm soát
                                        </p>
                                        <p className="text-gray-900">
                                            {details.vehicleRegistration}
                                        </p>
                                    </div>
                                </div>
                            </Section>

                            {details.serviceArea?.length > 0 && (
                                <Section title="Khu vực hoạt động">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {details.serviceArea.map(
                                            (area, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-blue-50 rounded border border-blue-200">
                                                    <p className="text-gray-900 font-medium">
                                                        {area.districtName}
                                                    </p>
                                                    <p className="text-gray-600 text-sm">
                                                        {area.provinceName}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </Section>
                            )}
                        </>
                    )}

                    {/* Bank Info */}
                    <Section title="Thông tin ngân hàng">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Chủ tài khoản
                                </p>
                                <p className="text-gray-900">
                                    {details.bankDetails?.accountName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Số tài khoản
                                </p>
                                <p className="text-gray-900">
                                    {details.bankDetails?.accountNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Ngân hàng
                                </p>
                                <p className="text-gray-900">
                                    {details.bankDetails?.bankName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Chi nhánh
                                </p>
                                <p className="text-gray-900">
                                    {details.bankDetails?.branchName}
                                </p>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Action Buttons */}
            {canApprove || canReject ? (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex gap-4">
                        {canApprove && (
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {actionLoading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Phê duyệt yêu cầu
                                    </>
                                )}
                            </button>
                        )}
                        {canReject && (
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {actionLoading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5" />
                                        Từ chối yêu cầu
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                    status === 'approved'
                                        ? 'bg-green-100'
                                        : 'bg-red-100'
                                }`}>
                                {status === 'approved' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    {status === 'approved'
                                        ? 'Yêu cầu đã được phê duyệt'
                                        : 'Yêu cầu đã bị từ chối'}
                                </p>
                                <p className="text-gray-600 text-sm">
                                    {status === 'approved'
                                        ? 'Người dùng đã được cấp quyền. Email xác nhận đã được gửi.'
                                        : request?.reason
                                        ? `Lý do: ${request.reason}`
                                        : 'Không có lý do được cung cấp'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <XCircle className="w-6 h-6" />
                                Từ chối yêu cầu
                            </h3>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Vui lòng nhập lý do để gửi email thông báo cho
                                người dùng:
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                placeholder="Ví dụ: Thông tin không đầy đủ, CCCD không rõ ràng..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none h-28 mb-3"
                            />
                            <p className="text-xs text-gray-500 mb-4">
                                {rejectReason.length} ký tự
                            </p>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={showApproveConfirm}
                type="success"
                title="Phê duyệt yêu cầu"
                message="Bạn có chắc chắn muốn phê duyệt yêu cầu này? Người dùng sẽ được cấp quyền truy cập."
                confirmText="Phê duyệt"
                cancelText="Hủy"
                onConfirm={handleApproveConfirm}
                onCancel={() => setShowApproveConfirm(false)}
            />

            <ConfirmModal
                open={showRejectConfirm}
                type="danger"
                title="Xác nhận từ chối"
                message="Bạn có chắc chắn muốn từ chối yêu cầu này? Lý do sẽ được gửi tới người dùng."
                confirmText="Từ chối"
                cancelText="Hủy"
                onConfirm={handleRejectConfirm}
                onCancel={() => setShowRejectConfirm(false)}
            />
        </div>
    );
}

export default RoleRequestDetail;
