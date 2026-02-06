const express = require('express');
const router = express.Router();
const Gasto = require('../models/Gasto');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Ruta: POST /api/gastos/unico (Crear Gasto)
router.post('/unico', auth, async (req, res) => {
    // Recibimos los datos del celular
    const { descripcion, monto, fecha, metodo_pago, categoria } = req.body;
    
    // Validación básica
    if (!monto || !metodo_pago) {
        return res.status(400).json({ error: "Faltan datos (monto o método de pago)" });
    }

    try {
        // 1. Buscar al usuario para revisar su saldo
        const usuario = await User.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        // 2. Verificar saldo suficiente
        const saldoActual = (metodo_pago === 'efectivo') ? usuario.saldo_efectivo : usuario.saldo_virtual;
        
        // Convertimos monto a número por si acaso viene como texto
        const montoNum = Number(monto);

        if (saldoActual < montoNum) {
            return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // 3. Crear el nuevo gasto (Nota: mapeamos 'metodo_pago' a 'tipo')
        const nuevoGasto = new Gasto({
            usuario: req.usuario.id,
            descripcion,
            monto: montoNum,
            fecha: fecha || Date.now(),
            tipo: metodo_pago, // Guardamos 'efectivo' o 'virtual' en el campo 'tipo'
            categoria: categoria || 'General'
        });

        // 4. Descontar el dinero al usuario
        if (metodo_pago === 'efectivo') {
            usuario.saldo_efectivo -= montoNum;
        } else {
            usuario.saldo_virtual -= montoNum;
        }

        // 5. Guardar ambos cambios en la base de datos
        await nuevoGasto.save();
        await usuario.save();

        res.status(201).json({ message: "Gasto registrado y saldo descontado", gasto: nuevoGasto });

    } catch (error) {
        console.error("Error al crear gasto:", error);
        res.status(500).json({ error: "Error al procesar el gasto" });
    }
});

// Ruta: GET /api/gastos/listar (Listar con búsqueda)
router.get('/listar', auth, async (req, res) => {
    const { search } = req.query;
    
    try {
        // Filtro base: Solo los gastos de ESTE usuario
        let filtro = { usuario: req.usuario.id };

        // Si el usuario escribió algo en el buscador
        if (search) {
            // Usamos expresiones regulares ($regex) para buscar coincidencias (como el LIKE %...% de SQL)
            // 'i' significa que ignora mayúsculas/minúsculas
            filtro.descripcion = { $regex: search, $options: 'i' };
        }

        // Buscamos, ordenamos por fecha (más nuevo primero)
        const gastos = await Gasto.find(filtro).sort({ fecha: -1 });

        res.json({
            count: gastos.length,
            gastos: gastos
        });

    } catch (error) {
        console.error("Error al listar gastos:", error);
        res.status(500).json({ error: "Error al obtener los gastos" });
    }
});

// Ruta: DELETE /api/gastos/eliminar/:id (Borrar y devolver dinero)
router.delete('/eliminar/:id', auth, async (req, res) => {
    try {
        // 1. Buscar el gasto y verificar que sea de este usuario
        const gasto = await Gasto.findOne({ _id: req.params.id, usuario: req.usuario.id });
        
        if (!gasto) {
            return res.status(404).json({ error: "Gasto no encontrado" });
        }

        // 2. Buscar al usuario para devolverle la plata
        const usuario = await User.findById(req.usuario.id);

        // 3. Reembolsar el dinero
        if (gasto.tipo === 'efectivo') {
            usuario.saldo_efectivo += gasto.monto;
        } else {
            usuario.saldo_virtual += gasto.monto;
        }

        // 4. Borrar el gasto y guardar al usuario actualizado
        await Gasto.findByIdAndDelete(req.params.id);
        await usuario.save();

        res.json({ message: "Gasto eliminado y dinero reembolsado" });

    } catch (error) {
        console.error("Error al eliminar gasto:", error);
        res.status(500).json({ error: "Error al eliminar el gasto" });
    }
});

module.exports = router;