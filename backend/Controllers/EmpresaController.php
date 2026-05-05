<?php

class EmpresaController
{
    public static function obtener(): void
    {
        $carga     = Jwt::requerirAutenticacion();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            $empresa = EmpresaModel::buscarPorId($idEmpresa);
            if (!$empresa) {
                http_response_code(404);
                echo json_encode(['error' => 'Empresa no encontrada']);
                return;
            }
            echo json_encode($empresa);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
