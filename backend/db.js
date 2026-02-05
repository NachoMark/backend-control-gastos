// backend/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Usamos el usuario 'admin' y la contraseña 'admin123'
        // Asegúrate de que esta URL sea EXACTAMENTE así (sin espacios extra)
        const conn = await mongoose.connect('mongodb+srv://admin:admin123@cluster0.nkhc3.mongodb.net/gastos-app?retryWrites=true&w=majority&appName=Cluster0');
        
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;