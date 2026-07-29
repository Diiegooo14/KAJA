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
        $promociones = $consulta->fetchAll();

        $idsSeleccion = array_values(array_map(
            fn($p) => $p['id'],
            array_filter($promociones, fn($p) => $p['tipo'] === 'SELECCION')
        ));

        if (!empty($idsSeleccion)) {
            $placeholders = implode(',', array_fill(0, count($idsSeleccion), '?'));
            $itemsQuery = $pdo->prepare(
                "SELECT pi.idPromocion, pi.idProducto, prod.nombre AS producto, prod.precioVenta, prod.iva
                 FROM PROMOCION_ITEMS pi
                 JOIN PRODUCTO prod ON pi.idProducto = prod.id
                 WHERE pi.idPromocion IN ($placeholders)"
            );
            $itemsQuery->execute($idsSeleccion);
            $rows = $itemsQuery->fetchAll();

            $itemsPorPromo = [];
            foreach ($rows as $row) {
                $itemsPorPromo[$row['idPromocion']][] = $row;
            }

            foreach ($promociones as &$promo) {
                if ($promo['tipo'] === 'SELECCION') {
                    $promo['items'] = $itemsPorPromo[$promo['id']] ?? [];
                }
            }
            unset($promo);
        }

        return $promociones;
    }

    public static function crear(
        int $idEmpresa,
        string $tipo,
        ?int $idProducto,
        ?int $idCategoria,
        int $cantidad,
        float $precioTotal,
        array $idProductos = []
    ): int {
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
        $id = (int) $pdo->lastInsertId();

        if ($tipo === 'SELECCION' && !empty($idProductos)) {
            $stmt = $pdo->prepare(
                'INSERT INTO PROMOCION_ITEMS (idPromocion, idProducto) VALUES (:idPromocion, :idProducto)'
            );
            foreach ($idProductos as $idProd) {
                $stmt->execute([':idPromocion' => $id, ':idProducto' => (int) $idProd]);
            }
        }

        return $id;
    }

    public static function actualizar(int $id, ?int $cantidad, float $precioTotal, string $estado): void
    {
        $pdo = Database::connect();
        if ($cantidad !== null) {
            $pdo->prepare(
                'UPDATE PROMOCION SET cantidad = :cantidad, precioTotal = :precioTotal, estado = :estado WHERE id = :id'
            )->execute([
                ':cantidad'    => $cantidad,
                ':precioTotal' => $precioTotal,
                ':estado'      => $estado,
                ':id'          => $id,
            ]);
        } else {
            $pdo->prepare(
                'UPDATE PROMOCION SET precioTotal = :precioTotal, estado = :estado WHERE id = :id'
            )->execute([
                ':precioTotal' => $precioTotal,
                ':estado'      => $estado,
                ':id'          => $id,
            ]);
        }
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('DELETE FROM PROMOCION WHERE id = :id')->execute([':id' => $id]);
    }
}
