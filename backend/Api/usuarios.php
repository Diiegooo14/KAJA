<?php
require_once __DIR__ . '/../autoload.php';

match ($_SERVER['REQUEST_METHOD']) {
    'GET'    => isset($_GET['id']) ? UsuarioController::obtener() : UsuarioController::listar(),
    'POST'   => !empty($_FILES) ? UsuarioController::subirImagen() : UsuarioController::crear(),
    'PUT'    => UsuarioController::actualizar(),
    'DELETE' => UsuarioController::desactivar(),
    default  => (function () {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    })()
};
