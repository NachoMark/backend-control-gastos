// backend/routes/cuotas.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// 1. CREAR una nueva compra a cuotas
router.post('/crear', auth, async (req, res) => {
    const { descripcion, monto_total, cantidad_cuotas, fecha_inicio } = req.body;
    const usuario_id = req.usuario.id;

    // Calculamos el valor de cada cuota automáticamente
    // (O podrías enviarlo desde el front si tiene intereses)
    const valor_cuota = monto_total / cantidad_cuotas;

    try {
        await pool.query(
            `INSERT INTO compras_cuotas 
            (usuario_id, descripcion, monto_total, cantidad_cuotas, valor_cuota, fecha_inicio, cuotas_pagadas) 
            VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [usuario_id, descripcion, monto_total, cantidad_cuotas, valor_cuota, fecha_inicio]
        );
        res.status(201).json({ message: "Compra a cuotas registrada" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la cuota" });
    }
});

// 2. LISTAR cuotas activas (que no hayan terminado)
router.get('/listar', auth, async (req, res) => {
    const usuario_id = req.usuario.id;
    try {
        const [rows] = await pool.query(
            `SELECT * FROM compras_cuotas 
             WHERE usuario_id = ? AND finalizado = FALSE 
             ORDER BY fecha_inicio DESC`,
            [usuario_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al listar cuotas" });
    }
});

// 3. PAGAR una cuota (Sumar 1 al progreso)
router.put('/pagar/:id', auth, async (req, res) => {
    const cuota_id = req.params.id;
    const usuario_id = req.usuario.id;
    const { metodo_pago } = req.body; // <--- Ahora necesitamos que el front nos diga cómo paga

    if (!metodo_pago) return res.status(400).json({ error: "Seleccione método de pago" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Obtener datos de la cuota
        const [rows] = await connection.query('SELECT * FROM compras_cuotas WHERE id = ? AND usuario_id = ?', [cuota_id, usuario_id]);
        if (rows.length === 0) throw new Error("Cuota no encontrada");
        const compra = rows[0];

        // 2. Verificar Saldo
        const columnaSaldo = metodo_pago === 'efectivo' ? 'saldo_efectivo' : 'saldo_virtual';
        const [userRows] = await connection.query(`SELECT ${columnaSaldo} as saldo FROM usuarios WHERE id = ?`, [usuario_id]);
        
        if (userRows[0].saldo < compra.valor_cuota) {
            await connection.rollback();
            return res.status(400).json({ error: `No tienes suficiente saldo en ${metodo_pago}` });
        }

        // 3. Actualizar la cuota (+1 pagada)
        const nuevas_pagadas = compra.cuotas_pagadas + 1;
        const finalizado = nuevas_pagadas >= compra.cantidad_cuotas;
        
        await connection.query(
            'UPDATE compras_cuotas SET cuotas_pagadas = ?, finalizado = ? WHERE id = ?',
            [nuevas_pagadas, finalizado, cuota_id]
        );

        // 4. GENERAR EL REGISTRO EN EL HOME (Tabla gastos_unicos)
        // Esto cumple tu deseo de ver la cuota en el Home
        const descripcionGasto = `Cuota ${nuevas_pagadas}/${compra.cantidad_cuotas}: ${compra.descripcion}`;
        await connection.query(
            'INSERT INTO gastos_unicos (usuario_id, descripcion, monto, fecha, categoria, metodo_pago) VALUES (?, ?, ?, NOW(), ?, ?)',
            [usuario_id, descripcionGasto, compra.valor_cuota, 'Cuotas', metodo_pago]
        );

        // 5. Descontar dinero
        await connection.query(
            `UPDATE usuarios SET ${columnaSaldo} = ${columnaSaldo} - ? WHERE id = ?`,
            [compra.valor_cuota, usuario_id]
        );

        await connection.commit();
        res.json({ message: "Pago exitoso", nuevas_pagadas, finalizado });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message || "Error al pagar" });
    } finally {
        connection.release();
    }
});
module.exports = router;