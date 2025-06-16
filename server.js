const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de Vitoko\'s Coffee',
        version: '1.0.0',
        endpoints: {
            productos: '/api/productos',
            clientes: '/api/clientes',
            ventas: '/api/ventas',
            test: '/api/test'
        }
    });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifique la configuración.');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado correctamente');
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('📋 Endpoints disponibles:');
            console.log('   GET  / - Información de la API');
            console.log('   GET  /api/test - Prueba de conectividad');
            console.log('   POST /api/productos - Registrar producto');
            console.log('   GET  /api/productos - Listar productos');
            console.log('   POST /api/clientes - Registrar cliente');
            console.log('   GET  /api/clientes - Listar clientes');
            console.log('   POST /api/ventas - Registrar venta');
            console.log('   GET  /api/ventas - Listar ventas');
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();