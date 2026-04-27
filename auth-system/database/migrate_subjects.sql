-- Subject-based filtering migration
-- Run ONCE against your existing vidnotes_auth database.
USE vidnotes_auth;

-- ── 1. Subjects lookup table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id   INT          NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Many-to-many: users ↔ subjects ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subjects (
  id         INT NOT NULL AUTO_INCREMENT,
  user_id    INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_subject (user_id, subject_id),
  INDEX idx_us_user    (user_id),
  INDEX idx_us_subject (subject_id),
  CONSTRAINT fk_us_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_us_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Add subject_id to materials ────────────────────────────────────────
-- Skip this block if you already ran the migration (will error on duplicate column).
ALTER TABLE materials
  ADD COLUMN  subject_id INT NULL AFTER uploaded_by,
  ADD INDEX   idx_mat_subject (subject_id),
  ADD CONSTRAINT fk_mat_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL;

-- ── 4. Seed subjects ───────────────────────────────────────────────────────
INSERT IGNORE INTO subjects (name) VALUES
  ('Biology'),
  ('Chemistry'),
  ('Computer Science'),
  ('Data Structures'),
  ('Database Management'),
  ('English Literature'),
  ('Machine Learning'),
  ('Mathematics'),
  ('Physics'),
  ('Web Development');

-- ── 5. Enrol demo accounts in 3 subjects each ─────────────────────────────
INSERT IGNORE INTO user_subjects (user_id, subject_id)
SELECT u.id, s.id
FROM   users u
JOIN   subjects s ON s.name IN ('Computer Science','Machine Learning','Data Structures')
WHERE  u.email = 'student@demo.com';

INSERT IGNORE INTO user_subjects (user_id, subject_id)
SELECT u.id, s.id
FROM   users u
JOIN   subjects s ON s.name IN ('Computer Science','Machine Learning','Data Structures')
WHERE  u.email = 'teacher@demo.com';

-- ── 6. Tag existing seed material ─────────────────────────────────────────
UPDATE materials m
JOIN   subjects s ON s.name = 'Machine Learning'
SET    m.subject_id = s.id
WHERE  m.title = 'Introduction to Machine Learning'
  AND  m.subject_id IS NULL;
