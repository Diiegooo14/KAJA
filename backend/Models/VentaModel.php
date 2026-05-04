<?php

class VentaModel
{
    public static function listarHoy(int $idEmpresa): array
    {
        $pdo = Database::connect();

        $consulta = $pdo->prepare(
            'SELECT v.id, v.fecha, u.nombre AS vendedor,
                    v.baseImponible, v.totalIva, v.totalFinal
             FROM VENTA v
             JOIN USUARIO u ON v.idUsuario = u.id
             WHERE DATE(v.fecha) = CURDATE()
               AND u.idEmpresa = :idEmpresa
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
}
