<?php

$envFile = __DIR__ . '/../.env';
$_env = file_exists($envFile) ? parse_ini_file($envFile) : [];

function _env(string $key, string $default = ''): string {
    global $_env;
    return $_env[$key] ?? getenv($key) ?: $default;
}

class Config
{
    public static string $HOST;
    public static string $DATABASE;
    public static string $USERNAME;
    public static string $PASSWORD;
    public static string $PORT;
    public static string $CHARSET = 'utf8mb4';
    public static string $JWT_Servidor;
    public static int    $tiempoUtil_JWT;
}

Config::$HOST           = _env('DB_HOST');
Config::$DATABASE       = _env('DB_NAME');
Config::$USERNAME       = _env('DB_USER');
Config::$PASSWORD       = _env('DB_PASS');
Config::$PORT           = _env('DB_PORT', '3306');
Config::$JWT_Servidor   = _env('JWT_SECRET');
Config::$tiempoUtil_JWT = (int) _env('JWT_TTL', '28800');
