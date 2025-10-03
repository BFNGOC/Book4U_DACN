import { useUser } from '../contexts/userContext';

function Home() {
    const { logoutUser } = useUser();

    return (
        <div className="">
            <p>Home</p>
            <button
                onClick={() => {
                    logoutUser();
                }}
                className="border"
            >
                logout
            </button>
        </div>
    );
}

export default Home;
