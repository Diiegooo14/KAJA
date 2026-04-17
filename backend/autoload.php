<?php
if (php_sapi_name() === 'cli-server') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

spl_autoload_register(function (string $class): void {
    $dirs = [
        __DIR__ . '/Config/',
        __DIR__ . '/Helpers/',
        __DIR__ . '/Controllers/',
        __DIR__ . '/Models/',
    ];

    foreach ($dirs as $dir) {
        $file = $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});
