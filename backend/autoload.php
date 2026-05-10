<?php
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
