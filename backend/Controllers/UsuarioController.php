<?php

class UsuarioController
{
    public static function listar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            $usuarios   = UsuarioModel::listarPorEmpresa($idEmpresa);
            $total      = count($usuarios);
            $activos    = count(array_filter($usuarios, fn($u) => $u['estado'] === 'Activo'));

            echo json_encode([
                'usuarios' => $usuarios,
                'resumen'  => [
                    'total'     => $total,
                    'activos'   => $activos,
                    'inactivos' => $total - $activos,
                ],
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function obtener(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario no válido']);
            return;
        }

        try {
            $usuario = UsuarioModel::buscarPorIdYEmpresa($id, $idEmpresa);
            if (!$usuario) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }
            echo json_encode(['usuario' => $usuario]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function crear(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos    = json_decode(file_get_contents('php://input'), true) ?? [];
        $nif      = trim($datos['nif']    ?? '');
        $nombre   = trim($datos['nombre'] ?? '');
        $password = $datos['password']    ?? '';
        $rol      = $datos['rol']         ?? '';

        if ($nif === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El NIF es obligatorio']);
            return;
        }
        if ($nombre === '') {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre es obligatorio']);
            return;
        }
        if (strlen($password) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
            return;
        }
        if (!in_array($rol, ['Administrador', 'Empleado'])) {
            http_response_code(400);
            echo json_encode(['error' => 'El rol debe ser Administrador o Empleado']);
            return;
        }

        try {
            if (UsuarioModel::existeNif($nif)) {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe un usuario con ese NIF']);
                return;
            }

            $idRol = UsuarioModel::idRolPorNombre($rol);
            if (!$idRol) {
                http_response_code(400);
                echo json_encode(['error' => 'Rol no encontrado en la base de datos']);
                return;
            }

            $id = UsuarioModel::crear([
                'idRol'     => $idRol,
                'idEmpresa' => $idEmpresa,
                'nif'       => $nif,
                'nombre'    => $nombre,
                'password'  => password_hash($password, PASSWORD_DEFAULT),
            ]);

            http_response_code(201);
            echo json_encode(['id' => $id, 'mensaje' => 'Usuario creado correctamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario no válido']);
            return;
        }

        try {
            if (!UsuarioModel::buscarPorIdYEmpresa($id, $idEmpresa)) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            $datos      = json_decode(file_get_contents('php://input'), true) ?? [];
            $campos     = [];
            $parametros = [];

            if (isset($datos['nombre'])) {
                $nombre = trim($datos['nombre']);
                if ($nombre === '') {
                    http_response_code(400);
                    echo json_encode(['error' => 'El nombre no puede estar vacío']);
                    return;
                }
                $campos[]              = 'nombre = :nombre';
                $parametros[':nombre'] = $nombre;
            }

            if (isset($datos['rol'])) {
                if (!in_array($datos['rol'], ['Administrador', 'Empleado'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Rol no válido']);
                    return;
                }
                $idRol = UsuarioModel::idRolPorNombre($datos['rol']);
                if (!$idRol) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Rol no encontrado en la base de datos']);
                    return;
                }
                $campos[]              = 'idRol = :idRol';
                $parametros[':idRol']  = $idRol;
            }

            if (!empty($datos['password'])) {
                if (strlen($datos['password']) < 8) {
                    http_response_code(400);
                    echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
                    return;
                }
                $campos[]                = 'password = :password';
                $parametros[':password'] = password_hash($datos['password'], PASSWORD_DEFAULT);
            }

            if (empty($campos)) {
                http_response_code(400);
                echo json_encode(['error' => 'No se proporcionaron campos para actualizar']);
                return;
            }

            UsuarioModel::actualizar($id, $campos, $parametros);
            echo json_encode(['mensaje' => 'Usuario actualizado correctamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function desactivar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];
        $idAdmin   = (int) $carga['id'];
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario no válido']);
            return;
        }

        if ($id === $idAdmin) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes desactivar tu propia cuenta']);
            return;
        }

        try {
            if (!UsuarioModel::buscarPorIdYEmpresa($id, $idEmpresa)) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            UsuarioModel::desactivar($id);
            echo json_encode(['mensaje' => 'Usuario desactivado correctamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
