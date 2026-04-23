import { getSupabase } from './supabaseClient.js';
import { showToast } from './ui.js';

export async function register({ name, email, password }) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase no esta configurado.');

  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;

  if (data.user) {
    await sb.from('profiles').upsert({ id: data.user.id, name, email });
  }

  return data;
}

export async function login({ email, password }) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase no esta configurado.');

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

export async function redirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) window.location.href = 'app.html';
}

export function onAuthStateChange(callback) {
  const sb = getSupabase();
  if (!sb) return;
  sb.auth.onAuthStateChange(callback);
}

export function initLoginForm() {
  const form = document.getElementById('login-form');
  const buttonText = document.getElementById('login-btn-text');
  const errorEl = document.getElementById('login-error');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = '';
    if (buttonText) buttonText.textContent = 'Ingresando...';

    try {
      await login({
        email: document.getElementById('login-email')?.value.trim(),
        password: document.getElementById('login-password')?.value || '',
      });
      window.location.href = 'app.html';
    } catch (error) {
      if (errorEl) errorEl.textContent = translateAuthError(error.message);
    } finally {
      if (buttonText) buttonText.textContent = 'Ingresar';
    }
  });
}

export function initRegisterForm() {
  const form = document.getElementById('register-form');
  const buttonText = document.getElementById('register-btn-text');
  const errorEl = document.getElementById('register-error');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = '';

    const password = document.getElementById('register-password')?.value || '';
    const confirm = document.getElementById('register-confirm')?.value || '';
    if (password !== confirm) {
      if (errorEl) errorEl.textContent = 'Las contrasenas no coinciden.';
      return;
    }

    if (buttonText) buttonText.textContent = 'Creando cuenta...';

    try {
      await register({
        name: document.getElementById('register-name')?.value.trim(),
        email: document.getElementById('register-email')?.value.trim(),
        password,
      });
      showToast('Cuenta creada. Revisa tu email para confirmar.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (error) {
      if (errorEl) errorEl.textContent = translateAuthError(error.message);
    } finally {
      if (buttonText) buttonText.textContent = 'Crear Cuenta';
    }
  });
}

function translateAuthError(message) {
  const map = {
    'Invalid login credentials': 'Email o contrasena incorrectos.',
    'Email not confirmed': 'Confirma tu email antes de ingresar.',
    'User already registered': 'Este email ya esta registrado.',
    'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
  };
  return map[message] || message;
}
