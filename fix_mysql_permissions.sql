-- ============================================================
-- SCRIPT: Corregir permisos de usuario MySQL para PROFARNOVA
-- Ejecutar como: sudo mysql < fix_mysql_permissions.sql
-- O conectado como administrador de MySQL
-- ============================================================

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS profarno_ecommerce
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Crear el usuario si no existe (ignorar error si ya existe)
CREATE USER IF NOT EXISTS 'profarno_usr'@'localhost' IDENTIFIED BY 'Profarnova2026!';
CREATE USER IF NOT EXISTS 'profarno_usr'@'127.0.0.1' IDENTIFIED BY 'Profarnova2026!';

-- 3. Otorgar todos los privilegios sobre la base de datos
GRANT ALL PRIVILEGES ON profarno_ecommerce.* TO 'profarno_usr'@'localhost';
GRANT ALL PRIVILEGES ON profarno_ecommerce.* TO 'profarno_usr'@'127.0.0.1';

-- 4. Aplicar los cambios
FLUSH PRIVILEGES;

-- 5. Verificar
SELECT user, host FROM mysql.user WHERE user = 'profarno_usr';
SHOW GRANTS FOR 'profarno_usr'@'localhost';
