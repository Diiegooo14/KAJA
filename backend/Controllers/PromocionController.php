<?php

class PromocionController
{
    public static function listar(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $idEmpresa = (int) $carga['idEmpresa'];

        $estado = in_array($_GET['estado'] ?? '', ['Activo', 'Inactivo']) ? $_GET['estado'] : null;

        try {
            echo json_encode(PromocionModel::listarTodas($idEmpresa, $estado));
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
        $tipo        = $datos['tipo'] ?? '';
        $idProducto  = isset($datos['idProducto'])  ? (int) $datos['idProducto']  : null;
        $idCategoria = isset($datos['idCategoria']) ? (int) $datos['idCategoria'] : null;
        $cantidad    = (int) ($datos['cantidad'] ?? 0);
        $precioTotal = (float) ($datos['precioTotal'] ?? 0);
        $idProductos = isset($datos['idProductos'])
            ? array_values(array_unique(array_filter(array_map('intval', $datos['idProductos']))))
            : [];

        if (!in_array($tipo, ['PRODUCTO', 'CATEGORIA', 'SELECCION'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo de promoción inválido']);
            exit;
        }
        if ($tipo === 'PRODUCTO' && !$idProducto) {
            http_response_code(400);
            echo json_encode(['error' => 'Selecciona un producto']);
            exit;
        }
        if ($tipo === 'CATEGORIA' && !$idCategoria) {
            http_response_code(400);
            echo json_encode(['error' => 'Selecciona una categoría']);
            exit;
        }
        if ($tipo === 'SELECCION') {
            if (count($idProductos) < 2) {
                http_response_code(400);
                echo json_encode(['error' => 'Selecciona al menos 2 productos distintos']);
                exit;
            }
            $cantidad = count($idProductos);
        }
        if ($precioTotal <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El precio debe ser mayor que 0']);
            exit;
        }
        if ($tipo !== 'SELECCION' && $cantidad < 2) {
            http_response_code(400);
            echo json_encode(['error' => 'Cantidad mínima de 2 unidades']);
            exit;
        }

        try {
            $id = PromocionModel::crear(
                $idEmpresa,
                $tipo,
                $tipo === 'PRODUCTO' ? $idProducto : null,
                $tipo === 'CATEGORIA' ? $idCategoria : null,
                $cantidad,
                $precioTotal,
                $tipo === 'SELECCION' ? $idProductos : []
            );
            http_response_code(201);
            echo json_encode(['id' => $id, 'mensaje' => 'Promoción creada']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe una promoción para ese producto/categoría. Edítala en vez de crear otra.']);
                exit;
            }
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizar(int $id): void
    {
        Jwt::requerirAdministrador();

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $precioTotal = (float) ($datos['precioTotal'] ?? 0);
        $estado      = $datos['estado'] ?? 'Activo';
        $esSeleccion = ($datos['tipo'] ?? '') === 'SELECCION';

        if ($precioTotal <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El precio debe ser mayor que 0']);
            exit;
        }
        if (!in_array($estado, ['Activo', 'Inactivo'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Estado inválido']);
            exit;
        }

        $cantidad = null;
        if (!$esSeleccion) {
            $cantidad = (int) ($datos['cantidad'] ?? 0);
            if ($cantidad < 2) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos inválidos: cantidad mínima de 2 unidades']);
                exit;
            }
        }

        try {
            PromocionModel::actualizar($id, $cantidad, $precioTotal, $estado);
            echo json_encode(['mensaje' => 'Promoción actualizada']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminar(int $id): void
    {
        Jwt::requerirAdministrador();

        try {
            PromocionModel::eliminar($id);
            echo json_encode(['mensaje' => 'Promoción eliminada']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
