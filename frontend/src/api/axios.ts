// frontend/src/services/api.js (o el archivo que uses)
import axios from 'axios';

const api = axios.create({
    // ¡IMPORTANTE! Asegúrate de que termine en /api si tus rutas en el backend empiezan así
    // Ejemplo: https://nombre-de-tu-app.onrender.com/api
    baseURL: 'https://backend-gastos-mongo.onrender.com/api', 
});

export default api;