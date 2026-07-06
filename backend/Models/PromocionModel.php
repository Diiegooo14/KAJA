<?php

class PromocionModel
{
    public static function listarTodas(int $idEmpresa, ?string $estado = null): array
    {
        $pdo = Database::connect();
        $sql = 'SELECT pr.id, pr.tipo, pr.idProducto, pr.idCategoria,
                       p.nombre AS producto, p.precioVenta, p.iva,
                       c.nombre AS categoria,
                       pr.cantidad, pr.precioTotal, pr.estado
                FROM PROMOCION pr
                LEFT JOIN PRODUCTO p ON pr.idProducto = p.id
                LEFT JOIN CATEGORIA c ON pr.idCategoria = c.id
                WHERE pr.idEmpresa = :idEmpresa';
        $parametros = [':idEmpresa' => $idEmpresa];

        if ($estado !== null) {
            $sql .= ' AND pr.estado = :estado';
            $parametros[':estado'] = $estado;
        }

        $sql .= ' ORDER BY COALESCE(p.nombre, c.nombre) ASC';

        $consulta = $pdo->prepare($sql);
        $consulta->execute($parametros);
        return $consulta->fetchAll();
    }

    public static function crear(int $idEmpresa, string $tipo, ?int $idProducto, ?int $idCategoria, int $cantidad, float $precioTotal): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'INSERT INTO PROMOCION (idEmpresa, tipo, idProducto, idCategoria, cantidad, precioTotal)
             VALUES (:idEmpresa, :tipo, :idProducto, :idCategoria, :cantidad, :precioTotal)'
        );
        $consulta->execute([
            ':idEmpresa'   => $idEmpresa,
            ':tipo'        => $tipo,
            ':idProducto'  => $idProducto,
            ':idCategoria' => $idCategoria,
            ':cantidad'    => $cantidad,
            ':precioTotal' => $precioTotal,
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function actualizar(int $id, int $cantidad, float $precioTotal, string $estado): void
    {
        $pdo = Database::connect();
        $pdo->prepare(
            'UPDATE PROMOCION SET cantidad = :cantidad, precioTotal = :precioTotal, estado = :estado WHERE id = :id'
        )->execute([
            ':cantidad'    => $cantidad,
            ':precioTotal' => $precioTotal,
            ':estado'      => $estado,
            ':id'          => $id,
        ]);
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('DELETE FROM PROMOCION WHERE id = :id')->execute([':id' => $id]);
    }
}
