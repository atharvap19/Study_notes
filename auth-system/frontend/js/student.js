const API = '';

/* ── Auth guard ─────────────────────────────────────────────────────────── */
(function () {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token || role !== 'student') {
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

/* ── Alert helper ───────────────────────────────────────────────────────── */
function showMainAlert(msg, type = 'error') {
  const el = document.getElementById('alert-main');
  el.textContent = msg;
  el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove('show'), 6000);
}

/* ── Sidebar section switcher ───────────────────────────────────────────── */
function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');

  document.querySelectorAll('[id^="section-"]').forEach(s => (s.style.display = 'none'));
  const sec = document.getElementById(`section-${name}`);
  if (sec) sec.style.display = '';

  const titles = {
    'study-materials': ['Study Materials',   'Your assigned documents'],
    tests:             ['Tests',             'Available tests & your results'],
    upcoming:          ['AI Study Plan',     'Your personalised 7-day schedule'],
    progress:          ['Progress',          'Your performance overview'],
  };

  if (name === 'tests')    loadStudentTests();
  if (name === 'progress') loadStudentAnalytics();
  if (name === 'upcoming') restoreStudyPlan();
  const [title, sub] = titles[name] || [name, ''];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent   = sub;
}

/* ── Logout ─────────────────────────────────────────────────────────────── */
function logout() {
  localStorage.clear();
  window.location.href = '/login';
}

/* ── File icon helper ───────────────────────────────────────────────────── */
function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  return { pdf: '📕', pptx: '📊', docx: '📄', xlsx: '📗' }[ext] || '📁';
}

/* ── Render a single material card ─────────────────────────────────────── */
function renderMaterialCard(m) {
  return `
    <div class="material-card">
      <div class="file-icon">${fileIcon(m.file_name)}</div>
      <div class="file-title">${escHtml(m.title)}</div>
      <div class="file-meta">
        ${escHtml(m.file_name)} &bull; Uploaded by ${escHtml(m.uploaded_by)}
      </div>
      <div class="card-actions">
        <a class="btn btn-ghost"
           href="/${escAttr(m.file_path)}"
           download="${escAttr(m.file_name)}"
           title="Download file">
          ⬇ Download
        </a>
      </div>
    </div>`;
}

/* ── Render materials grouped by subject ───────────────────────────────── */
function renderMaterials(materials) {
  const container = document.getElementById('materials-container');
  const badge     = document.getElementById('material-count');

  badge.textContent = `${materials.length} file${materials.length !== 1 ? 's' : ''}`;

  if (!materials.length) {
    container.innerHTML = `
      <div class="placeholder-box" style="grid-column:1/-1">
        <div class="ph-icon">📭</div>
        <h3>No materials available</h3>
        <p>You aren't enrolled in any subjects yet, or no files have been uploaded
           for your subjects. Contact your teacher.</p>
      </div>`;
    return;
  }

  // Group by subject_name
  const groups = {};
  materials.forEach(m => {
    const key = m.subject_name || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  // Render subject groups
  container.style.display = 'block';
  container.innerHTML = Object.entries(groups).map(([subject, items]) => `
    <div class="subject-group">
      <div class="subject-group-header">
        <span class="subject-group-title">📚 ${escHtml(subject)}</span>
        <span class="badge">${items.length} file${items.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="materials-grid">
        ${items.map(renderMaterialCard).join('')}
      </div>
    </div>
  `).join('');
}

/* ── Load dashboard (user info only) ───────────────────────────────────── */
async function loadDashboard() {
  try {
    const res  = await authFetch(`${API}/api/student/dashboard`);
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    if (!res.ok) throw new Error(data.message || 'Failed to load dashboard');

    const { user } = data;
    document.getElementById('sidebar-name').textContent = user.name;
    document.getElementById('sidebar-avatar').textContent =
      user.name.charAt(0).toUpperCase();
  } catch (err) {
    showMainAlert(err.message);
  }
}

/* ── Load materials filtered by enrolled subjects ───────────────────────── */
async function loadMaterials() {
  const container = document.getElementById('materials-container');
  container.innerHTML = `
    <div class="loading-state" style="grid-column:1/-1">
      <div class="spinner"></div>
      <span>Loading materials…</span>
    </div>`;

  try {
    const res  = await authFetch(`${API}/api/student/materials`);
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    if (!res.ok) throw new Error(data.message || 'Failed to load materials');

    renderMaterials(data.materials || []);
  } catch (err) {
    container.innerHTML = `
      <div class="placeholder-box" style="grid-column:1/-1">
        <div class="ph-icon">⚠️</div>
        <h3>Could not load materials</h3>
        <p>${escHtml(err.message)}</p>
      </div>`;
  }
}

/* ── Open DocNotes AI (Next.js) in a new tab ───────────────────────────── */
function openDocNotesAI() {
  const token = localStorage.getItem('token');
  window.open(`/docnotes?token=${encodeURIComponent(token)}`, '_blank');
}

/* ── Legacy modal helpers (kept for backward compat) ───────────────────── */
function openDocumentAI(filePath, title) {
  document.getElementById('modal-file-title').textContent = title;
  document.getElementById('ai-loading').style.display = '';
  document.getElementById('ai-results').style.display  = 'none';
  document.getElementById('ai-error').style.display    = 'none';
  document.getElementById('ai-modal').classList.add('open');
  callDocumentAI(filePath);
}

async function callDocumentAI(filePath) {
  try {
    const res  = await authFetch(`${API}/api/student/open-document-ai`, {
      method: 'POST',
      body:   JSON.stringify({ file_path: filePath }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Document AI failed');
    renderAIResults(data);
  } catch (err) {
    document.getElementById('ai-loading').style.display = 'none';
    const errEl = document.getElementById('ai-error');
    errEl.textContent = err.message;
    errEl.style.display = '';
  }
}

function renderAIResults({ summary, flashcards, quiz }) {
  document.getElementById('summary-content').textContent = summary || 'No summary generated.';

  const fcEl = document.getElementById('flashcards-content');
  if (flashcards && flashcards.length) {
    fcEl.innerHTML = flashcards.map((fc, i) => `
      <div class="flashcard">
        <div class="q">Q${i + 1}. ${escHtml(fc.question)}</div>
        <div class="a">${escHtml(fc.answer)}</div>
      </div>`).join('');
  } else {
    fcEl.innerHTML = '<p style="color:var(--clr-muted)">No flashcards generated.</p>';
  }

  const qEl = document.getElementById('quiz-content');
  if (quiz && quiz.length) {
    qEl.innerHTML = quiz.map((q, i) => {
      const opts = (q.options || []).map(o =>
        `<div class="opt ${o === q.correct_answer ? 'correct' : ''}">${escHtml(o)}</div>`
      ).join('');
      return `
        <div class="quiz-item">
          <div class="qnum">Q${i + 1} · ${q.type || 'mcq'} · ${q.difficulty || ''}</div>
          <div class="qtext">${escHtml(q.question)}</div>
          <div class="options">${opts}</div>
        </div>`;
    }).join('');
  } else {
    qEl.innerHTML = '<p style="color:var(--clr-muted)">No quiz generated.</p>';
  }

  document.getElementById('ai-loading').style.display  = 'none';
  document.getElementById('ai-results').style.display  = '';
}

function switchAiTab(name, btn) {
  document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ai-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`ai-panel-${name}`).classList.add('active');
}

function closeModal() {
  document.getElementById('ai-modal').classList.remove('open');
}

/* ── XSS helpers ────────────────────────────────────────────────────────── */
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str = '') {
  return String(str).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

/* ── Close modal on overlay click ──────────────────────────────────────── */
document.getElementById('ai-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

/* ══════════════════════════════════════════════════════════════════════════
   TESTS — student side
══════════════════════════════════════════════════════════════════════════ */

let _testTimer    = null;
let _testTimeLeft = 0;
let _currentTestId = null;

async function loadStudentTests() {
  const container = document.getElementById('tests-container');
  const badge     = document.getElementById('tests-count');
  if (!container) return;
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading tests…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/student/tests`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load tests');

    const tests = data.tests || [];
    if (badge) badge.textContent = tests.length;

    if (!tests.length) {
      container.innerHTML = `
        <div class="placeholder-box">
          <div class="ph-icon">📝</div>
          <h3>No tests available</h3>
          <p>Your teacher hasn't published any tests for your subjects yet.</p>
        </div>`;
      return;
    }

    const statusBadge = s => ({
      active: '<span class="test-status active">Active</span>',
      closed: '<span class="test-status closed">Closed</span>',
    }[s] || '');

    container.innerHTML = tests.map(t => {
      const submitted = t.attempt_status === 'submitted';
      const pct = submitted && t.attempt_total > 0 ? Math.round((t.score / t.attempt_total) * 100) : null;
      return `
        <div class="test-card">
          <div class="test-card-header">
            <div>
              <div class="test-card-title">${escHtml(t.title)}</div>
              <div class="test-card-meta">${escHtml(t.subject_name)} &bull; ${t.duration} min &bull; ${t.question_count} question${t.question_count !== 1 ? 's' : ''} &bull; ${t.total_marks} marks</div>
            </div>
            ${statusBadge(t.status)}
          </div>
          ${submitted ? `
            <div class="score-banner">
              <span class="score-val">${t.score} / ${t.attempt_total}</span>
              <span class="score-pct">${pct}%</span>
              <span style="font-size:0.8rem;color:var(--clr-muted)">${t.submitted_at ? 'Submitted ' + new Date(t.submitted_at).toLocaleDateString() : ''}</span>
            </div>` : ''}
          <div class="test-card-actions">
            ${!submitted && t.status === 'active' ? `<button class="btn btn-accent" onclick="openTestOverlay(${t.id}, '${escAttr(t.title)}', ${t.duration})">▶ Take Test</button>` : ''}
            ${submitted ? `<button class="btn btn-ghost" onclick="viewStudentResult(${t.id})">📊 View Result</button>` : ''}
            ${!submitted && t.status === 'closed' ? `<span style="font-size:0.82rem;color:var(--clr-muted);padding:0.4rem 0">Test is closed</span>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

async function openTestOverlay(testId, title, duration) {
  _currentTestId = testId;
  const overlay = document.getElementById('test-overlay');
  const titleEl = document.getElementById('test-overlay-title');
  const bodyEl  = document.getElementById('test-overlay-body');
  const timerEl = document.getElementById('test-timer');

  titleEl.textContent = title;
  timerEl.textContent = '';
  bodyEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading questions…</span></div>';
  overlay.classList.add('open');

  try {
    const res  = await authFetch(`${API}/api/student/tests/${testId}/start`);
    const data = await res.json();
    if (!res.ok) {
      if (data.already_submitted) {
        overlay.classList.remove('open');
        viewStudentResult(testId);
        return;
      }
      throw new Error(data.message || 'Failed to start test');
    }
    renderTestQuestions(data.questions, testId);
    startTimer(duration * 60);
  } catch (err) {
    bodyEl.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>
      <button class="btn btn-ghost" style="margin-top:1rem" onclick="closeTestOverlay()">Close</button>`;
  }
}

function renderTestQuestions(questions, testId) {
  const bodyEl = document.getElementById('test-overlay-body');

  bodyEl.innerHTML = questions.map((q, i) => {
    const opts = q.type === 'true_false'
      ? ['True', 'False']
      : (q.options || []);
    return `
      <div class="question-block">
        <div class="q-num">Q${i + 1} <span class="q-marks">${q.marks} mark${q.marks !== 1 ? 's' : ''}</span></div>
        <div class="q-text">${escHtml(q.question)}</div>
        <div class="opt-list">
          ${opts.map(o => `
            <label class="opt-btn">
              <input type="radio" name="q_${q.id}" value="${escAttr(o)}" />
              ${escHtml(o)}
            </label>`).join('')}
        </div>
      </div>`;
  }).join('');

  bodyEl.innerHTML += `
    <button class="btn btn-primary" style="margin-top:1.5rem" onclick="submitStudentTest(${testId})">
      Submit Test
    </button>`;
}

function startTimer(seconds) {
  _testTimeLeft = seconds;
  clearInterval(_testTimer);
  const timerEl = document.getElementById('test-timer');

  function tick() {
    const m = Math.floor(_testTimeLeft / 60);
    const s = _testTimeLeft % 60;
    timerEl.textContent = `⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    timerEl.className   = _testTimeLeft <= 60 ? 'test-timer danger' : 'test-timer';
    if (_testTimeLeft <= 0) {
      clearInterval(_testTimer);
      submitStudentTest(_currentTestId, true);
      return;
    }
    _testTimeLeft--;
  }
  tick();
  _testTimer = setInterval(tick, 1000);
}

async function submitStudentTest(testId, autoSubmit = false) {
  if (!autoSubmit && !confirm('Submit the test? You cannot change answers after submission.')) return;
  clearInterval(_testTimer);

  const answers = [];
  document.querySelectorAll('[name^="q_"]').forEach(input => {
    if (input.checked) {
      answers.push({ question_id: Number(input.name.replace('q_', '')), student_answer: input.value });
    }
  });

  const bodyEl = document.getElementById('test-overlay-body');
  bodyEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Submitting…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/student/tests/${testId}/submit`, {
      method: 'POST',
      body:   JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Submission failed');

    const pct = data.percentage;
    const colour = pct >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)';
    const msg    = pct >= 75 ? '🎉 Excellent!' : pct >= 50 ? '👍 Good effort!' : '📚 Keep studying!';
    bodyEl.innerHTML = `
      <div style="text-align:center;padding:2rem 0">
        <div style="font-size:3.5rem;font-weight:800;color:${colour}">${pct}%</div>
        <div style="font-size:1.1rem;margin:0.5rem 0;font-weight:600">${data.score} / ${data.total_marks} marks</div>
        <div style="color:var(--clr-muted);font-size:0.85rem;margin-bottom:1.5rem">${msg}</div>
        <button class="btn btn-primary" style="width:auto;padding:0.65rem 2rem"
          onclick="closeTestOverlay(); loadStudentTests()">Done</button>
      </div>`;
  } catch (err) {
    bodyEl.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>
      <button class="btn btn-ghost" style="margin-top:1rem" onclick="closeTestOverlay()">Close</button>`;
  }
}

function closeTestOverlay() {
  clearInterval(_testTimer);
  _currentTestId = null;
  document.getElementById('test-overlay').classList.remove('open');
}

async function viewStudentResult(testId) {
  _currentTestId = testId;
  const overlay = document.getElementById('test-overlay');
  const bodyEl  = document.getElementById('test-overlay-body');
  const titleEl = document.getElementById('test-overlay-title');
  const timerEl = document.getElementById('test-timer');

  titleEl.textContent = 'Result';
  timerEl.textContent = '';
  bodyEl.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading result…</span></div>';
  overlay.classList.add('open');

  try {
    const res  = await authFetch(`${API}/api/student/tests/${testId}/result`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load result');

    const pct    = data.percentage;
    const colour = pct >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)';
    bodyEl.innerHTML = `
      <div style="text-align:center;padding:1.5rem 0 2rem">
        <div style="font-size:3.5rem;font-weight:800;color:${colour}">${pct}%</div>
        <div style="font-size:1.1rem;font-weight:600;margin:0.4rem 0">${data.score} / ${data.total_marks} marks</div>
        <div style="color:var(--clr-muted);font-size:0.82rem">Submitted ${new Date(data.submitted_at).toLocaleString()}</div>
      </div>
      <hr style="border-color:var(--clr-border);margin-bottom:1.5rem">
      ${data.answers.map((a, i) => `
        <div class="result-answer ${a.is_correct ? 'correct' : 'wrong'}">
          <div class="ra-num">Q${i + 1}</div>
          <div class="ra-text">${escHtml(a.question)}</div>
          <div class="ra-row">
            <span class="ra-label">Your answer:</span>
            <span class="ra-val ${a.is_correct ? 'green' : 'red'}">${escHtml(a.student_answer || '(no answer)')}</span>
          </div>
          ${!a.is_correct ? `<div class="ra-row"><span class="ra-label">Correct:</span><span class="ra-val green">${escHtml(a.correct_answer)}</span></div>` : ''}
          <div class="ra-marks">${a.marks_awarded} / ${a.marks} mark${a.marks !== 1 ? 's' : ''}</div>
        </div>`).join('')}
      <button class="btn btn-ghost" style="margin-top:1.5rem" onclick="closeTestOverlay()">Close</button>`;
  } catch (err) {
    bodyEl.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>
      <button class="btn btn-ghost" style="margin-top:1rem" onclick="closeTestOverlay()">Close</button>`;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   AI STUDY PLAN
══════════════════════════════════════════════════════════════════════════ */

async function restoreStudyPlan() {
  const root = document.getElementById('study-plan-root');
  if (!root || root.querySelector('.plan-grid')) return; // already rendered
  try {
    const res  = await authFetch(`${API}/api/student/study-plan`);
    const data = await res.json();
    if (res.ok && data.plan) {
      renderStudyPlan(data.plan, data.generated_at);
      document.getElementById('btn-generate-plan').textContent = '✨ Regenerate';
    }
  } catch (_) {}
}

async function requestStudyPlan() {
  const root  = document.getElementById('study-plan-root');
  const btn   = document.getElementById('btn-generate-plan');
  root.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>AI is building your personalised plan… this takes about 15 seconds.</span>
    </div>`;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating…';

  try {
    const res  = await authFetch(`${API}/api/student/study-plan`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate plan');

      renderStudyPlan(data.plan, data.generated_at);
    document.getElementById('btn-generate-plan').textContent = '✨ Regenerate';
  } catch (err) {
    root.innerHTML = `
      <div class="alert alert-error show" style="margin-bottom:1rem">${escHtml(err.message)}</div>
      <button class="btn btn-ghost" onclick="requestStudyPlan()">Try Again</button>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Regenerate';
  }
}

function renderStudyPlan(plan, generatedAt) {
  const root = document.getElementById('study-plan-root');
  if (!plan) { root.innerHTML = '<p style="color:var(--clr-muted)">No plan data.</p>'; return; }

  const priorityColour = { high: 'var(--clr-danger)', medium: 'var(--clr-primary)', low: 'var(--clr-accent)' };
  const priorityIcon   = { high: '🔴', medium: '🟡', low: '🟢' };

  const weakBadges = (plan.weak_areas || []).map(a =>
    `<span class="area-badge weak">${escHtml(a)}</span>`).join('');
  const strongBadges = (plan.strong_areas || []).map(a =>
    `<span class="area-badge strong">${escHtml(a)}</span>`).join('');

  const days = (plan.plan || []).map(d => {
    const sessions = (d.sessions || []).map(s => `
      <div class="session-row">
        <div class="session-header">
          <span class="session-subject">${escHtml(s.subject)}</span>
          <span class="session-dur">${escHtml(s.duration)}</span>
          <span class="priority-dot" title="${s.priority}" style="color:${priorityColour[s.priority] || 'var(--clr-muted)'}">
            ${priorityIcon[s.priority] || '⚪'}
          </span>
        </div>
        <div class="session-topic">${escHtml(s.topic)}</div>
        <div class="session-tip">💡 ${escHtml(s.tip)}</div>
      </div>`).join('');

    return `
      <div class="plan-day-card">
        <div class="plan-day-header">
          <span class="plan-day-num">${escHtml(d.day)}</span>
          <span class="plan-day-label">${escHtml(d.label)}</span>
        </div>
        <div class="plan-sessions">${sessions}</div>
      </div>`;
  }).join('');

  const genDate = generatedAt ? new Date(generatedAt).toLocaleString() : '';

  root.innerHTML = `
    <!-- Summary card -->
    <div class="plan-summary-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
        <div>
          <div class="plan-summary-text">${escHtml(plan.summary || '')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.75rem">
            ${weakBadges}${strongBadges}
          </div>
        </div>
        <div style="font-size:0.75rem;color:var(--clr-muted);white-space:nowrap">Generated ${escHtml(genDate)}</div>
      </div>
    </div>

    <!-- 7-day grid -->
    <div class="plan-grid">${days}</div>

    <p style="font-size:0.75rem;color:var(--clr-muted);margin-top:1rem">
      🔴 High priority &nbsp;·&nbsp; 🟡 Medium &nbsp;·&nbsp; 🟢 Low &nbsp;·&nbsp; Plan refreshes every 24 h or on regenerate.
    </p>
  `;
}

/* ══════════════════════════════════════════════════════════════════════════
   PROGRESS / ANALYTICS — student side
══════════════════════════════════════════════════════════════════════════ */

async function loadStudentAnalytics() {
  const root = document.getElementById('analytics-root');
  if (!root) return;
  root.innerHTML = '<div class="loading-state"><div class="spinner"></div><span>Loading analytics…</span></div>';

  try {
    const res  = await authFetch(`${API}/api/student/analytics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load analytics');

    const { overall, by_subject, recent } = data;
    const o = overall || {};

    if (!o.tests_taken) {
      root.innerHTML = `
        <div class="placeholder-box">
          <div class="ph-icon">📊</div>
          <h3>No data yet</h3>
          <p>Complete some tests to see your performance analytics.</p>
        </div>`;
      return;
    }

    const passRate = o.tests_taken > 0 ? Math.round((o.passed / o.tests_taken) * 100) : 0;
    const avgPct   = o.avg_pct ?? 0;

    root.innerHTML = `
      <!-- ── Overall stats ── -->
      <div class="stats-strip" style="margin-bottom:2rem">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--clr-primary)">${o.tests_taken}</div>
          <div class="stat-label">Tests Taken</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:${avgPct >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)'}">${avgPct}%</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--clr-accent)">${passRate}%</div>
          <div class="stat-label">Pass Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--clr-primary)">${o.total_score ?? 0}</div>
          <div class="stat-label">Total Marks Earned</div>
        </div>
      </div>

      <!-- ── Subject breakdown ── -->
      ${by_subject.length ? `
        <div class="section-header"><span class="section-title">📚 Subject Performance</span></div>
        <div class="subject-analytics">
          ${by_subject.map(s => {
            const pct = s.avg_pct ?? 0;
            const colour = pct >= 75 ? 'var(--clr-accent)' : pct >= 50 ? 'var(--clr-primary)' : 'var(--clr-danger)';
            return `
              <div class="sa-card">
                <div class="sa-header">
                  <span class="sa-subject">${escHtml(s.subject_name || 'General')}</span>
                  <span class="sa-pct" style="color:${colour}">${pct}%</span>
                </div>
                <div class="sa-bar-bg">
                  <div class="sa-bar-fill" style="width:${pct}%;background:${colour}"></div>
                </div>
                <div class="sa-meta">${s.tests_taken} test${s.tests_taken !== 1 ? 's' : ''} &bull; Best: ${s.best_pct}%</div>
              </div>`;
          }).join('')}
        </div>` : ''}

      <!-- ── Score trend ── -->
      ${recent.length ? `
        <div class="section-header" style="margin-top:2rem"><span class="section-title">📈 Score Trend</span></div>
        <div class="trend-chart">
          ${recent.slice().reverse().map(r => {
            const pct = r.percentage ?? 0;
            const colour = pct >= 75 ? 'var(--clr-accent)' : pct >= 50 ? 'var(--clr-primary)' : 'var(--clr-danger)';
            return `
              <div class="trend-bar-wrap" title="${escAttr(r.title)}: ${pct}%">
                <div class="trend-bar-fill" style="height:${pct}%;background:${colour}"></div>
                <div class="trend-bar-label">${pct}%</div>
              </div>`;
          }).join('')}
        </div>

        <!-- ── Recent tests table ── -->
        <div class="section-header" style="margin-top:2rem"><span class="section-title">🗒️ Recent Tests</span></div>
        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead><tr><th>Test</th><th>Subject</th><th>Score</th><th>%</th><th>Date</th></tr></thead>
            <tbody>
              ${recent.map(r => {
                const pct = r.percentage ?? 0;
                const col = pct >= 50 ? 'var(--clr-accent)' : 'var(--clr-danger)';
                return `
                  <tr>
                    <td>${escHtml(r.title)}</td>
                    <td style="color:var(--clr-muted)">${escHtml(r.subject_name || '—')}</td>
                    <td>${r.score} / ${r.total_marks}</td>
                    <td style="font-weight:700;color:${col}">${pct}%</td>
                    <td style="color:var(--clr-muted);font-size:0.78rem">${r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : ''}
    `;
  } catch (err) {
    root.innerHTML = `<div class="alert alert-error show">${escHtml(err.message)}</div>`;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════════════════════════════ */

async function loadNotifications() {
  try {
    const res  = await authFetch(`${API}/api/student/notifications`);
    const data = await res.json();
    if (!res.ok) return;

    const badge = document.getElementById('notif-badge');
    const list  = document.getElementById('notif-list');

    if (data.unread > 0) {
      badge.textContent   = data.unread > 9 ? '9+' : data.unread;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }

    const notifs = data.notifications || [];
    list.innerHTML = notifs.length
      ? notifs.map(n => `
          <div class="notif-item${n.is_read ? '' : ' unread'}">
            <div class="notif-msg">${escHtml(n.message)}</div>
            <div class="notif-time">${new Date(n.created_at).toLocaleString()}</div>
          </div>`).join('')
      : '<div class="notif-empty">No notifications yet</div>';
  } catch (_) {}
}

function toggleNotifications() {
  const dd = document.getElementById('notif-dropdown');
  dd.classList.toggle('open');
  if (dd.classList.contains('open')) markAllRead();
}

async function markAllRead() {
  try {
    await authFetch(`${API}/api/student/notifications/read`, { method: 'PATCH' });
    document.getElementById('notif-badge').style.display = 'none';
  } catch (_) {}
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  const wrap = document.getElementById('notif-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('notif-dropdown')?.classList.remove('open');
  }
});

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
document.getElementById('profile-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProfile();
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
loadNotifications();
