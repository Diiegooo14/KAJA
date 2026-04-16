DROP DATABASE IF EXISTS kaja;
CREATE DATABASE kaja CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kaja;

CREATE TABLE ROL (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreRol VARCHAR(50) NOT NULL
);

CREATE TABLE EMPRESA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nif VARCHAR(20) NOT NULL,
    razonSocial VARCHAR(100) NOT NULL,
    nombreComercial VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE USUARIO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idRol INT NOT NULL,
    idEmpresa INT NOT NULL,
    nif VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (idRol) REFERENCES ROL(id) ON DELETE RESTRICT,
    FOREIGN KEY (idEmpresa) REFERENCES EMPRESA(id) ON DELETE RESTRICT
);

CREATE TABLE CATEGORIA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE PRODUCTO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idCategoria INT NOT NULL,
    idEmpresa INT NOT NULL, 
    nombre VARCHAR(150) NOT NULL,
    precioCoste DECIMAL(10,2) NOT NULL,
    precioVenta DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (idCategoria) REFERENCES CATEGORIA(id) ON DELETE RESTRICT,
    FOREIGN KEY (idEmpresa) REFERENCES EMPRESA(id) ON DELETE RESTRICT
);

CREATE INDEX idx_producto_nombre ON PRODUCTO(nombre);

CREATE TABLE VENTA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    baseImponible DECIMAL(10,2) NOT NULL,
    totalIva DECIMAL(10,2) NOT NULL,
    totalFinal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES USUARIO(id) ON DELETE RESTRICT
);

CREATE TABLE DETALLE_VENTA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idVenta INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioVentaHistorico DECIMAL(10,2) NOT NULL,
    ivaAplicado DECIMAL(5,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idVenta) REFERENCES VENTA(id) ON DELETE RESTRICT,
    FOREIGN KEY (idProducto) REFERENCES PRODUCTO(id) ON DELETE RESTRICT
);

CREATE TABLE TIPO_GASTO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreTipo VARCHAR(50) NOT NULL
);

CREATE TABLE GASTO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idEmpresa INT NOT NULL,
    idTipoGasto INT NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    importe DECIMAL(10,2) NOT NULL,
    fechaRegistro DATE NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES USUARIO(id) ON DELETE RESTRICT,
    FOREIGN KEY (idEmpresa) REFERENCES EMPRESA(id) ON DELETE RESTRICT,
    FOREIGN KEY (idTipoGasto) REFERENCES TIPO_GASTO(id) ON DELETE RESTRICT
);

-- DATOS DE PRUEBA

INSERT INTO ROL (nombreRol) VALUES ('Administrador'), ('Empleado');

INSERT INTO EMPRESA (nif, razonSocial, nombreComercial, direccion, email)
VALUES ('B12345678', 'Ferreterías Prieto S.L.', 'KAJA Demo', 'Calle Mayor 1', 'contacto@kajademo.es');

INSERT INTO USUARIO (idRol, idEmpresa, nif, nombre, password) VALUES
(1, 1, '11111111A', 'Diego Prieto (Admin)', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 1, '22222222B', 'Carlos López (Vendedor)', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO CATEGORIA (nombre, descripcion) VALUES 
('Herramienta Eléctrica', 'Taladros, sierras, radiales'),
('Tornillería', 'Cajas de tornillos, clavos'),
('Electricidad', 'Cables, enchufes, bombillas'),
('Ropa de Trabajo', 'EPIs, botas, guantes');

INSERT INTO PRODUCTO (idCategoria, idEmpresa, nombre, precioCoste, precioVenta, stock) VALUES
(1, 1, 'Taladro Percutor 500W', 35.00, 45.99, 12),       -- ID 1
(1, 1, 'Sierra Circular Pro', 80.00, 115.50, 5),       -- ID 2
(2, 1, 'Caja Tornillos Madera 4x40', 1.50, 3.20, 50),  -- ID 3
(3, 1, 'Rollo Cable Cobre 1.5mm', 15.00, 24.99, 10),   -- ID 4
(3, 1, 'Enchufe Superficie Doble', 2.50, 4.50, 30),    -- ID 5
(3, 1, 'Bombilla LED E27 10W', 4.00, 7.50, 45),        -- ID 6
(4, 1, 'Pantalón Multibolsillos Talla L', 12.00, 22.50, 15), -- ID 7
(4, 1, 'Botas de Seguridad S3 Talla 42', 25.00, 45.00, 8);   -- ID 8

INSERT INTO TIPO_GASTO (nombreTipo) VALUES ('Fijo'), ('Variable');

INSERT INTO GASTO (idUsuario, idEmpresa, idTipoGasto, concepto, importe, fechaRegistro) VALUES
(1, 1, 1, 'Alquiler local', 800.00, DATE_FORMAT(NOW(), '%Y-%m-01')),
(1, 1, 1, 'Cuota Internet y Teléfono', 45.00, DATE_FORMAT(NOW(), '%Y-%m-05')),
(1, 1, 2, 'Campaña Publicidad Facebook', 60.00, DATE_FORMAT(NOW(), '%Y-%m-15'));

INSERT INTO VENTA (idUsuario, fecha, baseImponible, totalIva, totalFinal) VALUES
(2, DATE_SUB(NOW(), INTERVAL 2 DAY), 55.78, 11.72, 67.50), -- Venta 1 (Ropa)
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), 13.64, 2.86, 16.50),  -- Venta 2 (Electricidad)
(2, NOW(), 133.46, 28.03, 161.49);                         -- Venta 3 (Herramientas)

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(1, 7, 1, 22.50, 21.00, 22.50),
(1, 8, 1, 45.00, 21.00, 45.00);

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(2, 5, 2, 4.50, 21.00, 9.00),
(2, 6, 1, 7.50, 21.00, 7.50);

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(3, 1, 1, 45.99, 21.00, 45.99),
(3, 2, 1, 115.50, 21.00, 115.50);