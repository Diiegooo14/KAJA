<?php
require_once __DIR__ . '/../autoload.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

match ($_SERVER['REQUEST_METHOD']) {
    'GET' => PromocionController::listar(),
    'POST' => PromocionController::crear(),
    'PUT' => $id ? PromocionController::actualizar($id) : (function () {
            http_response_code(400);
            echo json_encode(['error' => 'Se requiere el parámetro id']);
        })(),
    'DELETE' => $id ? PromocionController::eliminar($id) : (function () {
            http_response_code(400);
            echo json_encode(['error' => 'Se requiere el parámetro id']);
        })(),
    default => (function () {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        })()
};
