<?php
require_once __DIR__ . '/../autoload.php';

match ($_SERVER['REQUEST_METHOD']) {
    'GET'    => isset($_GET['action']) && $_GET['action'] === 'descargar'
                ? NominaController::descargar()
                : NominaController::listar(),
    'POST'   => NominaController::subir(),
    'DELETE' => NominaController::eliminar(),
    default  => (function () {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    })()
};
