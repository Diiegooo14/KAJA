<?php
require_once __DIR__ . '/../autoload.php';

$recurso = $_GET['recurso'] ?? '';

function rutaInvalida(): void
{
    http_response_code(404);
    echo json_encode(['error' => 'Recurso no encontrado']);
}

match ($_SERVER['REQUEST_METHOD']) {
    'GET' => match ($recurso) {
        'empresas'  => SuperAdminController::empresas(),
        'ventas'    => SuperAdminController::ventas(),
        'usuarios'  => SuperAdminController::usuarios(),
        'productos' => SuperAdminController::productos(),
        default     => rutaInvalida(),
    },
    'PUT' => match ($recurso) {
        'usuarios'  => SuperAdminController::actualizarUsuario(),
        'productos' => SuperAdminController::actualizarProducto(),
        default     => rutaInvalida(),
    },
    'POST' => match ($recurso) {
        'anular' => SuperAdminController::anularVenta(),
        default  => rutaInvalida(),
    },
    default => (function () {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    })()
};
