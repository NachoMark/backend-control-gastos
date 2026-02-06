// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require('../models/User'); // <--- CAMBIO IMPORTANTE: Importamos el Modelo, no la DB

// Ruta: POST /api/usuarios/registro
router.post('/registro', async (req, res) => {
    // 1. Desestructurar los datos
    const { nombre, email, password } = req.body;

    // 2. Validación básica
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        // 3. Verificar si el usuario ya existe (Versión MongoDB)
        // Ya no usamos "SELECT * FROM...", usamos .findOne()
        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado" });
        }

        // 4. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // 5. Crear el usuario en memoria (Versión MongoDB)
        const nuevoUsuario = new User({
            nombre,
            email,
            password: passwordEncriptada,
            saldo_efectivo: 0, // Iniciamos en 0
            saldo_virtual: 0
        });

        // 6. Guardarlo en la base de datos
        await nuevoUsuario.save();

        res.status(201).json({ message: "Usuario registrado exitosamente" });

    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error en el servidor al registrar usuario" });
    }
});

// Ruta: POST /api/usuarios/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        // 1. Buscar usuario
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        // 2. Verificar contraseña
        // Nota: Asegúrate de importar bcryptjs al inicio del archivo
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        // 3. Generar Token (CORREGIDO)
        const payload = {
            usuario: {
                id: usuario._id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secreto_temporal', // Debe ser igual al del middleware
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                
                // 4. Responder
                res.json({
                    message: "Login exitoso",
                    token,
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        email: usuario.email,
                        saldo_efectivo: usuario.saldo_efectivo,
                        saldo_virtual: usuario.saldo_virtual
                    }
                });
            }
        );

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error de servidor" });
    }
});

module.exports = router;