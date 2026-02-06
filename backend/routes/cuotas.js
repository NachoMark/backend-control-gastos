const express = require('express');
const router = express.Router();
const Cuota = require('../models/Cuota');
const auth = require('../middleware/auth');

// OBTENER CUOTAS
router.get('/', auth, async (req, res) => {
    try {
        const cuotas = await Cuota.find({ usuario: req.usuario.id });
        res.json(cuotas);
    } catch (error) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// CREAR NUEVA DEUDA EN CUOTAS
router.post('/', auth, async (req, res) => {
    const { descripcion, monto_total, cantidad_cuotas } = req.body;
    
    // Calculamos cuánto vale cada cuota automáticamente
    const monto_cuota = monto_total / cantidad_cuotas;

    try {
        const nuevaCuota = new Cuota({
            usuario: req.usuario.id,
            descripcion,
            monto_total,
            cantidad_cuotas,
            monto_cuota
        });
        await nuevaCuota.save();
        res.json(nuevaCuota);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear cuota" });
    }
});

// PAGAR UNA CUOTA (Avanzar 1 mes)
router.put('/pagar/:id', auth, async (req, res) => {
    try {
        const cuota = await Cuota.findById(req.params.id);
        
        if (cuota.cuotas_pagadas < cuota.cantidad_cuotas) {
            cuota.cuotas_pagadas += 1;
            await cuota.save();
            res.json(cuota);
        } else {
            res.status(400).json({ error: "Ya pagaste todo" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al pagar cuota" });
    }
});

module.exports = router;