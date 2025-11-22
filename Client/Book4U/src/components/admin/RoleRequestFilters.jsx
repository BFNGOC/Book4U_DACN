import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function RoleRequestFilters({ onFilterChange, loading }) {
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        onFilterChange({ role, status });
    }, [role, status]);

    return (
        <div className="flex gap-4 mb-6">
            {/* Role Filter */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò
                </label>
                <div className="relative inline-block w-64">
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">Tất cả</option>
                        <option value="seller">Đăng ký người bán hàng</option>
                        <option value="shipper">Đăng ký người giao hàng</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 w-5 h-5" />
                </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                </label>
                <div className="relative inline-block w-64">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">Tất cả</option>
                        <option value="pending">Chưa giải quyết</option>
                        <option value="approved">Đã chấp thuận</option>
                        <option value="rejected">Đã từ chối</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
