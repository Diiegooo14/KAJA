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

    public static function actualizar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $datos           = json_decode(file_get_contents('php://input'), true) ?? [];
        $razonSocial     = trim($datos['razonSocial']     ?? '');
        $nombreComercial = trim($datos['nombreComercial'] ?? '');
        $direccion       = trim($datos['direccion']       ?? '') ?: null;
        $telefono        = trim($datos['telefono']        ?? '') ?: null;
        $email           = trim($datos['email']           ?? '') ?: null;

        if ($razonSocial === '') {
            http_response_code(400);
            echo json_encode(['error' => 'La razón social es obligatoria']);
            return;
        }

        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'El formato del email no es válido']);
            return;
        }

        try {
            EmpresaModel::actualizar($idEmpresa, [
                'razonSocial'     => $razonSocial,
                'nombreComercial' => $nombreComercial,
                'direccion'       => $direccion,
                'telefono'        => $telefono,
                'email'           => $email,
            ]);
            echo json_encode(['mensaje' => 'Datos de empresa actualizados correctamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminarLogo(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            EmpresaModel::actualizarLogo($idEmpresa, null);
            echo json_encode(['mensaje' => 'Logo de empresa eliminado correctamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function subirLogo(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        if (!isset($_FILES['imagen'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibió ningún archivo']);
            return;
        }

        try {
            CloudinaryService::validar($_FILES['imagen']);
            $url = CloudinaryService::subir(
                $_FILES['imagen']['tmp_name'],
                'empresas KAJA',
                'empresa_' . $idEmpresa
            );
            EmpresaModel::actualizarLogo($idEmpresa, $url);
            echo json_encode(['url' => $url]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (\RuntimeException $e) {
            http_response_code(502);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
