// index.js
const express = require('express');
const cors = require('cors'); // <--- 1. Importamos CORS
require('dotenv').config(); // Asegúrate de tener esto si usas variables de entorno locales

const { inicializarBD } = require('./db');
const usuariosRoutes = require('./routes/usuarios');
const gastosRoutes = require("./routes/gastos");
const cuotasRoutes = require("./routes/cuotas");
const walletRoutes = require("./routes/wallet");
const suscripcionesRoutes = require("./routes/suscripciones");

const app = express();

// <--- 2. EL PUERTO DEBE SER DINÁMICO
// Si estamos en la nube, usa process.env.PORT. Si estamos en local, usa el 3000.
const PORT = process.env.PORT || 3000;

// <--- 3. ACTIVAR CORS (Permite que tu App hable con el servidor)
app.use(cors());

// Middleware para entender JSON
app.use(express.json());

// Usar las rutas
app.use('/api/usuarios', usuariosRoutes); 
app.use("/api/gastos", gastosRoutes);
app.use("/api/cuotas", cuotasRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/suscripciones", suscripcionesRoutes);

// Inicializar DB y arrancar el servidor
inicializarBD().then(() => {
    // <--- 4. ESCUCHAR EN '0.0.0.0'
    // Esto es vital para Railway/Render. Significa "escucha en todas las direcciones disponibles"
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
});