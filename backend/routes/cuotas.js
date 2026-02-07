const express = require('express');
const router = express.Router();
const Cuota = require('../models/Cuota');
const User = require('../models/User');
const Gasto = require('../models/Gasto'); 
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

// PAGAR CUOTA 
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

        // 3.Crear el registro en el Historial de Gastos
        const nuevoGasto = new Gasto({
            usuario: req.usuario.id,
            descripcion: `Cuota ${cuota.cuotas_pagadas} de ${cuota.cantidad_cuotas}: ${cuota.descripcion}`,
            monto: cuota.monto_cuota,
            tipo: metodo_pago,
            categoria: 'Cuotas', 
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
// EDITAR UNA CUOTA
router.put('/editar/:id', auth, async (req, res) => {
    const { descripcion, monto_total, cantidad_cuotas } = req.body;

    // Validamos que vengan los datos
    if (!descripcion || !monto_total || !cantidad_cuotas) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        // 1. Recalculamos el valor de la cuota mensual
        const nuevo_monto_cuota = Number(monto_total) / Number(cantidad_cuotas);

        // 2. Actualizamos en la base de datos
        const cuotaActualizada = await Cuota.findByIdAndUpdate(req.params.id, {
            descripcion,
            monto_total,
            cantidad_cuotas,
            monto_cuota: nuevo_monto_cuota
        }, { new: true }); // {new: true} devuelve el objeto ya cambiado

        res.json(cuotaActualizada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al editar la cuota" });
    }
});

// ELIMINAR UNA CUOTA (Borrón y cuenta nueva)
router.delete('/eliminar/:id', auth, async (req, res) => {
    try {
        const cuota = await Cuota.findByIdAndDelete(req.params.id);
        if (!cuota) return res.status(404).json({ error: "Cuota no encontrada" });

        res.json({ message: "Cuota eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la cuota" });
    }
});
module.exports = router;