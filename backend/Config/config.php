<?php
class Config
{
    public const HOST = 'localhost';        // host de la base de datos
    public const DATABASE = 'kaja';        // nombre de la base de datos
    public const USERNAME = 'root';        // usuario con el que accedemos
    public const PASSWORD = '';        // contraseña del usuario
    public const PORT = '3306';    // puerto en el que escucha MariaDB o MySQL
    public const CHARSET = 'utf8mb4'; // encoding de la conexión

    public const JWT_Servidor = 'KAJA_JWT_SERVIDOR_SECRETO_';
    // Duración del token en segundos (8 horas)
    public const tiempoUtil_JWT = 28800;
}
