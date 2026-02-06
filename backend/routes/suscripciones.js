const express = require('express');
const router = express.Router();
const Suscripcion = require('../models/Suscripcion');
const auth = require('../middleware/auth');

// OBTENER SUSCRIPCIONES
router.get('/', auth, async (req, res) => {
    try {
        const subs = await Suscripcion.find({ usuario: req.usuario.id });
        res.json(subs);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener suscripciones" });
    }
});

// CREAR SUSCRIPCION
router.post('/', auth, async (req, res) => {
    const { nombre, monto, fecha_cobro } = req.body;
    try {
        const nuevaSub = new Suscripcion({
            usuario: req.usuario.id,
            nombre,
            monto,
            fecha_cobro
        });
        await nuevaSub.save();
        res.json(nuevaSub);
    } catch (error) {
        res.status(500).json({ error: "Error al crear suscripción" });
    }
});

// BORRAR SUSCRIPCION (Para cuando dejas de pagar)
router.delete('/:id', auth, async (req, res) => {
    try {
        await Suscripcion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suscripción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;