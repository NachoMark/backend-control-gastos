const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Leer el token del header
    const token = req.header('x-auth-token');

    // 2. Si no hay token, prohibir paso
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    // 3. Verificar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_seguro');

        // 4. Guardar el usuario en la petición para usarlo en las rutas
        req.usuario = decoded.usuario;
        
        next(); 
    } catch (err) {
        console.error("Error en Middleware Auth:", err.message);
        res.status(401).json({ msg: 'Token no válido' });
    }
};