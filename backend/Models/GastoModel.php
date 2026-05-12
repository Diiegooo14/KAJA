<?php

class GastoModel
{
    public static function listarPorMes(int $idEmpresa, int $mes, int $anio): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT g.id, tg.nombreTipo AS tipo, g.concepto, g.importe, g.fechaRegistro AS fecha
             FROM GASTO g
             JOIN TIPO_GASTO tg ON g.idTipoGasto = tg.id
             WHERE g.idEmpresa = :idEmpresa
               AND MONTH(g.fechaRegistro) = :mes
               AND YEAR(g.fechaRegistro)  = :anio
             ORDER BY g.fechaRegistro DESC, g.id DESC'
        );
        $stmt->execute([':idEmpresa' => $idEmpresa, ':mes' => $mes, ':anio' => $anio]);
        return $stmt->fetchAll();
    }

    public static function crear(array $datos): int
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'INSERT INTO GASTO (idUsuario, idEmpresa, idTipoGasto, concepto, importe, fechaRegistro)
             VALUES (:idUsuario, :idEmpresa, :idTipoGasto, :concepto, :importe, :fechaRegistro)'
        );
        $stmt->execute([
            ':idUsuario'    => $datos['idUsuario'],
            ':idEmpresa'    => $datos['idEmpresa'],
            ':idTipoGasto'  => $datos['idTipoGasto'],
            ':concepto'     => $datos['concepto'],
            ':importe'      => $datos['importe'],
            ':fechaRegistro'=> $datos['fecha'],
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function actualizar(int $id, int $idEmpresa, array $datos): bool
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'UPDATE GASTO SET idTipoGasto = :idTipoGasto, concepto = :concepto, importe = :importe, fechaRegistro = :fechaRegistro
             WHERE id = :id AND idEmpresa = :idEmpresa'
        );
        $stmt->execute([
            ':idTipoGasto'   => $datos['idTipoGasto'],
            ':concepto'      => $datos['concepto'],
            ':importe'       => $datos['importe'],
            ':fechaRegistro' => $datos['fecha'],
            ':id'            => $id,
            ':idEmpresa'     => $idEmpresa,
        ]);
        return $stmt->rowCount() > 0;
    }

    public static function eliminar(int $id, int $idEmpresa): bool
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare('DELETE FROM GASTO WHERE id = :id AND idEmpresa = :idEmpresa');
        $stmt->execute([':id' => $id, ':idEmpresa' => $idEmpresa]);
        return $stmt->rowCount() > 0;
    }

    public static function resumenDiario(int $idEmpresa, int $mes, int $anio): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT DAY(g.fechaRegistro) AS dia,
                    ROUND(SUM(g.importe), 2) AS totalGastos
             FROM GASTO g
             WHERE g.idEmpresa = :idEmpresa
               AND MONTH(g.fechaRegistro) = :mes
               AND YEAR(g.fechaRegistro)  = :anio
             GROUP BY DAY(g.fechaRegistro)
             ORDER BY dia ASC'
        );
        $stmt->execute([':idEmpresa' => $idEmpresa, ':mes' => $mes, ':anio' => $anio]);
        return $stmt->fetchAll();
    }

    public static function resumenMensual(int $idEmpresa, int $anio): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT MONTH(g.fechaRegistro) AS mes,
                    ROUND(SUM(g.importe), 2) AS totalGastos
             FROM GASTO g
             WHERE g.idEmpresa = :idEmpresa
               AND YEAR(g.fechaRegistro) = :anio
             GROUP BY MONTH(g.fechaRegistro)
             ORDER BY mes ASC'
        );
        $stmt->execute([':idEmpresa' => $idEmpresa, ':anio' => $anio]);
        return $stmt->fetchAll();
    }

    public static function idTipoGasto(string $nombreTipo): ?int
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM TIPO_GASTO WHERE nombreTipo = :nombre LIMIT 1');
        $stmt->execute([':nombre' => $nombreTipo]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : null;
    }
}
