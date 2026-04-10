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
const ADMIN_TAB_SESSION_KEY = 'sd_admin_tab';

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

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }
    searchParams.append(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delay);
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se ha seleccionado ninguna imagen'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
    reader.readAsDataURL(file);
  });
}

function setupSearchSuggestions(input) {
  if (!input) return null;
  const wrapper = input.closest('.sd-search');
  if (!wrapper) return null;

  const panel = document.createElement('div');
  panel.className = 'search-suggestions';
  wrapper.appendChild(panel);

  const placeholderImage = 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';

  function hidePanel() {
    panel.classList.remove('search-suggestions--visible');
    panel.innerHTML = '';
  }

  async function fetchSuggestions(term) {
    try {
      const payload = await apiRequest(`/products${buildQueryString({
        search: term,
        limit: 5,
      })}`);
      const products = payload?.data || payload || [];
      if (!products.length) {
        hidePanel();
        return;
      }

      panel.innerHTML = '';
      products.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'search-suggestions__item';
        item.dataset.productId = product.id;

        const img = document.createElement('img');
        img.className = 'search-suggestions__thumb';
        img.src = product.imagen_url || placeholderImage;
        img.alt = product.nombre || 'Producto Sport4Data';

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'search-suggestions__name';
        name.textContent = product.nombre || 'Producto sin nombre';

        const meta = document.createElement('div');
        meta.className = 'search-suggestions__meta';
        const details = [];
        if (product.categoria) details.push(product.categoria);
        if (product.deporte) details.push(product.deporte);
        meta.textContent = details.join(' · ') || 'Sin categoría';

        info.appendChild(name);
        info.appendChild(meta);

        item.appendChild(img);
        item.appendChild(info);
        panel.appendChild(item);
      });

      panel.classList.add('search-suggestions--visible');
    } catch (error) {
      hidePanel();
    }
  }

  const debouncedFetch = debounce(fetchSuggestions, 250);

  input.addEventListener('input', () => {
    const term = input.value.trim();
    if (term.length < 2) {
      hidePanel();
      return;
    }
    debouncedFetch(term);
  });

  input.addEventListener('focus', () => {
    if (panel.childElementCount) {
      panel.classList.add('search-suggestions--visible');
    }
  });

  panel.addEventListener('click', (event) => {
    const item = event.target.closest('.search-suggestions__item');
    if (!item) return;
    const { productId } = item.dataset;
    hidePanel();
    if (productId) {
      document.dispatchEvent(new CustomEvent('sd:product-detail', {
        detail: { id: productId },
      }));
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      hidePanel();
    }
  });

  return {
    hide: hidePanel,
  };
}

function getURLParam(name, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeEmail(value = '') {
  if (!value) return '';
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

function isValidEmail(value = '') {
  const email = normalizeEmail(value);
  if (!email) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return pattern.test(email);
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

function requireSessionOrRedirect() {
  const session = getSession();
  if (session) return session;
  try {
    sessionStorage.setItem('sd_force_login_modal', '1');
  } catch (error) {
    // ignore storage errors
  }
  toast('Por favor, para registrar tus productos necesitas iniciar sesión', false);
  window.location.href = 'index.html#login';
  return null;
}

async function addToCart(productId, quantity = 1) {
  const session = requireSessionOrRedirect();
  if (!session) return;
  await apiRequest('/cart/items', {
    method: 'POST',
    token: session.token,
    body: { productId, quantity },
  });
  toast('Añadido al carrito', true);
}

async function updateCartItem(productId, quantity) {
  const session = requireSessionOrRedirect();
  if (!session) return;
  return apiRequest(`/cart/items/${productId}`, {
    method: 'PATCH',
    token: session.token,
    body: { quantity },
  });
}

async function removeFromCart(productId) {
  const session = requireSessionOrRedirect();
  if (!session) return;
  await apiRequest(`/cart/items/${productId}`, {
    method: 'DELETE',
    token: session.token,
  });
}

async function addFavorite(productId) {
  const session = requireSessionOrRedirect();
  if (!session) return;
  await apiRequest(`/favorites/${productId}`, {
    method: 'POST',
    token: session.token,
  });
  toast('Guardado en favoritos', true);
}

async function removeFavorite(productId) {
  const session = requireSessionOrRedirect();
  if (!session) return;
  await apiRequest(`/favorites/${productId}`, {
    method: 'DELETE',
    token: session.token,
  });
  toast('Eliminado de favoritos', true);
}

function updateHeaderUserLabel() {
  const profileBtn = $('#profileButton');
  if (!profileBtn) return;

  let label = document.getElementById('headerUserName');
  if (!label) {
    label = document.createElement('span');
    label.id = 'headerUserName';
    label.className = 'sd-user-label';
    profileBtn.insertAdjacentElement('afterend', label);
  }

  const session = getSession();
  const displayName = session?.nombre || session?.email || '';

  if (displayName) {
    label.textContent = displayName;
    label.hidden = false;
    profileBtn.setAttribute('aria-label', `Perfil de ${displayName}`);
    profileBtn.setAttribute('title', `Perfil de ${displayName}`);
  } else {
    label.textContent = '';
    label.hidden = true;
    profileBtn.setAttribute('aria-label', 'Perfil');
    profileBtn.setAttribute('title', 'Iniciar sesion');
  }
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

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

function formatCurrency(value) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }
  return currencyFormatter.format(numericValue);
}

(function initHeaderUserLabel() {
  updateHeaderUserLabel();
})();

(function initNavShortcuts() {
  const favBtn = document.getElementById('favoritesButton');
  const cartBtn = document.getElementById('cartButton');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const session = requireSessionOrRedirect();
      if (!session) return;
      window.location.href = 'favorites.html';
    });
  }
  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      const session = requireSessionOrRedirect();
      if (!session) return;
      window.location.href = 'cart.html';
    });
  }
})();

function updateBodyModalState() {
  const openModals = document.querySelectorAll('.modal:not([hidden])').length;
  if (openModals > 0) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}

function showLogoutConfirmInApp() {
  return new Promise((resolve) => {
    let modal = document.getElementById('logoutConfirmModal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'logoutConfirmModal';
      modal.className = 'modal';
      modal.hidden = true;
      modal.innerHTML = `
        <div class="modal__overlay" data-close-logout-modal></div>
        <div class="modal__panel modal__panel--confirm">
          <button class="modal__close" type="button" data-close-logout-modal-btn aria-label="Cerrar aviso">&times;</button>
          <div class="modal__content modal-confirm">
            <h2 class="auth-card__title modal-confirm__title">Cerrar sesion</h2>
            <p class="auth-card__subtitle modal-confirm__subtitle">Quieres cerrar sesion?</p>
            <div class="modal-confirm__actions">
              <button class="btn btn--primary" type="button" data-logout-confirm>Cerrar sesion</button>
              <button class="btn btn--ghost" type="button" data-logout-cancel>Cancelar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const overlay = modal.querySelector('[data-close-logout-modal]');
    const closeBtn = modal.querySelector('[data-close-logout-modal-btn]');
    const cancelBtn = modal.querySelector('[data-logout-cancel]');
    const confirmBtn = modal.querySelector('[data-logout-confirm]');

    if (!overlay || !closeBtn || !cancelBtn || !confirmBtn) {
      resolve(false);
      return;
    }

    const closeModal = (accepted) => {
      overlay.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      document.removeEventListener('keydown', handleKeydown);
      modal.setAttribute('hidden', 'true');
      updateBodyModalState();
      resolve(accepted);
    };

    const handleCancel = () => {
      closeModal(false);
    };

    const handleConfirm = () => {
      closeModal(true);
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
        closeModal(false);
      }
    };

    overlay.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeydown);

    modal.removeAttribute('hidden');
    updateBodyModalState();
    confirmBtn.focus();
  });
}

function renderUsers(users = []) {
  const tbody = $('#usersTableBody');
  const pagination = $('#usersPagination');
  const pageInfo = $('#usersPageInfo');
  const prevBtn = $('#prevUsersBtn');
  const nextBtn = $('#nextUsersBtn');
  if (!tbody || !pagination || !pageInfo || !prevBtn || !nextBtn) return;

  const SESSION_KEY = 'sd_users_page';
  const currentPage = Number.parseInt(sessionStorage.getItem(SESSION_KEY) || '1', 10);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(users.length / perPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  if (safePage !== currentPage) {
    sessionStorage.setItem(SESSION_KEY, String(safePage));
  }
  const start = (safePage - 1) * perPage;
  const visible = users.slice(start, start + perPage);

  tbody.innerHTML = '';
  visible.forEach((user) => {
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

  pagination.hidden = users.length <= perPage;
  pageInfo.textContent = `Pagina ${safePage} de ${totalPages}`;
  prevBtn.disabled = safePage <= 1;
  nextBtn.disabled = safePage >= totalPages;

  prevBtn.onclick = () => {
    if (safePage > 1) {
      sessionStorage.setItem(SESSION_KEY, String(safePage - 1));
      renderUsers(users);
    }
  };

  nextBtn.onclick = () => {
    if (safePage < totalPages) {
      sessionStorage.setItem(SESSION_KEY, String(safePage + 1));
      renderUsers(users);
    }
  };
}

(function initLoginRedirectOpeners() {
  const openers = document.querySelectorAll('[data-open-login]');
  if (!openers.length) return;

  openers.forEach((opener) => {
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      const session = getSession();
      if (session) {
        window.location.href = 'index.html';
        return;
      }
      try {
        sessionStorage.setItem('sd_force_login_modal', '1');
      } catch (error) {
        // ignore storage errors
      }
      const target = opener.getAttribute('href') || 'index.html';
      window.location.href = target;
    });
  });
})();

(function initLoginModal() {
  const trigger = $('#profileButton');
  if (!trigger) return;

  const modal = $('#loginModal');

  async function handleAuthenticatedProfileClick() {
    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const isProfilePage = currentPage === 'profile.html';

    if (isProfilePage) {
      const shouldLogout = await showLogoutConfirmInApp();
      if (!shouldLogout) return;

      clearSession();
      sessionStorage.removeItem('sd_users_page');
      sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
      updateHeaderUserLabel();
      window.location.href = 'index.html';
      return;
    }

    window.location.href = 'profile.html';
  }

  if (!modal) {
    trigger.addEventListener('click', () => {
      const session = getSession();
      if (!session) return;
      handleAuthenticatedProfileClick();
    });
    return;
  }

  const openModal = () => {
    modal.removeAttribute('hidden');
    updateBodyModalState();
  };

  const closeModal = () => {
    modal.setAttribute('hidden', 'true');
    updateBodyModalState();
  };

  trigger.addEventListener('click', () => {
    const session = getSession();
    if (session) {
      handleAuthenticatedProfileClick();
      return;
    }
    openModal();
  });

  modal.addEventListener('click', (event) => {
    const closer = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('[data-close-modal]')
      : null;
    if (closer) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });

  const forceModal = sessionStorage.getItem('sd_force_login_modal') === '1';

  if (forceModal || window.location.hash === '#login') {
    openModal();
  }

  if (forceModal) {
    sessionStorage.removeItem('sd_force_login_modal');
  }
})();

(function initScrollButtons() {
  document.addEventListener('click', (event) => {
    const trigger = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('[data-scroll-target]')
      : null;
    if (!trigger) return;
    const selector = trigger.getAttribute('data-scroll-target');
    if (!selector) return;
    const section = document.querySelector(selector);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
})();

(function initHighlights() {
  const highlightCards = document.querySelectorAll('[data-highlight]');
  if (!highlightCards.length) return;

  const statusEl = $('#runningMessage');
  let completed = 0;
  let failures = 0;
  const total = highlightCards.length;

  highlightCards.forEach((card) => {
    const sport = card.getAttribute('data-sport');
    const category = card.getAttribute('data-category');
    const list = card.querySelector('[data-role="highlight-links"]');
    if (!sport || !list) {
      completed += 1;
      return;
    }

    async function loadCard() {
      try {
        const query = buildQueryString({
          deporte: sport,
          categoria: category,
          disponible: true,
          limit: 3,
        });
        const payload = await apiRequest(`/products${query}`);
        const products = payload?.data || payload || [];
        list.innerHTML = '';
        if (!products.length) {
          const empty = document.createElement('li');
          empty.textContent = 'Sin productos disponibles.';
          list.appendChild(empty);
          return;
        }
        products.forEach((product) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          const nameSpan = document.createElement('span');
          nameSpan.textContent = product.nombre || 'Producto';
          const arrowSpan = document.createElement('span');
          arrowSpan.textContent = '→';
          button.appendChild(nameSpan);
          button.appendChild(arrowSpan);
          button.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('sd:product-detail', {
              detail: { id: product.id },
            }));
          });
          li.appendChild(button);
          list.appendChild(li);
        });
      } catch (error) {
        list.innerHTML = '';
        const err = document.createElement('li');
        err.textContent = 'Error al cargar la categoria.';
        list.appendChild(err);
        failures += 1;
      } finally {
        completed += 1;
        if (statusEl) {
          if (completed < total) {
            statusEl.textContent = `Sincronizando datos (${completed}/${total})...`;
          } else if (failures) {
            statusEl.textContent = 'Destacados cargados con incidencias.';
          } else {
            statusEl.textContent = 'Datos actualizados correctamente.';
          }
        }
      }
    }

    loadCard();
  });
})();

(function initHomeCatalog() {
  const grid = $('#homeProducts');
  if (!grid) return;

  const messageEl = $('#homeProductsMessage');
  const categorySelect = $('#homeCategoryFilter');
  const sportSelect = $('#homeSportFilter');
  const availabilitySelect = $('#homeAvailabilityFilter');
  const searchInput = $('#searchInput');
  const placeholderImage = 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';
  const suggestionControl = setupSearchSuggestions(searchInput);
  let currentSearch = '';

  function renderProducts(products = []) {
    grid.innerHTML = '';
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.productId = product.id;

      const image = document.createElement('img');
      image.className = 'product-card__image';
      image.loading = 'lazy';
      image.src = product.imagen_url || placeholderImage;
      image.alt = product.nombre || 'Producto Sport4Data';
      card.appendChild(image);

      const title = document.createElement('h3');
      title.className = 'product-card__title';
      title.textContent = product.nombre || 'Producto Sport4Data';
      card.appendChild(title);

      const price = document.createElement('p');
      price.className = 'product-card__price';
      price.textContent = formatCurrency(product.precio);
      card.appendChild(price);

      const meta = document.createElement('p');
      meta.className = 'product-card__meta';
      const metaParts = [];
      if (product.marca) {
        metaParts.push(product.marca);
      }
      if (product.deporte) {
        metaParts.push(product.deporte);
      }
      if (product.categoria) {
        metaParts.push(product.categoria);
      }
      meta.textContent = metaParts.join(' · ') || 'Sin categoria';
      card.appendChild(meta);

      const badges = document.createElement('div');
      badges.className = 'product-card__badges';

      const availability = document.createElement('span');
      availability.className = `badge ${product.disponible ? 'badge--ok' : 'badge--warn'}`;
      availability.textContent = product.disponible ? 'Disponible' : 'No disponible';
      badges.appendChild(availability);

      if (typeof product.stock === 'number') {
        const stock = document.createElement('span');
        stock.className = 'badge';
        stock.textContent = `Stock: ${product.stock}`;
        badges.appendChild(stock);
      }

      card.appendChild(badges);

      const description = document.createElement('p');
      description.className = 'product-card__description';
      description.textContent = product.descripcion || 'Sin descripcion disponible.';
      card.appendChild(description);

      const actions = document.createElement('div');
      actions.className = 'product-card__icon-actions';

      const favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.className = 'icon-round';
      favBtn.title = 'Añadir a favoritos';
      favBtn.innerHTML = '<img src="../images/icon-heart.svg" alt="Favoritos" />';
      favBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        addFavorite(product.id);
      });

      const cartBtn = document.createElement('button');
      cartBtn.type = 'button';
      cartBtn.className = 'icon-round';
      cartBtn.title = 'Añadir al carrito';
      cartBtn.innerHTML = '<img src="../images/icon-cart.svg" alt="Carrito" />';
      cartBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        addToCart(product.id, 1);
      });

      actions.appendChild(favBtn);
      actions.appendChild(cartBtn);
      card.appendChild(actions);

      grid.appendChild(card);
    });
  }

  async function loadProducts(options = {}) {
    if (typeof options.search === 'string') {
      currentSearch = options.search.trim();
    }

    const params = {
      limit: 12,
      categoria: categorySelect && categorySelect.value !== 'all' ? categorySelect.value : undefined,
      deporte: sportSelect && sportSelect.value !== 'all' ? sportSelect.value : undefined,
      disponible: availabilitySelect && availabilitySelect.value !== 'all' ? availabilitySelect.value : undefined,
      search: currentSearch || undefined,
    };

    if (messageEl) {
      if (currentSearch) {
        messageEl.textContent = `Buscando "${currentSearch}"...`;
      } else {
        messageEl.textContent = 'Cargando productos disponibles...';
      }
    }

    try {
      const payload = await apiRequest(`/products${buildQueryString(params)}`);
      const products = payload?.data || payload || [];
      renderProducts(products);
      if (messageEl) {
        if (products.length) {
          const prefix = currentSearch
            ? `Resultados para "${currentSearch}"`
            : 'Mostrando productos disponibles';
          messageEl.textContent = `${prefix}: ${products.length}`;
        } else if (currentSearch) {
          messageEl.textContent = `No hay resultados para "${currentSearch}".`;
        } else {
          messageEl.textContent = 'No hay productos para los filtros seleccionados.';
        }
      }
    } catch (error) {
      grid.innerHTML = '';
      if (messageEl) {
        messageEl.textContent = error.message || 'No se pudo cargar el catálogo.';
      }
    }
  }

  const handleFilters = () => loadProducts();
  [categorySelect, sportSelect, availabilitySelect].forEach((select) => {
    if (select) {
      select.addEventListener('change', handleFilters);
    }
  });

  if (searchInput) {
    const debouncedSearch = debounce(() => {
      loadProducts({ search: searchInput.value });
    }, 300);
    searchInput.addEventListener('input', () => debouncedSearch());
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });
  }

  document.addEventListener('sd:product-created', () => {
    loadProducts({ search: currentSearch });
  });

  loadProducts();
})();

(function initCategoryPage() {
  const view = document.querySelector('[data-category-view]');
  if (!view) return;

  const sport = (getURLParam('sport', 'running') || 'running').toLowerCase();
  const friendlyNames = {
    running: 'Running',
    montaña: 'Montaña',
    futbol: 'Fútbol',
    ciclismo: 'Ciclismo',
    baloncesto: 'Baloncesto',
  };

  const titleEl = $('#categoryTitle');
  const eyebrowEl = $('#categoryEyebrow');
  const descriptionEl = $('#categoryDescription');
  const messageEl = $('#categoryMessage');
  const grid = $('#categoryProducts');
  const typeSelect = $('#categoryTypeFilter');
  const availabilitySelect = $('#categoryAvailabilityFilter');
  const searchInput = $('#searchInputCategory');
  const suggestionControl = setupSearchSuggestions(searchInput);
  const placeholderImage = 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';

  const sportLabel = friendlyNames[sport] || sport.charAt(0).toUpperCase() + sport.slice(1);

  if (titleEl) {
    titleEl.textContent = `Colección ${sportLabel}`;
  }
  if (eyebrowEl) {
    eyebrowEl.textContent = `Colección ${sportLabel}`;
  }
  if (descriptionEl) {
    descriptionEl.textContent = `Estos son los productos disponibles para ${sportLabel}. Usa los filtros para afinar la búsqueda.`;
  }

  let currentSearch = '';

  function renderCategoryProducts(products = []) {
    grid.innerHTML = '';
    if (!products.length) {
      const empty = document.createElement('p');
      empty.className = 'product-card__description';
      empty.textContent = 'No hay productos disponibles para esta combinación.';
      grid.appendChild(empty);
      return;
    }

    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.productId = product.id;

      const image = document.createElement('img');
      image.className = 'product-card__image';
      image.loading = 'lazy';
      image.src = product.imagen_url || 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';
      image.alt = product.nombre || 'Producto Sport4Data';
      card.appendChild(image);

      const title = document.createElement('h3');
      title.className = 'product-card__title';
      title.textContent = product.nombre || 'Producto Sport4Data';
      card.appendChild(title);

      const price = document.createElement('p');
      price.className = 'product-card__price';
      price.textContent = formatCurrency(product.precio);
      card.appendChild(price);

      const meta = document.createElement('p');
      meta.className = 'product-card__meta';
      const pieces = [];
      if (product.marca) pieces.push(product.marca);
      if (product.categoria) pieces.push(product.categoria);
      if (product.color) pieces.push(product.color);
      meta.textContent = pieces.join(' · ') || 'Sin categoría';
      card.appendChild(meta);

      const badges = document.createElement('div');
      badges.className = 'product-card__badges';

      const availability = document.createElement('span');
      availability.className = `badge ${product.disponible ? 'badge--ok' : 'badge--warn'}`;
      availability.textContent = product.disponible ? 'Disponible' : 'No disponible';
      badges.appendChild(availability);

      if (typeof product.stock === 'number') {
        const stock = document.createElement('span');
        stock.className = 'badge';
        stock.textContent = `Stock: ${product.stock}`;
        badges.appendChild(stock);
      }

      card.appendChild(badges);

      const description = document.createElement('p');
      description.className = 'product-card__description';
      description.textContent = product.descripcion || 'Sin descripción disponible.';
      card.appendChild(description);

      const actions = document.createElement('div');
      actions.className = 'product-card__icon-actions';

      const favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.className = 'icon-round';
      favBtn.title = 'Añadir a favoritos';
      favBtn.innerHTML = '<img src="../images/icon-heart.svg" alt="Favoritos" />';
      favBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        addFavorite(product.id);
      });

      const cartBtn = document.createElement('button');
      cartBtn.type = 'button';
      cartBtn.className = 'icon-round';
      cartBtn.title = 'Añadir al carrito';
      cartBtn.innerHTML = '<img src="../images/icon-cart.svg" alt="Carrito" />';
      cartBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        addToCart(product.id, 1);
      });

      actions.appendChild(favBtn);
      actions.appendChild(cartBtn);
      card.appendChild(actions);

      grid.appendChild(card);
    });
  }

  async function loadCategoryProducts(options = {}) {
    if (typeof options.search === 'string') {
      currentSearch = options.search.trim();
    }
    const query = {
      deporte: sport,
      categoria: typeSelect && typeSelect.value !== 'all' ? typeSelect.value : undefined,
      disponible: availabilitySelect && availabilitySelect.value !== 'all' ? availabilitySelect.value : undefined,
      search: currentSearch || undefined,
      limit: 60,
    };

    if (messageEl) {
      messageEl.textContent = currentSearch
        ? `Buscando "${currentSearch}"...`
        : `Cargando productos de ${sportLabel}...`;
    }

    try {
      const payload = await apiRequest(`/products${buildQueryString(query)}`);
      const products = payload?.data || payload || [];
      renderCategoryProducts(products);
      if (messageEl) {
        messageEl.textContent = products.length
          ? `${products.length} productos encontrados`
          : 'No hay productos para esta selección.';
      }
    } catch (error) {
      grid.innerHTML = '';
      if (messageEl) {
        messageEl.textContent = error.message || 'No se pudo cargar el catálogo.';
      }
    }
  }

  [typeSelect, availabilitySelect].forEach((select) => {
    if (select) {
      select.addEventListener('change', () => loadCategoryProducts());
    }
  });

  if (searchInput) {
    const debouncedCategorySearch = debounce(() => {
      loadCategoryProducts({ search: searchInput.value });
    }, 300);
    searchInput.addEventListener('input', () => debouncedCategorySearch());
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });
  }

  document.addEventListener('sd:product-created', () => {
    loadCategoryProducts({ search: currentSearch });
  });

  loadCategoryProducts();
})();

(function initFavoritesPage() {
  const view = document.querySelector('[data-favorites-view]');
  if (!view) return;

  const grid = $('#favoritesGrid');
  const messageEl = $('#favoritesMessage');

  async function loadFavorites() {
    const session = requireSessionOrRedirect();
    if (!session) return;
    try {
      if (messageEl) messageEl.textContent = 'Cargando favoritos...';
      const payload = await apiRequest('/favorites', { token: session.token });
      const favorites = payload?.data || payload || [];
      grid.innerHTML = '';
      if (!favorites.length) {
        const empty = document.createElement('p');
        empty.className = 'product-card__description';
        empty.textContent = 'No tienes favoritos todavía.';
        grid.appendChild(empty);
      } else {
        favorites.forEach((fav) => {
          const product = fav.product || {};
          const card = document.createElement('article');
          card.className = 'product-card';
          card.dataset.productId = product.id;

          const image = document.createElement('img');
          image.className = 'product-card__image';
          image.loading = 'lazy';
          image.src = product.imagen_url || 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';
          image.alt = product.nombre || 'Producto Sport4Data';
          card.appendChild(image);

          const title = document.createElement('h3');
          title.className = 'product-card__title';
          title.textContent = product.nombre || 'Producto';
          card.appendChild(title);

          const price = document.createElement('p');
          price.className = 'product-card__price';
          price.textContent = formatCurrency(product.precio);
          card.appendChild(price);

          const actions = document.createElement('div');
          actions.className = 'product-card__icon-actions';

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'icon-round';
          removeBtn.title = 'Quitar de favoritos';
          removeBtn.innerHTML = '<img src="../images/icon-heart.svg" alt="Quitar" />';
          removeBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            await removeFavorite(product.id);
            loadFavorites();
          });

          const cartBtn = document.createElement('button');
          cartBtn.type = 'button';
          cartBtn.className = 'icon-round';
          cartBtn.title = 'Añadir al carrito';
          cartBtn.innerHTML = '<img src="../images/icon-cart.svg" alt="Carrito" />';
          cartBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            addToCart(product.id, 1);
          });

          actions.appendChild(removeBtn);
          actions.appendChild(cartBtn);
          card.appendChild(actions);

          grid.appendChild(card);
        });
      }
      if (messageEl) {
        messageEl.textContent = favorites.length
          ? `Total favoritos: ${favorites.length}`
          : 'Sin favoritos';
      }
    } catch (error) {
      if (messageEl) messageEl.textContent = error.message || 'No se pudieron cargar los favoritos';
      grid.innerHTML = '';
    }
  }

  loadFavorites();
})();

(function initCartPage() {
  const view = document.querySelector('[data-cart-view]');
  if (!view) return;

  const grid = $('#cartGrid');
  const messageEl = $('#cartMessage');
  const summaryEl = $('#cartSummary');
  const checkoutBtn = $('#checkoutBtn');
  let currentItems = [];

  function renderCart(items = []) {
    grid.innerHTML = '';
    let total = 0;
    items.forEach((item) => {
      const product = item.product || {};
      const price = Number(product.precio) || 0;
      total += price * item.quantity;

      const card = document.createElement('article');
      card.className = 'product-card';

      const image = document.createElement('img');
      image.className = 'product-card__image';
      image.loading = 'lazy';
      image.src = product.imagen_url || 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';
      image.alt = product.nombre || 'Producto';
      card.appendChild(image);

      const title = document.createElement('h3');
      title.className = 'product-card__title';
      title.textContent = product.nombre || 'Producto';
      card.appendChild(title);

      const priceEl = document.createElement('p');
      priceEl.className = 'product-card__price';
      priceEl.textContent = formatCurrency(price);
      card.appendChild(priceEl);

      const qtyWrap = document.createElement('div');
      qtyWrap.className = 'product-card__actions';

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = item.quantity;
      qtyInput.style.width = '80px';
      qtyInput.addEventListener('change', async () => {
        const nextQty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        qtyInput.value = String(nextQty);
        await updateCartItem(item.productId, nextQty);
        loadCart();
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn--ghost';
      removeBtn.textContent = 'Eliminar';
      removeBtn.addEventListener('click', async () => {
        await removeFromCart(item.productId);
        loadCart();
      });

      qtyWrap.appendChild(qtyInput);
      qtyWrap.appendChild(removeBtn);
      card.appendChild(qtyWrap);

      grid.appendChild(card);
    });

    if (summaryEl) {
      summaryEl.textContent = `Total: ${formatCurrency(total)}`;
    }
  }

  async function loadCart() {
    const session = requireSessionOrRedirect();
    if (!session) return;
    try {
      if (messageEl) messageEl.textContent = 'Cargando carrito...';
      const payload = await apiRequest('/cart', { token: session.token });
      currentItems = payload?.data || payload || [];
      renderCart(currentItems);
      if (messageEl) {
        messageEl.textContent = currentItems.length
          ? `Productos en carrito: ${currentItems.length}`
          : 'El carrito está vacío';
      }
    } catch (error) {
      currentItems = [];
      grid.innerHTML = '';
      if (messageEl) messageEl.textContent = error.message || 'No se pudo cargar el carrito';
    }
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const session = requireSessionOrRedirect();
      if (!session) return;
      if (!currentItems.length) {
        toast('Añade productos antes de finalizar la compra', false);
        return;
      }
      window.location.href = 'checkout.html';
    });
  }

  const goFav = $('#goFavoritesBtn');
  if (goFav) {
    goFav.addEventListener('click', () => {
      window.location.href = 'favorites.html';
    });
  }

  loadCart();
})();

(function initCheckoutPage() {
  const view = document.querySelector('[data-checkout-view]');
  if (!view) return;

  const form = $('#checkoutForm');
  const messageEl = $('#checkoutMessage');
  const summaryList = $('#checkoutSummaryList');
  const totalEl = $('#checkoutTotal');
  const emptyEl = $('#checkoutEmpty');
  const backBtn = $('#backToCartBtn');
  const yearSelect = $('#cardExpYear');
  const submitBtn = $('#confirmCheckoutBtn');
  const rememberCard = $('#rememberCard');
  const session = requireSessionOrRedirect();
  if (!session) return;

  let cartItems = [];
  let submitting = false;

  function setMessage(text) {
    if (messageEl) messageEl.textContent = text || '';
  }

  function detectCardBrand(number = '') {
    const digits = (number || '').replace(/\D/g, '');
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MasterCard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^(36|38|30[0-5])/.test(digits)) return 'Diners';
    if (/^6/.test(digits)) return 'Discover';
    if (/^35/.test(digits)) return 'JCB';
    return 'Tarjeta';
  }

  function fillYears() {
    if (!yearSelect) return;
    const current = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, idx) => current + idx);
    yearSelect.innerHTML = '<option value=\"\">Año</option>';
    years.forEach((year) => {
      const opt = document.createElement('option');
      opt.value = String(year);
      opt.textContent = String(year);
      yearSelect.appendChild(opt);
    });
  }

  function prefillFromSession() {
    const name = session?.nombre || '';
    if (name) {
      const [first, ...rest] = name.split(' ');
      const last = rest.join(' ');
      const firstInput = $('#shippingFirstName');
      const lastInput = $('#shippingLastName');
      if (firstInput && !firstInput.value) firstInput.value = first;
      if (lastInput && !lastInput.value) lastInput.value = last;
    }
    if (session?.email) {
      const emailInput = $('#shippingEmail');
      if (emailInput && !emailInput.value) emailInput.value = session.email;
    }
    if (session?.direccion) {
      const addressInput = $('#shippingAddress');
      if (addressInput && !addressInput.value) addressInput.value = session.direccion;
    }
  }

  function renderSummary(items = []) {
    if (summaryList) summaryList.innerHTML = '';
    let total = 0;
    items.forEach((item) => {
      const product = item.product || {};
      const price = Number(product.precio) || 0;
      const lineTotal = price * item.quantity;
      total += lineTotal;
      if (!summaryList) return;
      const row = document.createElement('div');
      row.className = 'summary-item';
      const title = document.createElement('div');
      title.textContent = product.nombre || 'Producto';
      const meta = document.createElement('div');
      meta.className = 'summary-item__meta';
      meta.textContent = `${item.quantity} uds x ${formatCurrency(price)}`;
      const priceEl = document.createElement('div');
      priceEl.textContent = formatCurrency(lineTotal);
      row.appendChild(title);
      row.appendChild(meta);
      row.appendChild(priceEl);
      summaryList.appendChild(row);
    });
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (emptyEl) emptyEl.hidden = items.length > 0;
    if (submitBtn) submitBtn.disabled = items.length === 0 || submitting;
  }

  async function loadCart() {
    try {
      setMessage('Cargando carrito...');
      const payload = await apiRequest('/cart', { token: session.token });
      cartItems = payload?.data || payload || [];
      renderSummary(cartItems);
      setMessage(cartItems.length ? `Productos en carrito: ${cartItems.length}` : 'Tu carrito está vacío');
    } catch (error) {
      cartItems = [];
      renderSummary(cartItems);
      setMessage(error.message || 'No se pudo cargar el carrito');
    }
  }

  function validateCheckout() {
    const requiredFields = [
      ['shippingFirstName', 'Nombre requerido'],
      ['shippingLastName', 'Apellido requerido'],
      ['shippingAddress', 'Dirección requerida'],
      ['shippingCity', 'Ciudad requerida'],
      ['shippingPostalCode', 'CP requerido'],
      ['shippingProvince', 'Provincia requerida'],
      ['shippingCountry', 'País requerido'],
      ['shippingPhone', 'Teléfono requerido'],
      ['shippingEmail', 'Email requerido'],
      ['cardHolder', 'Titular requerido'],
      ['cardNumber', 'Número de tarjeta requerido'],
      ['cardExpMonth', 'Mes requerido'],
      ['cardExpYear', 'Año requerido'],
      ['cardCvv', 'CVV requerido'],
      ['cardCountry', 'País requerido'],
    ];

    let ok = true;
    requiredFields.forEach(([id, message]) => {
      const input = document.getElementById(id);
      if (!input) return;
      if (!input.value.trim()) {
        setError(input, message);
        ok = false;
      } else {
        setError(input, '');
      }
    });

    const emailInput = $('#shippingEmail');
    if (emailInput && emailInput.value.trim()) {
      const email = normalizeEmail(emailInput.value);
      emailInput.value = email;
      if (!isValidEmail(email)) {
        setError(emailInput, 'Email no válido');
        ok = false;
      }
    }

    const postalInput = $('#shippingPostalCode');
    if (postalInput && postalInput.value.trim()) {
      const digits = postalInput.value.replace(/\\D/g, '');
      if (digits.length < 4 || digits.length > 6) {
        setError(postalInput, 'CP no válido');
        ok = false;
      }
    }

    const phoneInput = $('#shippingPhone');
    if (phoneInput && phoneInput.value.trim()) {
      const digits = phoneInput.value.replace(/\\D/g, '');
      if (digits.length < 8) {
        setError(phoneInput, 'Teléfono no válido');
        ok = false;
      }
    }

    const cardNumberInput = $('#cardNumber');
    let cardNumber = '';
    if (cardNumberInput && cardNumberInput.value.trim()) {
      cardNumber = cardNumberInput.value.replace(/\\D/g, '');
      if (cardNumber.length < 12 || cardNumber.length > 19) {
        setError(cardNumberInput, 'Número de tarjeta no válido');
        ok = false;
      } else {
        setError(cardNumberInput, '');
      }
    }

    const cvvInput = $('#cardCvv');
    if (cvvInput && cvvInput.value.trim()) {
      const digits = cvvInput.value.replace(/\\D/g, '');
      if (digits.length < 3 || digits.length > 4) {
        setError(cvvInput, 'CVV no válido');
        ok = false;
      } else {
        setError(cvvInput, '');
      }
    }

    const monthInput = $('#cardExpMonth');
    const yearInput = $('#cardExpYear');
    if (monthInput && yearInput && monthInput.value && yearInput.value) {
      const month = parseInt(monthInput.value, 10);
      const year = parseInt(yearInput.value, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (Number.isNaN(month) || month < 1 || month > 12) {
        setError(monthInput, 'Mes inválido');
        ok = false;
      }
      if (Number.isNaN(year) || year < currentYear) {
        setError(yearInput, 'Año inválido');
        ok = false;
      } else if (year === currentYear && month < currentMonth) {
        setError(monthInput, 'Tarjeta caducada');
        ok = false;
      }
    }

    if (!ok) return null;

    const shipping = {
      nombre: $('#shippingFirstName')?.value.trim() || '',
      apellidos: [$('#shippingLastName')?.value.trim(), $('#shippingLastName2')?.value.trim()]
        .filter(Boolean)
        .join(' '),
      direccion: $('#shippingAddress')?.value.trim() || '',
      ciudad: $('#shippingCity')?.value.trim() || '',
      provincia: $('#shippingProvince')?.value.trim() || '',
      pais: $('#shippingCountry')?.value || '',
      cp: $('#shippingPostalCode')?.value.trim() || '',
      telefono: $('#shippingPhone')?.value.trim() || '',
      email: $('#shippingEmail')?.value.trim() || '',
      notas: $('#shippingNotes')?.value.trim() || '',
      fechaNacimiento: $('#shippingBirth')?.value || '',
    };

    const payment = {
      method: 'card',
      holder: $('#cardHolder')?.value.trim() || '',
      brand: detectCardBrand(cardNumber),
      last4: cardNumber.slice(-4),
      expMonth: $('#cardExpMonth')?.value || '',
      expYear: $('#cardExpYear')?.value || '',
      country: $('#cardCountry')?.value || '',
      remember: rememberCard?.checked || false,
    };

    return { shipping, payment };
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting) return;
      const payload = validateCheckout();
      if (!payload) return;
      if (!cartItems.length) {
        toast('Tu carrito está vacío', false);
        return;
      }
      submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';
      }
      try {
        setMessage('Procesando pedido...');
        await apiRequest('/orders/checkout', {
          method: 'POST',
          token: session.token,
          body: payload,
        });
        toast('Pedido confirmado. ¡Gracias!', true);
        setMessage('Pedido creado correctamente. Hemos vaciado tu carrito.');
        form.reset();
        fillYears();
        await loadCart();
      } catch (error) {
        toast(error.message || 'No se pudo procesar el pedido', false);
        setMessage(error.message || 'No se pudo procesar el pedido');
      } finally {
        submitting = false;
        if (submitBtn) {
          submitBtn.disabled = !cartItems.length;
          submitBtn.textContent = 'Pagar y finalizar';
        }
      }
    });
  }

  fillYears();
  prefillFromSession();
  loadCart();
})();

(function initProductDetailModal() {
  const modal = $('#productModal');
  if (!modal) return;

  const imageEl = $('#productDetailImage');
  const categoryEl = $('#productDetailCategory');
  const nameEl = $('#productDetailName');
  const brandEl = $('#productDetailBrand');
  const descriptionEl = $('#productDetailDescription');
  const priceEl = $('#productDetailPrice');
  const stockEl = $('#productDetailStock');
  const sportEl = $('#productDetailSport');
  const colorEl = $('#productDetailColor');
  const availabilityEl = $('#productDetailAvailability');
  const placeholderImage = 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=700&q=80';
  const actionsEl = document.createElement('div');
  actionsEl.className = 'product-card__icon-actions';
  const favAction = document.createElement('button');
  favAction.type = 'button';
  favAction.className = 'icon-round';
  favAction.title = 'Añadir a favoritos';
  favAction.innerHTML = '<img src="../images/icon-heart.svg" alt="Favoritos" />';
  const cartAction = document.createElement('button');
  cartAction.type = 'button';
  cartAction.className = 'icon-round';
  cartAction.title = 'Añadir al carrito';
  cartAction.innerHTML = '<img src="../images/icon-cart.svg" alt="Carrito" />';
  actionsEl.appendChild(favAction);
  actionsEl.appendChild(cartAction);
  const detailContainer = document.querySelector('#productDetail .product-detail__body');
  if (detailContainer) {
    detailContainer.appendChild(actionsEl);
  }

  const closeModal = () => {
    modal.setAttribute('hidden', 'true');
    updateBodyModalState();
  };

  const openModal = () => {
    modal.removeAttribute('hidden');
    updateBodyModalState();
  };

  modal.addEventListener('click', (event) => {
    const closer = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('[data-close-product]')
      : null;
    if (closer) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });

  function setLoadingState(message) {
    if (nameEl) {
      nameEl.textContent = message;
    }
    if (descriptionEl) {
      descriptionEl.textContent = '';
    }
    if (brandEl) {
      brandEl.textContent = '';
    }
    if (categoryEl) {
      categoryEl.textContent = '';
    }
    if (priceEl) {
      priceEl.textContent = '';
    }
    if (stockEl) {
      stockEl.textContent = '';
    }
    if (sportEl) {
      sportEl.textContent = '';
    }
    if (colorEl) {
      colorEl.textContent = '';
    }
    if (availabilityEl) {
      availabilityEl.textContent = '';
    }
    if (imageEl) {
      imageEl.src = placeholderImage;
      imageEl.alt = 'Producto Sport4Data';
    }
  }

  function renderProduct(product) {
    if (imageEl) {
      imageEl.src = product.imagen_url || placeholderImage;
      imageEl.alt = product.nombre || 'Producto Sport4Data';
    }
    if (categoryEl) {
      categoryEl.textContent = `${product.categoria || 'Sin categoria'} · ${product.deporte || '-'}`;
    }
    if (nameEl) {
      nameEl.textContent = product.nombre || 'Producto sport4data';
    }
    if (brandEl) {
      brandEl.textContent = product.marca ? `Marca: ${product.marca}` : '';
    }
    if (descriptionEl) {
      descriptionEl.textContent = product.descripcion || 'Sin descripcion disponible.';
    }
    if (priceEl) {
      priceEl.textContent = formatCurrency(product.precio);
    }
    if (stockEl) {
      stockEl.textContent = typeof product.stock === 'number' ? `${product.stock} uds` : '-';
    }
    if (sportEl) {
      sportEl.textContent = product.deporte || '-';
    }
    if (colorEl) {
      colorEl.textContent = product.color || '-';
    }
    if (availabilityEl) {
      availabilityEl.textContent = product.disponible ? 'Disponible' : 'No disponible';
    }
    favAction.onclick = () => addFavorite(product.id);
    cartAction.onclick = () => addToCart(product.id, 1);
  }

  async function loadProduct(id) {
    if (!id) return;
    openModal();
    setLoadingState('Cargando producto...');
    try {
      const payload = await apiRequest(`/products/${id}`);
      const product = payload?.data || payload;
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      renderProduct(product);
    } catch (error) {
      setLoadingState(error.message || 'No se pudo cargar el producto.');
    }
  }

  document.addEventListener('sd:product-detail', (event) => {
    const productId = event.detail?.id;
    if (productId) {
      loadProduct(productId);
    }
  });

  ['#homeProducts', '#categoryProducts'].forEach((selector) => {
    const grid = document.querySelector(selector);
    if (!grid) return;
    grid.addEventListener('click', (event) => {
      const card = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-product-id]')
        : null;
      if (!card) return;
      const { productId } = card.dataset;
      if (productId) {
        document.dispatchEvent(new CustomEvent('sd:product-detail', {
          detail: { id: productId },
        }));
      }
    });
  });
})();

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
      sessionStorage.setItem('sd_users_page', '1');
      if (user?.rol === 'admin') {
        sessionStorage.setItem(ADMIN_TAB_SESSION_KEY, 'users');
      } else {
        sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
      }
      toast(`Bienvenido, ${user.nombre}!`, true);
      updateHeaderUserLabel();

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 900);
    } catch (error) {
      toast(error.message, false);
    }
  });

  const forgot = $('#forgotLink');
  if (forgot) {
    forgot.addEventListener('click', async (event) => {
      event.preventDefault();

      const loginInput = $('#loginId');
      let email = normalizeEmail(loginInput?.value || '');

      if (!isValidEmail(email)) {
        const typed = window.prompt('Introduce el email de tu cuenta');
        email = normalizeEmail(typed || '');
      }

      if (!isValidEmail(email)) {
        toast('Introduce un email valido', false);
        return;
      }

      try {
        const payload = await apiRequest('/auth/forgot-password', {
          method: 'POST',
          body: { email },
        });

        toast(payload?.message || 'Revisa tu correo para recuperar la contrasena', true);
      } catch (error) {
        toast(error.message || 'No se pudo enviar el correo de recuperacion', false);
      }
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

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setError($('#email'), 'Email no valido');
      ok = false;
    } else {
      $('#email').value = normalizedEmail;
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
  const shortcut = $('#profileShortcut');
  const shortcutMessage = $('#profileShortcutMessage');
  const goProfileBtn = $('#goProfileBtn');
  const logoutBtn = $('#logoutBtn');
  const adminTabsSection = $('#adminTabsSection');

  if (session) {
    if (welcomeEl) {
      welcomeEl.textContent = `Sesion iniciada como ${session.email}`;
    }
    if (form) {
      form.setAttribute('hidden', 'true');
    }
    if (shortcut) {
      shortcut.hidden = false;
    }
    if (shortcutMessage) {
      shortcutMessage.textContent = `Sesion iniciada como ${session.email}`;
    }
    if (goProfileBtn) {
      goProfileBtn.hidden = false;
    }
    if (logoutBtn) {
      logoutBtn.hidden = false;
    }
    if (adminTabsSection) {
      adminTabsSection.hidden = session.rol !== 'admin';
    }
    updateHeaderUserLabel();
  } else {
    if (welcomeEl) {
      welcomeEl.textContent = '';
    }
    if (form) {
      form.removeAttribute('hidden');
    }
    if (shortcut) {
      shortcut.hidden = true;
    }
    if (goProfileBtn) {
      goProfileBtn.hidden = true;
    }
    if (logoutBtn) {
      logoutBtn.hidden = true;
    }
    if (adminTabsSection) {
      adminTabsSection.hidden = true;
    }
    updateHeaderUserLabel();
  }
})();

(function initLogout() {
  const logoutBtn = $('#logoutBtn');
  const goProfileBtn = $('#goProfileBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      sessionStorage.removeItem('sd_users_page');
      sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
      updateHeaderUserLabel();
      window.location.href = 'index.html';
    });
  }

  if (goProfileBtn) {
    goProfileBtn.addEventListener('click', () => {
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
    section.hidden = true;
    if (tableWrap) {
      tableWrap.hidden = true;
    }
    const pagination = $('#usersPagination');
    if (pagination) {
      pagination.hidden = true;
    }
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
      const pagination = $('#usersPagination');
      if (pagination) {
        pagination.hidden = users.length <= 10;
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
      const pagination = $('#usersPagination');
      if (pagination) {
        pagination.hidden = true;
      }
      if (messageEl) {
        messageEl.textContent = error.message || 'No se pudo obtener la lista de usuarios';
      }
    }
  }

  loadUsers();
})();

(function initAdminTabs() {
  const tabsSection = $('#adminTabsSection');
  const tabsContainer = $('#adminTabs');
  const profileSection = $('#profileCard');
  const usersSection = $('#usersSection');
  const createProductSection = $('#createProductSection');
  const manageProductsSection = $('#manageProductsSection');
  const session = getSession();

  if (!tabsSection || !tabsContainer) return;

  function setActiveTab(tabName) {
    const tabButtons = tabsContainer.querySelectorAll('[data-admin-tab]');
    const availableTabs = Array.from(tabButtons).map((button) => button.dataset.adminTab);
    const allowedTabs = ['my-profile', 'users', 'create-product', 'manage-products'];
    const defaultTab = availableTabs.includes('my-profile') ? 'my-profile' : 'users';
    let safeTab = allowedTabs.includes(tabName) ? tabName : defaultTab;
    if (!availableTabs.includes(safeTab)) {
      safeTab = availableTabs.includes(defaultTab) ? defaultTab : (availableTabs[0] || defaultTab);
    }

    tabButtons.forEach((button) => {
      const isActive = button.dataset.adminTab === safeTab;
      button.classList.toggle('admin-tabs__tab--active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (profileSection) {
      profileSection.hidden = safeTab !== 'my-profile';
    }
    if (usersSection) {
      usersSection.hidden = safeTab !== 'users';
    }
    if (createProductSection) {
      createProductSection.hidden = safeTab !== 'create-product';
    }
    if (manageProductsSection) {
      manageProductsSection.hidden = safeTab !== 'manage-products';
    }
    sessionStorage.setItem(ADMIN_TAB_SESSION_KEY, safeTab);
  }

  if (!session || session.rol !== 'admin') {
    tabsSection.hidden = true;
    if (profileSection) {
      profileSection.hidden = false;
    }
    if (usersSection) {
      usersSection.hidden = true;
    }
    if (createProductSection) {
      createProductSection.hidden = true;
    }
    if (manageProductsSection) {
      manageProductsSection.hidden = true;
    }
    return;
  }

  tabsSection.hidden = false;
  const savedTab = sessionStorage.getItem(ADMIN_TAB_SESSION_KEY);
  setActiveTab(savedTab);

  tabsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-admin-tab]');
    if (!button) return;
    setActiveTab(button.dataset.adminTab);
  });
})();

(function initProductCreateForm() {
  const section = $('#createProductSection');
  const form = $('#productCreateForm');
  if (!section || !form) return;

  const session = getSession();
  if (!session || session.rol !== 'admin') {
    section.hidden = true;
    return;
  }

  const messageEl = $('#productCreateMessage');
  const nombreInput = $('#productNombre');
  const categoriaInput = $('#productCategoria');
  const deporteInput = $('#productDeporte');
  const colorInput = $('#productColor');
  const marcaInput = $('#productMarca');
  const precioInput = $('#productPrecio');
  const stockInput = $('#productStock');
  const disponibleInput = $('#productDisponible');
  const descripcionInput = $('#productDescripcion');
  const imageInput = $('#productImageFile');
  const imagePickBtn = $('#productImagePickBtn');
  const imageNameEl = $('#productImageFileName');
  const imageErrorEl = $('#productImageError');
  const imagePreview = $('#productImagePreview');
  const imagePreviewImg = $('#productImagePreviewImg');

  if (
    !nombreInput
    || !categoriaInput
    || !deporteInput
    || !colorInput
    || !marcaInput
    || !precioInput
    || !stockInput
    || !disponibleInput
    || !descripcionInput
    || !imageInput
    || !imagePickBtn
    || !imageNameEl
    || !imageErrorEl
    || !imagePreview
    || !imagePreviewImg
  ) {
    return;
  }

  let selectedImage = null;
  let previewUrl = '';

  function setMessage(text) {
    if (messageEl) {
      messageEl.textContent = text || '';
    }
  }

  function setImageError(text) {
    imageErrorEl.textContent = text || '';
  }

  function clearPreviewUrl() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  }

  function clearImage() {
    clearPreviewUrl();
    selectedImage = null;
    imageInput.value = '';
    imageNameEl.textContent = 'Ningun archivo seleccionado';
    imagePreview.hidden = true;
    imagePreviewImg.src = '';
    setImageError('');
  }

  function applySelectedImage(file) {
    clearPreviewUrl();
    selectedImage = null;
    imagePreview.hidden = true;
    imagePreviewImg.src = '';
    setImageError('');

    if (!file) {
      imageNameEl.textContent = 'Ningun archivo seleccionado';
      return;
    }

    selectedImage = file;
    imageNameEl.textContent = file.name;
    previewUrl = URL.createObjectURL(file);
    imagePreviewImg.src = previewUrl;
    imagePreview.hidden = false;
  }

  function buildValidationMessage(payload) {
    if (!payload.nombre) return 'El nombre es obligatorio';
    if (!payload.categoria) return 'Selecciona una categoria';
    if (!payload.deporte) return 'Selecciona un deporte';
    if (!payload.color) return 'El color es obligatorio';
    if (!payload.marca) return 'La marca es obligatoria';
    if (!payload.descripcion) return 'La descripcion es obligatoria';
    if (!selectedImage) return 'Selecciona una imagen del producto';
    return '';
  }

  imagePickBtn.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
    applySelectedImage(file);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const precio = Number.parseFloat(precioInput.value);
    const stock = Number.parseInt(stockInput.value, 10);
    const payload = {
      nombre: nombreInput.value.trim(),
      categoria: categoriaInput.value.trim().toLowerCase(),
      deporte: deporteInput.value.trim().toLowerCase(),
      color: colorInput.value.trim(),
      marca: marcaInput.value.trim(),
      descripcion: descripcionInput.value.trim(),
      disponible: disponibleInput.checked,
    };

    const validationMessage = buildValidationMessage(payload);
    if (validationMessage) {
      setMessage(validationMessage);
      toast(validationMessage, false);
      if (!selectedImage) {
        setImageError('Selecciona una imagen del producto');
      }
      return;
    }

    if (!Number.isFinite(precio) || precio < 0) {
      const message = 'Introduce un precio valido';
      setMessage(message);
      toast(message, false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      const message = 'Introduce un stock valido';
      setMessage(message);
      toast(message, false);
      return;
    }

    try {
      setMessage('Guardando producto...');
      const imageDataUrl = await readFileAsDataUrl(selectedImage);
      const response = await apiRequest('/products', {
        method: 'POST',
        token: session.token,
        body: {
          ...payload,
          precio: Number(precio.toFixed(2)),
          stock,
          imagen_base64: imageDataUrl,
          imagen_nombre: selectedImage.name,
          imagen_mime: selectedImage.type,
        },
      });

      const createdProduct = response?.data || response || null;
      const successName = createdProduct?.nombre || payload.nombre;
      setMessage(`Producto creado: ${successName}`);
      toast('Producto guardado correctamente', true);
      form.reset();
      clearImage();
      document.dispatchEvent(new CustomEvent('sd:product-created', {
        detail: { product: createdProduct },
      }));
    } catch (error) {
      let message = error.message || 'No se pudo crear el producto';
      if (Array.isArray(error.details) && error.details.length) {
        message = error.details
          .map((detail) => detail?.msg || detail?.message || '')
          .filter(Boolean)
          .join(' | ') || message;
      }
      setMessage(message);
      toast(message, false);
    }
  });
})();

(function initManageProducts() {
  const section = $('#manageProductsSection');
  const tableBody = $('#manageProductsTableBody');
  const messageEl = $('#manageProductsMessage');
  const editor = $('#manageProductEditor');
  const form = $('#manageProductForm');
  const cancelBtn = $('#manageCancelBtn');
  const saveBtn = $('#manageSaveBtn');
  const searchInput = $('#manageProductSearch');
  const categoryFilter = $('#manageFilterCategoria');
  const sportFilter = $('#manageFilterDeporte');
  const availabilityFilter = $('#manageFilterDisponibilidad');
  const clearFiltersBtn = $('#manageClearFiltersBtn');

  if (!section || !tableBody || !editor || !form || !cancelBtn || !saveBtn) return;

  const session = getSession();
  if (!session || session.rol !== 'admin') {
    section.hidden = true;
    return;
  }

  const PAGE_SIZE = 100;
  const placeholderImage = 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=700&q=80';
  let products = [];
  let editingProductId = null;
  let selectedEditImage = null;
  let currentEditorImageUrl = '';
  let editPreviewUrl = '';

  const idInput = $('#manageProductId');
  const nombreInput = $('#manageNombre');
  const categoriaInput = $('#manageCategoria');
  const deporteInput = $('#manageDeporte');
  const colorInput = $('#manageColor');
  const marcaInput = $('#manageMarca');
  const precioInput = $('#managePrecio');
  const stockInput = $('#manageStock');
  const disponibleInput = $('#manageDisponible');
  const descripcionInput = $('#manageDescripcion');
  const imageInput = $('#manageImageFile');
  const imagePickBtn = $('#manageImagePickBtn');
  const imageFileNameEl = $('#manageImageFileName');
  const imageErrorEl = $('#manageImageError');
  const imagePreview = $('#manageImagePreview');
  const imagePreviewImg = $('#manageImagePreviewImg');

  if (
    !idInput
    || !nombreInput
    || !categoriaInput
    || !deporteInput
    || !colorInput
    || !marcaInput
    || !precioInput
    || !stockInput
    || !disponibleInput
    || !descripcionInput
    || !imageInput
    || !imagePickBtn
    || !imageFileNameEl
    || !imageErrorEl
    || !imagePreview
    || !imagePreviewImg
  ) {
    return;
  }

  function setMessage(text) {
    if (messageEl) {
      messageEl.textContent = text || '';
    }
  }

  function normalizeFilterValue(value = '') {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .toLowerCase();
  }

  function formatFilterLabel(value = '') {
    const normalized = String(value || '')
      .trim()
      .replace(/[_-]+/g, ' ');
    if (!normalized) return '';

    return normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function syncFilterSelectOptions(selectEl, values = [], allLabel) {
    if (!selectEl) return;
    const previousValue = selectEl.value || 'all';
    const normalizedValues = Array.from(new Set(values.map((value) => normalizeFilterValue(value)).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    selectEl.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = allLabel;
    selectEl.appendChild(allOption);

    normalizedValues.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = formatFilterLabel(value);
      selectEl.appendChild(option);
    });

    if (previousValue === 'all') {
      selectEl.value = 'all';
      return;
    }

    selectEl.value = normalizedValues.includes(previousValue) ? previousValue : 'all';
  }

  function clearRows() {
    tableBody.innerHTML = '';
  }

  function renderEmptyRow(message) {
    clearRows();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function setImageError(text) {
    imageErrorEl.textContent = text || '';
  }

  function clearEditPreviewUrl() {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
      editPreviewUrl = '';
    }
  }

  function setEditorImagePreview(src) {
    const finalSrc = src || placeholderImage;
    imagePreviewImg.src = finalSrc;
    imagePreview.hidden = false;
  }

  function clearSelectedEditorImage() {
    selectedEditImage = null;
    imageInput.value = '';
    imageFileNameEl.textContent = 'Se mantendra la imagen actual';
    setImageError('');
    clearEditPreviewUrl();
    setEditorImagePreview(currentEditorImageUrl);
  }

  function ensureSelectOption(selectEl, value) {
    const normalized = (value || '').trim();
    if (!normalized) {
      selectEl.value = '';
      return;
    }

    const exists = Array.from(selectEl.options).some((option) => option.value === normalized);
    if (!exists) {
      const option = document.createElement('option');
      option.value = normalized;
      option.textContent = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      selectEl.appendChild(option);
    }
    selectEl.value = normalized;
  }

  function setEditorState(visible) {
    editor.hidden = !visible;
    if (!visible) {
      editingProductId = null;
      form.reset();
      idInput.value = '';
      currentEditorImageUrl = '';
      clearEditPreviewUrl();
      imagePreviewImg.src = '';
      imagePreview.hidden = true;
      imageFileNameEl.textContent = 'Se mantendra la imagen actual';
      setImageError('');
      selectedEditImage = null;
    }
  }

  function fillEditor(product) {
    if (!product) return;
    editingProductId = Number(product.id);
    idInput.value = String(product.id);
    nombreInput.value = product.nombre || '';
    ensureSelectOption(categoriaInput, (product.categoria || '').toLowerCase());
    ensureSelectOption(deporteInput, (product.deporte || '').toLowerCase());
    colorInput.value = product.color || '';
    marcaInput.value = product.marca || '';
    const priceValue = Number(product.precio);
    precioInput.value = Number.isFinite(priceValue) ? priceValue.toFixed(2) : '0.00';
    const stockValue = Number.parseInt(product.stock, 10);
    stockInput.value = Number.isInteger(stockValue) && stockValue >= 0 ? String(stockValue) : '0';
    descripcionInput.value = product.descripcion || '';
    disponibleInput.checked = Boolean(product.disponible);
    currentEditorImageUrl = product.imagen_url || '';
    clearSelectedEditorImage();
    setEditorState(true);
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function buildUpdatePayload() {
    const payload = {
      nombre: nombreInput.value.trim(),
      categoria: categoriaInput.value.trim().toLowerCase(),
      deporte: deporteInput.value.trim().toLowerCase(),
      color: colorInput.value.trim(),
      marca: marcaInput.value.trim(),
      descripcion: descripcionInput.value.trim(),
      disponible: disponibleInput.checked,
    };

    const priceValue = Number.parseFloat(precioInput.value);
    const stockValue = Number.parseInt(stockInput.value, 10);

    if (!payload.nombre) throw new Error('El nombre del producto es obligatorio');
    if (!payload.categoria) throw new Error('La categoria es obligatoria');
    if (!payload.deporte) throw new Error('El deporte es obligatorio');
    if (!payload.marca) throw new Error('La marca es obligatoria');
    if (!Number.isFinite(priceValue) || priceValue < 0) throw new Error('El precio no es valido');
    if (!Number.isInteger(stockValue) || stockValue < 0) throw new Error('El stock no es valido');

    payload.precio = Number(priceValue.toFixed(2));
    payload.stock = stockValue;

    if (selectedEditImage) {
      payload.imagen_base64 = await readFileAsDataUrl(selectedEditImage);
      payload.imagen_nombre = selectedEditImage.name;
      payload.imagen_mime = selectedEditImage.type;
    }

    return payload;
  }

  function setRowBusy(row, isBusy) {
    const actionButtons = row.querySelectorAll('button[data-action]');
    actionButtons.forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function renderProductsList(items = [], emptyMessage = 'No hay productos registrados') {
    clearRows();
    if (!items.length) {
      renderEmptyRow(emptyMessage);
      return;
    }

    items.forEach((product) => {
      const row = document.createElement('tr');
      row.dataset.productId = String(product.id);

      const imageCell = document.createElement('td');
      imageCell.className = 'admin-product-media';
      const img = document.createElement('img');
      img.className = 'admin-product-thumb';
      img.src = product.imagen_url || placeholderImage;
      img.alt = product.nombre || 'Producto';
      imageCell.appendChild(img);
      row.appendChild(imageCell);

      const nameCell = document.createElement('td');
      const nameWrap = document.createElement('div');
      nameWrap.className = 'admin-product-name';
      const name = document.createElement('strong');
      name.textContent = product.nombre || 'Producto sin nombre';
      const meta = document.createElement('small');
      meta.textContent = `ID ${product.id} · ${product.categoria || '-'} · ${product.deporte || '-'}`;
      nameWrap.appendChild(name);
      nameWrap.appendChild(meta);
      nameCell.appendChild(nameWrap);
      row.appendChild(nameCell);

      const actionsCell = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'admin-product-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn--ghost';
      editBtn.textContent = 'Modificar';
      editBtn.dataset.action = 'edit-product';

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn--ghost';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.dataset.action = 'delete-product';

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      actionsCell.appendChild(actions);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  }

  function getFiltersState() {
    return {
      term: searchInput ? normalizeFilterValue(searchInput.value) : '',
      categoria: categoryFilter ? normalizeFilterValue(categoryFilter.value || 'all') : 'all',
      deporte: sportFilter ? normalizeFilterValue(sportFilter.value || 'all') : 'all',
      disponibilidad: availabilityFilter ? normalizeFilterValue(availabilityFilter.value || 'all') : 'all',
    };
  }

  function hasActiveFilters(filters = getFiltersState()) {
    return Boolean(
      filters.term
      || filters.categoria !== 'all'
      || filters.deporte !== 'all'
      || filters.disponibilidad !== 'all',
    );
  }

  function updateFiltersFromProducts() {
    const categories = products
      .map((product) => product?.categoria)
      .filter(Boolean);
    const sports = products
      .map((product) => product?.deporte)
      .filter(Boolean);

    syncFilterSelectOptions(categoryFilter, categories, 'Todas las categorias');
    syncFilterSelectOptions(sportFilter, sports, 'Todos los deportes');
  }

  function matchesFilters(product, filters) {
    const categoryValue = normalizeFilterValue(product?.categoria || '');
    const sportValue = normalizeFilterValue(product?.deporte || '');
    const availableRaw = product?.disponible;
    const availableValue = availableRaw === true
      || availableRaw === 1
      || normalizeFilterValue(availableRaw) === 'true';

    if (filters.categoria !== 'all' && categoryValue !== filters.categoria) {
      return false;
    }
    if (filters.deporte !== 'all' && sportValue !== filters.deporte) {
      return false;
    }
    if (filters.disponibilidad === 'available' && !availableValue) {
      return false;
    }
    if (filters.disponibilidad === 'unavailable' && availableValue) {
      return false;
    }

    if (!filters.term) {
      return true;
    }

    const searchChunks = [
      product?.id,
      product?.nombre,
      product?.marca,
      product?.color,
      product?.descripcion,
      product?.categoria,
      product?.deporte,
    ];

    const searchTarget = searchChunks
      .map((piece) => normalizeFilterValue(piece))
      .join(' ');

    return searchTarget.includes(filters.term);
  }

  function renderFilteredProducts() {
    const filters = getFiltersState();
    const filtered = products.filter((product) => matchesFilters(product, filters));
    const usingFilters = hasActiveFilters(filters);

    renderProductsList(
      filtered,
      usingFilters ? 'No hay productos que coincidan con la busqueda/filtros' : 'No hay productos registrados',
    );

    if (!products.length) {
      setMessage('No hay productos registrados');
      return;
    }

    if (!usingFilters) {
      setMessage(`Total productos: ${products.length}`);
      return;
    }

    if (!filtered.length) {
      setMessage('No hay productos que coincidan con la busqueda/filtros');
      return;
    }

    setMessage(`Mostrando ${filtered.length} de ${products.length} productos`);
  }

  function resetFilters() {
    if (searchInput) {
      searchInput.value = '';
    }
    if (categoryFilter) {
      categoryFilter.value = 'all';
    }
    if (sportFilter) {
      sportFilter.value = 'all';
    }
    if (availabilityFilter) {
      availabilityFilter.value = 'all';
    }
  }

  function findProductById(productId) {
    return products.find((product) => Number(product.id) === Number(productId)) || null;
  }

  async function fetchAllProducts() {
    const collected = [];
    let skip = 0;

    while (true) {
      const payload = await apiRequest(`/products${buildQueryString({ limit: PAGE_SIZE, skip })}`);
      const chunk = payload?.data || payload || [];
      if (!Array.isArray(chunk) || !chunk.length) {
        break;
      }
      collected.push(...chunk);
      if (chunk.length < PAGE_SIZE) {
        break;
      }
      skip += PAGE_SIZE;
    }

    return collected;
  }

  async function loadProducts() {
    try {
      setMessage('Cargando productos...');
      products = await fetchAllProducts();
      updateFiltersFromProducts();
      renderFilteredProducts();
    } catch (error) {
      renderEmptyRow('No se pudieron cargar los productos');
      setMessage(error.message || 'No se pudo cargar la lista de productos');
    }
  }

  async function handleDeleteProduct(productId, row) {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este producto?');
    if (!confirmed) return;

    setRowBusy(row, true);
    try {
      await apiRequest(`/products/${productId}`, {
        method: 'DELETE',
        token: session.token,
      });
      products = products.filter((product) => Number(product.id) !== Number(productId));
      if (editingProductId === Number(productId)) {
        setEditorState(false);
      }
      updateFiltersFromProducts();
      renderFilteredProducts();
      toast('Producto eliminado correctamente', true);
    } catch (error) {
      toast(error.message || 'No se pudo eliminar el producto', false);
      setRowBusy(row, false);
    }
  }

  function applySelectedEditorImage(file) {
    setImageError('');
    clearEditPreviewUrl();
    selectedEditImage = null;

    if (!file) {
      imageFileNameEl.textContent = 'Se mantendra la imagen actual';
      setEditorImagePreview(currentEditorImageUrl);
      return;
    }

    selectedEditImage = file;
    imageFileNameEl.textContent = file.name;
    editPreviewUrl = URL.createObjectURL(file);
    setEditorImagePreview(editPreviewUrl);
  }

  imagePickBtn.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
    applySelectedEditorImage(file);
  });

  const debouncedFilterRender = debounce(() => {
    renderFilteredProducts();
  }, 180);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      debouncedFilterRender();
    });

    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        searchInput.value = '';
        renderFilteredProducts();
      }
    });
  }

  [categoryFilter, sportFilter, availabilityFilter].forEach((selectEl) => {
    if (!selectEl) return;
    selectEl.addEventListener('change', () => {
      renderFilteredProducts();
    });
  });

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      resetFilters();
      renderFilteredProducts();
    });
  }

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const row = button.closest('tr[data-product-id]');
    if (!row) return;
    const productId = Number.parseInt(row.dataset.productId, 10);
    if (!Number.isInteger(productId)) return;

    if (button.dataset.action === 'edit-product') {
      const product = findProductById(productId);
      if (!product) {
        toast('No se encontro el producto', false);
        return;
      }
      fillEditor(product);
      return;
    }

    if (button.dataset.action === 'delete-product') {
      handleDeleteProduct(productId, row);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!Number.isInteger(editingProductId)) {
      toast('Selecciona un producto para modificar', false);
      return;
    }

    let body;
    try {
      body = await buildUpdatePayload();
    } catch (error) {
      toast(error.message || 'Datos de producto no validos', false);
      return;
    }

    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    try {
      const response = await apiRequest(`/products/${editingProductId}`, {
        method: 'PUT',
        token: session.token,
        body,
      });
      const updated = response?.data || response;
      products = products.map((product) => (Number(product.id) === Number(editingProductId) ? updated : product));
      updateFiltersFromProducts();
      renderFilteredProducts();
      fillEditor(updated);
      toast('Producto actualizado correctamente', true);
    } catch (error) {
      toast(error.message || 'No se pudo actualizar el producto', false);
    } finally {
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => {
    setEditorState(false);
  });

  document.addEventListener('sd:product-created', () => {
    loadProducts();
  });

  resetFilters();
  updateFiltersFromProducts();
  setEditorState(false);
  loadProducts();
})();

(function initProfilePage() {
  const container = $('#profileRows');
  if (!container) return;

  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  updateHeaderUserLabel();

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
        updateHeaderUserLabel();
      }

      const successText = field.key === 'password'
        ? 'Contrasena actualizada correctamente.'
        : 'Dato actualizado correctamente.';
      toast(successText, true);

      if (currentData?.fechaActualizacion) {
        setMessage(`Ultima actualización: ${formatDateTime(currentData.fechaActualizacion)}`);
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
        setMessage(`Ultima actualización: ${formatDateTime(currentData.fechaActualizacion)}`);
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
