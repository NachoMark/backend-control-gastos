// backend/routes/wallet.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Importamos el modelo de Mongo
const auth = require('../middleware/auth');

// CARGAR SALDO
router.post('/cargar', auth, async (req, res) => {
    const { monto, tipo } = req.body; // tipo: 'efectivo' o 'virtual'

    if (!monto || !tipo) return res.status(400).json({ error: "Faltan datos" });

    try {
        // Buscamos al usuario por su ID
        const usuario = await User.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // Sumamos el saldo (asegurándonos de que sea número)
        if (tipo === 'efectivo') {
            usuario.saldo_efectivo += Number(monto);
        } else {
            usuario.saldo_virtual += Number(monto);
        }

        await usuario.save(); // Guardamos en MongoDB

        res.json({ message: "Saldo actualizado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar saldo" });
    }
});

// OBTENER SALDO
router.get('/saldo', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id);
        res.json({
            saldo_efectivo: usuario.saldo_efectivo,
            saldo_virtual: usuario.saldo_virtual
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener saldo" });
    }
});

module.exports = router;