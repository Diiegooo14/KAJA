<?php
require_once __DIR__ . '/../autoload.php';

match ($_SERVER['REQUEST_METHOD']) {
    'GET'  => EmpresaController::obtener(),
    'PUT'  => EmpresaController::actualizar(),
    'POST'   => EmpresaController::subirLogo(),
    'DELETE' => isset($_GET['todo']) ? EmpresaController::eliminarEmpresa() : EmpresaController::eliminarLogo(),
    default => (function () {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    })()
};
