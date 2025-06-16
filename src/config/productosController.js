const { pool } = require('../config/database');

const productosController = {
    // 1. Registrar un nuevo producto
    registrarProducto: async (req, res) => {
        try {
            const { codigo, nombre, precio, stock = 0 } = req.body;
            
            if (!codigo || !nombre || !precio) {
                return res.status(400).json({
                    success: false,
                    message: 'Código, nombre y precio son obligatorios'
                });
            }

            const [result] = await pool.execute(
                'INSERT INTO productos (codigo, nombre, precio, stock) VALUES (?, ?, ?, ?)',
                [codigo, nombre, precio, stock]
            );

            res.status(201).json({
                success: true,
                message: 'Producto registrado exitosamente',
                data: {
                    id: result.insertId,
                    codigo,
                    nombre,
                    precio,
                    stock
                }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'El código del producto ya existe'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 3. Eliminar (deshabilitar) un producto
    eliminarProducto: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [result] = await pool.execute(
                'UPDATE productos SET activo = FALSE WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Producto deshabilitado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 4. Actualizar el precio de un producto
    actualizarPrecio: async (req, res) => {
        try {
            const { id } = req.params;
            const { precio } = req.body;

            if (!precio) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio es obligatorio'
                });
            }

            const [result] = await pool.execute(
                'UPDATE productos SET precio = ? WHERE id = ? AND activo = TRUE',
                [precio, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado o inactivo'
                });
            }

            res.json({
                success: true,
                message: 'Precio actualizado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 12. Listar productos disponibles
    listarProductos: async (req, res) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM productos WHERE activo = TRUE ORDER BY nombre'
            );

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 13. Listar productos vendidos recientemente (Semana actual)
    productosVendidosRecientes: async (req, res) => {
        try {
            const [rows] = await pool.execute(`
                SELECT DISTINCT p.*, SUM(dv.cantidad) as cantidad_vendida
                FROM productos p
                INNER JOIN detalle_ventas dv ON p.id = dv.producto_id
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE YEARWEEK(v.fecha_venta, 1) = YEARWEEK(CURDATE(), 1)
                GROUP BY p.id
                ORDER BY cantidad_vendida DESC
            `);

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 14. Incrementar el stock de un producto
    incrementarStock: async (req, res) => {
        try {
            const { id } = req.params;
            const { cantidad } = req.body;

            if (!cantidad || cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            const [result] = await pool.execute(
                'UPDATE productos SET stock = stock + ? WHERE id = ? AND activo = TRUE',
                [cantidad, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado o inactivo'
                });
            }

            res.json({
                success: true,
                message: 'Stock incrementado exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 15. Cantidad de productos vendidos durante el año actual
    productosVendidosAnio: async (req, res) => {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    p.codigo,
                    p.nombre,
                    SUM(dv.cantidad) as cantidad_vendida,
                    SUM(dv.subtotal) as ingresos_totales
                FROM productos p
                INNER JOIN detalle_ventas dv ON p.id = dv.producto_id
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
                GROUP BY p.id
                ORDER BY cantidad_vendida DESC
            `);

            const [totalRow] = await pool.execute(`
                SELECT SUM(dv.cantidad) as total_productos_vendidos
                FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
            `);

            res.json({
                success: true,
                data: {
                    productos: rows,
                    total_productos_vendidos: totalRow[0].total_productos_vendidos || 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
};

module.exports = productosController;