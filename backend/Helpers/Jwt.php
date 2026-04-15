<?php
require_once __DIR__ . '/../Config/config.php';

class Jwt
{
    private static function codificarB64(string $datos): string
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    private static function decodificarB64(string $datos): string
    {
        return base64_decode(strtr($datos, '-_', '+/'));
    }

    public static function generar(array $carga): string
    {
        $cabecera        = self::codificarB64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $carga['iat']    = time();
        $carga['exp']    = time() + Config::tiempoUtil_JWT;
        $cargaCodificada = self::codificarB64(json_encode($carga));
        $firma           = self::codificarB64(
            hash_hmac('sha256', "$cabecera.$cargaCodificada", Config::JWT_Servidor, true)
        );
        return "$cabecera.$cargaCodificada.$firma";
    }

    public static function verificar(string $token): ?array
    {
        $partes = explode('.', $token);
        if (count($partes) !== 3) return null;

        [$cabecera, $cargaCodificada, $firma] = $partes;

        $firmaEsperada = self::codificarB64(
            hash_hmac('sha256', "$cabecera.$cargaCodificada", Config::JWT_Servidor, true)
        );

        if (!hash_equals($firmaEsperada, $firma)) return null;

        $datos = json_decode(self::decodificarB64($cargaCodificada), true);

        if (!$datos || $datos['exp'] < time()) return null;

        return $datos;
    }

    public static function obtenerDePeticion(): ?array
    {
        $cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($cabecera, 'Bearer ')) return null;
        return self::verificar(substr($cabecera, 7));
    }

    public static function requerirAutenticacion(): array
    {
        $carga = self::obtenerDePeticion();
        if (!$carga) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado. Inicia sesión.']);
            exit;
        }
        return $carga;
    }

    public static function requerirAdministrador(): array
    {
        $carga = self::requerirAutenticacion();
        if ($carga['rol'] !== 'Administrador') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado. Se requiere rol Administrador.']);
            exit;
        }
        return $carga;
    }
}
