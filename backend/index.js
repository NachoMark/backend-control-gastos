// backend/index.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); // Importamos la nueva conexión

const app = express();

// Conectar a MongoDB
connectDB(); 

app.use(cors());
app.use(express.json());

// Tus rutas (asegúrate de que apunten a los archivos correctos)
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet')); 
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/cuotas', require('./routes/cuotas'));
app.use('/api/suscripciones', require('./routes/suscripciones'));
// ... otras rutas

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// app.use('/api/usuarios', usuariosRoutes); 
// app.use("/api/gastos", gastosRoutes);
// app.use("/api/cuotas", cuotasRoutes);
// app.use("/api/wallet", walletRoutes);
// app.use("/api/suscripciones", suscripcionesRoutes);