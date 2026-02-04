// routes/usuarios.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")
const { pool } = require('../db'); // Importamos la conexión

// Ruta: POST /api/usuarios/registro
router.post('/registro', async (req, res) => {
    // 1. Desestructurar los datos que vienen del Frontend
    const { nombre, email, password } = req.body;

    // 2. Validación básica
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        // 3. Verificar si el usuario ya existe
        const [usuariosExistentes] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado" });
        }

        // 4. Encriptar la contraseña (Hashing)
        const salt = await bcrypt.genSalt(10); // Nivel de complejidad
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // 5. Insertar en la base de datos
        await pool.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, passwordEncriptada]
        );

        // 6. Respuesta de éxito
        res.status(201).json({ message: "Usuario registrado exitosamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al registrar usuario" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validar que enviaron datos
    if (!email || !password) {
        return res.status(400).json({ error: "Faltan datos (email o password)" });
    }

    try {
        // 2. Buscar al usuario por email
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );

        // Si el array está vacío, es que el usuario no existe
        if (usuarios.length === 0) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const usuario = usuarios[0];

        // 3. Verificar la contraseña (comparar la que enviaron con la encriptada)
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        // 4. Generar el Token (La "pulsera" digital)
        // Guardamos el ID del usuario dentro del token para saber quién es
        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre }, 
            process.env.JWT_SECRET || 'secreto_temporal', // Usa la clave del .env
            { expiresIn: '30d' } // El token dura 30 días
        );

        // 5. Enviar el token y los datos básicos al usuario
        res.json({
            message: "Login exitoso",
            token, // El celular guardará esto
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
    }
});

module.exports = router;