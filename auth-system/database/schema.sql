-- VidNotes AI Auth System — Database Schema
-- Run this against your MySQL instance before starting the backend.

CREATE DATABASE IF NOT EXISTS vidnotes_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vidnotes_auth;

-- ─────────────────────────────────────────────
-- Users Table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT           NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,              -- bcrypt hash
  role       ENUM('student','teacher') NOT NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Study Materials Table  (used by teacher upload — future feature)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id           INT           NOT NULL AUTO_INCREMENT,
  title        VARCHAR(255)  NOT NULL,
  file_name    VARCHAR(255)  NOT NULL,
  file_path    VARCHAR(500)  NOT NULL,
  uploaded_by  INT           NOT NULL,            -- FK → users.id (teacher)
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_uploaded_by (uploaded_by),
  CONSTRAINT fk_materials_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Seed: demo teacher + student accounts
-- Passwords are bcrypt hashes of "password123"
-- ─────────────────────────────────────────────
INSERT IGNORE INTO users (name, email, password, role) VALUES
  ('Demo Teacher', 'teacher@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oJHf6V9eW', 'teacher'),
  ('Demo Student', 'student@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oJHf6V9eW', 'student');

-- Seed: one sample material linked to the demo teacher (id=1)
INSERT IGNORE INTO materials (title, file_name, file_path, uploaded_by) VALUES
  ('Introduction to Machine Learning', 'ml_intro.pdf', 'uploads/ml_intro.pdf', 1);
