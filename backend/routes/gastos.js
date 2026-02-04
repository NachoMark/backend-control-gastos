// backend/routes/gastos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth'); // Importamos nuestro guardia

// Ruta: POST /api/gastos/unico
// Agregamos 'auth' antes de la función para proteger la ruta
router.post('/unico', auth, async (req, res) => {
    const { descripcion, monto,  fecha, metodo_pago } = req.body; // <--- Agregamos metodo_pago
    const usuario_id = req.usuario.id;

    if (!monto || !fecha || !metodo_pago) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const connection = await pool.getConnection(); // Usamos conexión dedicada para transacción
    try {
        await connection.beginTransaction(); // Iniciamos operación segura

        // 1. Verificar si tiene saldo suficiente
        const columnaSaldo = metodo_pago === 'efectivo' ? 'saldo_efectivo' : 'saldo_virtual';
        const [userRows] = await connection.query(`SELECT ${columnaSaldo} as saldo FROM usuarios WHERE id = ?`, [usuario_id]);
        
        if (userRows[0].saldo < monto) {
            await connection.rollback();
            return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // 2. Insertar el gasto
        await connection.query(
            'INSERT INTO gastos_unicos (usuario_id, descripcion, monto, fecha,  metodo_pago) VALUES (?,  ?, ?, ?, ?)',
            [usuario_id, descripcion, monto, fecha, metodo_pago]
        );

        // 3. Descontar del usuario
        await connection.query(
            `UPDATE usuarios SET ${columnaSaldo} = ${columnaSaldo} - ? WHERE id = ?`,
            [monto, usuario_id]
        );

        await connection.commit(); // Confirmar cambios
        res.status(201).json({ message: "Gasto registrado y saldo descontado" });

    } catch (error) {
        await connection.rollback(); // Cancelar todo si falla
        console.error(error);
        res.status(500).json({ error: "Error al procesar el gasto" });
    } finally {
        connection.release();
    }
});

// Esta ruta nos devolverá todos los gastos del usuario autenticado
// router.get('/listar', auth, async (req, res) => {
//     const usuario_id = req.usuario.id; // Obtenemos el ID del token

//     try {
//         // Consultamos los gastos del usuario, ordenados por fecha (del más reciente al más antiguo)
//         const [rows] = await pool.query(
//             'SELECT * FROM gastos_unicos WHERE usuario_id = ? ORDER BY fecha DESC',
//             [usuario_id]
//         );

//         // Si el usuario no tiene gastos aún, enviamos un array vacío
//         res.json({
//             count: rows.length,
//             gastos: rows
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Error al obtener los gastos" });
//     }
// });

router.get('/listar', auth, async (req, res) => {
    const usuario_id = req.usuario.id;
    // Extraemos filtros de la URL: /listar?search=comida&categoria=Hogar
    const { search } = req.query; 

    try {
        let sql = 'SELECT * FROM gastos_unicos WHERE usuario_id = ?';
        let params = [usuario_id];

        // Si hay búsqueda por texto (Descripción)
        if (search) {
            sql += ' AND descripcion LIKE ?';
            params.push(`%${search}%`); // % permite buscar coincidencias parciales
        }

        // Si hay filtro por categoría
        // if (categoria && categoria !== 'Todas') {
        //     sql += ' AND categoria = ?';
        //     params.push(categoria);
        // }

        sql += ' ORDER BY fecha DESC';

        const [rows] = await pool.query(sql, params);
        res.json({ count: rows.length, gastos: rows });

    } catch (error) {
        res.status(500).json({ error: "Error al filtrar gastos" });
    }
});

router.delete('/eliminar/:id', auth, async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. OBTENER EL GASTO ANTES DE BORRARLO (Para saber cuánto devolver)
        const [rows] = await connection.query(
            'SELECT monto, metodo_pago FROM gastos_unicos WHERE id = ? AND usuario_id = ?', 
            [id, usuario_id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Gasto no encontrado" });
        }

        const gasto = rows[0];

        // 2. DEVOLVER EL DINERO A LA BILLETERA CORRESPONDIENTE
        const columnaSaldo = (gasto.metodo_pago === 'virtual') ? 'saldo_virtual' : 'saldo_efectivo';

        await connection.query(
            `UPDATE usuarios SET ${columnaSaldo} = ${columnaSaldo} + ? WHERE id = ?`,
            [gasto.monto, usuario_id]
        );

        // 3. AHORA SÍ, BORRAR EL GASTO
        await connection.query(
            'DELETE FROM gastos_unicos WHERE id = ?', 
            [id]
        );

        await connection.commit();
        res.json({ message: "Gasto eliminado y dinero reembolsado" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el gasto" });
    } finally {
        connection.release();
    }
});

module.exports = router;