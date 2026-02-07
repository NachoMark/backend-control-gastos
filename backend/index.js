const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

// Conectar a Base de Datos
connectDB();

const app = express();
app.use(express.json());
app.use(cors());


app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/gastos', require('./routes/gastos'));      
app.use('/api/cuotas', require('./routes/cuotas'));        
app.use('/api/suscripciones', require('./routes/suscripciones')); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));