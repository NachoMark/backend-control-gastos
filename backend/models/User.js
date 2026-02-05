// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Aquí definimos los saldos. ¡Fíjate qué fácil es!
    saldo_efectivo: { type: Number, default: 0 },
    saldo_virtual: { type: Number, default: 0 },
    fecha_creacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);