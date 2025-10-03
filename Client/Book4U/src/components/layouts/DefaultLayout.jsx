import Navbar from './Navbar';

function DefaultLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-[#F0FAFB]">
            {/* Navbar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 w-full h-full max-w-screen-xl mx-auto px-6 py-6 mt-16">
                {children}
            </main>
        </div>
    );
}

export default DefaultLayout;
