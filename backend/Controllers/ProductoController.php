<?php

class ProductoController
{
    public static function listar(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $idEmpresa  = (int) $carga['idEmpresa'];

        $busqueda    = trim($_GET['search'] ?? '');
        $idCategoria = isset($_GET['categoria']) ? (int) $_GET['categoria'] : null;
        $pagina      = max(1, (int) ($_GET['pagina'] ?? 1));
        $porPagina   = 25;

        try {
            $total = ProductoModel::contarTodos($idEmpresa, $busqueda, $idCategoria);
            $datos = ProductoModel::listarTodos($idEmpresa, $busqueda, $idCategoria, $pagina, $porPagina);

            echo json_encode([
                'datos'       => $datos,
                'total'       => $total,
                'pagina'      => $pagina,
                'porPagina'   => $porPagina,
                'totalPaginas' => (int) ceil($total / $porPagina),
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function obtener(int $id): void
    {
        $carga = Jwt::requerirAutenticacion();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            $producto = ProductoModel::buscarPorId($id, $idEmpresa);

            if (!$producto) {
                http_response_code(404);
                echo json_encode(['error' => 'Producto no encontrado']);
                exit;
            }

            echo json_encode($producto);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function crear(): void
    {
        $carga = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $nombre = trim($datos['nombre'] ?? '');
        $idCategoria = (int) ($datos['idCategoria'] ?? 0);
        $precioCoste = (float) ($datos['precioCoste'] ?? 0);
        $precioVenta = (float) ($datos['precioVenta'] ?? 0);
        $stock = (int) ($datos['stock'] ?? 0);

        if ($nombre === '' || $idCategoria <= 0 || $precioCoste <= 0 || $precioVenta <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos obligatorios o los valores son inválidos']);
            exit;
        }
        if ($stock < 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El stock no puede ser negativo']);
            exit;
        }

        try {
            $id = ProductoModel::crear(compact('nombre', 'idCategoria', 'idEmpresa', 'precioCoste', 'precioVenta', 'stock'));
            http_response_code(201);
            echo json_encode(['id' => $id, 'mensaje' => 'Producto creado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizar(int $id): void
    {
        $carga = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $nombre = trim($datos['nombre'] ?? '');
        $idCategoria = (int) ($datos['idCategoria'] ?? 0);
        $precioCoste = (float) ($datos['precioCoste'] ?? 0);
        $precioVenta = (float) ($datos['precioVenta'] ?? 0);
        $stock = (int) ($datos['stock'] ?? 0);

        if ($nombre === '' || $idCategoria <= 0 || $precioCoste <= 0 || $precioVenta <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos obligatorios o los valores son inválidos']);
            exit;
        }
        if ($stock < 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El stock no puede ser negativo']);
            exit;
        }

        try {
            ProductoModel::actualizar($id, compact('nombre', 'idCategoria', 'precioCoste', 'precioVenta', 'stock'));
            echo json_encode(['mensaje' => 'Producto actualizado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminar(int $id): void
    {
        Jwt::requerirAdministrador();

        try {
            if (ProductoModel::tieneVentas($id)) {
                ProductoModel::desactivar($id);
                echo json_encode(['mensaje' => 'Producto desactivado (tiene ventas históricas)']);
            } else {
                ProductoModel::eliminar($id);
                echo json_encode(['mensaje' => 'Producto eliminado']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
