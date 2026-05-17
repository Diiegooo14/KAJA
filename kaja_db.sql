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
    email VARCHAR(100),
    logo_empresa VARCHAR(255)
);

CREATE TABLE USUARIO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idRol INT NOT NULL,
    idEmpresa INT NOT NULL,
    nif VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    imagen_perfil VARCHAR(255),
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    FOREIGN KEY (idRol) REFERENCES ROL(id) ON DELETE RESTRICT,
    FOREIGN KEY (idEmpresa) REFERENCES EMPRESA(id) ON DELETE RESTRICT
);

CREATE TABLE CATEGORIA (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idEmpresa INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    FOREIGN KEY (idEmpresa) REFERENCES EMPRESA(id) ON DELETE RESTRICT
);

CREATE TABLE PRODUCTO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idCategoria INT NOT NULL,
    idEmpresa INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    precioCoste DECIMAL(10,2) NOT NULL,
    precioVenta DECIMAL(10,2) NOT NULL,
    iva DECIMAL(5,2) NOT NULL DEFAULT 21.00,
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

INSERT INTO CATEGORIA (idEmpresa, nombre, descripcion) VALUES
(1, 'Herramienta Eléctrica', 'Taladros, sierras, radiales'),
(1, 'Tornillería', 'Cajas de tornillos, clavos'),
(1, 'Electricidad', 'Cables, enchufes, bombillas'),
(1, 'Ropa de Trabajo', 'EPIs, botas, guantes');

INSERT INTO PRODUCTO (idCategoria, idEmpresa, nombre, precioCoste, precioVenta, stock) VALUES
(1, 1, 'Taladro Percutor 500W', 35.00, 45.99, 12),
(1, 1, 'Sierra Circular Pro', 80.00, 115.50, 5),
(1, 1, 'Amoladora Angular 115mm', 28.00, 42.99, 8),
(1, 1, 'Lijadora Orbital 200W', 22.00, 34.50, 10),
(1, 1, 'Atornillador a Batería 18V', 45.00, 69.99, 6),
(1, 1, 'Caladora de Vaivén 450W', 38.00, 57.50, 7),
(1, 1, 'Compresor de Aire 24L', 90.00, 139.99, 3),
(2, 1, 'Caja Tornillos Madera 4x40', 1.50, 3.20, 50),
(2, 1, 'Caja Tornillos Metal 3x20', 1.20, 2.80, 60),
(2, 1, 'Caja Tornillos Aglomerado 5x50', 1.80, 3.70, 40),
(2, 1, 'Caja Clavos Acero 40mm', 2.00, 3.90, 35),
(2, 1, 'Surtido Tuercas y Arandelas M6', 3.50, 6.50, 25),
(2, 1, 'Varilla Roscada M8 1m', 1.90, 3.50, 30),
(2, 1, 'Caja Pernos Hexagonales M10', 4.00, 7.20, 20),
(2, 1, 'Taco de Expansión 8mm (100u)', 2.50, 4.90, 45),
(3, 1, 'Rollo Cable Cobre 1.5mm', 15.00, 24.99, 10),
(3, 1, 'Enchufe Superficie Doble', 2.50, 4.50, 30),
(3, 1, 'Bombilla LED E27 10W', 4.00, 7.50, 45),
(3, 1, 'Bombilla LED GU10 7W', 3.50, 6.50, 40),
(3, 1, 'Interruptor Simple Superficie', 1.80, 3.50, 25),
(3, 1, 'Caja Empotrar Cuadrada', 0.90, 1.80, 50),
(3, 1, 'Tubo Corrugado Eléctrico 16mm (50m)', 8.00, 14.50, 15),
(3, 1, 'Cuadro Eléctrico 12 Módulos', 18.00, 29.99, 8),
(4, 1, 'Pantalón Multibolsillos Talla L', 12.00, 22.50, 15),
(4, 1, 'Botas de Seguridad S3 Talla 42', 25.00, 45.00, 8),
(4, 1, 'Chaleco Reflectante Alta Visibilidad', 5.00, 9.50, 20),
(4, 1, 'Guantes de Trabajo Talla L', 3.00, 5.90, 35),
(4, 1, 'Casco de Seguridad ABS', 7.00, 13.50, 18),
(4, 1, 'Gafas Protectoras Antipimpacto', 4.50, 8.90, 22),
(4, 1, 'Chaqueta de Trabajo Talla L', 18.00, 32.00, 10),
(4, 1, 'Rodilleras Profesionales', 6.00, 11.50, 14);

INSERT INTO TIPO_GASTO (nombreTipo) VALUES ('Fijo'), ('Variable'), ('Nómina');

INSERT INTO GASTO (idUsuario, idEmpresa, idTipoGasto, concepto, importe, fechaRegistro) VALUES
(1, 1, 1, 'Alquiler local', 800.00, DATE_FORMAT(NOW(), '%Y-%m-01')),
(1, 1, 1, 'Cuota Internet y Teléfono', 45.00, DATE_FORMAT(NOW(), '%Y-%m-05')),
(1, 1, 2, 'Campaña Publicidad Facebook', 60.00, DATE_FORMAT(NOW(), '%Y-%m-15'));

INSERT INTO VENTA (idUsuario, fecha, baseImponible, totalIva, totalFinal) VALUES
(2, DATE_SUB(NOW(), INTERVAL 2 DAY), 55.78, 11.72, 67.50), 
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), 13.64, 2.86, 16.50),  
(2, NOW(), 133.46, 28.03, 161.49);                         

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(1, 7, 1, 22.50, 21.00, 22.50),
(1, 8, 1, 45.00, 21.00, 45.00);

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(2, 5, 2, 4.50, 21.00, 9.00),
(2, 6, 1, 7.50, 21.00, 7.50);

INSERT INTO DETALLE_VENTA (idVenta, idProducto, cantidad, precioVentaHistorico, ivaAplicado, subtotal) VALUES
(3, 1, 1, 45.99, 21.00, 45.99),
(3, 2, 1, 115.50, 21.00, 115.50);