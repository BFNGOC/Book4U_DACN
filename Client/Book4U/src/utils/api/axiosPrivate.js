import axios from 'axios';
import API_URL from '../../configs/api.js';

const axiosPrivate = axios.create({
    baseURL: API_URL,
});

axiosPrivate.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosPrivate;
