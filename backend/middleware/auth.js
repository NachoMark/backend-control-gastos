// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Leer el token que viene en el "Header" de la petición
    const token = req.header('Authorization');

    // 2. Si no hay token, no lo dejamos pasar
    if (!token) {
        return res.status(401).json({ error: "No hay token, permiso denegado" });
    }

    try {
        // El token suele venir como "Bearer XXXX...", quitamos la palabra "Bearer "
        const cifrado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secreto_temporal');
        
        // 3. Guardamos los datos del usuario dentro de la petición (req)
        // para que la siguiente función sepa quién es
        req.usuario = cifrado;
        
        next(); // ¡Pase usted!
    } catch (error) {
        res.status(401).json({ error: "Token no válido" });
    }
};