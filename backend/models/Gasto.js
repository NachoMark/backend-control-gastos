const mongoose = require('mongoose');

const GastoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Esto conecta el gasto con el usuario dueño
        required: true
    },
    monto: {
        type: Number,
        required: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true // Elimina espacios vacíos al inicio/final
    },
    tipo: {
        type: String,
        enum: ['efectivo', 'virtual'], // Solo permite estos dos valores
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now // Se guarda la hora exacta automáticamente
    }
});

module.exports = mongoose.model('Gasto', GastoSchema);