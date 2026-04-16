<?php

$_env = parse_ini_file(__DIR__ . '/../.env');

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

Config::$HOST           = $_env['DB_HOST'];
Config::$DATABASE       = $_env['DB_NAME'];
Config::$USERNAME       = $_env['DB_USER'];
Config::$PASSWORD       = $_env['DB_PASS'];
Config::$PORT           = $_env['DB_PORT'];
Config::$JWT_Servidor   = $_env['JWT_SECRET'];
Config::$tiempoUtil_JWT = (int) $_env['JWT_TTL'];
