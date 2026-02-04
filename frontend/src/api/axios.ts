// src/api/axios.ts
import axios from 'axios';

// REEMPLAZA '192.168.X.X' CON TU IP REAL
// REEMPLAZA '3000' CON EL PUERTO DE TU BACKEND
const BASE_URL = 'https://backend-control-gastos-production.up.railway.app/api';
export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Esto nos ayudará a ver en consola si la conexión falla
api.interceptors.response.use(
    response => response,
    error => {
        console.error("Error en la petición API:", error.response || error.message);
        return Promise.reject(error);
    }
);