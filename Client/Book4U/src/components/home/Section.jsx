function Section({ title, viewAll, children }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{title}</h2>
                {viewAll && <button className="text-blue-600 hover:underline">Xem tất cả</button>}
            </div>
            {children}
        </div>
    );
}
export default Section;
