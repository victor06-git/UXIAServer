const { sequelize, user, petition, response } = require('./bd');
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;
const _dirname = path.resolve();
const bcrypt = require('bcrypt');

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