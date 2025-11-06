import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { UserProvider } from './contexts/userContext';
import { CartProvider } from './contexts/CartContext';

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <CartProvider>
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                        <AppRoutes />

                        <Toaster
                            position="top-center"
                            toastOptions={{
                                duration: 2000,
                                style: {
                                    background: '#fff',
                                    color: '#333',
                                    fontWeight: 500,
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderRadius: '12px',
                                },
                            }}
                        />
                    </GoogleOAuthProvider>
                </CartProvider>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;
