<?php

class PerfilController
{
    public static function obtener(): void
    {
        $carga   = Jwt::requerirAutenticacion();
        $usuario = UsuarioModel::buscarPorId((int) $carga['id']);

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['error' => 'Usuario no encontrado']);
            return;
        }

        echo json_encode(['usuario' => $usuario]);
    }

    public static function actualizar(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $id    = (int) $carga['id'];

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

        $tieneActual = !empty($datos['password_actual']);
        $tieneNueva  = !empty($datos['password_nueva']);

        if ($tieneActual || $tieneNueva) {
            if (!$tieneActual || !$tieneNueva) {
                http_response_code(400);
                echo json_encode(['error' => 'Debes indicar la contraseña actual y la nueva']);
                return;
            }

            $row = UsuarioModel::buscarPorIdConPassword($id);
            if (!$row || !password_verify($datos['password_actual'], $row['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'La contraseña actual no es correcta']);
                return;
            }

            if (strlen($datos['password_nueva']) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'La nueva contraseña debe tener al menos 8 caracteres']);
                return;
            }

            $campos[]                = 'password = :password';
            $parametros[':password'] = password_hash($datos['password_nueva'], PASSWORD_DEFAULT);
        }

        if (empty($campos)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se proporcionaron campos para actualizar']);
            return;
        }

        try {
            UsuarioModel::actualizar($id, $campos, $parametros);
            $actualizado = UsuarioModel::buscarPorId($id);
            echo json_encode([
                'mensaje' => 'Perfil actualizado correctamente',
                'usuario' => $actualizado,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function subirImagen(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $id    = (int) $carga['id'];

        if (!isset($_FILES['imagen'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibió ningún archivo']);
            return;
        }

        try {
            CloudinaryService::validar($_FILES['imagen']);
            $url = CloudinaryService::subir(
                $_FILES['imagen']['tmp_name'],
                'usuarios KAJA',
                'user_' . $id
            );
            UsuarioModel::actualizarImagenPerfil($id, $url);
            echo json_encode(['url' => $url]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (\RuntimeException $e) {
            http_response_code(502);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
