// backend/routes/suscripciones.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// 1. CREAR una suscripción
router.post('/crear', auth, async (req, res) => {
    const { nombre_servicio, costo, fecha_cobro, frecuencia } = req.body;
    const usuario_id = req.usuario.id;

    try {
        await pool.query(
            `INSERT INTO suscripciones (usuario_id, nombre_servicio, costo, fecha_cobro, frecuencia) 
             VALUES (?, ?, ?, ?, ?)`,
            [usuario_id, nombre_servicio, costo, fecha_cobro, frecuencia || 'mensual']
        );
        res.status(201).json({ message: "Suscripción agregada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear suscripción" });
    }
});

// 2. LISTAR suscripciones activas
router.get('/listar', auth, async (req, res) => {
    const usuario_id = req.usuario.id;
    try {
        // Ordenamos por fecha de cobro para ver qué vence primero
        const [rows] = await pool.query(
            `SELECT * FROM suscripciones WHERE usuario_id = ? AND activa = TRUE ORDER BY fecha_cobro ASC`,
            [usuario_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// 3. PAGAR EL MES (Renovar fecha + Descontar saldo)
router.put('/pagar/:id', auth, async (req, res) => {
    const id = req.params.id;
    const { metodo_pago } = req.body; // 'efectivo' o 'virtual'
    const usuario_id = req.usuario.id;

    if (!metodo_pago) return res.status(400).json({ error: "Falta método de pago" });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // A. Obtener datos de la suscripción
        const [subs] = await connection.query('SELECT * FROM suscripciones WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
        if (subs.length === 0) throw new Error("Suscripción no encontrada");
        const item = subs[0];

        // B. Verificar Saldo
        const columnaSaldo = metodo_pago === 'efectivo' ? 'saldo_efectivo' : 'saldo_virtual';
        const [userRows] = await connection.query(`SELECT ${columnaSaldo} as saldo FROM usuarios WHERE id = ?`, [usuario_id]);
        
        if (userRows[0].saldo < item.costo) {
            await connection.rollback();
            return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // C. Descontar Saldo
        await connection.query(`UPDATE usuarios SET ${columnaSaldo} = ${columnaSaldo} - ? WHERE id = ?`, [item.costo, usuario_id]);

        // D. Registrar en Gastos (Historial)
        await connection.query(
            'INSERT INTO gastos_unicos (usuario_id, descripcion, monto, fecha, categoria, metodo_pago) VALUES (?, ?, ?, NOW(), ?, ?)',
            [usuario_id, `Pago Suscripción: ${item.nombre_servicio}`, item.costo, 'Suscripciones', metodo_pago]
        );

        // E. Mover la fecha de cobro al próximo mes
        // SQL tiene funciones de fecha, pero para asegurar compatibilidad, sumaremos 1 mes.
        await connection.query(
            `UPDATE suscripciones SET fecha_cobro = DATE_ADD(fecha_cobro, INTERVAL 1 MONTH) WHERE id = ?`,
            [id]
        );

        await connection.commit();
        res.json({ message: "Pago registrado y fecha actualizada" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message || "Error al procesar pago" });
    } finally {
        connection.release();
    }
});
// 4. EDITAR suscripción (Actualizar precio, nombre o fecha)
router.put('/editar/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { nombre_servicio, costo, fecha_cobro } = req.body;
    const usuario_id = req.usuario.id;

    try {
        const [result] = await pool.query(
            `UPDATE suscripciones 
             SET nombre_servicio = ?, costo = ?, fecha_cobro = ? 
             WHERE id = ? AND usuario_id = ?`,
            [nombre_servicio, costo, fecha_cobro, id, usuario_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Suscripción no encontrada" });
        }

        res.json({ message: "Suscripción actualizada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 5. ELIMINAR suscripción (Dar de baja)
router.delete('/eliminar/:id', auth, async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    try {
        const [result] = await pool.query(
            'DELETE FROM suscripciones WHERE id = ? AND usuario_id = ?',
            [id, usuario_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Suscripción no encontrada" });
        }

        res.json({ message: "Suscripción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

module.exports = router;