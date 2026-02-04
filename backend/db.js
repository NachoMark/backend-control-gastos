// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración PRINCIPAL (La que usará la app una vez iniciada)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'control_gastos', // Esta es la base a la que nos queremos conectar
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

// Creamos el pool, pero NO lo usamos todavía hasta asegurar que la DB existe
const pool = mysql.createPool(dbConfig);

async function inicializarBD() {
    try {
        // PASO 1: Conexión TEMPORAL (Sin base de datos específica)
        // Hacemos esto para poder ejecutar el comando CREATE DATABASE
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // PASO 2: Crear la base de datos si no existe
        await connection.query(`CREATE DATABASE IF NOT EXISTS control_gastos;`);
        console.log("✅ Base de datos 'control_gastos' verificada/creada.");
        
        // Cerramos la conexión temporal porque ya cumplió su misión
        await connection.end(); 

        // PASO 3: Crear las tablas
        // Ahora sí podemos usar 'pool' porque la base de datos ya existe
        const sqlTablas = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS suscripciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                nombre_servicio VARCHAR(100) NOT NULL,
                costo DECIMAL(10, 2) NOT NULL,
                fecha_cobro DATE NOT NULL,
                frecuencia ENUM('mensual', 'anual') DEFAULT 'mensual',
                activa BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            );

            CREATE TABLE IF NOT EXISTS compras_cuotas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                descripcion VARCHAR(150) NOT NULL,
                monto_total DECIMAL(10, 2) NOT NULL,
                cantidad_cuotas INT NOT NULL,
                cuotas_pagadas INT DEFAULT 0,
                valor_cuota DECIMAL(10, 2) NOT NULL,
                fecha_inicio DATE NOT NULL,
                finalizado BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            );

            CREATE TABLE IF NOT EXISTS gastos_unicos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                descripcion VARCHAR(150),
                monto DECIMAL(10, 2) NOT NULL,
                fecha DATE NOT NULL,
                categoria VARCHAR(50),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            );
        `;

        // Ejecutamos la creación de tablas usando el POOL
        await pool.query(sqlTablas);
        console.log("✅ Tablas verificadas/creadas correctamente.");

    } catch (error) {
        console.error("❌ Error al inicializar la base de datos:", error);
        // Tip: Si el error es de contraseña, avisamos claramente
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("⚠️ Verifica tu usuario y contraseña en el archivo .env");
        }
        process.exit(1);
    }
}

module.exports = { pool, inicializarBD };