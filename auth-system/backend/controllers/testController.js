const db = require('../config/db');

// ════════════════════════════════════════════════════════════
//  TEACHER  ENDPOINTS
// ════════════════════════════════════════════════════════════

// POST /api/teacher/tests
exports.createTest = async (req, res, next) => {
  try {
    const { title, subject_id, duration } = req.body;
    if (!title || !subject_id || !duration) {
      return res.status(400).json({ message: 'Title, subject, and duration are required' });
    }
    const [result] = await db.query(
      'INSERT INTO tests (title, subject_id, teacher_id, duration) VALUES (?, ?, ?, ?)',
      [title.trim(), Number(subject_id), req.user.id, Number(duration)]
    );
    return res.status(201).json({ message: 'Test created', test_id: result.insertId });
  } catch (err) { next(err); }
};

// GET /api/teacher/tests
exports.getTeacherTests = async (req, res, next) => {
  try {
    const [tests] = await db.query(
      `SELECT t.id, t.title, t.duration, t.status, t.created_at,
              s.name AS subject_name,
              COUNT(DISTINCT tq.id)                              AS question_count,
              COALESCE(SUM(tq.marks), 0)                        AS total_marks,
              COUNT(DISTINCT CASE WHEN ta.status='submitted' THEN ta.id END) AS attempt_count
       FROM   tests t
       LEFT JOIN subjects       s  ON s.id  = t.subject_id
       LEFT JOIN test_questions tq ON tq.test_id = t.id
       LEFT JOIN test_attempts  ta ON ta.test_id = t.id
       WHERE  t.teacher_id = ?
       GROUP  BY t.id
       ORDER  BY t.created_at DESC`,
      [req.user.id]
    );
    return res.json({ tests });
  } catch (err) { next(err); }
};

// GET /api/teacher/tests/:testId/questions
exports.getTestQuestions = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const [own] = await db.query(
      'SELECT id FROM tests WHERE id = ? AND teacher_id = ?',
      [Number(testId), req.user.id]
    );
    if (!own.length) return res.status(404).json({ message: 'Test not found' });

    const [questions] = await db.query(
      'SELECT id, question, type, options, correct_answer, marks FROM test_questions WHERE test_id = ? ORDER BY id',
      [Number(testId)]
    );
    return res.json({
      questions: questions.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : [] }))
    });
  } catch (err) { next(err); }
};

// POST /api/teacher/tests/:testId/questions
exports.addQuestion = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { question, type, options, correct_answer, marks } = req.body;

    if (!question || !type || !correct_answer) {
      return res.status(400).json({ message: 'question, type, and correct_answer are required' });
    }

    const [own] = await db.query(
      'SELECT id, status FROM tests WHERE id = ? AND teacher_id = ?',
      [Number(testId), req.user.id]
    );
    if (!own.length)            return res.status(404).json({ message: 'Test not found' });
    if (own[0].status === 'closed') return res.status(400).json({ message: 'Cannot modify a closed test' });

    const optJson = (type === 'mcq' && Array.isArray(options) && options.length)
      ? JSON.stringify(options) : null;

    const [result] = await db.query(
      'INSERT INTO test_questions (test_id, question, type, options, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?)',
      [Number(testId), question.trim(), type, optJson, correct_answer.trim(), Number(marks) || 1]
    );
    return res.status(201).json({ message: 'Question added', question_id: result.insertId });
  } catch (err) { next(err); }
};

// DELETE /api/teacher/questions/:questionId
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const [rows] = await db.query(
      `SELECT tq.id FROM test_questions tq
       JOIN tests t ON t.id = tq.test_id
       WHERE tq.id = ? AND t.teacher_id = ?`,
      [Number(questionId), req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Question not found' });
    await db.query('DELETE FROM test_questions WHERE id = ?', [Number(questionId)]);
    return res.json({ message: 'Question deleted' });
  } catch (err) { next(err); }
};

// PATCH /api/teacher/tests/:testId/publish
exports.publishTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM test_questions WHERE test_id = ?',
      [Number(testId)]
    );
    if (cnt === 0) return res.status(400).json({ message: 'Add at least one question before publishing' });

    await db.query(
      "UPDATE tests SET status = 'active' WHERE id = ? AND teacher_id = ?",
      [Number(testId), req.user.id]
    );

    // Notify enrolled students
    const [[test]] = await db.query('SELECT title, subject_id FROM tests WHERE id = ?', [Number(testId)]);
    const [enrolled] = await db.query(
      'SELECT user_id FROM user_subjects WHERE subject_id = ?',
      [test.subject_id]
    );
    if (enrolled.length) {
      const rows = enrolled.map(e => [e.user_id, `New test available: "${test.title}"`, 'test']);
      await db.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [rows]);
    }

    return res.json({ message: 'Test published' });
  } catch (err) { next(err); }
};

// PATCH /api/teacher/tests/:testId/close
exports.closeTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    await db.query(
      "UPDATE tests SET status = 'closed' WHERE id = ? AND teacher_id = ?",
      [Number(testId), req.user.id]
    );
    return res.json({ message: 'Test closed' });
  } catch (err) { next(err); }
};

// GET /api/teacher/tests/:testId/results
exports.getTestResults = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const [own] = await db.query(
      `SELECT t.id, t.title, s.name AS subject_name
       FROM tests t LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE t.id = ? AND t.teacher_id = ?`,
      [Number(testId), req.user.id]
    );
    if (!own.length) return res.status(404).json({ message: 'Test not found' });

    const [attempts] = await db.query(
      `SELECT ta.score, ta.total_marks, ta.submitted_at, ta.status,
              u.name AS student_name, u.email AS student_email
       FROM test_attempts ta
       JOIN users u ON u.id = ta.student_id
       WHERE ta.test_id = ?
       ORDER BY ta.submitted_at DESC`,
      [Number(testId)]
    );
    return res.json({ test: own[0], attempts });
  } catch (err) { next(err); }
};


// ════════════════════════════════════════════════════════════
//  STUDENT  ENDPOINTS
// ════════════════════════════════════════════════════════════

// GET /api/student/tests
exports.getStudentTests = async (req, res, next) => {
  try {
    const [subs] = await db.query(
      'SELECT subject_id FROM user_subjects WHERE user_id = ?',
      [req.user.id]
    );
    const subjectIds = subs.map(r => r.subject_id);
    if (!subjectIds.length) return res.json({ tests: [] });

    const [tests] = await db.query(
      `SELECT t.id, t.title, t.duration, t.status, t.created_at,
              s.name AS subject_name,
              COUNT(tq.id)          AS question_count,
              COALESCE(SUM(tq.marks),0) AS total_marks,
              ta.status AS attempt_status,
              ta.score,
              ta.total_marks AS attempt_total,
              ta.submitted_at
       FROM tests t
       LEFT JOIN subjects       s  ON s.id  = t.subject_id
       LEFT JOIN test_questions tq ON tq.test_id = t.id
       LEFT JOIN test_attempts  ta ON ta.test_id = t.id AND ta.student_id = ?
       WHERE t.subject_id IN (?) AND t.status IN ('active','closed')
       GROUP BY t.id, ta.id
       ORDER BY t.created_at DESC`,
      [req.user.id, subjectIds]
    );
    return res.json({ tests });
  } catch (err) { next(err); }
};

// GET /api/student/tests/:testId/start
exports.startTest = async (req, res, next) => {
  try {
    const { testId } = req.params;

    const [rows] = await db.query(
      `SELECT t.id, t.title, t.duration, t.status, s.name AS subject_name
       FROM tests t LEFT JOIN subjects s ON s.id = t.subject_id WHERE t.id = ?`,
      [Number(testId)]
    );
    if (!rows.length)           return res.status(404).json({ message: 'Test not found' });
    if (rows[0].status === 'draft') return res.status(403).json({ message: 'Test not published yet' });

    const test = rows[0];

    const [existing] = await db.query(
      'SELECT id, status FROM test_attempts WHERE test_id = ? AND student_id = ?',
      [Number(testId), req.user.id]
    );
    if (existing.length && existing[0].status === 'submitted') {
      return res.status(400).json({ message: 'You already submitted this test', already_submitted: true });
    }
    if (!existing.length) {
      await db.query(
        'INSERT INTO test_attempts (test_id, student_id) VALUES (?, ?)',
        [Number(testId), req.user.id]
      );
    }

    const [questions] = await db.query(
      'SELECT id, question, type, options, marks FROM test_questions WHERE test_id = ? ORDER BY id',
      [Number(testId)]
    );
    return res.json({
      test,
      questions: questions.map(q => ({ ...q, options: q.options ? JSON.parse(q.options) : [] }))
    });
  } catch (err) { next(err); }
};

// POST /api/student/tests/:testId/submit
exports.submitTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'answers array is required' });
    }

    const [attempts] = await db.query(
      'SELECT id, status FROM test_attempts WHERE test_id = ? AND student_id = ?',
      [Number(testId), req.user.id]
    );
    if (!attempts.length)               return res.status(404).json({ message: 'Start the test first' });
    if (attempts[0].status === 'submitted') return res.status(400).json({ message: 'Already submitted' });

    const attemptId = attempts[0].id;

    const [questions] = await db.query(
      'SELECT id, correct_answer, marks FROM test_questions WHERE test_id = ?',
      [Number(testId)]
    );

    let score = 0, totalMarks = 0;
    const rows = [];

    for (const q of questions) {
      totalMarks += q.marks;
      const ans = answers.find(a => Number(a.question_id) === q.id);
      const given   = ans ? String(ans.student_answer).trim() : '';
      const correct = given.toLowerCase() === q.correct_answer.toLowerCase() ? 1 : 0;
      const awarded = correct ? q.marks : 0;
      score += awarded;
      rows.push([attemptId, q.id, given, correct, awarded]);
    }

    if (rows.length) {
      await db.query(
        'INSERT INTO test_answers (attempt_id, question_id, student_answer, is_correct, marks_awarded) VALUES ?',
        [rows]
      );
    }
    await db.query(
      "UPDATE test_attempts SET status='submitted', submitted_at=NOW(), score=?, total_marks=? WHERE id=?",
      [score, totalMarks, attemptId]
    );

    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    return res.json({ message: 'Test submitted', score, total_marks: totalMarks, percentage: pct });
  } catch (err) { next(err); }
};

// GET /api/student/tests/:testId/result
exports.getStudentResult = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const [attempts] = await db.query(
      "SELECT id, score, total_marks, submitted_at FROM test_attempts WHERE test_id=? AND student_id=? AND status='submitted'",
      [Number(testId), req.user.id]
    );
    if (!attempts.length) return res.status(404).json({ message: 'No submitted attempt found' });

    const att = attempts[0];
    const [answers] = await db.query(
      `SELECT ta.student_answer, ta.is_correct, ta.marks_awarded,
              tq.question, tq.type, tq.options, tq.correct_answer, tq.marks
       FROM test_answers ta
       JOIN test_questions tq ON tq.id = ta.question_id
       WHERE ta.attempt_id = ?
       ORDER BY tq.id`,
      [att.id]
    );

    return res.json({
      score:        att.score,
      total_marks:  att.total_marks,
      percentage:   att.total_marks > 0 ? Math.round((att.score / att.total_marks) * 100) : 0,
      submitted_at: att.submitted_at,
      answers:      answers.map(a => ({ ...a, options: a.options ? JSON.parse(a.options) : [] }))
    });
  } catch (err) { next(err); }
};
