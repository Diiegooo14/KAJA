<?php

class VentaController
{
    public static function listar(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            $ventas = VentaModel::listarHoy($idEmpresa);
            $totalRecaudado = array_sum(array_map(fn($v) => (float) $v['totalFinal'], $ventas));

            echo json_encode([
                'ventas'  => $ventas,
                'resumen' => [
                    'totalVentas'     => count($ventas),
                    'totalRecaudado'  => round($totalRecaudado, 2),
                ],
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function crear(): void
    {
        $carga     = Jwt::requerirAutenticacion();
        $idUsuario = (int) $carga['id'];
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($datos['lineas']) || !is_array($datos['lineas'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Debe incluir al menos una línea de venta']);
            return;
        }

        foreach ($datos['lineas'] as $linea) {
            if (empty($linea['id']) || empty($linea['cantidad']) || empty($linea['precioVenta']) || empty($linea['nombre'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos de línea incompletos']);
                return;
            }
        }

        try {
            $venta = VentaModel::crear($idUsuario, $idEmpresa, $datos['lineas']);
            http_response_code(201);
            echo json_encode($venta);
        } catch (\RuntimeException $e) {
            http_response_code(422);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
