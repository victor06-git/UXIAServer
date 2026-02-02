const express = require("express");
const cors = require('cors');
const path = require("path");
const bcrypt = require('bcrypt');
const { sequelize, user, petition, response } = require('./bd');

const app = express();
const port = 3000;

// --- 1. MIDDLEWARES ---
app.use(cors()); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


async function checkDb() {
  try {
    await sequelize.authenticate();
    console.log('¡Conectado a MySQL con éxito!');
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
  }
}

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

// Autenticación de usuario administrador
app.post('/api/admin/usuaris/login', async (req, res) => {
    console.log(req.body);
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
                    data: {}
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
        console.error('Error during admin login:', error);
        res.status(500).json(
            { 
                status: "Error",
                message: 'Internal server error' 
            });
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