import axios from 'axios';

const api = axios.create({
    baseURL: 'https://backend-gastos-mongo.onrender.com/api', 
});

export default api;