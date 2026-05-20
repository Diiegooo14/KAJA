<?php

class NominaModel
{
    public static function listarPorEmpresa(int $idEmpresa): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT n.id, n.idUsuario, n.mes, n.anio, n.url, n.fechaSubida,
                    u.nombre AS nombreUsuario
             FROM NOMINA n
             INNER JOIN USUARIO u ON n.idUsuario = u.id
             WHERE n.idEmpresa = :idEmpresa
             ORDER BY n.anio DESC, n.mes DESC'
        );
        $stmt->execute([':idEmpresa' => $idEmpresa]);
        return $stmt->fetchAll();
    }

    public static function listarPorUsuario(int $idUsuario): array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT id, mes, anio, url, fechaSubida
             FROM NOMINA
             WHERE idUsuario = :idUsuario
             ORDER BY anio DESC, mes DESC'
        );
        $stmt->execute([':idUsuario' => $idUsuario]);
        return $stmt->fetchAll();
    }

    public static function existePeriodo(int $idUsuario, int $mes, int $anio): bool
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT id FROM NOMINA
             WHERE idUsuario = :idUsuario AND mes = :mes AND anio = :anio
             LIMIT 1'
        );
        $stmt->execute([':idUsuario' => $idUsuario, ':mes' => $mes, ':anio' => $anio]);
        return (bool) $stmt->fetch();
    }

    public static function crear(array $datos): int
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'INSERT INTO NOMINA (idUsuario, idEmpresa, mes, anio, url)
             VALUES (:idUsuario, :idEmpresa, :mes, :anio, :url)'
        );
        $stmt->execute([
            ':idUsuario' => $datos['idUsuario'],
            ':idEmpresa' => $datos['idEmpresa'],
            ':mes'       => $datos['mes'],
            ':anio'      => $datos['anio'],
            ':url'       => $datos['url'],
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function actualizar(int $id, string $url): void
    {
        $pdo = Database::connect();
        $pdo->prepare('UPDATE NOMINA SET url = :url, fechaSubida = NOW() WHERE id = :id')
            ->execute([':url' => $url, ':id' => $id]);
    }

    public static function buscarPorId(int $id): ?array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare('SELECT * FROM NOMINA WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->prepare('DELETE FROM NOMINA WHERE id = :id')
            ->execute([':id' => $id]);
    }
}
