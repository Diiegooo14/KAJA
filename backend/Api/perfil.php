<?php
require_once __DIR__ . '/../autoload.php';

match ($_SERVER['REQUEST_METHOD']) {
    'GET'  => PerfilController::obtener(),
    'PUT'  => PerfilController::actualizar(),
    'POST' => PerfilController::subirImagen(),
    default => (function () {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    })()
};
