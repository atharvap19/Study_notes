const API = '';

/* ── Auth guard ─────────────────────────────────────────────────────────── */
(function () {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token || role !== 'teacher') {
    window.location.href = '/login';
  }
})();

/* ── Authenticated fetch helper ─────────────────────────────────────────── */
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

/* ── Sidebar section switcher ───────────────────────────────────────────── */
function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');

  document.querySelectorAll('[id^="section-"]').forEach(s => (s.style.display = 'none'));
  const sec = document.getElementById(`section-${name}`);
  if (sec) sec.style.display = '';

  const titles = {
    overview:  ['Teacher Dashboard', 'Manage your classroom'],
    materials: ['Study Materials',   'Upload and manage files'],
    tests:     ['Tests',             'Create and manage tests'],
    students:  ['Students',          'Performance Analytics'],
  };
  const [title, sub] = titles[name] || [name, ''];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent   = sub;

  if (name === 'tests')    loadTeacherTests();
  if (name === 'students') loadTeacherAnalytics();
  if (name === 'subjects') loadSubjects();
}

/* ── Logout ─────────────────────────────────────────────────────────────── */
function logout() {
  localStorage.clear();
  window.location.href = '/login';
}

/* ── Load dashboard data ────────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const res  = await authFetch(`${API}/api/teacher/dashboard`);
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    if (!res.ok) throw new Error(data.message || 'Failed to load dashboard');

    const { user, total_materials, total_students } = data;
    document.getElementById('sidebar-name').textContent   = user.name;
    document.getElementById('sidebar-avatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('welcome-name').textContent   = user.name.split(' ')[0];
    document.getElementById('stat-materials').textContent = total_materials;
    document.getElementById('stat-students').textContent  = total_students;
  } catch (err) {
    const al = document.getElementById('alert-main');
    al.textContent = err.message;
    al.className   = 'alert alert-error show';
  }
}

/* ── Load subject dropdown ──────────────────────────────────────────────── */
async function loadSubjectDropdown() {
  try {
    const res  = await fetch(`${API}/api/subjects`);
    const data = await res.json();
    const subjects = data.subjects || [];
    ['upload-subject', 'test-subject'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1); // clear except placeholder
      subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = s.id;
        opt.textContent = s.name;
        sel.appendChild(opt);
      });
    });
  } catch (_) {}
}

/* ── Load uploaded materials list ───────────────────────────────────────── */
async function loadMaterials() {
  try {
    const res  = await authFetch(`${API}/api/teacher/materials`);
    const data = await res.json();
    if (!res.ok) return;

    const list  = data.materials || [];
    const badge = document.getElementById('upload-count');
    const grid  = document.getElementById('uploaded-list');
    if (!badge || !grid) return;

    badge.textContent = `${list.length} file${list.length !== 1 ? 's' : ''}`;

    if (!list.length) {
      grid.innerHTML = '<p style="color:var(--clr-muted);font-size:0.85rem">No files uploaded yet.</p>';
      return;
    }

    // Group by subject
    const groups = {};
    list.forEach(m => {
      const key = m.subject_name || 'No Subject';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    const icons = { pdf: '📕', pptx: '📊', docx: '📄', xlsx: '📗' };

    grid.innerHTML = Object.entries(groups).map(([subject, items]) => `
      <div class="subject-group">
        <div class="subject-group-header">
          <span class="subject-group-title">📂 ${escHtml(subject)}</span>
          <span class="badge">${items.length} file${items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="materials-grid">
          ${items.map(m => {
            const ext  = m.file_name.split('.').pop().toLowerCase();
            const icon = icons[ext] || '📁';
            return `
              <div class="material-card">
                <div class="file-icon">${icon}</div>
                <div class="file-title">${escHtml(m.title)}</div>
                <div class="file-meta">${escHtml(m.file_name)}</div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  } catch (_) {}
}

/* ── Upload handler ─────────────────────────────────────────────────────── */
async function handleUpload(e) {
  e.preventDefault();
  const btn        = document.getElementById('btn-upload');
  const alert      = document.getElementById('upload-alert');
  const title      = document.getElementById('upload-title').value.trim();
  const subject_id = document.getElementById('upload-subject').value;
  const file       = document.getElementById('upload-file').files[0];

  if (!title || !subject_id || !file) {
    alert.textContent = 'Please fill in all fields and select a file.';
    alert.className   = 'alert alert-error show';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Uploading…';
  alert.classList.remove('show');

  const form = new FormData();
  form.append('title',      title);
  form.append('subject_id', subject_id);
  form.append('file',       file);

  try {
    const token = localStorage.getItem('token');
    const res   = await fetch(`${API}/api/teacher/upload-material`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Upload failed');

    alert.textContent = `✅ "${title}" uploaded successfully!`;
    alert.className   = 'alert alert-success show';
    document.getElementById('upload-form').reset();

    loadMaterials();
    loadDashboard();
  } catch (err) {
    alert.textContent = err.message;
    alert.className   = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload';
  }
}

/* ── XSS helper ─────────────────────────────────────────────────────────── */
function escHtml(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(str = '') {
  return String(str).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════════════════════════
   TESTS — teacher side
══════════════════════════════════════════════════════════════════════════ */

let _activeTestId = null;

async function loadTeacherTests() {
  const list = document.getElementById('tests-list');
  if (!list) return;
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading tests…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/teacher/tests`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load tests');

    const tests = data.tests || [];
    const statEl = document.getElementById('stat-tests');
    if (statEl) statEl.textContent = tests.length;

    if (!tests.length) {
      list.innerHTML = `
        <div class="placeholder-box">
          <div class="ph-icon">📝</div>
          <h3>No tests yet</h3>
          <p>Click <strong>+ Create Test</strong> to get started.</p>
        </div>`;
      return;
    }

    const statusBadge = s => ({
      draft:  '<span class="test-status draft">Draft</span>',
      active: '<span class="test-status active">Active</span>',
      closed: '<span class="test-status closed">Closed</span>',
    }[s] || s);

    list.innerHTML = tests.map(t => `
      <div class="test-card">
        <div class="test-card-header">
          <div>
            <div class="test-card-title">${escHtml(t.title)}</div>
            <div class="test-card-meta">${escHtml(t.subject_name)} &bull; ${t.duration} min &bull; ${t.question_count} question${t.question_count !== 1 ? 's' : ''} &bull; ${t.total_marks} mark${t.total_marks !== 1 ? 's' : ''}</div>
          </div>
          ${statusBadge(t.status)}
        </div>
        <div class="test-card-actions">
          <button class="btn btn-ghost" onclick="manageTest(${t.id})">⚙ Questions</button>
          ${t.status === 'draft'  ? `<button class="btn btn-accent" style="font-size:0.82rem" onclick="publishTest(${t.id})">▶ Publish</button>` : ''}
          ${t.status === 'active' ? `<button class="btn btn-ghost"  onclick="closeTestAction(${t.id})">⏹ Close</button>` : ''}
          <button class="btn btn-ghost" onclick="viewResults(${t.id})">📊 Results (${t.attempt_count})</button>
        </div>
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

function toggleCreateForm() {
  const panel = document.getElementById('create-test-panel');
  panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

async function handleCreateTest(e) {
  e.preventDefault();
  const btn       = document.getElementById('btn-create-test');
  const alertEl   = document.getElementById('create-test-alert');
  const title     = document.getElementById('test-title').value.trim();
  const subjectId = document.getElementById('test-subject').value;
  const duration  = document.getElementById('test-duration').value;

  alertEl.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating…';

  try {
    const res  = await authFetch(`${API}/api/teacher/tests`, {
      method: 'POST',
      body:   JSON.stringify({ title, subject_id: Number(subjectId), duration: Number(duration) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create test');

    alertEl.textContent = '✅ Test created!';
    alertEl.className   = 'alert alert-success show';
    document.getElementById('create-test-form').reset();
    setTimeout(() => { toggleCreateForm(); alertEl.classList.remove('show'); }, 1200);
    loadTeacherTests();
  } catch (err) {
    alertEl.textContent = err.message;
    alertEl.className   = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Test';
  }
}

async function manageTest(testId) {
  _activeTestId = testId;
  const mgr = document.getElementById('question-manager');
  mgr.style.display = '';
  mgr.scrollIntoView({ behavior: 'smooth' });
  await loadQuestions(testId);
}

async function loadQuestions(testId) {
  const list    = document.getElementById('questions-list');
  const alertEl = document.getElementById('qm-alert');
  alertEl.classList.remove('show');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/teacher/tests/${testId}/questions`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load questions');

    const questions = data.questions || [];
    if (!questions.length) {
      list.innerHTML = '<p style="color:var(--clr-muted);font-size:0.85rem;padding:0.5rem 0">No questions added yet.</p>';
      return;
    }

    list.innerHTML = questions.map((q, i) => {
      const optsHtml = q.type === 'mcq' && q.options.length
        ? `<div class="q-opts">${q.options.map(o => `<span class="q-opt ${o === q.correct_answer ? 'correct' : ''}">${escHtml(o)}</span>`).join('')}</div>`
        : `<div class="q-opts"><span class="q-opt correct">${escHtml(q.correct_answer)}</span></div>`;
      return `
        <div class="question-row">
          <div class="q-meta">Q${i + 1} &bull; ${q.type === 'mcq' ? 'MCQ' : 'True/False'} &bull; ${q.marks} mark${q.marks !== 1 ? 's' : ''}</div>
          <div class="q-text">${escHtml(q.question)}</div>
          ${optsHtml}
          <button class="btn btn-ghost"
            style="margin-top:0.5rem;font-size:0.78rem;color:var(--clr-danger);border-color:var(--clr-danger)"
            onclick="deleteQuestion(${q.id})">🗑 Delete</button>
        </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

function closeQuestionManager() {
  document.getElementById('question-manager').style.display = 'none';
  _activeTestId = null;
}

function onQTypeChange(val) {
  document.getElementById('mcq-options-group').style.display = val === 'mcq'        ? '' : 'none';
  document.getElementById('tf-options-group').style.display  = val === 'true_false' ? '' : 'none';
}

async function handleAddQuestion(e) {
  e.preventDefault();
  if (!_activeTestId) return;

  const btn      = document.getElementById('btn-add-q');
  const alertEl  = document.getElementById('qm-alert');
  const type     = document.getElementById('q-type').value;
  const question = document.getElementById('q-text').value.trim();
  const marks    = Number(document.getElementById('q-marks').value) || 1;

  let correct_answer, options = [];
  if (type === 'mcq') {
    options = Array.from(document.querySelectorAll('.mcq-opt')).map(i => i.value.trim()).filter(Boolean);
    correct_answer = document.getElementById('q-correct-mcq').value.trim();
    if (!options.length || !correct_answer) {
      alertEl.textContent = 'Please fill in options and the correct answer.';
      alertEl.className   = 'alert alert-error show';
      return;
    }
  } else {
    correct_answer = document.getElementById('q-correct-tf').value;
  }

  alertEl.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Adding…';

  try {
    const res  = await authFetch(`${API}/api/teacher/tests/${_activeTestId}/questions`, {
      method: 'POST',
      body:   JSON.stringify({ question, type, options, correct_answer, marks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add question');

    alertEl.textContent = '✅ Question added!';
    alertEl.className   = 'alert alert-success show';
    document.getElementById('add-question-form').reset();
    onQTypeChange('mcq');
    setTimeout(() => alertEl.classList.remove('show'), 2000);
    loadQuestions(_activeTestId);
    loadTeacherTests();
  } catch (err) {
    alertEl.textContent = err.message;
    alertEl.className   = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Question';
  }
}

async function deleteQuestion(questionId) {
  if (!confirm('Delete this question?')) return;
  try {
    const res  = await authFetch(`${API}/api/teacher/questions/${questionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Delete failed');
    loadQuestions(_activeTestId);
    loadTeacherTests();
  } catch (err) { alert(err.message); }
}

async function publishTest(testId) {
  if (!confirm('Publish this test? Students will be able to take it.')) return;
  try {
    const res  = await authFetch(`${API}/api/teacher/tests/${testId}/publish`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Publish failed');
    loadTeacherTests();
  } catch (err) { alert(err.message); }
}

async function closeTestAction(testId) {
  if (!confirm('Close this test? No more submissions will be accepted.')) return;
  try {
    const res  = await authFetch(`${API}/api/teacher/tests/${testId}/close`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Close failed');
    loadTeacherTests();
  } catch (err) { alert(err.message); }
}

async function viewResults(testId) {
  try {
    const res  = await authFetch(`${API}/api/teacher/tests/${testId}/results`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load results');

    const { test, attempts } = data;
    let html = `
      <div class="results-overlay" id="results-overlay" onclick="if(event.target===this)closeResults()">
        <div class="results-modal">
          <div class="results-header">
            <h2>📊 Results — ${escHtml(test.title)}</h2>
            <button class="modal-close" onclick="closeResults()">✕</button>
          </div>
          <div class="results-body">`;

    if (!attempts.length) {
      html += '<p style="color:var(--clr-muted)">No submissions yet.</p>';
    } else {
      const avg = attempts.reduce((s, a) => s + (a.total_marks > 0 ? (a.score / a.total_marks) * 100 : 0), 0) / attempts.length;
      html += `
        <p style="margin-bottom:1rem;font-size:0.85rem;color:var(--clr-muted)">${attempts.length} submission${attempts.length !== 1 ? 's' : ''} &bull; Avg: ${avg.toFixed(1)}%</p>
        <table class="results-table">
          <thead><tr><th>Student</th><th>Score</th><th>%</th><th>Submitted</th></tr></thead>
          <tbody>
            ${attempts.map(a => `
              <tr>
                <td>${escHtml(a.student_name)}<div style="font-size:0.75rem;color:var(--clr-muted)">${escHtml(a.student_email)}</div></td>
                <td>${a.score} / ${a.total_marks}</td>
                <td>${a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0}%</td>
                <td style="font-size:0.78rem;color:var(--clr-muted)">${a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    html += '</div></div></div>';
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
  } catch (err) { alert(err.message); }
}

function closeResults() {
  const el = document.getElementById('results-overlay');
  if (el) el.remove();
}

/* ══════════════════════════════════════════════════════════════════════════
   ANALYTICS — teacher side
══════════════════════════════════════════════════════════════════════════ */

async function loadTeacherAnalytics() {
  const root = document.getElementById('analytics-root');
  if (!root) return;
  root.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading analytics…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/teacher/analytics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load analytics');

    const { overall, test_stats, students } = data;
    const o = overall || {};

    root.innerHTML = `
      <!-- ── Overall stats ── -->
      <div class="stats-strip" style="margin-bottom:2rem">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--clr-primary)">${o.active_students ?? 0}</div>
          <div class="stat-label">Active Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--clr-accent)">${o.total_attempts ?? 0}</div>
          <div class="stat-label">Total Submissions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:${(o.avg_pct ?? 0) >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)'}">${o.avg_pct ?? '—'}%</div>
          <div class="stat-label">Class Average</div>
        </div>
      </div>

      <!-- ── Per-test stats ── -->
      ${test_stats.length ? `
        <div class="section-header"><span class="section-title">📝 Test Performance</span></div>
        <div class="analytics-table-wrap" style="margin-bottom:2rem">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Test</th><th>Subject</th><th>Status</th>
                <th>Attempts</th><th>Avg %</th><th>Top %</th><th>Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              ${test_stats.map(t => {
                const avg  = t.avg_pct ?? '—';
                const top  = t.top_pct ?? '—';
                const pass = t.attempts > 0 ? Math.round((t.passed / t.attempts) * 100) : 0;
                const col  = typeof avg === 'number' ? (avg >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)') : 'var(--clr-muted)';
                const statusBadge = { draft:'draft', active:'active', closed:'closed' }[t.status] || '';
                return `
                  <tr>
                    <td>${escHtml(t.title)}</td>
                    <td style="color:var(--clr-muted)">${escHtml(t.subject_name || '—')}</td>
                    <td><span class="test-status ${statusBadge}">${t.status}</span></td>
                    <td>${t.attempts}</td>
                    <td style="font-weight:700;color:${col}">${avg}${typeof avg === 'number' ? '%' : ''}</td>
                    <td>${top}${typeof top === 'number' ? '%' : ''}</td>
                    <td>${t.attempts > 0 ? pass + '%' : '—'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="placeholder-box" style="margin-bottom:2rem">
          <div class="ph-icon">📝</div>
          <h3>No test data yet</h3>
          <p>Create and publish tests to see performance stats.</p>
        </div>`}

      <!-- ── Student leaderboard ── -->
      <div class="section-header"><span class="section-title">👥 Student Overview</span></div>
      ${students.length ? `
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr><th>#</th><th>Student</th><th>Tests Taken</th><th>Avg Score</th><th>Marks Earned</th></tr>
            </thead>
            <tbody>
              ${students.map((s, i) => {
                const avg = s.avg_pct;
                const col = avg != null ? (avg >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)') : 'var(--clr-muted)';
                return `
                  <tr>
                    <td style="color:var(--clr-muted);font-size:0.82rem">${i + 1}</td>
                    <td>
                      <div style="font-weight:600">${escHtml(s.name)}</div>
                      <div style="font-size:0.75rem;color:var(--clr-muted)">${escHtml(s.email)}</div>
                    </td>
                    <td>${s.tests_taken || 0}</td>
                    <td style="font-weight:700;color:${col}">${avg != null ? avg + '%' : '—'}</td>
                    <td>${s.total_score != null ? s.total_score + ' / ' + s.total_available : '—'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="placeholder-box">
          <div class="ph-icon">👥</div>
          <h3>No students yet</h3>
          <p>Students will appear here once they register and take tests.</p>
        </div>`}
    `;
  } catch (err) {
    root.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   SUBJECT MANAGEMENT
══════════════════════════════════════════════════════════════════════════ */

async function loadSubjects() {
  const list = document.getElementById('subjects-list');
  if (!list) return;
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>';
  try {
    const res  = await fetch(`${API}/api/subjects`);
    const data = await res.json();
    const subjects = data.subjects || [];
    if (!subjects.length) {
      list.innerHTML = '<p style="color:var(--clr-muted);font-size:0.85rem">No subjects yet. Add one above.</p>';
      return;
    }
    list.innerHTML = `
      <div class="analytics-table-wrap">
        <table class="analytics-table">
          <thead><tr><th>Subject</th><th style="width:120px">Action</th></tr></thead>
          <tbody>
            ${subjects.map(s => `
              <tr>
                <td style="font-weight:600">${escHtml(s.name)}</td>
                <td>
                  <button class="btn btn-ghost"
                    style="font-size:0.78rem;color:var(--clr-danger);border-color:var(--clr-danger)"
                    onclick="deleteSubject(${s.id}, '${escAttr(s.name)}')">🗑 Delete</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    list.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

async function handleAddSubject(e) {
  e.preventDefault();
  const btn     = document.getElementById('btn-add-subject');
  const alertEl = document.getElementById('subject-alert');
  const name    = document.getElementById('new-subject-name').value.trim();

  alertEl.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Adding…';

  try {
    const res  = await authFetch(`${API}/api/teacher/subjects`, {
      method: 'POST',
      body:   JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alertEl.textContent = `✅ "${name}" added`;
    alertEl.className   = 'alert alert-success show';
    document.getElementById('add-subject-form').reset();
    loadSubjects();
    loadSubjectDropdown();
    setTimeout(() => alertEl.classList.remove('show'), 2000);
  } catch (err) {
    alertEl.textContent = err.message;
    alertEl.className   = 'alert alert-error show';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Subject';
  }
}

async function deleteSubject(id, name) {
  if (!confirm(`Delete subject "${name}"? This cannot be undone.`)) return;
  try {
    const res  = await authFetch(`${API}/api/teacher/subjects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    loadSubjects();
    loadSubjectDropdown();
  } catch (err) { alert(err.message); }
}

/* ══════════════════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════════════════ */

async function openProfile() {
  document.getElementById('profile-modal').classList.add('open');
  document.getElementById('profile-alert').classList.remove('show');
  try {
    const res  = await authFetch(`${API}/api/auth/me`);
    const { user } = await res.json();
    document.getElementById('profile-avatar-lg').textContent  = user.name.charAt(0).toUpperCase();
    document.getElementById('profile-name-disp').textContent  = user.name;
    document.getElementById('profile-email-disp').textContent = user.email;
    document.getElementById('profile-joined-disp').textContent =
      'Joined ' + new Date(user.created_at).toLocaleDateString();
    document.getElementById('new-display-name').value = user.name;
  } catch (_) {}
}

function closeProfile() {
  document.getElementById('profile-modal').classList.remove('open');
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('profile-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProfile();
  });
});

async function updateProfileName(e) {
  e.preventDefault();
  const btn     = document.getElementById('btn-update-name');
  const alertEl = document.getElementById('profile-alert');
  const name    = document.getElementById('new-display-name').value.trim();

  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  alertEl.classList.remove('show');
  try {
    const res  = await authFetch(`${API}/api/auth/profile`, {
      method: 'PATCH', body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alertEl.textContent = '✅ Name updated';
    alertEl.className   = 'alert alert-success show';
    document.getElementById('profile-name-disp').textContent  = name;
    document.getElementById('profile-avatar-lg').textContent  = name.charAt(0).toUpperCase();
    document.getElementById('sidebar-name').textContent       = name;
    document.getElementById('sidebar-avatar').textContent     = name.charAt(0).toUpperCase();
  } catch (err) {
    alertEl.textContent = err.message; alertEl.className = 'alert alert-error show';
  } finally { btn.disabled = false; btn.textContent = 'Update Name'; }
}

async function submitChangePassword(e) {
  e.preventDefault();
  const btn     = document.getElementById('btn-change-pw');
  const alertEl = document.getElementById('profile-alert');
  const curPw   = document.getElementById('cur-pw').value;
  const newPw   = document.getElementById('new-pw').value;

  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  alertEl.classList.remove('show');
  try {
    const res  = await authFetch(`${API}/api/auth/change-password`, {
      method: 'PATCH', body: JSON.stringify({ current_password: curPw, new_password: newPw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alertEl.textContent = '✅ Password changed successfully';
    alertEl.className   = 'alert alert-success show';
    document.getElementById('change-pw-form').reset();
  } catch (err) {
    alertEl.textContent = err.message; alertEl.className = 'alert alert-error show';
  } finally { btn.disabled = false; btn.textContent = 'Change Password'; }
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
loadDashboard();
loadMaterials();
loadSubjectDropdown();
