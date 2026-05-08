<?php

class UsuarioModel
{
    public static function buscarPorNif(string $nif): ?array
    {
        $pdo = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT u.id, u.idEmpresa, u.nombre, u.password, r.nombreRol AS rol
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
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion, r.nombreRol AS rol
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
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion, r.nombreRol AS rol
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

    public static function existeNif(string $nif): bool
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM USUARIO WHERE nif = :nif LIMIT 1');
        $stmt->execute([':nif' => $nif]);
        return (bool) $stmt->fetch();
    }

    public static function desactivar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('UPDATE USUARIO SET estado = "Inactivo" WHERE id = :id')
            ->execute([':id' => $id]);
    }

    public static function listarPorEmpresa(int $idEmpresa): array
    {
        $pdo      = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion,
                    r.nombreRol AS rol
                FROM USUARIO u
                JOIN ROL r ON u.idRol = r.id
                WHERE u.idEmpresa = :idEmpresa
                ORDER BY u.nombre ASC'
        );
        $consulta->execute([':idEmpresa' => $idEmpresa]);
        return $consulta->fetchAll();
    }

    public static function buscarPorIdYEmpresa(int $id, int $idEmpresa): ?array
    {
        $pdo      = Database::connect();
        $consulta = $pdo->prepare(
            'SELECT u.id, u.nif, u.nombre, u.estado, u.fechaCreacion,
                    r.nombreRol AS rol
                FROM USUARIO u
                JOIN ROL r ON u.idRol = r.id
                WHERE u.id = :id AND u.idEmpresa = :idEmpresa'
        );
        $consulta->execute([':id' => $id, ':idEmpresa' => $idEmpresa]);
        return $consulta->fetch() ?: null;
    }

    public static function buscarPorIdConPassword(int $id): ?array
    {
        $pdo      = Database::connect();
        $consulta = $pdo->prepare('SELECT id, password FROM USUARIO WHERE id = :id LIMIT 1');
        $consulta->execute([':id' => $id]);
        return $consulta->fetch() ?: null;
    }

    public static function idRolPorNombre(string $nombre): ?int
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM ROL WHERE nombreRol = :nombre LIMIT 1');
        $stmt->execute([':nombre' => $nombre]);
        $id = $stmt->fetchColumn();
        return $id !== false ? (int) $id : null;
    }
}
