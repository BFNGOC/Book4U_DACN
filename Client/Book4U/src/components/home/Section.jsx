import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

function Section({ title, viewAll, viewAllLink, children }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {viewAll && viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                        Xem tất cả
                        <FaArrowRight className="text-sm" />
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
}
export default Section;
