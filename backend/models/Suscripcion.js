const mongoose = require('mongoose');

const SuscripcionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nombre: { type: String, required: true }, // Ej: Netflix
    monto: { type: Number, required: true },
    fecha_cobro: { type: Date, default: Date.now }, // O día del mes
    frecuencia: { type: String, default: 'mensual' }
});

module.exports = mongoose.model('Suscripcion', SuscripcionSchema);