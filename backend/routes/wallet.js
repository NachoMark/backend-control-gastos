// backend/routes/wallet.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Función mágica para reparar la base de datos si faltan columnas
async function repararBaseDeDatos() {
    try {
        console.log("Revisando estructura de la tabla usuarios...");
        // Intentamos agregar las columnas. Si ya existen, MySQL dará un error que ignoraremos.
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS saldo_efectivo DECIMAL(10, 2) DEFAULT 0.00`);
        await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS saldo_virtual DECIMAL(10, 2) DEFAULT 0.00`);
    } catch (err) {
        // Si el "IF NOT EXISTS" falla por versión de MySQL, probamos el método tradicional
        try {
            await pool.query(`ALTER TABLE usuarios ADD COLUMN saldo_efectivo DECIMAL(10, 2) DEFAULT 0.00`);
        } catch (e) {}
        try {
            await pool.query(`ALTER TABLE usuarios ADD COLUMN saldo_virtual DECIMAL(10, 2) DEFAULT 0.00`);
        } catch (e) {}
    }
}

// POST /api/wallet/cargar
router.post('/cargar', auth, async (req, res) => {
    const { monto, tipo } = req.body; 
    const usuario_id = req.usuario.id;

    if (!monto || !tipo) return res.status(400).json({ error: "Faltan datos" });

    try {
        // Intentamos reparar antes de cargar
        await repararBaseDeDatos();

        const columna = tipo === 'efectivo' ? 'saldo_efectivo' : 'saldo_virtual';
        
        await pool.query(
            `UPDATE usuarios SET ${columna} = ${columna} + ? WHERE id = ?`,
            [monto, usuario_id]
        );

        res.json({ message: "Saldo actualizado" });
    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({ error: "Error al cargar saldo", details: error.message });
    }
});

// GET /api/wallet/saldo
router.get('/saldo', auth, async (req, res) => {
    try {
        await repararBaseDeDatos();
        const [rows] = await pool.query('SELECT saldo_efectivo, saldo_virtual FROM usuarios WHERE id = ?', [req.usuario.id]);
        res.json(rows[0] || { saldo_efectivo: 0, saldo_virtual: 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener saldo" });
    }
});

module.exports = router;