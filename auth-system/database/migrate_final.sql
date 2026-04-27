-- Final feature additions — run ONCE against vidnotes_auth
USE vidnotes_auth;

-- Study plans (one saved plan per student, replaced on regenerate)
CREATE TABLE IF NOT EXISTS study_plans (
  id           INT NOT NULL AUTO_INCREMENT,
  student_id   INT NOT NULL,
  plan_json    JSON NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_plan (student_id),
  CONSTRAINT fk_sp_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         INT NOT NULL AUTO_INCREMENT,
  user_id    INT NOT NULL,
  message    VARCHAR(500) NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_user (user_id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
