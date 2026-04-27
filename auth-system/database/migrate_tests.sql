-- Online Test System migration
-- Run ONCE against your existing vidnotes_auth database.
USE vidnotes_auth;

-- ── Tests ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
  id         INT NOT NULL AUTO_INCREMENT,
  title      VARCHAR(255) NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  duration   INT NOT NULL DEFAULT 30,        -- minutes
  status     ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_test_subject (subject_id),
  INDEX idx_test_teacher (teacher_id),
  CONSTRAINT fk_test_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Test Questions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_questions (
  id             INT NOT NULL AUTO_INCREMENT,
  test_id        INT NOT NULL,
  question       TEXT NOT NULL,
  type           ENUM('mcq','true_false') NOT NULL DEFAULT 'mcq',
  options        JSON,                        -- array of strings for MCQ
  correct_answer VARCHAR(500) NOT NULL,
  marks          INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  INDEX idx_tq_test (test_id),
  CONSTRAINT fk_tq_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Test Attempts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_attempts (
  id           INT NOT NULL AUTO_INCREMENT,
  test_id      INT NOT NULL,
  student_id   INT NOT NULL,
  started_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  score        INT NOT NULL DEFAULT 0,
  total_marks  INT NOT NULL DEFAULT 0,
  status       ENUM('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt (test_id, student_id),
  INDEX idx_ta_test    (test_id),
  INDEX idx_ta_student (student_id),
  CONSTRAINT fk_ta_test    FOREIGN KEY (test_id)    REFERENCES tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Test Answers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_answers (
  id             INT NOT NULL AUTO_INCREMENT,
  attempt_id     INT NOT NULL,
  question_id    INT NOT NULL,
  student_answer TEXT,
  is_correct     TINYINT(1) NOT NULL DEFAULT 0,
  marks_awarded  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_ans_attempt  (attempt_id),
  INDEX idx_ans_question (question_id),
  CONSTRAINT fk_ans_attempt  FOREIGN KEY (attempt_id)  REFERENCES test_attempts(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
