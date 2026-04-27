const API = '';  // same-origin — served by Express

let allSubjects = [];

/* ── Alert helpers ─────────────────────────────────────────────────────── */
function showAlert(message, type = 'error') {
  const el = document.getElementById('alert');
  el.textContent = message;
  el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

/* ── Tab switcher ──────────────────────────────────────────────────────── */
function switchTab(tab) {
  ['login', 'register'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`panel-${t}`).classList.toggle('active', t === tab);
  });
  document.getElementById('alert').classList.remove('show');
}

/* ── Load subjects from API ────────────────────────────────────────────── */
async function loadSubjects() {
  try {
    const res  = await fetch(`${API}/api/subjects`);
    const data = await res.json();
    allSubjects = data.subjects || [];
  } catch (_) {}
}

// 5 subjects available for student selection
const STUDENT_SUBJECTS = [
  'Computer Science',
  'Data Structures',
  'Database Management',
  'Machine Learning',
  'Web Development',
];

/* ── Render subject pill checkboxes ───────────────────────────────────── */
function renderSubjectPills(role) {
  const container = document.getElementById('subject-pills');
  if (!container) return;
  const list = role === 'student'
    ? allSubjects.filter(s => STUDENT_SUBJECTS.includes(s.name))
    : allSubjects;
  container.innerHTML = list.map(s => `
    <label class="subject-pill">
      <input type="checkbox" value="${s.id}" name="subject" />
      ${s.name}
    </label>
  `).join('');
}

/* ── Show/hide subjects when role is selected ─────────────────────────── */
function onRoleChange(role) {
  const group = document.getElementById('subject-group');
  const label = document.getElementById('subject-label');
  const hint  = document.getElementById('subject-hint');
  if (!role) {
    group.style.display = 'none';
    return;
  }
  label.textContent = role === 'student'
    ? 'Subjects you are studying'
    : 'Subjects you teach';
  hint.textContent = 'Select at least one subject.';
  renderSubjectPills(role);
  group.style.display = '';
}

/* ── Register ──────────────────────────────────────────────────────────── */
async function handleRegister(e) {
  e.preventDefault();
  const btn      = document.getElementById('btn-register');
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const subjects = Array.from(
    document.querySelectorAll('input[name="subject"]:checked')
  ).map(el => Number(el.value));

  if (!name || !email || !password || !role) {
    return showAlert('Please fill in all fields.');
  }
  if (subjects.length === 0) {
    return showAlert('Please select at least one subject.');
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating…';

  try {
    const res  = await fetch(`${API}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, role, subjects }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Registration failed');

    showAlert(data.message, 'success');
    document.getElementById('form-register').reset();
    document.getElementById('subject-group').style.display = 'none';
    setTimeout(() => switchTab('login'), 1500);
  } catch (err) {
    showAlert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

/* ── Login ─────────────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  const btn      = document.getElementById('btn-login');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in…';

  try {
    const res  = await fetch(`${API}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('role',  data.role);
    localStorage.setItem('name',  data.name);

    window.location.href = data.role === 'teacher' ? '/teacher' : '/student';
  } catch (err) {
    showAlert(err.message);
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

/* ── Guard: redirect if already logged in ─────────────────────────────── */
(function () {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (token && role) {
    window.location.href = role === 'teacher' ? '/teacher' : '/student';
  }
})();

/* ── Boot ───────────────────────────────────────────────────────────────── */
loadSubjects();
