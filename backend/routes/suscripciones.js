const express = require('express');
const router = express.Router();
const Suscripcion = require('../models/Suscripcion');
const User = require('../models/User');
const Gasto = require('../models/Gasto'); // <--- ¡IMPORTANTE!
const auth = require('../middleware/auth');

// LISTAR
router.get('/listar', auth, async (req, res) => {
    try {
        const subs = await Suscripcion.find({ usuario: req.usuario.id });
        res.json(subs);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener suscripciones" });
    }
});

// CREAR
router.post('/crear', auth, async (req, res) => {
    const { nombre_servicio, costo, fecha_cobro } = req.body;
    try {
        const nuevaSub = new Suscripcion({
            usuario: req.usuario.id,
            nombre: nombre_servicio,
            monto: parseFloat(costo),
            fecha_cobro
        });
        await nuevaSub.save();
        res.json(nuevaSub);
    } catch (error) {
        res.status(500).json({ error: "Error al crear suscripción" });
    }
});

// PAGAR MES (La magia ocurre aquí ✨)
router.put('/pagar/:id', auth, async (req, res) => {
    const { metodo_pago } = req.body;

    try {
        const sub = await Suscripcion.findById(req.params.id);
        const usuario = await User.findById(req.usuario.id);

        if (!sub || !usuario) return res.status(404).json({ error: "No encontrado" });

        const saldoActual = metodo_pago === 'efectivo' ? usuario.saldo_efectivo : usuario.saldo_virtual;
        if (saldoActual < sub.monto) {
            return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // 1. Descontar dinero
        if (metodo_pago === 'efectivo') {
            usuario.saldo_efectivo -= sub.monto;
        } else {
            usuario.saldo_virtual -= sub.monto;
        }

        // 2. Avanzar fecha
        const fechaActual = new Date(sub.fecha_cobro);
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        sub.fecha_cobro = fechaActual;

        // 3. ¡NUEVO! Crear el registro en el Historial de Gastos
        const nuevoGasto = new Gasto({
            usuario: req.usuario.id,
            descripcion: `Suscripción: ${sub.nombre}`,
            monto: sub.monto,
            tipo: metodo_pago,
            categoria: 'Suscripciones',
            fecha: Date.now()
        });

        // 4. Guardar todo
        await usuario.save();
        await sub.save();
        await nuevoGasto.save();

        res.json({ message: "Pago registrado en historial y fecha actualizada" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al pagar suscripción" });
    }
});

// ELIMINAR
router.delete('/eliminar/:id', auth, async (req, res) => {
    try {
        await Suscripcion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suscripción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;