const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

// Conectar a Base de Datos
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// --- RUTAS (Asegúrate de que estas líneas existan) ---
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/gastos', require('./routes/gastos'));        // <--- ¿Está esta?
app.use('/api/cuotas', require('./routes/cuotas'));        // <--- ¿Y esta?
app.use('/api/suscripciones', require('./routes/suscripciones')); // <--- ¿Y esta?

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));