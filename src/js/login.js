import { getSession, saveSession } from './auth.js';
import { apiClient } from './api-client.js';

// Si ya hay sesión activa (recordar sesión), redirigir directamente.
const existingSession = getSession();
if (existingSession) {
  window.location.replace(existingSession.role === 'admin' ? 'dashboard.html' : 'validation-ticket.html');
}

// Lógica del formulario de login
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberSessionInput = document.getElementById('rememberSession');
const loginAlert = document.getElementById('loginAlert');
const loginButton = document.getElementById('loginButton');
const togglePasswordButton = document.getElementById('togglePasswordButton');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');

usernameInput?.focus();

// Lógica de envío del formulario
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
    const response = await apiClient.post('/api/auth/login/', { username, password });

    const remember = rememberSessionInput?.checked ?? false; // Si el checkbox no existe, no recordar sesión
    saveSession({ access: response.access, refresh: response.refresh }, response.user, remember);

    showAlert('success', 'Acceso correcto. Redirigiendo...');
    
    setTimeout(() => {
      window.location.href = response.user.role === 'admin' ? 'dashboard.html' : 'validation-ticket.html';
    }, 500);
  } catch (error) {
    showAlert('danger', error.message || 'No fue posible iniciar sesión. Intenta nuevamente.');
  } finally {
    setLoadingState(false);
  }
});

togglePasswordButton?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePasswordIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
});

function validateRequiredInputs() {
  if (!usernameInput.value.trim()) usernameInput.classList.add('is-invalid');
  if (!passwordInput.value.trim()) passwordInput.classList.add('is-invalid');
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