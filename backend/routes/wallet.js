
const express = require('express');
const router = express.Router();
const User = require('../models/User');
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
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no existe en BD" });
        }
        res.json({
            saldo_efectivo: usuario.saldo_efectivo || 0, // El || 0 evita errores si es null
            saldo_virtual: usuario.saldo_virtual || 0
        });
    } catch (error) {
        // ESTA LÍNEA ES LA QUE NOS FALTABA PARA VER EL ERROR:
        console.error("❌ ERROR EN WALLET:", error); 
        res.status(500).json({ error: "Error de servidor al obtener saldo" });
    }
});

router.put('/actualizar', auth, async (req, res) => {
    const { nuevo_efectivo, nuevo_virtual } = req.body;

    try {
        const usuario = await User.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        // Solo actualizamos si nos envían un valor (puede ser 0)
        // Usamos !== undefined porque el valor podría ser 0
        if (nuevo_efectivo !== undefined) {
            usuario.saldo_efectivo = Number(nuevo_efectivo);
        }
        
        if (nuevo_virtual !== undefined) {
            usuario.saldo_virtual = Number(nuevo_virtual);
        }

        await usuario.save();
        res.json({ message: "Saldo corregido exitosamente", saldo: usuario });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar saldo" });
    }
});
module.exports = router;