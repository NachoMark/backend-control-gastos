const express = require('express');
const router = express.Router();
const Cuota = require('../models/Cuota');
const User = require('../models/User');
const Gasto = require('../models/Gasto'); // <--- ¡IMPORTANTE! Agregamos esto
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

// CREAR CUOTA
router.post('/crear', auth, async (req, res) => {
    const { descripcion, monto_total, cantidad_cuotas } = req.body;
    
    if (!monto_total || !cantidad_cuotas) {
        return res.status(400).json({ error: "Faltan datos" });
    }

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
        res.status(500).json({ error: "Error al crear cuota" });
    }
});

// PAGAR CUOTA (La magia ocurre aquí ✨)
router.put('/pagar/:id', auth, async (req, res) => {
    const { metodo_pago } = req.body;

    try {
        const cuota = await Cuota.findById(req.params.id);
        const usuario = await User.findById(req.usuario.id);

        if (!cuota || !usuario) return res.status(404).json({ error: "No encontrado" });

        if (cuota.cuotas_pagadas >= cuota.cantidad_cuotas) {
            return res.status(400).json({ error: "Deuda pagada" });
        }

        const saldoActual = metodo_pago === 'efectivo' ? usuario.saldo_efectivo : usuario.saldo_virtual;
        
        if (saldoActual < cuota.monto_cuota) {
            return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // 1. Descontar dinero
        if (metodo_pago === 'efectivo') {
            usuario.saldo_efectivo -= cuota.monto_cuota;
        } else {
            usuario.saldo_virtual -= cuota.monto_cuota;
        }

        // 2. Avanzar cuota
        cuota.cuotas_pagadas += 1;

        // 3. ¡NUEVO! Crear el registro en el Historial de Gastos
        const nuevoGasto = new Gasto({
            usuario: req.usuario.id,
            descripcion: `Cuota ${cuota.cuotas_pagadas} de ${cuota.cantidad_cuotas}: ${cuota.descripcion}`,
            monto: cuota.monto_cuota,
            tipo: metodo_pago,
            categoria: 'Cuotas', // Categoría especial
            fecha: Date.now()
        });

        // 4. Guardar todo
        await usuario.save();
        await cuota.save();
        await nuevoGasto.save(); // Guardamos el historial

        res.json({ message: "Cuota pagada y registrada en historial" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al pagar cuota" });
    }
});

module.exports = router;