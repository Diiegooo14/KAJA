<?php

class EmpresaModel
{
    public static function existeNif(string $nif): bool
    {
        $pdo = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM EMPRESA WHERE nif = :nif LIMIT 1');
        $stmt->execute([':nif' => $nif]);
        return (bool) $stmt->fetch();
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
