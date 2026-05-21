<?php

class RegistroController
{
    public static function registrar(): void
    {
        // Acepta tanto multipart/form-data (con imágenes) como application/json
        $datos = !empty($_POST)
            ? $_POST
            : (json_decode(file_get_contents('php://input'), true) ?? []);

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
        if ($empresaEmail === '')     $errores['empresaEmail']         = 'El email de la empresa es obligatorio.';
        elseif (!filter_var($empresaEmail, FILTER_VALIDATE_EMAIL))
            $errores['empresaEmail']         = 'El formato del email no es válido.';
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

            if (UsuarioModel::existeNif($adminNif)) {
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

            $idAdmin = UsuarioModel::crear([
                'idRol'     => 1, // Administrador
                'idEmpresa' => $idEmpresa,
                'nif'       => $adminNif,
                'nombre'    => $adminNombre,
                'password'  => password_hash($adminPassword, PASSWORD_DEFAULT),
            ]);

            $pdo->commit();

            // Subir imágenes opcionales tras el commit (fallos silenciosos)
            if (!empty($_FILES['logoEmpresa']['tmp_name'])) {
                try {
                    CloudinaryService::validar($_FILES['logoEmpresa']);
                    $url = CloudinaryService::subir(
                        $_FILES['logoEmpresa']['tmp_name'],
                        'empresas KAJA',
                        'empresa_' . $idEmpresa
                    );
                    EmpresaModel::actualizarLogo($idEmpresa, $url);
                } catch (\Exception) {
                    // La imagen es opcional; el admin puede subirla después
                }
            }

            if (!empty($_FILES['fotoAdmin']['tmp_name'])) {
                try {
                    CloudinaryService::validar($_FILES['fotoAdmin']);
                    $url = CloudinaryService::subir(
                        $_FILES['fotoAdmin']['tmp_name'],
                        'usuarios KAJA',
                        'user_' . $idAdmin
                    );
                    UsuarioModel::actualizarImagenPerfil($idAdmin, $url);
                } catch (\Exception) {
                    // La foto es opcional; el admin puede subirla después
                }
            }

            http_response_code(201);
            echo json_encode(['mensaje' => 'Empresa registrada correctamente. Ya puede iniciar sesión.']);

        } catch (PDOException) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

}
