-- Skema Database StudyTrack untuk MySQL
-- File ini bisa langsung di-import di phpMyAdmin atau dijalankan otomatis oleh backend

CREATE DATABASE IF NOT EXISTS `studytrack_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `studytrack_db`;

-- 1. TABEL PENGGUNA
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL DEFAULT '',
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `avatar` MEDIUMTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABEL TUGAS KULIAH
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `course` VARCHAR(100) NOT NULL DEFAULT '',
  `date` DATE NOT NULL,
  `prio` ENUM('Tinggi', 'Sedang', 'Rendah') NOT NULL DEFAULT 'Sedang',
  `notes` TEXT NULL,
  `done` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. TABEL RENCANA BELAJAR HARIAN
CREATE TABLE IF NOT EXISTS `plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `min` INT NOT NULL DEFAULT 0,
  `done` TINYINT(1) NOT NULL DEFAULT 0,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. PENGATURAN NOTIFIKASI PER PENGGUNA
CREATE TABLE IF NOT EXISTS `notif_settings` (
  `user_id` INT PRIMARY KEY,
  `email_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `wa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `to_email` VARCHAR(100) NOT NULL DEFAULT '',
  `to_phone` VARCHAR(30) NOT NULL DEFAULT '',
  `reminder_days` VARCHAR(50) NOT NULL DEFAULT '7,3,1',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. TABEL KHUSUS NOTIFIKASI EMAIL
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NULL,
  `to_email` VARCHAR(100) NOT NULL,
  `task_name` VARCHAR(255) NOT NULL,
  `h_days` INT NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `status` ENUM('Tertunda', 'Berhasil', 'Gagal', 'Tidak Terkirim') NOT NULL DEFAULT 'Tertunda',
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. TABEL KHUSUS NOTIFIKASI WHATSAPP
CREATE TABLE IF NOT EXISTS `wa_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NULL,
  `to_phone` VARCHAR(30) NOT NULL,
  `task_name` VARCHAR(255) NOT NULL,
  `h_days` INT NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `status` ENUM('Tertunda', 'Berhasil', 'Gagal', 'Tidak Terkirim') NOT NULL DEFAULT 'Tertunda',
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. TABEL SESI LOGIN
CREATE TABLE IF NOT EXISTS `sessions` (
  `token` VARCHAR(100) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
