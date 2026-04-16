<?php

class ProductoModel
{
    public static function buscarPorId(int $id, int $idEmpresa): ?array
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT p.id, p.nombre, p.precioCoste, p.precioVenta, p.stock, p.estado,
                    c.id AS idCategoria, c.nombre AS categoria
                    FROM PRODUCTO p
                    JOIN CATEGORIA c ON p.idCategoria = c.id
                    WHERE p.id = :id AND p.idEmpresa = :idEmpresa'
        );
        $consulta->execute([':id' => $id, ':idEmpresa' => $idEmpresa]);
        return $consulta->fetch() ?: null;
    }

    public static function contarTodos(int $idEmpresa, string $busqueda = '', ?int $idCategoria = null): int
    {
        $pdo = Database::connect();
        $sql = 'SELECT COUNT(*) FROM PRODUCTO p
                WHERE p.idEmpresa = :idEmpresa';
        $parametros = [':idEmpresa' => $idEmpresa];

        if ($busqueda !== '') {
            $sql .= ' AND p.nombre LIKE :busqueda';
            $parametros[':busqueda'] = "%$busqueda%";
        }
        if ($idCategoria) {
            $sql .= ' AND p.idCategoria = :categoria';
            $parametros[':categoria'] = $idCategoria;
        }

        $consulta = $pdo->prepare($sql);
        $consulta->execute($parametros);
        return (int) $consulta->fetchColumn();
    }

    public static function listarTodos(int $idEmpresa, string $busqueda = '', ?int $idCategoria = null, int $pagina = 1, int $porPagina = 15): array
    {
        $pdo = Database::connect();
        $sql = 'SELECT p.id, p.nombre, p.precioCoste, p.precioVenta, p.stock, p.estado,
                        c.id AS idCategoria, c.nombre AS categoria
                        FROM PRODUCTO p
                        JOIN CATEGORIA c ON p.idCategoria = c.id
                        WHERE p.idEmpresa = :idEmpresa';
        $parametros = [':idEmpresa' => $idEmpresa];

        if ($busqueda !== '') {
            $sql .= ' AND p.nombre LIKE :busqueda';
            $parametros[':busqueda'] = "%$busqueda%";
        }
        if ($idCategoria) {
            $sql .= ' AND p.idCategoria = :categoria';
            $parametros[':categoria'] = $idCategoria;
        }

        $offset = ($pagina - 1) * $porPagina;
        $sql .= ' ORDER BY c.nombre ASC, p.nombre ASC LIMIT :limite OFFSET :offset';

        $consulta = $pdo->prepare($sql);
        $consulta->bindValue(':limite', $porPagina, PDO::PARAM_INT);
        $consulta->bindValue(':offset', $offset,    PDO::PARAM_INT);
        foreach ($parametros as $clave => $valor) {
            $consulta->bindValue($clave, $valor);
        }
        $consulta->execute();
        return $consulta->fetchAll();
    }

    public static function crear(array $datos): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'INSERT INTO PRODUCTO (idCategoria, idEmpresa, nombre, precioCoste, precioVenta, stock)
            VALUES (:categoria, :idEmpresa, :nombre, :coste, :venta, :stock)'
        );
        $consulta->execute([
            ':categoria' => $datos['idCategoria'],
            ':idEmpresa' => $datos['idEmpresa'],
            ':nombre' => $datos['nombre'],
            ':coste' => $datos['precioCoste'],
            ':venta' => $datos['precioVenta'],
            ':stock' => $datos['stock'],
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function actualizar(int $id, array $datos): void
    {
        $pdo = Database::connect();
        $pdo->prepare(
            'UPDATE PRODUCTO
                SET idCategoria = :categoria,
                    nombre      = :nombre,
                    precioCoste = :coste,
                    precioVenta = :venta,
                    stock       = :stock
                    WHERE id = :id'
        )->execute([
                    ':categoria' => $datos['idCategoria'],
                    ':nombre' => $datos['nombre'],
                    ':coste' => $datos['precioCoste'],
                    ':venta' => $datos['precioVenta'],
                    ':stock' => $datos['stock'],
                    ':id' => $id,
                ]);
    }

    public static function tieneVentas(int $id): bool
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare('SELECT COUNT(*) FROM DETALLE_VENTA WHERE idProducto = :id');
        $consulta->execute([':id' => $id]);
        return (int) $consulta->fetchColumn() > 0;
    }

    public static function desactivar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('UPDATE PRODUCTO SET estado = "Inactivo" WHERE id = :id')
            ->execute([':id' => $id]);
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('DELETE FROM PRODUCTO WHERE id = :id')
            ->execute([':id' => $id]);
    }
}
