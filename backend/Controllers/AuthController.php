<?php

class AuthController
{
    public static function login(): void
    {
        $datos = json_decode(file_get_contents('php://input'), true) ?? [];
        $nif = trim($datos['nif'] ?? '');
        $password = $datos['password'] ?? '';

        if ($nif === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['error' => 'NIF y contraseña son obligatorios']);
            exit;
        }

        try {
            $usuario = UsuarioModel::buscarPorNif($nif);

            if (!$usuario || !password_verify($password, $usuario['password'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Usuario o clave incorrectos']);
                exit;
            }

            $token = Jwt::generar([
                'id' => $usuario['id'],
                'idEmpresa' => $usuario['idEmpresa'],
                'nombre' => $usuario['nombre'],
                'rol' => $usuario['rol'],
            ]);

            echo json_encode([
                'token' => $token,
                'nombre' => $usuario['nombre'],
                'rol' => $usuario['rol'],
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function logout(): void
    {
        Jwt::requerirAutenticacion();
        echo json_encode(['mensaje' => 'Sesión cerrada correctamente']);
    }
}
