import { useState, useCallback, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import RoleRequestFilters from './RoleRequestFilters';
import { getAllRoleRequests } from '../../services/api/roleRequestApi';
import toast from 'react-hot-toast';
import Loading from '../common/Loading';

const ITEMS_PER_PAGE = 10;

function RoleRequestManagement({ onSelectRequest }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const [filters, setFilters] = useState({ role: '', status: '' });

    const fetchRequests = useCallback(async (page = 1, filterParams) => {
        try {
            setLoading(true);
            const params = {};
            if (filterParams.role) params.role = filterParams.role;
            if (filterParams.status) params.status = filterParams.status;

            const response = await getAllRoleRequests(params);

            if (response.success) {
                // Tính toán phân trang
                const total = response.data.length;
                const start = (page - 1) * ITEMS_PER_PAGE;
                const end = start + ITEMS_PER_PAGE;
                const paginatedData = response.data.slice(start, end);

                setRequests(paginatedData);
                setTotalRequests(total);
                setCurrentPage(page);
            } else {
                toast.error(response.message || 'Lỗi khi tải danh sách');
            }
        } catch (error) {
            console.error('Fetch requests error:', error);
            toast.error('Lỗi khi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchRequests(1, filters);
    }, []);

    const handleFilterChange = useCallback(
        (newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
            fetchRequests(1, newFilters);
        },
        [fetchRequests]
    );

    const totalPages = Math.ceil(totalRequests / ITEMS_PER_PAGE);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchRequests(currentPage - 1, filters);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchRequests(currentPage + 1, filters);
        }
    };

    const getRoleLabel = (role) => {
        return role === 'seller' ? 'Người bán hàng' : 'Người giao hàng';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'Chưa giải quyết';
            case 'approved':
                return 'Đã chấp thuận';
            case 'rejected':
                return 'Đã từ chối';
            default:
                return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-50 border-l-4 border-amber-500';
            case 'approved':
                return 'bg-green-50 border-l-4 border-green-500';
            case 'rejected':
                return 'bg-red-50 border-l-4 border-red-500';
            default:
                return 'bg-gray-50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-amber-500" />;
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FAFB] from-slate-50 to-slate-100 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Quản lý yêu cầu vai trò
                </h1>
            </div>

            {/* Filters */}
            <RoleRequestFilters
                onFilterChange={handleFilterChange}
                loading={loading}
            />

            {loading && <Loading />}

            {!loading && requests.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        Không có yêu cầu nào
                    </p>
                </div>
            ) : (
                <>
                    {/* Cards Grid */}
                    <div className="grid gap-4">
                        {requests.map((request) => (
                            <div
                                key={request._id}
                                className={`bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer ${getStatusColor(
                                    request.status
                                )}`}
                                onClick={() => onSelectRequest(request._id)}>
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Status Icon */}
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(request.status)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {request.details.lastName}{' '}
                                                    {request.details.firstName}
                                                </h3>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                                        request.status
                                                    )}`}>
                                                    {getStatusLabel(
                                                        request.status
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {request?.userId?.email ||
                                                    'N/A'}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">
                                                        {getRoleLabel(
                                                            request.role
                                                        )}
                                                    </span>
                                                </span>
                                                <span className="text-gray-400">
                                                    •
                                                </span>
                                                <span>
                                                    {new Date(
                                                        request.createdAt
                                                    ).toLocaleDateString(
                                                        'vi-VN'
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectRequest(request._id);
                                        }}
                                        className="cursor-pointer ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm whitespace-nowrap">
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <div className="flex items-center gap-1">
                                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                                    Trang {currentPage} / {totalPages}
                                </span>
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default RoleRequestManagement;
