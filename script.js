// Application State
const appState = {
  currentVideo: null,
  queue: [],
  favorites: new Set(),
  liked: new Set(),
  allContent: [],
  filteredContent: [],
  currentFilter: "all",
  searchQuery: "",
};

// Content source paths - your scraper output will be loaded from these locations
const CONTENT_SOURCES = [
  "./content.json",
  "./catalog.json",
  "./data.json",
  "./data/content.json",
  "./data/catalog.json",
  "./data/all.json",
  "./data/movies.json",
  "./data/tv.json",
];

function safeText(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function buildId(raw) {
  const id =
    raw?.id ??
    raw?.tmdb_id ??
    raw?.tmdbId ??
    raw?.imdb_id ??
    raw?.imdbId ??
    raw?.slug ??
    raw?.key;
  if (id != null) return String(id);

  const title = safeText(raw?.title ?? raw?.name ?? raw?.primaryTitle).trim();
  const year = raw?.year ?? raw?.release_year ?? raw?.releaseYear ?? raw?.first_air_date?.slice?.(0, 4);
  return `${title || "unknown"}-${year || "unknown"}`;
}

function normalizeType(raw) {
  const t = (raw?.type ?? raw?.media_type ?? raw?.mediaType ?? raw?.kind ?? "").toString().toLowerCase();
  if (t.includes("tv") || t.includes("show") || t === "series") return "tv";
  if (t.includes("movie") || t === "film") return "movies";
  if (raw?.number_of_seasons != null || raw?.seasons != null) return "tv";
  return "movies";
}

function normalizeItem(raw) {
  const id = buildId(raw);
  const title = safeText(raw?.title ?? raw?.name ?? raw?.primaryTitle ?? raw?.original_title ?? raw?.originalTitle).trim();

  const year =
    raw?.year ??
    raw?.release_year ??
    raw?.releaseYear ??
    (typeof raw?.release_date === "string" ? Number(raw.release_date.slice(0, 4)) : undefined) ??
    (typeof raw?.first_air_date === "string" ? Number(raw.first_air_date.slice(0, 4)) : undefined);

  const thumbnail =
    raw?.thumbnail ??
    raw?.poster ??
    raw?.posterUrl ??
    raw?.poster_url ??
    raw?.backdrop ??
    raw?.backdropUrl ??
    raw?.image ??
    raw?.img ??
    "";

  const videoUrl =
    raw?.videoUrl ??
    raw?.video_url ??
    raw?.mp4 ??
    raw?.stream ??
    raw?.trailerUrl ??
    raw?.trailer_url ??
    "";

  const description =
    raw?.description ??
    raw?.overview ??
    raw?.plot ??
    raw?.summary ??
    "";

  const comingSoon =
    Boolean(raw?.comingSoon ?? raw?.coming_soon ?? raw?.upcoming) ||
    (typeof raw?.status === "string" && raw.status.toLowerCase().includes("coming"));

  return {
    id,
    title: title || id,
    type: normalizeType(raw),
    year: Number.isFinite(Number(year)) ? Number(year) : "",
    thumbnail: safeText(thumbnail),
    videoUrl: safeText(videoUrl),
    description: safeText(description),
    comingSoon,
    _raw: raw,
  };
}

function normalizePayload(payload) {
  let items = null;

  if (Array.isArray(payload)) items = payload;
  else if (payload && Array.isArray(payload.items)) items = payload.items;
  else if (payload && Array.isArray(payload.all)) items = payload.all;
  else if (payload && (Array.isArray(payload.movies) || Array.isArray(payload.tv))) {
    items = [...(payload.movies || []), ...(payload.tv || [])];
  }

  if (!Array.isArray(items)) return [];

  const normalized = items.map(normalizeItem).filter((x) => x.title && x.id);

  const seen = new Set();
  return normalized.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function loadContent() {
  // 1) If your scraper/build injects content directly:
  if (Array.isArray(window.MOVIESHOWS_CONTENT) || window.MOVIESHOWS_CONTENT?.items) {
    return normalizePayload(window.MOVIESHOWS_CONTENT);
  }

  // 2) Allow query override: ?source=/path/to/file.json
  const params = new URLSearchParams(window.location.search);
  const sourceOverride = params.get("source");
  if (sourceOverride) {
    try {
      const payload = await fetchJson(sourceOverride);
      return normalizePayload(payload);
    } catch (_) {}
  }

  // 3) Try known local paths
  for (const src of CONTENT_SOURCES) {
    try {
      const payload = await fetchJson(src);
      const normalized = normalizePayload(payload);
      if (normalized.length) return normalized;
    } catch (_) {}
  }

  return [];
}

// DOM Elements
const elements = {
    videoPlayer: document.getElementById('videoPlayer'),
    currentTitle: document.getElementById('currentTitle'),
    currentDescription: document.getElementById('currentDescription'),
    btnLike: document.getElementById('btnLike'),
    btnFavorite: document.getElementById('btnFavorite'),
    queueContainer: document.getElementById('queueContainer'),
    queueEmpty: document.getElementById('queueEmpty'),
    queueCount: document.getElementById('queueCount'),
    sidePanel: document.getElementById('sidePanel'),
    favoritesPanel: document.getElementById('favoritesPanel'),
    togglePanel: document.getElementById('togglePanel'),
    closePanel: document.getElementById('closePanel'),
    toggleFavorites: document.getElementById('toggleFavorites'),
    closeFavorites: document.getElementById('closeFavorites'),
    panelContent: document.getElementById('panelContent'),
    favoritesContent: document.getElementById('favoritesContent'),
    searchInput: document.getElementById('searchInput'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    overlay: document.getElementById('overlay'),
    favoritesCount: document.getElementById('favoritesCount')
};

// Initialize App
async function init() {
    loadState();

    elements.panelContent.innerHTML =
        '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Loading content…</p>';

    const content = await loadContent();
    appState.allContent = content;
    appState.filteredContent = content;

    renderBrowseContent();
    renderQueue();
    renderFavorites();
    updateFavoritesCount();

    setupEventListeners();
    setupDragAndDrop();
}

// Load state from localStorage
function loadState() {
    const savedFavorites = localStorage.getItem('favorites');
    const savedLiked = localStorage.getItem('liked');
    const savedQueue = localStorage.getItem('queue');
    
    if (savedFavorites) {
        appState.favorites = new Set(JSON.parse(savedFavorites));
    }
    if (savedLiked) {
        appState.liked = new Set(JSON.parse(savedLiked));
    }
    if (savedQueue) {
        appState.queue = JSON.parse(savedQueue);
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('favorites', JSON.stringify([...appState.favorites]));
    localStorage.setItem('liked', JSON.stringify([...appState.liked]));
    localStorage.setItem('queue', JSON.stringify(appState.queue));
}

// Setup Event Listeners
function setupEventListeners() {
    // Panel toggles
    elements.togglePanel.addEventListener('click', () => toggleSidePanel());
    elements.closePanel.addEventListener('click', () => toggleSidePanel());
    elements.toggleFavorites.addEventListener('click', () => toggleFavoritesPanel());
    elements.closeFavorites.addEventListener('click', () => toggleFavoritesPanel());
    
    // Overlay click to close panels
    elements.overlay.addEventListener('click', () => {
        closeAllPanels();
    });
    
    // Like and Favorite buttons
    elements.btnLike.addEventListener('click', toggleLike);
    elements.btnFavorite.addEventListener('click', toggleFavorite);
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase();
        filterContent();
    });
    
    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.currentFilter = e.target.dataset.filter;
            filterContent();
        });
    });
    
    // Video player events
    elements.videoPlayer.addEventListener('ended', playNextInQueue);
}

// Toggle Side Panel
function toggleSidePanel() {
    elements.sidePanel.classList.toggle('open');
    elements.overlay.classList.toggle('active');
}

// Toggle Favorites Panel
function toggleFavoritesPanel() {
    elements.favoritesPanel.classList.toggle('open');
    elements.overlay.classList.toggle('active');
}

// Close All Panels
function closeAllPanels() {
    elements.sidePanel.classList.remove('open');
    elements.favoritesPanel.classList.remove('open');
    elements.overlay.classList.remove('active');
}

// Filter Content
function filterContent() {
    let filtered = appState.allContent;
    
    // Apply filter
    if (appState.currentFilter !== 'all') {
        if (appState.currentFilter === 'coming-soon') {
            filtered = filtered.filter(item => item.comingSoon);
        } else {
            filtered = filtered.filter(item => item.type === appState.currentFilter);
        }
    }
    
    // Apply search
    if (appState.searchQuery) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(appState.searchQuery)
        );
    }
    
    appState.filteredContent = filtered;
    renderBrowseContent();
}

// Render Browse Content
function renderBrowseContent() {
    elements.panelContent.innerHTML = '';
    
    if (appState.filteredContent.length === 0) {
        const msg = appState.allContent.length === 0
            ? 'No content loaded. Place your scraper output as <b>content.json</b> or <b>data/content.json</b> beside this page, or set <b>window.MOVIESHOWS_CONTENT</b> before page load.'
            : 'No content matches your filters.';
        elements.panelContent.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">${msg}</p>`;
        return;
    }
    
    appState.filteredContent.forEach(item => {
        const contentItem = createContentItem(item);
        elements.panelContent.appendChild(contentItem);
    });
}

// Create Content Item Element
function createContentItem(item) {
    const div = document.createElement('div');
    div.className = 'content-item';
    div.dataset.id = item.id;
    
    const isFavorite = appState.favorites.has(item.id);
    const isLiked = appState.liked.has(item.id);
    
    div.innerHTML = `
        <img src="${item.thumbnail || 'https://via.placeholder.com/300x169?text=No+Image'}" alt="${item.title}" class="content-item-thumbnail" onerror="this.src='https://via.placeholder.com/300x169?text=No+Image'">
        <div class="content-item-info">
            <div class="content-item-title">${item.title}</div>
            <div class="content-item-meta">${item.year ? item.year + ' • ' : ''}${item.type === 'tv' ? 'TV Show' : 'Movie'}${item.comingSoon ? ' • Coming Soon' : ''}</div>
        </div>
        <div class="content-item-actions">
            <button class="content-item-btn" data-action="play" title="Play">▶️</button>
            <button class="content-item-btn ${isFavorite ? 'active' : ''}" data-action="favorite" title="Add to Favorites">❤️</button>
            <button class="content-item-btn ${isLiked ? 'active' : ''}" data-action="like" title="Like">👍</button>
            <button class="content-item-btn" data-action="add-queue" title="Add to Queue">➕</button>
        </div>
    `;
    
    // Add event listeners
    div.querySelector('[data-action="play"]').addEventListener('click', (e) => {
        e.stopPropagation();
        playVideo(item);
        closeAllPanels();
    });
    
    div.querySelector('[data-action="favorite"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteById(item.id);
        renderBrowseContent();
        renderFavorites();
        updateFavoritesCount();
    });
    
    div.querySelector('[data-action="like"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLikeById(item.id);
        renderBrowseContent();
    });
    
    div.querySelector('[data-action="add-queue"]').addEventListener('click', (e) => {
        e.stopPropagation();
        addToQueue(item);
    });
    
    // Click on item to play
    div.addEventListener('click', () => {
        playVideo(item);
        closeAllPanels();
    });
    
    return div;
}

// Play Video
function playVideo(item) {
    appState.currentVideo = item;
    elements.currentTitle.textContent = item.title;
    elements.currentDescription.textContent = item.description || '';
    
    updatePlayerButtons();
    
    if (!item.videoUrl) {
        elements.videoPlayer.removeAttribute('src');
        elements.videoPlayer.load();
        return;
    }
    
    elements.videoPlayer.src = item.videoUrl;
    if (item.thumbnail) elements.videoPlayer.poster = item.thumbnail;
    
    elements.videoPlayer.play().catch(() => {});
}

// Update Player Buttons
function updatePlayerButtons() {
    if (!appState.currentVideo) return;
    
    const isLiked = appState.liked.has(appState.currentVideo.id);
    const isFavorite = appState.favorites.has(appState.currentVideo.id);
    
    elements.btnLike.classList.toggle('active', isLiked);
    elements.btnFavorite.classList.toggle('active', isFavorite);
}

// Toggle Like
function toggleLike() {
    if (!appState.currentVideo) return;
    
    const id = appState.currentVideo.id;
    if (appState.liked.has(id)) {
        appState.liked.delete(id);
    } else {
        appState.liked.add(id);
    }
    
    updatePlayerButtons();
    saveState();
    renderBrowseContent();
}

// Toggle Like by ID
function toggleLikeById(id) {
    if (appState.liked.has(id)) {
        appState.liked.delete(id);
    } else {
        appState.liked.add(id);
    }
    saveState();
}

// Toggle Favorite
function toggleFavorite() {
    if (!appState.currentVideo) return;
    
    const id = appState.currentVideo.id;
    if (appState.favorites.has(id)) {
        appState.favorites.delete(id);
    } else {
        appState.favorites.add(id);
    }
    
    updatePlayerButtons();
    updateFavoritesCount();
    saveState();
    renderFavorites();
    renderBrowseContent();
}

// Toggle Favorite by ID
function toggleFavoriteById(id) {
    if (appState.favorites.has(id)) {
        appState.favorites.delete(id);
    } else {
        appState.favorites.add(id);
    }
    saveState();
}

// Update Favorites Count
function updateFavoritesCount() {
    elements.favoritesCount.textContent = appState.favorites.size;
}

// Add to Queue
function addToQueue(item) {
    // Check if already in queue
    if (appState.queue.some(q => q.id === item.id)) {
        return;
    }
    
    appState.queue.push(item);
    saveState();
    renderQueue();
}

// Remove from Queue
function removeFromQueue(index) {
    appState.queue.splice(index, 1);
    saveState();
    renderQueue();
}

// Render Queue
function renderQueue() {
    elements.queueCount.textContent = `${appState.queue.length} ${appState.queue.length === 1 ? 'item' : 'items'}`;
    
    if (appState.queue.length === 0) {
        elements.queueEmpty.style.display = 'block';
        elements.queueContainer.innerHTML = '';
        return;
    }
    
    elements.queueEmpty.style.display = 'none';
    elements.queueContainer.innerHTML = '';
    
    appState.queue.forEach((item, index) => {
        const queueItem = createQueueItem(item, index);
        elements.queueContainer.appendChild(queueItem);
    });
}

// Create Queue Item Element
function createQueueItem(item, index) {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.id = item.id;
    
    div.innerHTML = `
        <div class="queue-item-drag-handle">☰</div>
        <img src="${item.thumbnail || 'https://via.placeholder.com/300x169?text=No+Image'}" alt="${item.title}" class="queue-item-thumbnail" onerror="this.src='https://via.placeholder.com/300x169?text=No+Image'">
        <div class="queue-item-info">
            <div class="queue-item-title">${item.title}</div>
            <div class="queue-item-meta">${item.year ? item.year + ' • ' : ''}${item.type === 'tv' ? 'TV Show' : 'Movie'}</div>
        </div>
        <div class="queue-item-actions">
            <button class="queue-item-btn" data-action="play" title="Play Now">▶️</button>
            <button class="queue-item-btn" data-action="remove" title="Remove">✕</button>
        </div>
    `;
    
    // Event listeners
    div.querySelector('[data-action="play"]').addEventListener('click', (e) => {
        e.stopPropagation();
        playVideo(item);
        // Remove from queue if playing
        removeFromQueue(index);
    });
    
    div.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromQueue(index);
    });
    
    return div;
}

// Setup Drag and Drop
function setupDragAndDrop() {
    let draggedElement = null;
    let draggedIndex = null;
    
    // Drag start
    document.addEventListener('dragstart', (e) => {
        if (e.target.closest('.queue-item')) {
            draggedElement = e.target.closest('.queue-item');
            draggedIndex = parseInt(draggedElement.dataset.index);
            draggedElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedElement.innerHTML);
        }
    });
    
    // Drag end
    document.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            document.querySelectorAll('.queue-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            draggedElement = null;
            draggedIndex = null;
        }
    });
    
    // Drag over
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.queue-item');
        if (target && target !== draggedElement) {
            target.classList.add('drag-over');
        }
    });
    
    // Drag leave
    document.addEventListener('dragleave', (e) => {
        const target = e.target.closest('.queue-item');
        if (target) {
            target.classList.remove('drag-over');
        }
    });
    
    // Drop
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const target = e.target.closest('.queue-item');
        if (target && draggedElement && target !== draggedElement) {
            const targetIndex = parseInt(target.dataset.index);
            
            // Reorder queue
            const item = appState.queue[draggedIndex];
            appState.queue.splice(draggedIndex, 1);
            appState.queue.splice(targetIndex, 0, item);
            
            saveState();
            renderQueue();
        }
        
        // Clean up
        document.querySelectorAll('.queue-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    });
}

// Play Next in Queue
function playNextInQueue() {
    if (appState.queue.length > 0) {
        const nextItem = appState.queue.shift();
        playVideo(nextItem);
        saveState();
        renderQueue();
    }
}

// Render Favorites
function renderFavorites() {
    if (appState.favorites.size === 0) {
        elements.favoritesContent.innerHTML = '<div class="favorites-empty"><p>No favorites yet. Start liking videos!</p></div>';
        return;
    }
    
    elements.favoritesContent.innerHTML = '';
    
    const favoritesList = Array.from(appState.favorites)
        .map(id => appState.allContent.find(item => item.id === id))
        .filter(item => item !== undefined);
    
    favoritesList.forEach(item => {
        const contentItem = createContentItem(item);
        elements.favoritesContent.appendChild(contentItem);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
