import { getSession } from './auth.js';

// Si ya existe una sesión activa (ej. localStorage con "recordar sesión"),
// redirigir directamente sin mostrar el formulario.
const existingSession = getSession();

if (existingSession) {
  window.location.replace(existingSession.role === 'admin' ? 'dashboard.html' : 'validation-ticket.html');
}

const demoUsers = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Administrador General',
    tenant: '',
    permissions: ['two_hours_free', 'fifty_percent', 'preferred_rate', 'full_courtesy'],
    redirectTo: 'dashboard.html',
  },
  {
    username: 'usuario.cine01',
    password: 'demo123',
    role: 'tenant_user',
    displayName: 'Usuario Cine 01',
    tenant: 'Cine',
    permissions: ['two_hours_free'],
    redirectTo: 'validation-ticket.html',
  },
];

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberSessionInput = document.getElementById('rememberSession');
const loginAlert = document.getElementById('loginAlert');
const loginButton = document.getElementById('loginButton');
const togglePasswordButton = document.getElementById('togglePasswordButton');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');

usernameInput?.focus();

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearValidationState();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    validateRequiredInputs();
    showAlert('danger', 'Ingresa usuario y contraseña para continuar.');
    return;
  }

  setLoadingState(true);

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      showAlert('danger', 'Usuario o contraseña incorrectos.');
      return;
    }

    saveSession(user);
    showAlert('success', 'Acceso correcto. Redirigiendo...');

    setTimeout(() => {
      window.location.href = user.redirectTo;
    }, 500);
  } catch (error) {
    showAlert('danger', 'No fue posible iniciar sesión. Intenta nuevamente.');
  } finally {
    setLoadingState(false);
  }
});

togglePasswordButton?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';

  passwordInput.type = isPassword ? 'text' : 'password';
  togglePasswordIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
});

function authenticateUser(username, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = demoUsers.find((item) =>
        item.username === username && item.password === password
      );

      resolve(user || null);
    }, 350);
  });
}

function saveSession(user) {
  const storage = rememberSessionInput.checked ? localStorage : sessionStorage;

  storage.setItem('portalUser', JSON.stringify({
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    tenant: user.tenant,
    permissions: user.permissions,
    loggedAt: new Date().toISOString(),
  }));
}

function validateRequiredInputs() {
  if (!usernameInput.value.trim()) {
    usernameInput.classList.add('is-invalid');
  }

  if (!passwordInput.value.trim()) {
    passwordInput.classList.add('is-invalid');
  }
}

function clearValidationState() {
  usernameInput.classList.remove('is-invalid');
  passwordInput.classList.remove('is-invalid');
  hideAlert();
}

function setLoadingState(isLoading) {
  loginButton.disabled = isLoading;

  loginButton.innerHTML = isLoading
    ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Validando...'
    : '<i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión';
}

function showAlert(type, message) {
  loginAlert.className = `alert alert-${type}`;
  loginAlert.textContent = message;
}

function hideAlert() {
  loginAlert.className = 'alert d-none';
  loginAlert.textContent = '';
}