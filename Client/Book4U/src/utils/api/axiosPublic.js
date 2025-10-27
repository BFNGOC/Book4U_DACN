import axios from 'axios';
import API_URL from '../../configs/api.js';

const axiosPublic = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosPublic;
