<?php

class VentaModel
{
    public static function listarHoy(int $idEmpresa): array
    {
        $pdo = Database::connect();

        $consulta = $pdo->prepare(
            'SELECT v.id, v.fecha, u.nombre AS vendedor,
                    u.imagen_perfil AS imagenVendedor,
                    v.baseImponible, v.totalIva, v.totalFinal
                    FROM VENTA v
                    JOIN USUARIO u ON v.idUsuario = u.id
                    WHERE DATE(v.fecha) = CURDATE()
                    AND u.idEmpresa = :idEmpresa
                    AND v.estado = "Emitida"
                    ORDER BY v.fecha DESC'
        );
        $consulta->execute([':idEmpresa' => $idEmpresa]);
        $ventas = $consulta->fetchAll();

        if (empty($ventas)) return [];

        $ids = array_column($ventas, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $consulta2 = $pdo->prepare(
            "SELECT dv.idVenta, p.nombre AS producto,
                    dv.cantidad, dv.precioVentaHistorico, dv.ivaAplicado, dv.subtotal
                FROM DETALLE_VENTA dv
                JOIN PRODUCTO p ON dv.idProducto = p.id
                WHERE dv.idVenta IN ($placeholders)
                ORDER BY dv.id ASC"
        );
        $consulta2->execute($ids);
        $lineas = $consulta2->fetchAll();

        $lineasPorVenta = [];
        foreach ($lineas as $linea) {
            $lineasPorVenta[$linea['idVenta']][] = $linea;
        }

        foreach ($ventas as &$venta) {
            $venta['lineas'] = $lineasPorVenta[$venta['id']] ?? [];
        }

        return $ventas;
    }

    public static function listarPorMes(int $idEmpresa, int $mes, int $anio): array
    {
        $pdo = Database::connect();

        $consulta = $pdo->prepare(
            'SELECT v.id, v.fecha, u.nombre AS vendedor,
                    u.imagen_perfil AS imagenVendedor,
                    v.baseImponible, v.totalIva, v.totalFinal
                    FROM VENTA v
                    JOIN USUARIO u ON v.idUsuario = u.id
                    WHERE MONTH(v.fecha) = :mes
                    AND YEAR(v.fecha)  = :anio
                    AND u.idEmpresa    = :idEmpresa
                    AND v.estado       = "Emitida"
                    ORDER BY v.fecha DESC'
        );
        $consulta->execute([':mes' => $mes, ':anio' => $anio, ':idEmpresa' => $idEmpresa]);
        $ventas = $consulta->fetchAll();

        if (empty($ventas)) return [];

        $ids          = array_column($ventas, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $consulta2    = $pdo->prepare(
            "SELECT dv.idVenta, p.nombre AS producto,
                    dv.cantidad, dv.precioVentaHistorico, dv.ivaAplicado, dv.subtotal
                    FROM DETALLE_VENTA dv
                    JOIN PRODUCTO p ON dv.idProducto = p.id
                    WHERE dv.idVenta IN ($placeholders)
                    ORDER BY dv.id ASC"
        );
        $consulta2->execute($ids);
        $lineas = $consulta2->fetchAll();

        $lineasPorVenta = [];
        foreach ($lineas as $linea) {
            $lineasPorVenta[$linea['idVenta']][] = $linea;
        }

        foreach ($ventas as &$venta) {
            $venta['lineas'] = $lineasPorVenta[$venta['id']] ?? [];
        }

        return $ventas;
    }

    public static function resumenDiario(int $idEmpresa, int $mes, int $anio): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT DAY(v.fecha) AS dia,
                    ROUND(SUM(v.totalFinal), 2)     AS totalVentas,
                    ROUND(SUM(v.baseImponible), 2)  AS totalBase,
                    ROUND(SUM(v.totalIva), 2)        AS totalIva
                FROM VENTA v
                JOIN USUARIO u ON v.idUsuario = u.id
                WHERE MONTH(v.fecha) = :mes
                AND YEAR(v.fecha)  = :anio
                AND u.idEmpresa    = :idEmpresa
                AND v.estado       = "Emitida"
                GROUP BY DAY(v.fecha)
                ORDER BY dia ASC'
        );
        $stmt->execute([':mes' => $mes, ':anio' => $anio, ':idEmpresa' => $idEmpresa]);
        return $stmt->fetchAll();
    }

    public static function resumenMensual(int $idEmpresa, int $anio): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT MONTH(v.fecha) AS mes,
                    ROUND(SUM(v.totalFinal), 2)    AS totalVentas,
                    ROUND(SUM(v.baseImponible), 2) AS totalBase,
                    ROUND(SUM(v.totalIva), 2)       AS totalIva,
                    COUNT(*) AS numVentas
                    FROM VENTA v
                    JOIN USUARIO u ON v.idUsuario = u.id
                    WHERE YEAR(v.fecha) = :anio
                    AND u.idEmpresa   = :idEmpresa
                    AND v.estado      = "Emitida"
                    GROUP BY MONTH(v.fecha)
                    ORDER BY mes ASC'
        );
        $stmt->execute([':anio' => $anio, ':idEmpresa' => $idEmpresa]);
        return $stmt->fetchAll();
    }

    public static function crear(int $idUsuario, int $idEmpresa, array $lineas): array
    {
        $pdo = Database::connect();
        $pdo->beginTransaction();

        try {
            $totalFinal    = 0.0;
            $baseImponible = 0.0;
            foreach ($lineas as $linea) {
                $subtotal  = (float) $linea['precioVenta'] * (int) $linea['cantidad'];
                $ivaLinea  = isset($linea['iva']) ? (float) $linea['iva'] : 21.0;
                $baseLinea = $subtotal / (1 + $ivaLinea / 100);
                $totalFinal    += $subtotal;
                $baseImponible += $baseLinea;
            }
            $totalFinal    = round($totalFinal, 2);
            $baseImponible = round($baseImponible, 2);
            $totalIva      = round($totalFinal - $baseImponible, 2);

            $pdo->prepare(
                'INSERT INTO VENTA (idUsuario, fecha, baseImponible, totalIva, totalFinal)
                VALUES (:idUsuario, NOW(), :baseImponible, :totalIva, :totalFinal)'
            )->execute([
                ':idUsuario'    => $idUsuario,
                ':baseImponible'=> $baseImponible,
                ':totalIva'     => $totalIva,
                ':totalFinal'   => $totalFinal,
            ]);
            $idVenta = (int) $pdo->lastInsertId();

            $stmtLinea = $pdo->prepare(
                'INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal)
                VALUES (:idVenta, :idProducto, :cantidad, :precio, :iva, :subtotal)'
            );
            $stmtStock = $pdo->prepare(
                'UPDATE PRODUCTO SET stock = stock - :cantidad
                WHERE id = :id AND idEmpresa = :idEmpresa AND stock >= :cantidadMin'
            );
            $stmtDesactivar = $pdo->prepare(
                'UPDATE PRODUCTO SET estado = "Inactivo"
                WHERE id = :id AND idEmpresa = :idEmpresa AND stock = 0'
            );

            foreach ($lineas as $linea) {
                $subtotal = round((float) $linea['precioVenta'] * (int) $linea['cantidad'], 2);
                $ivaLinea = isset($linea['iva']) ? (float) $linea['iva'] : 21.0;
                $stmtLinea->execute([
                    ':idVenta'   => $idVenta,
                    ':idProducto'=> (int) $linea['id'],
                    ':cantidad'  => (int) $linea['cantidad'],
                    ':precio'    => (float) $linea['precioVenta'],
                    ':iva'       => $ivaLinea,
                    ':subtotal'  => $subtotal,
                ]);
                $stmtStock->execute([
                    ':cantidad'    => (int) $linea['cantidad'],
                    ':cantidadMin' => (int) $linea['cantidad'],
                    ':id'          => (int) $linea['id'],
                    ':idEmpresa'   => $idEmpresa,
                ]);
                if ($stmtStock->rowCount() === 0) {
                    throw new \RuntimeException('Stock insuficiente para: ' . $linea['nombre']);
                }
                $stmtDesactivar->execute([
                    ':id'        => (int) $linea['id'],
                    ':idEmpresa' => $idEmpresa,
                ]);
            }

            $pdo->commit();

            return [
                'id'            => $idVenta,
                'baseImponible' => $baseImponible,
                'totalIva'      => $totalIva,
                'totalFinal'    => $totalFinal,
            ];
        } catch (\Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Listado cross-empresa para el panel SuperAdmin: incluye ventas anuladas
     * y los datos de auditoría de la anulación.
     */
    public static function listarParaSuperAdmin(int $idEmpresa, ?int $mes = null, ?int $anio = null): array
    {
        $pdo = Database::connect();

        $sql = 'SELECT v.id, v.fecha, u.nombre AS vendedor,
                    v.baseImponible, v.totalIva, v.totalFinal,
                    v.estado, v.motivoAnulacion, v.fechaAnulacion,
                    ua.nombre AS anuladoPor
                FROM VENTA v
                JOIN USUARIO u ON v.idUsuario = u.id
                LEFT JOIN USUARIO ua ON v.idUsuarioAnula = ua.id
                WHERE u.idEmpresa = :idEmpresa';
        $parametros = [':idEmpresa' => $idEmpresa];

        if ($mes !== null && $anio !== null) {
            $sql .= ' AND MONTH(v.fecha) = :mes AND YEAR(v.fecha) = :anio';
            $parametros[':mes']  = $mes;
            $parametros[':anio'] = $anio;
        }

        $sql .= ' ORDER BY v.fecha DESC LIMIT 200';

        $consulta = $pdo->prepare($sql);
        $consulta->execute($parametros);
        $ventas = $consulta->fetchAll();

        if (empty($ventas)) return [];

        $ids          = array_column($ventas, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $consulta2    = $pdo->prepare(
            "SELECT dv.idVenta, p.nombre AS producto,
                    dv.cantidad, dv.precioVentaHistorico, dv.ivaAplicado, dv.subtotal
                FROM DETALLE_VENTA dv
                JOIN PRODUCTO p ON dv.idProducto = p.id
                WHERE dv.idVenta IN ($placeholders)
                ORDER BY dv.id ASC"
        );
        $consulta2->execute($ids);
        $lineas = $consulta2->fetchAll();

        $lineasPorVenta = [];
        foreach ($lineas as $linea) {
            $lineasPorVenta[$linea['idVenta']][] = $linea;
        }

        foreach ($ventas as &$venta) {
            $venta['lineas'] = $lineasPorVenta[$venta['id']] ?? [];
        }

        return $ventas;
    }

    /**
     * Anula una venta emitida (nunca se borra/edita: Ley Antifraude 11/2021).
     * Revierte el stock descontado y reactiva productos que se hubieran desactivado a 0.
     * Lanza RuntimeException si la venta no existe, no pertenece a la empresa o ya está anulada.
     */
    public static function anular(int $idVenta, int $idEmpresa, int $idUsuarioAnula, string $motivo): void
    {
        $pdo = Database::connect();
        $pdo->beginTransaction();

        try {
            $consulta = $pdo->prepare(
                'SELECT v.id, v.estado
                    FROM VENTA v
                    JOIN USUARIO u ON v.idUsuario = u.id
                    WHERE v.id = :id AND u.idEmpresa = :idEmpresa
                    FOR UPDATE'
            );
            $consulta->execute([':id' => $idVenta, ':idEmpresa' => $idEmpresa]);
            $venta = $consulta->fetch();

            if (!$venta) {
                throw new \RuntimeException('Venta no encontrada para esa empresa');
            }
            if ($venta['estado'] === 'Anulada') {
                throw new \RuntimeException('La venta ya estaba anulada');
            }

            $lineas = $pdo->prepare(
                'SELECT idProducto, cantidad FROM DETALLE_VENTA WHERE idVenta = :id'
            );
            $lineas->execute([':id' => $idVenta]);

            $stmtStock = $pdo->prepare(
                'UPDATE PRODUCTO
                    SET stock = stock + :cantidad, estado = "Activo"
                    WHERE id = :id AND idEmpresa = :idEmpresa'
            );
            foreach ($lineas->fetchAll() as $linea) {
                $stmtStock->execute([
                    ':cantidad'  => (int) $linea['cantidad'],
                    ':id'        => (int) $linea['idProducto'],
                    ':idEmpresa' => $idEmpresa,
                ]);
            }

            $pdo->prepare(
                'UPDATE VENTA
                    SET estado = "Anulada", motivoAnulacion = :motivo,
                        idUsuarioAnula = :idUsuarioAnula, fechaAnulacion = NOW()
                    WHERE id = :id'
            )->execute([
                ':motivo'         => $motivo,
                ':idUsuarioAnula' => $idUsuarioAnula,
                ':id'             => $idVenta,
            ]);

            $pdo->commit();
        } catch (\Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
