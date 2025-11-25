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

const SPORT_LABELS = {
  running: 'Running',
  montana: 'Montaña',
  futbol: 'Fútbol',
  ciclismo: 'Ciclismo',
  baloncesto: 'Baloncesto',
  natacion: 'Natación',
  crossfit: 'Crossfit',
  tenis: 'Tenis',
};

function formatSportLabel(value) {
  if (!value) return '';
  const key = String(value).toLowerCase();
  return SPORT_LABELS[key] || value;
}

function updateBodyModalState() {
  const openModals = document.querySelectorAll('.modal:not([hidden])').length;
  if (openModals > 0) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
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
  const modal = $('#loginModal');
  const trigger = $('#profileButton');
  if (!modal || !trigger) return;

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
      window.location.href = 'profile.html';
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
        metaParts.push(formatSportLabel(product.deporte));
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

  loadProducts();
})();

(function initCategoryPage() {
  const view = document.querySelector('[data-category-view]');
  if (!view) return;

  const sport = (getURLParam('sport', 'running') || 'running').toLowerCase();
  const friendlyNames = {
    running: 'Running',
    montana: 'Montaña',
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

  loadCategoryProducts();
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
      categoryEl.textContent = `${product.categoria || 'Sin categoria'} · ${formatSportLabel(product.deporte) || '-'}`;
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
      sportEl.textContent = formatSportLabel(product.deporte) || '-';
    }
    if (colorEl) {
      colorEl.textContent = product.color || '-';
    }
    if (availabilityEl) {
      availabilityEl.textContent = product.disponible ? 'Disponible' : 'No disponible';
    }
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
  const shortcut = $('#profileShortcut');
  const shortcutMessage = $('#profileShortcutMessage');
  const goProfileBtn = $('#goProfileBtn');
  const logoutBtn = $('#logoutBtn');

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
  }
})();

(function initLogout() {
  const logoutBtn = $('#logoutBtn');
  const goProfileBtn = $('#goProfileBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      sessionStorage.removeItem('sd_users_page');
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
