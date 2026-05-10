<?php

class FinancieroController
{
    public static function resumenAnual(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];
        $anio      = max(2000, (int) ($_GET['anio'] ?? date('Y')));
        $mes       = isset($_GET['mes']) ? max(1, min(12, (int) $_GET['mes'])) : null;

        try {
            if ($mes !== null) {
                // Resumen diario del mes seleccionado
                $diasEnMes = (int) date('t', mktime(0, 0, 0, $mes, 1, $anio));

                $ventasDia = VentaModel::resumenDiario($idEmpresa, $mes, $anio);
                $gastosDia = GastoModel::resumenDiario($idEmpresa, $mes, $anio);

                $ventasPorDia = array_fill(0, $diasEnMes, 0.0);
                foreach ($ventasDia as $v) {
                    $ventasPorDia[(int)$v['dia'] - 1] = (float) $v['totalVentas'];
                }

                $gastosPorDia = array_fill(0, $diasEnMes, 0.0);
                foreach ($gastosDia as $g) {
                    $gastosPorDia[(int)$g['dia'] - 1] = (float) $g['totalGastos'];
                }

                echo json_encode([
                    'modo'   => 'diario',
                    'mes'    => $mes,
                    'anio'   => $anio,
                    'dias'   => $diasEnMes,
                    'ventas' => $ventasPorDia,
                    'gastos' => $gastosPorDia,
                ]);
            } else {
                // Resumen mensual del año
                $ventasMes = VentaModel::resumenMensual($idEmpresa, $anio);
                $gastosMes = GastoModel::resumenMensual($idEmpresa, $anio);

                $ventasPorMes = array_fill(0, 12, 0.0);
                foreach ($ventasMes as $v) {
                    $ventasPorMes[(int)$v['mes'] - 1] = (float) $v['totalVentas'];
                }

                $gastosPorMes = array_fill(0, 12, 0.0);
                foreach ($gastosMes as $g) {
                    $gastosPorMes[(int)$g['mes'] - 1] = (float) $g['totalGastos'];
                }

                echo json_encode([
                    'modo'   => 'mensual',
                    'anio'   => $anio,
                    'ventas' => $ventasPorMes,
                    'gastos' => $gastosPorMes,
                ]);
            }
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
