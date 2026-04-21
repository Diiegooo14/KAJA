<?php

class RegistroController
{
    public static function registrar(): void
    {
        $datos = json_decode(file_get_contents('php://input'), true) ?? [];

        $empresaNif           = trim($datos['empresaNif']           ?? '');
        $razonSocial          = trim($datos['razonSocial']          ?? '');
        $nombreComercial      = trim($datos['nombreComercial']      ?? '');
        $direccion            = trim($datos['direccion']            ?? '');
        $telefono             = trim($datos['telefono']             ?? '');
        $empresaEmail         = trim($datos['empresaEmail']         ?? '');
        $adminNif             = trim($datos['adminNif']             ?? '');
        $adminNombre          = trim($datos['adminNombre']          ?? '');
        $adminPassword        = $datos['adminPassword']             ?? '';
        $adminPasswordConfirm = $datos['adminPasswordConfirm']      ?? '';

        $errores = [];
        if ($empresaNif === '')       $errores['empresaNif']           = 'El NIF de la empresa es obligatorio.';
        if ($razonSocial === '')      $errores['razonSocial']          = 'La razón social es obligatoria.';
        if ($nombreComercial === '')  $errores['nombreComercial']      = 'El nombre comercial es obligatorio.';
        if ($adminNif === '')         $errores['adminNif']             = 'El NIF del administrador es obligatorio.';
        if ($adminNombre === '')      $errores['adminNombre']          = 'El nombre del administrador es obligatorio.';
        if ($adminPassword === '')    $errores['adminPassword']        = 'La contraseña es obligatoria.';
        elseif (strlen($adminPassword) < 8)
                                      $errores['adminPassword']        = 'La contraseña debe tener al menos 8 caracteres.';
        if ($adminPassword !== $adminPasswordConfirm)
                                      $errores['adminPasswordConfirm'] = 'Las contraseñas no coinciden.';

        if (!empty($errores)) {
            http_response_code(422);
            echo json_encode(['errores' => $errores]);
            exit;
        }

        try {
            if (EmpresaModel::existeNif($empresaNif)) {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe una empresa registrada con ese NIF.']);
                exit;
            }

            if (self::existeNifUsuario($adminNif)) {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe un usuario registrado con ese NIF de administrador.']);
                exit;
            }

            $pdo = Database::connect();
            $pdo->beginTransaction();

            $idEmpresa = EmpresaModel::crear([
                'nif'             => $empresaNif,
                'razonSocial'     => $razonSocial,
                'nombreComercial' => $nombreComercial,
                'direccion'       => $direccion ?: null,
                'telefono'        => $telefono ?: null,
                'email'           => $empresaEmail ?: null,
            ]);

            UsuarioModel::crear([
                'idRol'    => 1, // Administrador
                'idEmpresa'=> $idEmpresa,
                'nif'      => $adminNif,
                'nombre'   => $adminNombre,
                'password' => password_hash($adminPassword, PASSWORD_DEFAULT),
            ]);

            $pdo->commit();

            http_response_code(201);
            echo json_encode(['mensaje' => 'Empresa registrada correctamente. Ya puede iniciar sesión.']);

        } catch (PDOException $e) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    private static function existeNifUsuario(string $nif): bool
    {
        $pdo = Database::connect();
        $stmt = $pdo->prepare('SELECT id FROM USUARIO WHERE nif = :nif LIMIT 1');
        $stmt->execute([':nif' => $nif]);
        return (bool) $stmt->fetch();
    }
}
