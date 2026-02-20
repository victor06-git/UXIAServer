const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(
    'uxia5',
    'uxia_user',
    '1234',
     {
        host: 'localhost',
        dialect: 'mysql',
        define: {
            timestamps: false
        },
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
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    }
})

const petition = sequelize.define('petition', {
    prompt: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    stream: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
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

const img = sequelize.define('img', {
    base64: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    tags: {
        type: DataTypes.STRING, // ulleras,persona,cara,fosc
        allowNull: false
    }
})

const token = sequelize.define('token', {
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
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

// petition image 1-n
petition.hasMany(img);
img.belongsTo(petition);

// token user 1-1
token.belongsTo(user);
user.hasOne(token);

module.exports = { sequelize, user, petition, response, img, token };