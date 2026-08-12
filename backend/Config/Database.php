<?php
require_once __DIR__ . '/config.php';

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                Config::$HOST,
                Config::$PORT,
                Config::$DATABASE,
                Config::$CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $options[PDO::MYSQL_ATTR_SSL_CA] = __DIR__ . '/cacert.pem';
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;

            self::$instance = new PDO($dsn, Config::$USERNAME, Config::$PASSWORD, $options);

            // NOW()/CURRENT_TIMESTAMP se evalúan con la zona horaria de la sesión de
            // TiDB (normalmente UTC), no con la de PHP. Se fija aquí como offset fijo
            // (no como nombre de zona) porque TiDB Cloud no siempre tiene cargadas las
            // tablas de zonas horarias con nombre. Se recalcula en cada conexión para
            // seguir el cambio de horario de verano/invierno automáticamente.
            $offset = (new DateTime('now', new DateTimeZone('Europe/Madrid')))->format('P');
            self::$instance->exec("SET time_zone = '$offset'");
        }

        return self::$instance;
    }
}
