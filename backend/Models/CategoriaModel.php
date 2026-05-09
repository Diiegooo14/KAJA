<?php

class CategoriaModel
{
    public static function listarTodas(int $idEmpresa): array
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT c.id, c.nombre, c.descripcion,
                    COUNT(p.id) AS totalProductos
             FROM CATEGORIA c
             LEFT JOIN PRODUCTO p ON p.idCategoria = c.id
             WHERE c.idEmpresa = :idEmpresa
             GROUP BY c.id, c.nombre, c.descripcion
             ORDER BY c.nombre ASC'
        );
        $consulta->execute([':idEmpresa' => $idEmpresa]);
        return $consulta->fetchAll();
    }

    public static function crear(string $nombre, ?string $descripcion, int $idEmpresa): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'INSERT INTO CATEGORIA (idEmpresa, nombre, descripcion) VALUES (:idEmpresa, :nombre, :descripcion)'
        );
        $consulta->execute([':idEmpresa' => $idEmpresa, ':nombre' => $nombre, ':descripcion' => $descripcion]);
        return (int) $pdo->lastInsertId();
    }

    public static function tieneProductos(int $id): bool
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare('SELECT COUNT(*) FROM PRODUCTO WHERE idCategoria = :id');
        $consulta->execute([':id' => $id]);
        return (int) $consulta->fetchColumn() > 0;
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('DELETE FROM CATEGORIA WHERE id = :id')
            ->execute([':id' => $id]);
    }
}
