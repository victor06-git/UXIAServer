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
        await sequelize.sync({force: true}); 
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


app.post('/api/analitzar-imatge', async (req, res) => {
    if (!req.body.images || !req.body.images[0]) {
        return res.status(400).json({ error: "No se enviaron imágenes" });
    }

    let base64 = req.body.images[0];
    // Limpieza de prefijo base64 si existe
    if (base64.startsWith('data:')) base64 = base64.split(',')[1];

    try {
        

        const respons = await fetch('http://192.168.1.24:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "qwen2.5vl:7b",
                prompt: "Analitza aquesta imatge i respon estrictament amb aquest format JSON, sense markdown ni text addicional: {\"data\": {\"description\": \"...\", \"tags\": [\"tag1\", \"tag2\"]}}",
                stream: false,
                images: [base64]
            })
        });

        const ollamaRaw = await respons.json();
        
        // --- PROCESAMIENTO SEGURO DE LA RESPUESTA ---
        let finalDescription = "No s'ha podido generar una descripción.";
        let finalTags = [];

        try {
            const cleanResponse = ollamaRaw.response.replace(/```json|```/g, '').trim();
            const jsonResponse = JSON.parse(cleanResponse);
            
            finalDescription = jsonResponse.data?.description || finalDescription;
            finalTags = jsonResponse.data?.tags || [];
            const tagsString = finalTags.join(',');

            // 1. CREAR LA PETICIÓN PRIMERO
            // Necesitamos este ID para los demás registros
            const nuevaPeticion = await petition.create({
                prompt: "Analitza aquesta imatge...",
                stream: false,
                model: "qwen2.5vl:7b",
                userId: req.body.userId
            });

            // 2. CREAR LA IMAGEN ASOCIADA
            // Usamos el ID de la petición recién creada (nuevaPeticion.id)
            const nuevaImagen = await img.create({
                base64: base64,
                tags: tagsString,
                petitionId: nuevaPeticion.id 
            });

            // 3. CREAR LA RESPUESTA ASOCIADA
            await response.create({
                status: 200,
                message: "Imatges processades correctament",
                data: {
                    description: finalDescription,
                    tags: finalTags,
                    model_used: ollamaRaw.model,
                    total_duration: ollamaRaw.total_duration
                },
                petitionId: nuevaPeticion.id
            });

            logger.info('Todo guardado correctamente y relacionado');

        } catch (parseError) {
            logger.error('Error parseando JSON o guardando en DB:', parseError);
            finalDescription = ollamaRaw.response;
        }

        // 3. Respuesta final al cliente
        res.json({ 
            status: "OK",
            message: "Imatges processades correctament",
            data: {
                description: finalDescription,
                tags: finalTags,
                model_used: ollamaRaw.model,
                total_duration: ollamaRaw.total_duration
            }
        });

        

    } catch (error) {
        logger.error('Error procesando imagen:', error);
        res.status(500).json({ error: `Error interno: ${error.message}` });
    }
});

app.post('/api/generate', async (req, res) => {
    logger.info(req.body);
    const { prompt, imatges, stream, model } = req.body;

    try {
        var base64 = imatges[0];
        

        return res.status(200).json(
            { 
                status: "OK",
                message: 'Text generated successfully',
                data: {
                    text: `Resposta generada pel model ${model} amb el prompt "${prompt}".`
                }
            }
        );


        if (!adminUser) {
            return res.status(401).json(
                { 
                    status: "Error",
                    message: 'Invalid credentials',
                    data: {}
                }
            );
        }

    } catch (error) {
        logger.error('Error during token generation:', error);
        res.status(500).json(
            { 
                status: "Error",
                message: `Internaldsadasdsadasdsddsd server error: ${error.message}` 
            });
    }
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