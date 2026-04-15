<?php

class CategoriaController
{
    public static function listar(): void
    {
        Jwt::requerirAutenticacion();

        try {
            echo json_encode(CategoriaModel::listarTodas());
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function crear(): void
    {
        Jwt::requerirAdministrador();

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $nombre = trim($datos['nombre'] ?? '');
        $descripcion = trim($datos['descripcion'] ?? '') ?: null;

        if ($nombre === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de la categoría es obligatorio']);
            exit;
        }

        try {
            $id = CategoriaModel::crear($nombre, $descripcion);
            http_response_code(201);
            echo json_encode(['id' => $id, 'mensaje' => 'Categoría creada']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminar(int $id): void
    {
        Jwt::requerirAdministrador();

        try {
            if (CategoriaModel::tieneProductos($id)) {
                http_response_code(409);
                echo json_encode(['error' => 'No se puede eliminar: la categoría tiene productos asociados']);
                exit;
            }

            CategoriaModel::eliminar($id);
            echo json_encode(['mensaje' => 'Categoría eliminada']);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
