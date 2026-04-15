<?php
require_once __DIR__ . '/../autoload.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

match ($_SERVER['REQUEST_METHOD']) {
    'GET' => $id ? ProductoController::obtener($id) : ProductoController::listar(),
    'POST' => ProductoController::crear(),
    'PUT' => $id ? ProductoController::actualizar($id) : (function () {
            http_response_code(400);
            echo json_encode(['error' => 'Se requiere el parámetro id']);
        })(),
    'DELETE' => $id ? ProductoController::eliminar($id) : (function () {
            http_response_code(400);
            echo json_encode(['error' => 'Se requiere el parámetro id']);
        })(),
    default => (function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        })()
};
