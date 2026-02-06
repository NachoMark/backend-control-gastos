const mongoose = require('mongoose');

const CuotaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    descripcion: { type: String, required: true }, // Ej: TV 50 pulgadas
    monto_total: { type: Number, required: true },
    cantidad_cuotas: { type: Number, required: true },
    monto_cuota: { type: Number, required: true }, // Cuánto pagas por mes
    cuotas_pagadas: { type: Number, default: 0 },
    fecha_inicio: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cuota', CuotaSchema);