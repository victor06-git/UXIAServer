const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(
    'uxia5',
    'uxia_user',
    '1234',
     {
        host: 'localhost',
        dialect: 'mysql',
        logging: true
     }
)

// Generando las tablas
const user = sequelize.define('user', {
    nickname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telephone: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('normal', 'admin'),
        allowNull: false
    }
})

const petition = sequelize.define('petition', {
    prompt: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true
    },
    stream: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

const response = sequelize.define('response', {
    status: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    }
})

// Generando las relaciones

// user petition 1-n
user.hasMany(petition);
petition.belongsTo(user);

// petition response 1-1
petition.hasOne(response);
response.belongsTo(petition);


async function checkDb() {
  try {
    await sequelize.authenticate();
    console.log('¡Conectado a MySQL con éxito!');
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
  }
}

checkDb();

module.exports = { sequelize, user, petition, response };