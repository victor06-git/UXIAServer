const express = require("express");
const cors = require('cors');
const path = require("path");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sequelize, user, petition, response, img, token } = require('./bd');
const logger = require('./logger');
const { start } = require("repl");

const app = express();
const port = 3000;

// --- 1. MIDDLEWARES ---
app.use(cors()); 

app.use(express.json({ limit: '50mb'})); 
app.use(express.urlencoded({ extended: true }));

const authenticateToken = async (req, res, next) => {
    // 1. Obtener la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    
    const tokenValue = authHeader && authHeader.split(' ')[1];

    if (!tokenValue) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        // 2. Buscar el token en la base de datos
        const foundToken = await token.findOne({ 
            where: { value: tokenValue },
            include: ['user'] 
        });

        if (!foundToken) {
            return res.status(403).json(
                { 
                    status: "ERROR",
                    message: "API_KEY invàlida",
                    "data": null
                });
        }

        req.user = foundToken.user;
        
        // 4. Continuar con la ejecución
        next();
    } catch (error) {
        logger.error('Error en la validación del token:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

async function generateToken(email) {
    const tokenValue = crypto.randomBytes(32).toString('hex');
    try {
        const foundUser = await user.findOne({ where: { email: email } });

        if (!foundUser) {
            throw new Error('Usuario no encontrado');
        }
        await token.create({
            value: tokenValue,
            email: email,
            userId: foundUser.id
        });
        return tokenValue;
    } catch (error) {
        logger.error('Error generating token:', error);
        throw new Error('Error generating token');
    }
}

async function checkDb() {
  try {
    await sequelize.authenticate();
    console.log('¡Conectado a MySQL con éxito!');
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
  }
}

async function startApp() {
    try {
        // 2. Sincronizamos ANTES de que el servidor acepte peticiones
        await sequelize.sync(); 
        logger.info('Tablas verificadas/creadas correctamente');

        // 3. Ahora que las tablas existen, encendemos el servidor
        app.listen(port, () => {
            logger.info(`Servidor listo en puerto ${port}`);
        });
    } catch (error) {
        logger.error('Error al iniciar la base de datos:', error);
    }
}

startApp();

app.get('/', (req, res) => {
    res.send('Hello Worldsdsdssdsdd!');
});

app.get('/test', (req, res) => {
    res.send('testtesttest!');
});

app.post('/api/test', (req, res) => {
    console.log(req.body);
    res.json({ message: 'Test received', data: req.body });
});


// VERSIÓN ANTIGUA SIN VERIFICACIÓN DE TOKEN
// app.post('/api/analitzar-imatge', (req, res) => {
//     if (!req.body.images || !req.body.images[0]) {
//         return res.status(400).json({ error: "No se enviaron imágenes" });
//     }
//     logger.info(req.body);
    

//     var base64 = req.body.images[0];

//     // Guardando imagen en la base de datos
//     img.create({
//         base64: base64
//     }).then(() => {
//         logger.info('Image saved to database');
//     }).catch((error) => {
//         logger.error('Error saving image to database:', error);
//     });



//     res.json({ 
//         message: 'Image analysis received', 
//         data: req.body });
// });

app.post('/api/analitzar-imatge', authenticateToken, (req, res) => {
    if (!req.body.images || !req.body.images[0]) {
        return res.status(400).json({ error: "No se enviaron imágenes" });
    }

    const base64 = req.body.images[0];

    // Ahora podemos saber qué usuario está subiendo la imagen gracias al middleware
    img.create({
        base64: base64,
        userId: req.user.id // <-- Relación automática
    }).then(() => {
        logger.info(`Image saved for user: ${req.user.email}`);
    }).catch((error) => {
        logger.error('Error saving image:', error);
    });

    res.json({ 
        status: "OK",
        message: "Imatges processades correctament",
        data: {
            description: "Aquesta imatge es molt bonica",

            tags: ["bonica", "foto", "imatge"],
            processingTime: "2.3s",
            model_used: "qwen2.5vl:7b"
        }
    });
});

// Autenticación de usuario administrador
app.post('/api/admin/usuaris/login', async (req, res) => {
    logger.info(req.body);
    const { email, password } = req.body;

    try {
        const adminUser = await user.findOne({ where: { email, role: 'admin' }});

        if (!adminUser) {
            return res.status(401).json(
                { 
                    status: "Error",
                    message: 'Invalid credentials',
                    data: {}
                }
            );
        }

        // Comprobando contraseña
        if (bcrypt.compareSync(password, adminUser.password)) {
            res.status(200).json(
                { 
                    status: "OK",
                    message: 'User successfully authenticated',
                    data: {
                        token: await generateToken(email),
                    }
                }
            );
        }
        else {
            res.status(401).json(
                { 
                    status: "Error",
                    message: 'Invalid credentials',
                    data: {}
                }
            );
        }
    } catch (error) {
        logger.error('Error during admin login:', error);
        res.status(500).json(
            { 
                status: "Error",
                message: 'Internal server error' 
            });
    }
});

app.post('/api/admin/usuaris/testtoken', async (req, res) => {
    const { token: tokenValue } = req.body;

    try {
        const foundToken = await token.findOne({ where: { value: tokenValue } });

        if (!foundToken) {
            return res.status(401).json(
                {
                    status: "Error",
                    message: 'Invalid token',
                    data: {}
                }
            );
        }

        res.status(200).json(
            {
                status: "OK",
                message: 'Token is valid',
                data: {
                    email: foundToken.email
                }
            }
        );
    } catch (error) {
        logger.error('Error during token validation:', error);
        res.status(500).json(
            {
                status: "Error",
                message: 'Internal server error'
            }
        );
    }
});

app.post('/api/admin/usuaris/logout', async (req, res) => {
    const { token: tokenValue } = req.body;

    try {
        const foundToken = await token.findOne({ where: { value: tokenValue } });

        if (!foundToken) {
            return res.status(401).json(
                {
                    status: "Error",
                    message: 'Invalid token',
                    data: {}
                }
            );
        }

        await foundToken.destroy();

        res.status(200).json(
            {
                status: "OK",
                message: 'User logged out successfully',
                data: {}
            }
        );
    } catch (error) {
        logger.error('Error during logout:', error);
        res.status(500).json(
            {
                status: "Error",
                message: 'Internal server error'
            }
        );
    }
});

// Activar el servidor
const httpServer = app.listen(port, appListen)
function appListen () {
    console.log(`Example app listening on: http://0.0.0.0:${port}`);

}


// Aturar el servidor correctament 
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    httpServer.close();
    process.exit(0);
}