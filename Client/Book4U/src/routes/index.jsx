import { Routes, Route } from 'react-router-dom';

import DefaultLayout from '../components/layouts/DefaultLayout';

import PrivateRoute from './PrivateRoute';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import SetPassword from '../pages/auth/SetPassword';
import ProfileSetup from '../pages/auth/ProfileSetup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import Home from '../pages/Home';
import ProductDetails from '../pages/ProductDetails';
import Search from '../pages/Search';
import LivePage from '../pages/LivePage';
import LiveListPage from '../pages/LiveListPage';

import RoleSelection from '../pages/role/RoleSelection';
import SellerRegister from '../pages/role/sellerRegistration/SellerRegister';
import ShipperRegister from '../pages/role/shipperRegistration/ShipperRegister';

import DailyDiscover from '../pages/DailyDiscover';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import SellerConfirmation from '../pages/SellerConfirmation';

import RoleRequestsPage from '../pages/admin/RoleRequestsPage';
import SellerStore from '../pages/seller/SellerStore';
import SellerDashboard from '../pages/seller/SellerDashboard';
import SellerOrdersManagement from '../components/seller/SellerOrdersManagement';

import ShipperDashboard from '../pages/shipper/ShipperDashboard';
import OrderTracking from '../components/tracking/OrderTracking';
import ReturnStatusPage from '../pages/returns/ReturnStatusPage';
import PaymentCallback from '../pages/payment/PaymentCallback';
import MomoTestPayment from '../pages/payment/MomoTestPayment';

import NotFound from '../pages/NotFound';

function AppRoutes() {
    return (
        <DefaultLayout>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                    path="/reset-password/:token"
                    element={<ResetPassword />}
                />
                <Route path="/book/:slug" element={<ProductDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="/seller/:sellerId" element={<SellerStore />} />

                {/* Private Routes */}
                <Route
                    path="/daily-discover"
                    element={
                        <PrivateRoute>
                            <DailyDiscover />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="register/role/select"
                    element={
                        <PrivateRoute>
                            <RoleSelection />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="register/seller/"
                    element={
                        <PrivateRoute>
                            <SellerRegister />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="register/shipper/"
                    element={
                        <PrivateRoute>
                            <ShipperRegister />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/cart"
                    element={
                        <PrivateRoute>
                            <Cart />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/checkout"
                    element={
                        <PrivateRoute>
                            <Checkout />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <PrivateRoute>
                            <Orders />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orders/:orderId"
                    element={
                        <PrivateRoute>
                            <OrderDetail />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/role-requests"
                    element={
                        <PrivateRoute>
                            <RoleRequestsPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/dashboard/seller"
                    element={
                        <PrivateRoute>
                            <SellerDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/seller/confirmation"
                    element={
                        <PrivateRoute>
                            <SellerConfirmation />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/seller/orders"
                    element={
                        <PrivateRoute>
                            <SellerOrdersManagement />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/dashboard/shipper"
                    element={
                        <PrivateRoute>
                            <ShipperDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tracking/:orderId"
                    element={
                        <PrivateRoute>
                            <OrderTracking />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/returns/:orderId"
                    element={
                        <PrivateRoute>
                            <ReturnStatusPage />
                        </PrivateRoute>
                    }
                />
                {/* Payment Callback Routes */}
                <Route
                    path="/payment/vnpay/callback"
                    element={<PaymentCallback />}
                />
                <Route
                    path="/payment/momo/callback"
                    element={<PaymentCallback />}
                />
                <Route
                    path="/payment/momo/test"
                    element={<MomoTestPayment />}
                />
                <Route
                    path="/live/:streamId"
                    element={
                        <PrivateRoute>
                            <LivePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/lives"
                    element={
                        <PrivateRoute>
                            <LiveListPage />
                        </PrivateRoute>
                    }
                />
                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </DefaultLayout>
    );
}

export default AppRoutes;
