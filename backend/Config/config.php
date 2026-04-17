<?php

$envFile = __DIR__ . '/../.env';
$_env = file_exists($envFile) ? (parse_ini_file($envFile) ?: []) : [];

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

Config::$HOST           = (string)($_env['DB_HOST'] ?? getenv('DB_HOST') ?: '');
Config::$DATABASE       = (string)($_env['DB_NAME'] ?? getenv('DB_NAME') ?: '');
Config::$USERNAME       = (string)($_env['DB_USER'] ?? getenv('DB_USER') ?: '');
Config::$PASSWORD       = (string)($_env['DB_PASS'] ?? getenv('DB_PASS') ?: '');
Config::$PORT           = (string)($_env['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');
Config::$JWT_Servidor   = (string)($_env['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: '');
Config::$tiempoUtil_JWT = (int)($_env['JWT_TTL'] ?? getenv('JWT_TTL') ?: 28800);
