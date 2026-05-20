<?php

class EmpresaModel
{
    public static function buscarPorId(int $id): ?array
    {
        $pdo  = Database::connect();
        $stmt = $pdo->prepare(
            'SELECT nif, razonSocial, nombreComercial, direccion, telefono, email, logo_empresa
                FROM EMPRESA WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function actualizarLogo(int $id, ?string $url): void
    {
        $pdo = Database::connect();
        $pdo->prepare('UPDATE EMPRESA SET logo_empresa = :url WHERE id = :id')
            ->execute([':url' => $url, ':id' => $id]);
    }

    public static function actualizar(int $id, array $datos): void
    {
        $pdo = Database::connect();
        $pdo->prepare(
            'UPDATE EMPRESA
                SET razonSocial = :razonSocial, nombreComercial = :nombreComercial,
                direccion = :direccion, telefono = :telefono, email = :email
                WHERE id = :id'
        )->execute([
            ':razonSocial'     => $datos['razonSocial'],
            ':nombreComercial' => $datos['nombreComercial'],
            ':direccion'       => $datos['direccion'],
            ':telefono'        => $datos['telefono'],
            ':email'           => $datos['email'],
            ':id'              => $id,
        ]);
    }

    public static function existeNif(string $nif): bool
    {
        $pdo = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM EMPRESA WHERE nif = :nif LIMIT 1');
        $stmt->execute([':nif' => $nif]);
        return (bool) $stmt->fetch();
    }

    public static function eliminar(int $id): void
    {
        $pdo = Database::connect();
        $pdo->beginTransaction();
        try {
            $pdo->prepare(
                'DELETE dv FROM DETALLE_VENTA dv
                 INNER JOIN VENTA v ON dv.idVenta = v.id
                 INNER JOIN USUARIO u ON v.idUsuario = u.id
                 WHERE u.idEmpresa = :id'
            )->execute([':id' => $id]);

            $pdo->prepare(
                'DELETE v FROM VENTA v
                 INNER JOIN USUARIO u ON v.idUsuario = u.id
                 WHERE u.idEmpresa = :id'
            )->execute([':id' => $id]);

            $pdo->prepare('DELETE FROM GASTO    WHERE idEmpresa = :id')->execute([':id' => $id]);
            $pdo->prepare('DELETE FROM PRODUCTO WHERE idEmpresa = :id')->execute([':id' => $id]);
            $pdo->prepare('DELETE FROM CATEGORIA WHERE idEmpresa = :id')->execute([':id' => $id]);
            $pdo->prepare('DELETE FROM NOMINA   WHERE idEmpresa = :id')->execute([':id' => $id]);
            $pdo->prepare('DELETE FROM USUARIO  WHERE idEmpresa = :id')->execute([':id' => $id]);
            $pdo->prepare('DELETE FROM EMPRESA  WHERE id = :id')->execute([':id' => $id]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function crear(array $datos): int
    {
        $pdo = Database::connect();
        $stmt = $pdo->prepare(
            'INSERT INTO EMPRESA (nif, razonSocial, nombreComercial, direccion, telefono, email)
                VALUES (:nif, :razonSocial, :nombreComercial, :direccion, :telefono, :email)'
        );
        $stmt->execute([
            ':nif'             => $datos['nif'],
            ':razonSocial'     => $datos['razonSocial'],
            ':nombreComercial' => $datos['nombreComercial'],
            ':direccion'       => $datos['direccion'] ?? null,
            ':telefono'        => $datos['telefono'] ?? null,
            ':email'           => $datos['email'] ?? null,
        ]);
        return (int) $pdo->lastInsertId();
    }
}
