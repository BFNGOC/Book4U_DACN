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
import RoleSelection from '../pages/role/RoleSelection';

import DailyDiscover from '../pages/DailyDiscover';

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
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/product/:slug" element={<ProductDetails />} />
                <Route path="/search" element={<Search />} />

                {/* Private Routes */}
                <Route
                    path="/daily-discover"
                    element={
                        <PrivateRoute>
                            <DailyDiscover />
                        </PrivateRoute>
                    }
                />
                <Route path="/role/select" element={<RoleSelection />} />
                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </DefaultLayout>
    );
}

export default AppRoutes;
