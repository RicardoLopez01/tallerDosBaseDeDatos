const { pool } = require('../config/database');

const ventasController = {
    // 7. Registrar un nuevo pedido/venta
    registrarVenta: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { cliente_id, trabajador_id = 1, productos } = req.body;

            if (!cliente_id || !productos || productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente ID y productos son obligatorios'
                });
            }

            // Verificar que el cliente existe y está activo
            const [clienteRows] = await connection.execute(
                'SELECT * FROM clientes WHERE id = ? AND activo = TRUE',
                [cliente_id]
            );

            if (clienteRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado o inactivo'
                });
            }

            const cliente = clienteRows[0];

            // Generar número de venta único
            const numeroVenta = `V${Date.now()}`;

            // Calcular totales
            let subtotal = 0;
            const productosDetalle = [];

            // Verificar productos y calcular subtotal
            for (const item of productos) {
                const { producto_id, cantidad } = item;

                if (!producto_id || !cantidad || cantidad <= 0) {
                    throw new Error('Producto ID y cantidad válida son obligatorios');
                }

                // Verificar producto existe, está activo y tiene stock suficiente
                const [productoRows] = await connection.execute(
                    'SELECT * FROM productos WHERE id = ? AND activo = TRUE',
                    [producto_id]
                );

                if (productoRows.length === 0) {
                    throw new Error(`Producto con ID ${producto_id} no encontrado o inactivo`);
                }

                const producto = productoRows[0];

                if (producto.stock < cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`);
                }

                const subtotalProducto = parseFloat(producto.precio) * cantidad;
                subtotal += subtotalProducto;

                productosDetalle.push({
                    producto_id: producto.id,
                    cantidad,
                    precio_unitario: producto.precio,
                    subtotal: subtotalProducto
                });
            }

            // Calcular descuento (20% para clientes premium)
            const descuento = cliente.tipo === 'premium' ? subtotal * 0.20 : 0;
            const subtotalConDescuento = subtotal - descuento;

            // Calcular propina (10% del subtotal con descuento)
            const propina = subtotalConDescuento * 0.10;

            // Calcular total final
            const total = subtotalConDescuento + propina;

            // Insertar venta
            const [ventaResult] = await connection.execute(
                'INSERT INTO ventas (numero_venta, cliente_id, trabajador_id, subtotal, descuento, propina, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [numeroVenta, cliente_id, trabajador_id, subtotal, descuento, propina, total]
            );

            const ventaId = ventaResult.insertId;

            // Insertar detalle de venta y actualizar stock
            for (const item of productosDetalle) {
                // Insertar detalle
                await connection.execute(
                    'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [ventaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
                );

                // Actualizar stock
                await connection.execute(
                    'UPDATE productos SET stock = stock - ? WHERE id = ?',
                    [item.cantidad, item.producto_id]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Venta registrada exitosamente',
                data: {
                    venta_id: ventaId,
                    numero_venta: numeroVenta,
                    cliente: cliente.nombre,
                    subtotal: subtotal,
                    descuento: descuento,
                    propina: propina,
                    total: total,
                    productos: productosDetalle.length
                }
            });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        } finally {
            connection.release();
        }
    },

    // Obtener todas las ventas
    obtenerVentas: async (req, res) => {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    v.*,
                    c.nombre as cliente_nombre,
                    c.tipo as cliente_tipo,
                    t.nombre as trabajador_nombre
                FROM ventas v
                INNER JOIN clientes c ON v.cliente_id = c.id
                LEFT JOIN trabajadores t ON v.trabajador_id = t.id
                ORDER BY v.fecha_venta DESC
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

    // Obtener detalle de una venta específica
    obtenerDetalleVenta: async (req, res) => {
        try {
            const { id } = req.params;

            const [ventaRows] = await pool.execute(`
                SELECT 
                    v.*,
                    c.nombre as cliente_nombre,
                    c.tipo as cliente_tipo,
                    t.nombre as trabajador_nombre
                FROM ventas v
                INNER JOIN clientes c ON v.cliente_id = c.id
                LEFT JOIN trabajadores t ON v.trabajador_id = t.id
                WHERE v.id = ?
            `, [id]);

            if (ventaRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Venta no encontrada'
                });
            }

            const [detalleRows] = await pool.execute(`
                SELECT 
                    dv.*,
                    p.codigo as producto_codigo,
                    p.nombre as producto_nombre
                FROM detalle_ventas dv
                INNER JOIN productos p ON dv.producto_id = p.id
                WHERE dv.venta_id = ?
            `, [id]);

            res.json({
                success: true,
                data: {
                    venta: ventaRows[0],
                    detalle: detalleRows
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

module.exports = ventasController;