<?php
require_once __DIR__ . '/../autoload.php';

match ($_SERVER['REQUEST_METHOD']) {
    'POST' => AuthController::login(),
    'DELETE' => AuthController::logout(),
    default => (function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        })()
};
