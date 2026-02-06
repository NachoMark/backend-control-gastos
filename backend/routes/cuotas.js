const express = require('express');
const router = express.Router();
const Cuota = require('../models/Cuota');
const User = require('../models/User'); // IMPORTANTE: Necesitamos el modelo de Usuario para restar el saldo
const auth = require('../middleware/auth');

// OBTENER CUOTAS
// Frontend llama a: api.get('/cuotas') -> Coincide con api/cuotas/
router.get('/', auth, async (req, res) => {
    try {
        const cuotas = await Cuota.find({ usuario: req.usuario.id });
        res.json(cuotas);
    } catch (error) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

// CREAR NUEVA DEUDA EN CUOTAS
// Frontend llama a: api.post('/cuotas/crear') -> Agregamos '/crear' aquí
router.post('/crear', auth, async (req, res) => {
    const { descripcion, monto_total, cantidad_cuotas } = req.body;
    
    // Validación básica
    if (!monto_total || !cantidad_cuotas) {
        return res.status(400).json({ error: "Faltan datos del monto o cuotas" });
    }

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

// PAGAR UNA CUOTA (Avanzar 1 mes y RESTAR DINERO)
router.put('/pagar/:id', auth, async (req, res) => {
    const { metodo_pago } = req.body; // 'efectivo' o 'virtual'

    try {
        const cuota = await Cuota.findById(req.params.id);
        const usuario = await User.findById(req.usuario.id);

        if (!cuota) return res.status(404).json({ error: "Cuota no encontrada" });
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        // 1. Verificar si ya terminó de pagar
        if (cuota.cuotas_pagadas >= cuota.cantidad_cuotas) {
            return res.status(400).json({ error: "Esta deuda ya está pagada" });
        }

        // 2. Verificar si tiene saldo suficiente para pagar esta cuota
        const saldoActual = metodo_pago === 'efectivo' ? usuario.saldo_efectivo : usuario.saldo_virtual;
        
        if (saldoActual < cuota.monto_cuota) {
            return res.status(400).json({ error: "No tienes saldo suficiente para pagar esta cuota" });
        }

        // 3. Todo en orden: Restamos dinero y sumamos cuota pagada
        if (metodo_pago === 'efectivo') {
            usuario.saldo_efectivo -= cuota.monto_cuota;
        } else {
            usuario.saldo_virtual -= cuota.monto_cuota;
        }

        cuota.cuotas_pagadas += 1;

        // 4. Guardamos ambos cambios (Billetera y Cuota)
        await usuario.save();
        await cuota.save();

        res.json({ message: "Cuota pagada", cuota, nuevo_saldo: saldoActual - cuota.monto_cuota });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al pagar cuota" });
    }
});

module.exports = router;