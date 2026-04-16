DROP DATABASE IF EXISTS kaja;
CREATE DATABASE IF NOT EXISTS kaja CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    nombre VARCHAR(150) NOT NULL,
    precioCoste DECIMAL(10,2) NOT NULL,
    precioVenta DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (idCategoria) REFERENCES CATEGORIA(id) ON DELETE RESTRICT
);

CREATE INDEX idx_producto_nombre ON PRODUCTO(nombre);
CREATE INDEX idx_producto_categoria ON PRODUCTO(idCategoria);

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
    idTipoGasto INT NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    importe DECIMAL(10,2) NOT NULL,
    fechaRegistro DATE NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES USUARIO(id) ON DELETE RESTRICT,
    FOREIGN KEY (idTipoGasto) REFERENCES TIPO_GASTO(id) ON DELETE RESTRICT
);


-- DATOS DE PRUEBA


INSERT INTO ROL (nombreRol) VALUES ('Administrador'), ('Empleado');

INSERT INTO EMPRESA (nif, razonSocial, nombreComercial, direccion, telefono, email)
VALUES ('B12345678', 'Ferreterías Prieto S.L.', 'KAJA Demo', 'Calle Mayor 1, Salamanca', '923456789', 'contacto@kajademo.es');

INSERT INTO USUARIO (idRol, idEmpresa, nif, nombre, password, estado) VALUES
(1, 1, '11111111A', 'Diego Prieto (Admin)',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Activo'),
(2, 1, '22222222B', 'Carlos López',             '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Activo'),
(2, 1, '33333333C', 'Ana García (Baja)',         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Inactivo');

INSERT INTO CATEGORIA (nombre, descripcion) VALUES
('Herramienta Eléctrica', 'Taladros, sierras, radiales y más'),
('Tornillería',            'Cajas de tornillos, clavos y tacos'),
('Pinturas',               'Pinturas, barnices y selladores'),
('Fontanería',             'Tuberías, llaves y accesorios');

INSERT INTO PRODUCTO (idCategoria, nombre, precioCoste, precioVenta, stock) VALUES
(1, 'Taladro Percutor 500W',             35.00,  45.99, 12),
(1, 'Sierra Circular Pro',               80.00, 115.50,  5),
(1, 'Amoladora Angular 125mm',           45.00,  62.99,  8),
(1, 'Destornillador Eléctrico',          18.00,  27.99, 15),
(2, 'Caja Tornillos Madera 4x40 100uds',  1.50,   3.20, 50),
(2, 'Caja Tornillos Metal 3x20 200uds',   1.20,   2.80, 45),
(2, 'Tacos Plástico 8mm 50uds',           0.80,   1.99, 60),
(2, 'Clavos Acero 3x50 200uds',           1.00,   2.50,  4),
(3, 'Pintura Blanca 5L',                 12.00,  18.50, 20),
(3, 'Barniz Brillante 1L',                8.00,  13.99, 15),
(3, 'Imprimación Universal 1L',           6.50,  10.99,  3),
(4, 'Llave de Paso 1/2',                  5.50,   9.99, 30),
(4, 'Rollo Teflón 10m',                   0.50,   1.50, 80),
(4, 'Sifón Botella Universal',            4.00,   7.99, 25);

INSERT INTO TIPO_GASTO (nombreTipo) VALUES ('Fijo'), ('Variable');

INSERT INTO GASTO (idUsuario, idTipoGasto, concepto, importe, fechaRegistro) VALUES
(1, 1, 'Alquiler local',       800.00, DATE_FORMAT(NOW(), '%Y-%m-01')),
(1, 1, 'Seguro comercio',      120.00, DATE_FORMAT(NOW(), '%Y-%m-01')),
(1, 2, 'Suministro eléctrico', 150.00, CURDATE()),
(1, 2, 'Material de limpieza',  45.00, CURDATE()),
(1, 2, 'Gasoil furgoneta',      90.00, CURDATE());

INSERT INTO VENTA (idUsuario, baseImponible, totalIva, totalFinal) VALUES
(2, 38.01, 7.98, 45.99);

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(1, 1, 1, 45.99, 21.00, 45.99);