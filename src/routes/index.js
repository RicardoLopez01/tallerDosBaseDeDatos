const express = require('express');
const router = express.Router();

// Importar controladores
const productosController = require('../controllers/productosController');
const clientesController = require('../controllers/clientesController');
const ventasController = require('../controllers/ventasController');

// RUTAS DE PRODUCTOS
// 1. Registrar un nuevo producto
router.post('/productos', productosController.registrarProducto);

// 3. Eliminar (deshabilitar) un producto
router.delete('/productos/:id', productosController.eliminarProducto);

// 4. Actualizar el precio de un producto
router.put('/productos/:id/precio', productosController.actualizarPrecio);

// 12. Listar productos disponibles
router.get('/productos', productosController.listarProductos);

// 13. Listar productos vendidos recientemente (Semana actual)
router.get('/productos/vendidos-recientes', productosController.productosVendidosRecientes);

// 14. Incrementar el stock de un producto
router.put('/productos/:id/stock', productosController.incrementarStock);

// 15. Cantidad de productos vendidos durante el año actual
router.get('/productos/vendidos-anio', productosController.productosVendidosAnio);

// RUTAS DE CLIENTES
// 2. Registrar un nuevo cliente
router.post('/clientes', clientesController.registrarCliente);

// 5. Eliminar (desactivar) un cliente
router.delete('/clientes/:id', clientesController.eliminarCliente);

// 6. Actualizar el estado de un cliente
router.put('/clientes/:id/estado', clientesController.actualizarEstado);

// 8. Consultar el detalle de los pedidos de un cliente específico para una fecha determinada
router.get('/clientes/:clienteId/pedidos', clientesController.pedidosClienteFecha);

// 9. Listar clientes normales
router.get('/clientes/normales', clientesController.listarClientesNormales);

// 10. Listar clientes Premium
router.get('/clientes/premium', clientesController.listarClientesPremium);

// 11. Listar todos los clientes
router.get('/clientes', clientesController.listarTodosClientes);

// RUTAS DE VENTAS
// 7. Registrar un nuevo pedido/venta
router.post('/ventas', ventasController.registrarVenta);

// Rutas adicionales para gestión de ventas
router.get('/ventas', ventasController.obtenerVentas);
router.get('/ventas/:id', ventasController.obtenerDetalleVenta);

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API de Vitoko\'s Coffee funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;