<?php

class UsuarioModel
{
    public static function buscarPorNif(string $nif): ?array
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT u.id, u.nombre, u.password, r.nombreRol AS rol
               FROM USUARIO u
               JOIN ROL r ON u.idRol = r.id
              WHERE u.nif = :nif
                AND u.estado = "Activo"
              LIMIT 1'
        );
        $consulta->execute([':nif' => $nif]);
        return $consulta->fetch() ?: null;
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion,
                    r.nombreRol AS rol
               FROM USUARIO u
               JOIN ROL r ON u.idRol = r.id
              WHERE u.id = :id'
        );
        $consulta->execute([':id' => $id]);
        return $consulta->fetch() ?: null;
    }

    public static function listarTodos(): array
    {
        $pdo = Database::connect();
        $consulta = $pdo->query(
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion,
                    r.nombreRol AS rol
               FROM USUARIO u
               JOIN ROL r ON u.idRol = r.id
              ORDER BY u.nombre ASC'
        );
        return $consulta->fetchAll();
    }

    public static function obtenerIdEmpresa(int $idAdmin): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare('SELECT idEmpresa FROM USUARIO WHERE id = :id');
        $consulta->execute([':id' => $idAdmin]);
        return (int) $consulta->fetchColumn();
    }

    public static function crear(array $datos): int
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'INSERT INTO USUARIO (idRol, idEmpresa, nif, nombre, password, estado)
             VALUES (:rol, :empresa, :nif, :nombre, :pass, "Activo")'
        );
        $consulta->execute([
            ':rol' => $datos['idRol'],
            ':empresa' => $datos['idEmpresa'],
            ':nif' => $datos['nif'],
            ':nombre' => $datos['nombre'],
            ':pass' => $datos['password'],
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function actualizar(int $id, array $campos, array $parametros): void
    {
        $pdo = Database::connect();
        $sql = 'UPDATE USUARIO SET ' . implode(', ', $campos) . ' WHERE id = :id';
        $parametros[':id'] = $id;
        $pdo->prepare($sql)->execute($parametros);
    }

    public static function desactivar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('UPDATE USUARIO SET estado = "Inactivo" WHERE id = :id')
            ->execute([':id' => $id]);
    }
}
