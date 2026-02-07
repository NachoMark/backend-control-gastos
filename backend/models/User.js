const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    saldo_efectivo: {
        type: Number,
        default: 0
    },
    saldo_virtual: {
        type: Number,
        default: 0
    },
    fecha_registro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);