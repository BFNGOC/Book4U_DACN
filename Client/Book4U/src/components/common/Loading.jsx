import { FaSpinner } from 'react-icons/fa';

function Loading({ context }) {
    return (
        <div className="py-6 flex justify-center items-center text-gray-500">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span>{context}</span>
        </div>
    );
}

export default Loading;
