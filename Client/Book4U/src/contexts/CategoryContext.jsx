import { createContext, useContext, useEffect, useState } from 'react';
import { getAllCategories } from '@/services/api/categoryApi';

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await getAllCategories();
            if (res.success) setCategories(res.data);
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <CategoryContext.Provider value={{ categories, loading }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategory = () => useContext(CategoryContext);
