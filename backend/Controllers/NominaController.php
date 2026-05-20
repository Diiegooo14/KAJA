<?php

class NominaController
{
    public static function listar(): void
    {
        $carga     = Jwt::requerirAutenticacion();
        $idEmpresa = (int) $carga['idEmpresa'];

        try {
            if ($carga['rol'] === 'Administrador') {
                $nominas = NominaModel::listarPorEmpresa($idEmpresa);
            } else {
                $nominas = NominaModel::listarPorUsuario((int) $carga['id']);
            }
            echo json_encode(['nominas' => $nominas]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function subir(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];

        $idUsuario = (int) ($_POST['idUsuario'] ?? 0);
        $mes       = (int) ($_POST['mes']       ?? 0);
        $anio      = (int) ($_POST['anio']      ?? 0);

        if ($idUsuario <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Usuario no válido']);
            return;
        }
        if ($mes < 1 || $mes > 12) {
            http_response_code(400);
            echo json_encode(['error' => 'Mes no válido (1-12)']);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            http_response_code(400);
            echo json_encode(['error' => 'Año no válido']);
            return;
        }
        if (!isset($_FILES['nomina'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibió ningún archivo']);
            return;
        }

        try {
            if (!UsuarioModel::buscarPorIdYEmpresa($idUsuario, $idEmpresa)) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            CloudinaryService::validarPdf($_FILES['nomina']);

            $publicId = "nomina_{$idUsuario}_{$anio}_{$mes}.pdf";
            $url      = CloudinaryService::subirPdf(
                $_FILES['nomina']['tmp_name'],
                'nominas KAJA',
                $publicId
            );

            if (NominaModel::existePeriodo($idUsuario, $mes, $anio)) {
                $nominas = NominaModel::listarPorUsuario($idUsuario);
                foreach ($nominas as $n) {
                    if ((int)$n['mes'] === $mes && (int)$n['anio'] === $anio) {
                        NominaModel::actualizar((int)$n['id'], $url);
                        echo json_encode(['url' => $url, 'mensaje' => 'Nómina actualizada correctamente']);
                        return;
                    }
                }
            }

            $id = NominaModel::crear([
                'idUsuario' => $idUsuario,
                'idEmpresa' => $idEmpresa,
                'mes'       => $mes,
                'anio'      => $anio,
                'url'       => $url,
            ]);

            http_response_code(201);
            echo json_encode(['id' => $id, 'url' => $url, 'mensaje' => 'Nómina subida correctamente']);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (\RuntimeException $e) {
            http_response_code(502);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function descargar(): void
    {
        $carga = Jwt::requerirAutenticacion();
        $id    = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de nómina no válido']);
            return;
        }

        try {
            $nomina = NominaModel::buscarPorId($id);
            if (!$nomina) {
                http_response_code(404);
                echo json_encode(['error' => 'Nómina no encontrada']);
                return;
            }

            if ($carga['rol'] !== 'Administrador' && (int) $nomina['idUsuario'] !== (int) $carga['id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Acceso denegado']);
                return;
            }

            echo json_encode(['url' => $nomina['url']]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function eliminar(): void
    {
        $carga     = Jwt::requerirAdministrador();
        $idEmpresa = (int) $carga['idEmpresa'];
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de nómina no válido']);
            return;
        }

        try {
            $nomina = NominaModel::buscarPorId($id);
            if (!$nomina || (int)$nomina['idEmpresa'] !== $idEmpresa) {
                http_response_code(404);
                echo json_encode(['error' => 'Nómina no encontrada']);
                return;
            }

            NominaModel::eliminar($id);
            echo json_encode(['mensaje' => 'Nómina eliminada correctamente']);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
