import { Routes, Route } from 'react-router-dom';

import PrivateRoute from './PrivateRoute';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import SetPassword from '../pages/auth/SetPassword';
import ProfileSetup from '../pages/auth/ProfileSetup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}></Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default AppRoutes;
