<?php

class GastoController
{
    public static function listar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $mes  = max(1, min(12, (int) ($_GET['mes']  ?? date('n'))));
        $anio = max(2000,       (int) ($_GET['anio'] ?? date('Y')));

        try {
            $gastos = GastoModel::listarPorMes($idEmpresa, $mes, $anio);

            $totalFijos     = array_sum(array_map(fn($g) => $g['tipo'] === 'Fijo'     ? (float)$g['importe'] : 0, $gastos));
            $totalVariables = array_sum(array_map(fn($g) => $g['tipo'] === 'Variable' ? (float)$g['importe'] : 0, $gastos));

            echo json_encode([
                'gastos'  => $gastos,
                'resumen' => [
                    'totalMes'       => round($totalFijos + $totalVariables, 2),
                    'totalFijos'     => round($totalFijos, 2),
                    'totalVariables' => round($totalVariables, 2),
                ],
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function crear(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idUsuario = (int) $carga['id'];
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos    = json_decode(file_get_contents('php://input'), true) ?? [];
        $tipo     = $datos['tipo']     ?? '';
        $concepto = trim($datos['concepto'] ?? '');
        $importe  = (float) ($datos['importe'] ?? 0);
        $fecha    = $datos['fecha'] ?? '';

        if (!in_array($tipo, ['Fijo', 'Variable'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El tipo debe ser Fijo o Variable']);
            return;
        }
        if ($concepto === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El concepto es obligatorio']);
            return;
        }
        if ($importe <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El importe debe ser mayor que 0']);
            return;
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha no es válida']);
            return;
        }

        try {
            $idTipoGasto = GastoModel::idTipoGasto($tipo);
            if (!$idTipoGasto) {
                http_response_code(400);
                echo json_encode(['error' => 'Tipo de gasto no encontrado en la base de datos']);
                return;
            }

            $id = GastoModel::crear(compact('idUsuario', 'idEmpresa', 'idTipoGasto', 'concepto', 'importe', 'fecha'));
            http_response_code(201);
            echo json_encode(['id' => $id, 'mensaje' => 'Gasto registrado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos    = json_decode(file_get_contents('php://input'), true) ?? [];
        $id       = (int) ($datos['id'] ?? 0);
        $tipo     = $datos['tipo'] ?? '';
        $concepto = trim($datos['concepto'] ?? '');
        $importe  = (float) ($datos['importe'] ?? 0);
        $fecha    = $datos['fecha'] ?? '';

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de gasto no válido']);
            return;
        }
        if (!in_array($tipo, ['Fijo', 'Variable'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El tipo debe ser Fijo o Variable']);
            return;
        }
        if ($concepto === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El concepto es obligatorio']);
            return;
        }
        if ($importe <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El importe debe ser mayor que 0']);
            return;
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            http_response_code(400);
            echo json_encode(['error' => 'La fecha no es válida']);
            return;
        }

        try {
            $idTipoGasto = GastoModel::idTipoGasto($tipo);
            if (!$idTipoGasto) {
                http_response_code(400);
                echo json_encode(['error' => 'Tipo de gasto no encontrado en la base de datos']);
                return;
            }

            $actualizado = GastoModel::actualizar($id, $idEmpresa, compact('idTipoGasto', 'concepto', 'importe', 'fecha'));
            if (!$actualizado) {
                http_response_code(404);
                echo json_encode(['error' => 'Gasto no encontrado']);
                return;
            }
            echo json_encode(['mensaje' => 'Gasto actualizado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $id    = (int) ($datos['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de gasto no válido']);
            return;
        }

        try {
            $eliminado = GastoModel::eliminar($id, $idEmpresa);
            if (!$eliminado) {
                http_response_code(404);
                echo json_encode(['error' => 'Gasto no encontrado']);
                return;
            }
            echo json_encode(['mensaje' => 'Gasto eliminado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
