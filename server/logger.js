const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info', // Nivel mínimo de logs a capturar
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json() // Formato ideal para archivos
    ),
    transports: [
        // 1. Archivo para errores críticos
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        // 2. Archivo para todos los logs (info, warn, error)
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Si no estamos en producción, también mostramos por consola con colores
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

module.exports = logger;