import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { UserProvider } from './contexts/userContext';

function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                    <AppRoutes />
                </GoogleOAuthProvider>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;
