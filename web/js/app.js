const API_BASE = (() => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  if (window.API_BASE_URL) {
    return window.API_BASE_URL;
  }

  const protocol = ['http:', 'https:'].includes(window.location.protocol)
    ? window.location.protocol
    : 'http:';
  const host = window.location.hostname && window.location.hostname !== 'null'
    ? window.location.hostname
    : 'localhost';

  return `${protocol}//${host}:5000/api`;
})();

const $ = (sel, ctx = document) => ctx.querySelector(sel);

function toast(message, ok = true) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.className = `toast toast--show ${ok ? 'toast--ok' : 'toast--err'}`;
  el.textContent = message;
  setTimeout(() => el.classList.remove('toast--show'), 2400);
}

function setError(input, message) {
  if (!input) return;
  const id = input.getAttribute('id');
  const err = document.querySelector(`[data-error-for="${id}"]`);
  if (err) {
    err.textContent = message || '';
  }
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Error en la comunicaciÃ³n con el servidor';
    const error = new Error(message);
    error.details = data?.details;
    error.status = response.status;
    throw error;
  }

  return data;
}

function saveSession(user, token) {
  sessionStorage.setItem(
    'sd_auth_user',
    JSON.stringify({
      ...user,
      token,
    }),
  );
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem('sd_auth_user')) || null;
  } catch (error) {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem('sd_auth_user');
}

function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderUsers(users = []) {
  const tbody = $('#usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  users.forEach((user) => {
    const row = document.createElement('tr');
    const values = [
      user?.nombre || '',
      user?.email || '',
      user?.direccion || '-',
      user?.rol || '',
      formatDate(user?.fechaRegistro),
    ];

    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value || '';
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });
}

(function initLogin() {
  const form = $('#loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const idOrEmail = $('#loginId').value.trim();
    const password = $('#loginPassword').value;

    let ok = true;
    if (!idOrEmail) {
      setError($('#loginId'), 'Introduce tu email o DNI');
      ok = false;
    } else {
      setError($('#loginId'), '');
    }

    if (!password || password.length < 8) {
      setError($('#loginPassword'), 'MÃ­nimo 8 caracteres');
      ok = false;
    } else {
      setError($('#loginPassword'), '');
    }

    if (!ok) return;

    try {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: idOrEmail,
          password,
        },
      });

      const { user, token } = payload.data;
      saveSession(user, token);
      toast(`Bienvenido, ${user.nombre}!`, true);

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 900);
    } catch (error) {
      toast(error.message, false);
    }
  });

  const forgot = $('#forgotLink');
  if (forgot) {
    forgot.addEventListener('click', (event) => {
      event.preventDefault();
      toast('FunciÃ³n de recuperaciÃ³n no implementada en la demo', false);
    });
  }
})();

(function initRegister() {
  const form = $('#registerForm');
  if (!form) return;

  const fechaInput = $('#fecha');
  if (fechaInput && !fechaInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    fechaInput.value = `${yyyy}-${mm}-${dd}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dni = $('#dni').value.trim();
    const nombre = $('#nombre').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    const password2 = $('#password2').value;
    const direccion = $('#direccion').value.trim();

    let ok = true;
    if (!dni) {
      setError($('#dni'), 'El DNI es obligatorio');
      ok = false;
    } else {
      setError($('#dni'), '');
    }

    if (!nombre) {
      setError($('#nombre'), 'El nombre es obligatorio');
      ok = false;
    } else {
      setError($('#nombre'), '');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError($('#email'), 'Email no vÃ¡lido');
      ok = false;
    } else {
      setError($('#email'), '');
    }

    if (!password || password.length < 8) {
      setError($('#password'), 'MÃ­nimo 8 caracteres');
      ok = false;
    } else {
      setError($('#password'), '');
    }

    if (password !== password2) {
      setError($('#password2'), 'Las contraseÃ±as no coinciden');
      ok = false;
    } else {
      setError($('#password2'), '');
    }

    if (!direccion) {
      setError($('#direccion'), 'La direcciÃ³n es obligatoria');
      ok = false;
    } else {
      setError($('#direccion'), '');
    }

    if (!ok) return;

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          nombre,
          email,
          password,
          direccion,
        },
      });

      toast('Cuenta creada correctamente', true);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 900);
    } catch (error) {
      if (error.details?.length) {
        error.details.forEach((detail) => {
          const field = document.getElementById(detail.field);
          if (field) {
            setError(field, detail.message);
          }
        });
      }
      toast(error.message, false);
    }
  });
})();

(function showWelcome() {
  const session = getSession();
  const welcomeEl = $('#loginCard .auth-card__subtitle');
  const form = $('#loginForm');
  const actions = $('#sessionActions');
  const editBtn = $('#editProfileBtn');
  const logoutBtn = $('#logoutBtn');

  if (session) {
    if (welcomeEl) {
      welcomeEl.textContent = `Sesion iniciada como ${session.email}`;
    }
    if (form) {
      form.setAttribute('hidden', 'true');
    }
    if (actions) {
      actions.hidden = false;
    }
    if (editBtn) {
      editBtn.hidden = false;
    }
    if (logoutBtn) {
      logoutBtn.hidden = false;
    }
  } else {
    if (welcomeEl) {
      welcomeEl.textContent = '';
    }
    if (form) {
      form.removeAttribute('hidden');
    }
    if (actions) {
      actions.hidden = true;
    }
    if (editBtn) {
      editBtn.hidden = true;
    }
    if (logoutBtn) {
      logoutBtn.hidden = true;
    }
  }
})();

(function initLogout() {
  const logoutBtn = $('#logoutBtn');
  const editBtn = $('#editProfileBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }
})();

(function initUsersList() {
  const section = $('#usersSection');
  if (!section) return;

  const messageEl = $('#usersSectionMessage');
  const tableWrap = $('#usersSection .table-wrap');
  const session = getSession();

  if (!session) {
    section.hidden = true;
    if (tableWrap) {
      tableWrap.hidden = true;
    }
    return;
  }

  section.hidden = false;
  if (messageEl) {
    messageEl.textContent = '';
  }

  if (session.rol !== 'admin') {
    if (messageEl) {
      messageEl.textContent = 'Necesitas rol admin para ver la lista de usuarios.';
    }
    if (tableWrap) {
      tableWrap.hidden = true;
    }
    renderUsers([]);
    return;
  }

  if (tableWrap) {
    tableWrap.hidden = true;
  }

  async function loadUsers() {
    try {
      if (messageEl) {
        messageEl.textContent = 'Cargando usuarios...';
      }
      const payload = await apiRequest('/users', { token: session.token });
      const users = payload?.data || [];
      renderUsers(users);
      if (tableWrap) {
        tableWrap.hidden = users.length === 0;
      }
      if (messageEl) {
        messageEl.textContent = users.length
          ? `Total usuarios: ${users.length}`
          : 'No hay usuarios registrados';
      }
    } catch (error) {
      renderUsers([]);
      if (tableWrap) {
        tableWrap.hidden = true;
      }
      if (messageEl) {
        messageEl.textContent = error.message || 'No se pudo obtener la lista de usuarios';
      }
    }
  }

  loadUsers();
})();

(function initProfilePage() {
  const container = $('#profileRows');
  if (!container) return;

  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const messageEl = $('#profileMessage');
  const fields = [
    {
      key: 'nombre',
      label: 'Nombre completo',
      editable: true,
      type: 'text',
      placeholder: 'Introduce tu nombre completo',
    },
    {
      key: 'email',
      label: 'Email',
      editable: true,
      type: 'email',
      placeholder: 'Introduce tu email',
    },
    {
      key: 'direccion',
      label: 'Direccion',
      editable: true,
      multiline: true,
      placeholder: 'Direccion completa',
    },
    {
      key: 'password',
      label: 'Contrasena',
      editable: true,
      type: 'password',
      maskValue: true,
    },
  ];

  let currentData = null;
  let editingField = null;

  function setMessage(text) {
    if (messageEl) {
      messageEl.textContent = text || '';
    }
  }

  function getField(fieldKey) {
    return fields.find((field) => field.key === fieldKey) || null;
  }

  function findRow(fieldKey) {
    return container.querySelector(`.profile-row[data-field="${fieldKey}"]`);
  }

  function formatValue(field, value) {
    if (!field) return '-';
    if (field.maskValue) {
      return '********';
    }
    if (field.formatter) {
      return field.formatter(value);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return value;
  }

  function renderValues() {
    fields.forEach((field) => {
      const row = findRow(field.key);
      if (!row) return;
      if (editingField === field.key) return;
      const valueEl = row.querySelector('.profile-row__value');
      if (!valueEl) return;
      const value = currentData ? currentData[field.key] : null;
      valueEl.textContent = formatValue(field, value);
    });
  }

  function exitEditMode(fieldKey) {
    const row = findRow(fieldKey);
    const field = getField(fieldKey);
    if (!row || !field) return;

    row.classList.remove('profile-row--editing');
    const valueEl = row.querySelector('.profile-row__value');
    const buttonsEl = row.querySelector('.profile-row__buttons');
    if (valueEl) {
      valueEl.classList.remove('profile-row__value--editing');
      valueEl.innerHTML = '';
      const value = currentData ? currentData[fieldKey] : null;
      valueEl.textContent = formatValue(field, value);
    }
    if (buttonsEl) {
      buttonsEl.innerHTML = '';
      if (field.editable) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'profile-btn';
        editBtn.dataset.action = 'edit';
        editBtn.textContent = 'Editar';
        buttonsEl.appendChild(editBtn);
      }
    }
    editingField = null;
  }

  async function updateField(field, value) {
    try {
      setMessage('Guardando cambios...');
      const payload = await apiRequest('/users/me', {
        method: 'PUT',
        token: session.token,
        body: { [field.key]: value },
      });

      if (payload?.data) {
        currentData = payload.data;
        Object.assign(session, payload.data);
        saveSession(payload.data, session.token);
      }

      const successText = field.key === 'password'
        ? 'Contrasena actualizada correctamente.'
        : 'Dato actualizado correctamente.';
      toast(successText, true);

      if (currentData?.fechaActualizacion) {
        setMessage(`Ultima actualizacion: ${formatDateTime(currentData.fechaActualizacion)}`);
      } else {
        setMessage(successText);
      }

      exitEditMode(field.key);
      renderValues();
    } catch (error) {
      const message = error.message || 'No se pudo actualizar el dato.';
      toast(message, false);
      setMessage(message);
    }
  }

  function enterEditMode(field) {
    const row = findRow(field.key);
    if (!row) return;
    const valueEl = row.querySelector('.profile-row__value');
    const buttonsEl = row.querySelector('.profile-row__buttons');
    if (!valueEl || !buttonsEl) return;

    editingField = field.key;
    row.classList.add('profile-row--editing');
    valueEl.classList.add('profile-row__value--editing');
    valueEl.innerHTML = '';

    if (field.key === 'password') {
      const group = document.createElement('div');
      group.className = 'profile-password';

      const newInput = document.createElement('input');
      newInput.type = 'password';
      newInput.dataset.role = 'new-password';
      newInput.placeholder = 'Nueva contrasena (min. 8 caracteres)';
      newInput.autocomplete = 'new-password';

      const confirmInput = document.createElement('input');
      confirmInput.type = 'password';
      confirmInput.dataset.role = 'confirm-password';
      confirmInput.placeholder = 'Repite la contrasena';
      confirmInput.autocomplete = 'new-password';

      group.appendChild(newInput);
      group.appendChild(confirmInput);
      valueEl.appendChild(group);

      const hint = document.createElement('p');
      hint.className = 'profile-hint';
      hint.textContent = 'Asegurate de que coincidan y tengan al menos 8 caracteres.';
      valueEl.appendChild(hint);

      newInput.focus();
    } else {
      let input;
      if (field.multiline) {
        input = document.createElement('textarea');
        input.rows = 4;
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }
      input.value = currentData?.[field.key] ?? '';
      if (field.placeholder) {
        input.placeholder = field.placeholder;
      }
      input.autocomplete = 'off';
      valueEl.appendChild(input);
      input.focus({ preventScroll: true });
    }

    buttonsEl.innerHTML = '';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'profile-btn profile-btn--primary';
    saveBtn.dataset.action = 'save';
    saveBtn.textContent = 'Guardar';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'profile-btn';
    cancelBtn.dataset.action = 'cancel';
    cancelBtn.textContent = 'Cancelar';

    buttonsEl.appendChild(saveBtn);
    buttonsEl.appendChild(cancelBtn);
  }

  function createRow(field) {
    const row = document.createElement('div');
    row.className = 'profile-row';
    row.dataset.field = field.key;

    const labelEl = document.createElement('div');
    labelEl.className = 'profile-row__label';
    labelEl.textContent = field.label;

    const valueEl = document.createElement('div');
    valueEl.className = 'profile-row__value';
    valueEl.textContent = formatValue(field, currentData ? currentData[field.key] : null);

    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'profile-row__buttons';
    if (field.editable) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'profile-btn';
      editBtn.dataset.action = 'edit';
      editBtn.textContent = 'Editar';
      buttonsEl.appendChild(editBtn);
    }

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    row.appendChild(buttonsEl);
    container.appendChild(row);
  }

  container.addEventListener('click', (event) => {
    const button = event.target.closest('.profile-btn');
    if (!button) return;

    const row = button.closest('.profile-row');
    if (!row) return;

    const fieldKey = row.dataset.field;
    const field = getField(fieldKey);
    if (!field) return;

    const action = button.dataset.action;

    if (action === 'edit') {
      if (!field.editable) {
        toast('Este dato no puede modificarse desde tu cuenta.', false);
        return;
      }
      if (editingField && editingField !== fieldKey) {
        toast('Termina la edicion actual antes de modificar otro dato.', false);
        return;
      }
      enterEditMode(field);
    }

    if (action === 'cancel') {
      exitEditMode(fieldKey);
      if (currentData?.fechaActualizacion) {
        setMessage(`Ultima actualizacion: ${formatDateTime(currentData.fechaActualizacion)}`);
      }
    }

    if (action === 'save') {
      if (field.key === 'password') {
        const newInput = row.querySelector('input[data-role="new-password"]');
        const confirmInput = row.querySelector('input[data-role="confirm-password"]');
        const newPassword = newInput?.value.trim() ?? '';
        const confirmPassword = confirmInput?.value.trim() ?? '';

        if (newPassword.length < 8) {
          toast('La contrasena debe tener al menos 8 caracteres.', false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast('Las contrasenas no coinciden.', false);
          return;
        }

        updateField(field, newPassword);
        return;
      }

      const input = field.multiline
        ? row.querySelector('textarea')
        : row.querySelector('input');
      if (!input) return;

      const newValue = input.value.trim();
      if (!newValue) {
        toast('El valor no puede quedar vacio.', false);
        return;
      }
      if (field.key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
        toast('Introduce un email valido.', false);
        return;
      }

      updateField(field, newValue);
    }
  });

  async function loadProfile() {
    try {
      setMessage('Cargando datos...');
      const payload = await apiRequest('/users/me', { token: session.token });
      currentData = payload?.data || null;
      renderValues();
      if (currentData?.fechaActualizacion) {
        setMessage(`Ultima actualizacion: ${formatDateTime(currentData.fechaActualizacion)}`);
      } else {
        setMessage('No se encontraron datos de perfil.');
      }
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar tu perfil.');
      if (error.status === 401) {
        clearSession();
        window.location.href = 'index.html';
      }
    }
  }

  fields.forEach(createRow);
  loadProfile();
})();
