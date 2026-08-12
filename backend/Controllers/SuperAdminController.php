<?php

class SuperAdminController
{
    /** Impide operar sobre la empresa "sistema" que aloja las cuentas SuperAdmin. */
    private static function empresaValida(int $idEmpresa): ?array
    {
        $empresa = EmpresaModel::buscarPorId($idEmpresa);
        if (!$empresa || $empresa['nif'] === 'SUPERADMIN') return null;
        return $empresa;
    }

    public static function empresas(): void
    {
        Jwt::requerirSuperAdmin();

        try {
            echo json_encode(['empresas' => EmpresaModel::listarTodasConStats()]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function ventas(): void
    {
        Jwt::requerirSuperAdmin();
        $idEmpresa = (int) ($_GET['idEmpresa'] ?? 0);
        $mes  = isset($_GET['mes'])  ? max(1, min(12, (int) $_GET['mes'])) : null;
        $anio = isset($_GET['anio']) ? max(2000, (int) $_GET['anio'])     : null;

        if (!self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa no encontrada']);
            return;
        }

        try {
            echo json_encode(['ventas' => VentaModel::listarParaSuperAdmin($idEmpresa, $mes, $anio)]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function anularVenta(): void
    {
        $carga = Jwt::requerirSuperAdmin();

        $datos     = json_decode(file_get_contents('php://input'), true) ?? [];
        $idVenta   = (int) ($datos['idVenta']   ?? 0);
        $idEmpresa = (int) ($datos['idEmpresa'] ?? 0);
        $motivo    = trim($datos['motivo'] ?? '');

        if ($idVenta <= 0 || $idEmpresa <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'idVenta e idEmpresa son obligatorios']);
            return;
        }
        if (strlen($motivo) < 5) {
            http_response_code(400);
            echo json_encode(['error' => 'Debes indicar un motivo de anulación (mínimo 5 caracteres)']);
            return;
        }
        if (!self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa no encontrada']);
            return;
        }

        try {
            VentaModel::anular($idVenta, $idEmpresa, (int) $carga['id'], $motivo);
            echo json_encode(['mensaje' => 'Venta anulada correctamente']);
        } catch (\RuntimeException $e) {
            http_response_code(422);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function reemitirVenta(): void
    {
        $carga = Jwt::requerirSuperAdmin();

        $datos            = json_decode(file_get_contents('php://input'), true) ?? [];
        $idVenta          = (int) ($datos['idVenta']          ?? 0);
        $idEmpresa        = (int) ($datos['idEmpresa']        ?? 0);
        $idUsuarioDestino = (int) ($datos['idUsuarioDestino'] ?? 0);
        $motivo           = trim($datos['motivo'] ?? '');

        if ($idVenta <= 0 || $idEmpresa <= 0 || $idUsuarioDestino <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'idVenta, idEmpresa e idUsuarioDestino son obligatorios']);
            return;
        }
        if (strlen($motivo) < 5) {
            http_response_code(400);
            echo json_encode(['error' => 'Debes indicar un motivo (mínimo 5 caracteres)']);
            return;
        }
        if (!self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa no encontrada']);
            return;
        }

        $destino = UsuarioModel::buscarPorIdYEmpresa($idUsuarioDestino, $idEmpresa);
        if (!$destino || $destino['estado'] !== 'Activo') {
            http_response_code(400);
            echo json_encode(['error' => 'El usuario destino debe ser un empleado activo de esa empresa']);
            return;
        }

        try {
            $resultado = VentaModel::reemitir($idVenta, $idEmpresa, $idUsuarioDestino, (int) $carga['id'], $motivo);
            echo json_encode([
                'mensaje'      => 'Venta anulada y reemitida correctamente',
                'idVentaNueva' => $resultado['idVentaNueva'],
                'totalFinal'   => $resultado['totalFinal'],
            ]);
        } catch (\RuntimeException $e) {
            http_response_code(422);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function usuarios(): void
    {
        Jwt::requerirSuperAdmin();
        $idEmpresa = (int) ($_GET['idEmpresa'] ?? 0);

        if (!self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa no encontrada']);
            return;
        }

        try {
            echo json_encode(['usuarios' => UsuarioModel::listarPorEmpresa($idEmpresa)]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizarUsuario(): void
    {
        Jwt::requerirSuperAdmin();
        $idEmpresa = (int) ($_GET['idEmpresa'] ?? 0);
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0 || !self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa o usuario no encontrado']);
            return;
        }

        try {
            if (!UsuarioModel::buscarPorIdYEmpresa($id, $idEmpresa)) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            $datos      = json_decode(file_get_contents('php://input'), true) ?? [];
            $campos     = [];
            $parametros = [];

            if (isset($datos['nombre'])) {
                $nombre = trim($datos['nombre']);
                if ($nombre === '') {
                    http_response_code(400);
                    echo json_encode(['error' => 'El nombre no puede estar vacío']);
                    return;
                }
                $campos[]              = 'nombre = :nombre';
                $parametros[':nombre'] = $nombre;
            }

            if (isset($datos['rol'])) {
                if (!in_array($datos['rol'], ['Administrador', 'Empleado'], true)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Rol no válido']);
                    return;
                }
                $idRol = UsuarioModel::idRolPorNombre($datos['rol']);
                $campos[]             = 'idRol = :idRol';
                $parametros[':idRol'] = $idRol;
            }

            if (!empty($datos['password'])) {
                if (strlen($datos['password']) < 8) {
                    http_response_code(400);
                    echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
                    return;
                }
                $campos[]                = 'password = :password';
                $parametros[':password'] = password_hash($datos['password'], PASSWORD_DEFAULT);
            }

            if (isset($datos['estado'])) {
                if (!in_array($datos['estado'], ['Activo', 'Inactivo'], true)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Estado no válido']);
                    return;
                }
                $campos[]              = 'estado = :estado';
                $parametros[':estado'] = $datos['estado'];
            }

            if (empty($campos)) {
                http_response_code(400);
                echo json_encode(['error' => 'No se proporcionaron campos para actualizar']);
                return;
            }

            UsuarioModel::actualizar($id, $campos, $parametros);
            echo json_encode(['mensaje' => 'Usuario actualizado correctamente']);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function productos(): void
    {
        Jwt::requerirSuperAdmin();
        $idEmpresa = (int) ($_GET['idEmpresa'] ?? 0);

        if (!self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa no encontrada']);
            return;
        }

        try {
            $productos = ProductoModel::listarTodos($idEmpresa, '', null, 1, 999);
            echo json_encode(['productos' => $productos]);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public static function actualizarProducto(): void
    {
        Jwt::requerirSuperAdmin();
        $idEmpresa = (int) ($_GET['idEmpresa'] ?? 0);
        $id        = (int) ($_GET['id'] ?? 0);

        if ($id <= 0 || !self::empresaValida($idEmpresa)) {
            http_response_code(404);
            echo json_encode(['error' => 'Empresa o producto no encontrado']);
            return;
        }

        try {
            if (!ProductoModel::buscarPorId($id, $idEmpresa)) {
                http_response_code(404);
                echo json_encode(['error' => 'Producto no encontrado']);
                return;
            }

            $datos       = json_decode(file_get_contents('php://input'), true) ?? [];
            $nombre      = trim($datos['nombre'] ?? '');
            $idCategoria = (int) ($datos['idCategoria'] ?? 0);
            $precioCoste = (float) ($datos['precioCoste'] ?? 0);
            $precioVenta = (float) ($datos['precioVenta'] ?? 0);
            $iva         = (int) ($datos['iva'] ?? 21);
            $stock       = (int) ($datos['stock'] ?? 0);

            if ($nombre === '' || $idCategoria <= 0 || $precioCoste <= 0 || $precioVenta <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Faltan campos obligatorios o los valores son inválidos']);
                return;
            }
            if ($stock < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'El stock no puede ser negativo']);
                return;
            }
            if (!in_array($iva, [0, 4, 10, 21], true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Tipo de IVA no válido']);
                return;
            }

            $estado = $stock > 0 ? 'Activo' : 'Inactivo';

            ProductoModel::actualizar($id, compact('nombre', 'idCategoria', 'precioCoste', 'precioVenta', 'iva', 'stock', 'estado'));
            echo json_encode(['mensaje' => 'Producto actualizado correctamente']);
        } catch (PDOException) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }
}
