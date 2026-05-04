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
}
