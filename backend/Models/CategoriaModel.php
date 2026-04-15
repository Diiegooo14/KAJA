<?php

class CategoriaModel
{
    public static function listarTodas(): array
    {
        $pdo = Database::connect();
        return $pdo->query(
            'SELECT id, nombre, descripcion FROM CATEGORIA ORDER BY nombre ASC'
        )->fetchAll();
    }

    public static function crear(string $nombre, ?string $descripcion): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'INSERT INTO CATEGORIA (nombre, descripcion) VALUES (:nombre, :descripcion)'
        );
        $consulta->execute([':nombre' => $nombre, ':descripcion' => $descripcion]);
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
