const express = require('express');
const router = express.Router();
const Suscripcion = require('../models/Suscripcion');
const User = require('../models/User'); // Necesario para restar el dinero
const auth = require('../middleware/auth');

// LISTAR SUSCRIPCIONES
// Frontend llama a: /api/suscripciones/listar
router.get('/listar', auth, async (req, res) => {
    try {
        const subs = await Suscripcion.find({ usuario: req.usuario.id });
        res.json(subs);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener suscripciones" });
    }
});

// CREAR SUSCRIPCION
// Frontend llama a: /api/suscripciones/crear
router.post('/crear', auth, async (req, res) => {
    // Recibimos los nombres que manda el Frontend (nombre_servicio, costo)
    // y los guardamos con los nombres de MongoDB (nombre, monto)
    const { nombre_servicio, costo, fecha_cobro } = req.body;
    
    try {
        const nuevaSub = new Suscripcion({
            usuario: req.usuario.id,
            nombre: nombre_servicio, // Mapeo: nombre_servicio -> nombre
            monto: parseFloat(costo), // Mapeo: costo -> monto
            fecha_cobro
        });
        await nuevaSub.save();
        res.json(nuevaSub);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear suscripción" });
    }
});

// PAGAR SUSCRIPCION (La lógica que faltaba) 🧠
router.put('/pagar/:id', auth, async (req, res) => {
    const { metodo_pago } = req.body; // 'efectivo' o 'virtual'

    try {
        const sub = await Suscripcion.findById(req.params.id);
        const usuario = await User.findById(req.usuario.id);

        if (!sub || !usuario) return res.status(404).json({ error: "No encontrado" });

        // 1. Verificar saldo
        const saldoActual = metodo_pago === 'efectivo' ? usuario.saldo_efectivo : usuario.saldo_virtual;
        if (saldoActual < sub.monto) {
            return res.status(400).json({ error: "Saldo insuficiente para pagar la suscripción" });
        }

        // 2. Descontar dinero
        if (metodo_pago === 'efectivo') {
            usuario.saldo_efectivo -= sub.monto;
        } else {
            usuario.saldo_virtual -= sub.monto;
        }

        // 3. Avanzar la fecha 1 mes
        const fechaActual = new Date(sub.fecha_cobro);
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        sub.fecha_cobro = fechaActual;

        // 4. Guardar cambios
        await usuario.save();
        await sub.save();

        res.json({ message: "Pago registrado y fecha actualizada", nueva_fecha: sub.fecha_cobro });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al pagar suscripción" });
    }
});

// BORRAR SUSCRIPCION
router.delete('/eliminar/:id', auth, async (req, res) => {
    try {
        await Suscripcion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suscripción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;