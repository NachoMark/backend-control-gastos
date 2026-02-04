// backend/routes/wallet.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// POST /api/wallet/cargar
// Sirve para agregar dinero a efectivo o virtual
router.post('/cargar', auth, async (req, res) => {
    const { monto, tipo } = req.body; // tipo: 'efectivo' o 'virtual'
    const usuario_id = req.usuario.id;

    if (!monto || !tipo) return res.status(400).json({ error: "Faltan datos" });

    try {
        // Actualización dinámica según el tipo
        const columna = tipo === 'efectivo' ? 'saldo_efectivo' : 'saldo_virtual';
        
        await pool.query(
            `UPDATE usuarios SET ${columna} = ${columna} + ? WHERE id = ?`,
            [monto, usuario_id]
        );

        res.json({ message: "Saldo actualizado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar saldo" });
    }
});

// GET /api/wallet/saldo
// Para obtener el saldo actualizado en tiempo real
router.get('/saldo', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT saldo_efectivo, saldo_virtual FROM usuarios WHERE id = ?', [req.usuario.id]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener saldo" });
    }
});

module.exports = router;