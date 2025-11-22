import { useState } from 'react';
import RoleRequestManagement from '../../components/admin/RoleRequestManagement';
import RoleRequestDetail from '../../components/admin/RoleRequestDetail';
import { useUser } from '../../contexts/userContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

function RoleRequestsPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        Truy cập bị từ chối
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Bạn không có quyền truy cập trang này. Chỉ quản trị viên
                        mới có thể quản lý yêu cầu đăng ký vai trò.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {selectedRequestId ? (
                <RoleRequestDetail
                    requestId={selectedRequestId}
                    onBack={() => setSelectedRequestId(null)}
                />
            ) : (
                <RoleRequestManagement
                    onSelectRequest={(id) => setSelectedRequestId(id)}
                />
            )}
        </div>
    );
}

export default RoleRequestsPage;
