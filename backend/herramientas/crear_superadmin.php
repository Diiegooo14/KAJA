<?php
// Crea (o resetea la contraseña de) la cuenta SuperAdmin. Solo por línea de comandos:
// no existe endpoint HTTP para esto, precisamente para que nadie pueda
// autopromocionarse a SuperAdmin desde fuera.
//
// Requisito previo: haber ejecutado backend/superadmin_migracion.sql
//
// Uso:
//   php backend/herramientas/crear_superadmin.php <NIF> "<Nombre>" "<Password>"

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script solo puede ejecutarse por línea de comandos.\n");
}

require_once __DIR__ . '/../autoload.php';

[, $nif, $nombre, $password] = array_pad($argv, 4, null);

if (!$nif || !$nombre || !$password) {
    fwrite(STDERR, "Uso: php crear_superadmin.php <NIF> \"<Nombre>\" \"<Password>\"\n");
    exit(1);
}

if (strlen($password) < 8) {
    fwrite(STDERR, "La contraseña debe tener al menos 8 caracteres.\n");
    exit(1);
}

$pdo = Database::connect();

$idRol = UsuarioModel::idRolPorNombre('SuperAdmin');
if (!$idRol) {
    fwrite(STDERR, "No existe el rol 'SuperAdmin'. Ejecuta antes backend/superadmin_migracion.sql\n");
    exit(1);
}

$stmtEmpresa = $pdo->prepare('SELECT id FROM EMPRESA WHERE nif = "SUPERADMIN" LIMIT 1');
$stmtEmpresa->execute();
$idEmpresa = $stmtEmpresa->fetchColumn();
if (!$idEmpresa) {
    fwrite(STDERR, "No existe la empresa sistema (nif SUPERADMIN). Ejecuta antes backend/superadmin_migracion.sql\n");
    exit(1);
}

$existente = $pdo->prepare(
    'SELECT u.id, u.idEmpresa, e.nombreComercial
        FROM USUARIO u JOIN EMPRESA e ON u.idEmpresa = e.id
        WHERE u.nif = :nif LIMIT 1'
);
$existente->execute([':nif' => $nif]);
$filaExistente = $existente->fetch();

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

if ($filaExistente) {
    if ((int) $filaExistente['idEmpresa'] !== (int) $idEmpresa) {
        fwrite(STDERR,
            "Aviso: ese NIF pertenecía a la empresa \"{$filaExistente['nombreComercial']}\". " .
            "Se está reasignando esa cuenta a SuperAdmin (empresa sistema). " .
            "Si esa empresa necesita seguir teniendo un Administrador, asígnalo a otro usuario.\n"
        );
    }
    $pdo->prepare('UPDATE USUARIO SET password = :password, nombre = :nombre, idRol = :idRol, idEmpresa = :idEmpresa, estado = "Activo" WHERE id = :id')
        ->execute([
            ':password'  => $passwordHash,
            ':nombre'    => $nombre,
            ':idRol'     => $idRol,
            ':idEmpresa' => (int) $idEmpresa,
            ':id'        => $filaExistente['id'],
        ]);
    echo "Cuenta SuperAdmin existente actualizada (id {$filaExistente['id']}), movida a la empresa sistema.\n";
} else {
    $id = UsuarioModel::crear([
        'idRol'     => $idRol,
        'idEmpresa' => (int) $idEmpresa,
        'nif'       => $nif,
        'nombre'    => $nombre,
        'password'  => $passwordHash,
    ]);
    echo "Cuenta SuperAdmin creada (id $id). Ya puedes iniciar sesión en /login con ese NIF.\n";
}
