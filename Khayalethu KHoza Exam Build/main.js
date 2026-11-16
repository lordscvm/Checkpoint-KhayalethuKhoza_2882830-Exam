const API_KEY = "625670ba43ad482783289aebf4b1ddb6";

const FIGMA_GAME_IDS = [
  "3498",   // Signal Drift placeholder
  "9767",   // Hollow Knight: Silksong
  "3498",   // Elden Ring
  "364091", // Balatro
  "360218", // Hades II
  "414546", // Clair Obscur: Expedition 33
  "412816", // Death Stranding 2
  "354570", // Blue Prince
  "326243", // Alan Wake II
  "413150", // Outer Wilds
  "326243", // Ghost of Tsushima placeholder
  "324902"  // Celeste
];

const navLinks = document.querySelectorAll('.nav-link');
const logo = document.querySelector('.logo');
const pages = document.querySelectorAll('.page');

const grid = document.getElementById("game-grid");
const countLabel = document.getElementById("game-count");
const errorBox = document.getElementById("error-message");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-toggle");

const heroBg = document.getElementById("hero-bg");
const heroTitle = document.getElementById("hero-title");
const heroMeta = document.getElementById("hero-meta");
const heroStats = document.getElementById("hero-stats");
const heroLogBtn = document.getElementById("hero-log-btn");
const heroLogItBtn = document.getElementById("hero-logit-btn");

const modal = document.getElementById("game-modal");
const modalBg = document.getElementById("modal-bg");
const modalTitle = document.getElementById("modal-title");
const modalMeta = document.getElementById("modal-meta");
const modalStats = document.getElementById("modal-stats");
const modalDesc = document.getElementById("modal-desc");
const modalClose = document.getElementById("modal-close");
const modalLogBtn = document.getElementById("modal-log-btn");

const profileBtn = document.getElementById("profile-btn");
const profileDrawer = document.getElementById("profile-drawer");
const drawerClose = document.getElementById("drawer-close");
const drawerStats = document.getElementById("drawer-stats");
const scrollProgress = document.getElementById("scroll-progress");

gsap.registerPlugin(ScrollTrigger, Draggable, Flip);

let currentGames = [];
let loggedGames = JSON.parse(localStorage.getItem("checkpoint_logged")) || [];
let currentFeaturedGame = null;
let currentFilter = "popular";

function makeStars(rating) {
  const n = Math.round(rating);
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function isLogged(gameId) {
  return loggedGames.includes(gameId);
}

function toggleLog(gameId) {
  const index = loggedGames.indexOf(gameId);
  if (index > -1) {
    loggedGames.splice(index, 1);
  } else {
    loggedGames.push(gameId);
  }
  localStorage.setItem("checkpoint_logged", JSON.stringify(loggedGames));
  updateUIForLogging(gameId);
  updateDrawerStats();
  if (!document.getElementById("page-log").hidden) {
    loadLoggedGames();
  }
}

function updateUIForLogging(gameId) {
  const isNowLogged = isLogged(gameId);

  if (currentFeaturedGame && currentFeaturedGame.id === gameId) {
    if (isNowLogged) {
      heroLogItBtn.textContent = "✓ Logged";
      heroLogItBtn.classList.add("logged");
    } else {
      heroLogItBtn.textContent = "✓ Log It";
      heroLogItBtn.classList.remove("logged");
    }
  }

  const cards = document.querySelectorAll(`.game-card[data-id="${gameId}"] .log-indicator`);
  cards.forEach((indicator) => {
    if (isNowLogged) {
      indicator.textContent = "✓ Logged";
      indicator.style.display = "block";
    } else {
      indicator.style.display = "none";
    }
  });
}

function updateDrawerStats() {
  const count = loggedGames.length;
  if (count === 0) {
    drawerStats.innerHTML = "<p>You haven't logged any games yet.</p>";
  } else {
    drawerStats.innerHTML = `<p><strong>${count}</strong> game${count === 1 ? "" : "s"} logged.</p>`;
  }
}

function getEsrbHTML(game, isModal = false) {
  if (!game.esrb_rating) return "";
  const ratingName = game.esrb_rating.name;
  
  if (isModal) {
    return `<span class="esrb-badge" style="margin-left:12px;">${ratingName}</span>`;
  } else {
    return `<span class="esrb-badge card">${ratingName}</span>`;
  }
}

function openModal(game) {
  modalBg.style.backgroundImage = `url('${game.background_image || ""}')`;
  modalTitle.textContent = game.name;
  modalMeta.textContent =
    (game.released ? game.released.slice(0, 4) : "TBA") +
    " · " +
    (game.genres || []).map((g) => g.name).slice(0, 3).join(" · ");
    
  modalStats.innerHTML = `
    <div class="stars" style="display:inline-flex;">${makeStars(game.rating)} <span>${game.rating.toFixed(1)}</span></div>
    ${getEsrbHTML(game, true)}
  `;
  modalDesc.textContent = game.description_raw || "No description available.";

  const isNowLogged = isLogged(game.id);
  modalLogBtn.textContent = isNowLogged ? "✓ Logged" : "+ Add to Backlog";
  modalLogBtn.classList.toggle("logged", isNowLogged);

  modalLogBtn.onclick = () => {
    toggleLog(game.id);
    const nowLogged = isLogged(game.id);
    modalLogBtn.textContent = nowLogged ? "✓ Logged" : "+ Add to Backlog";
    modalLogBtn.classList.toggle("logged", nowLogged);
  };

  modal.style.visibility = "visible";
  gsap.to(modal, { opacity: 1, duration: 0.3, ease: "power2.out" });
  gsap.fromTo(
    ".modal-content",
    { y: 40, scale: 0.95 },
    { y: 0, scale: 1, duration: 0.4, ease: "power2.out", clearProps: "transform" }
  );
}

function closeModal() {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      modal.style.visibility = "hidden";
    },
  });
}

function openDrawer() {
  profileDrawer.style.visibility = "visible";
  gsap.to(profileDrawer, { x: 0, duration: 0.3, ease: "power2.out" });
}

function closeDrawer() {
  gsap.to(profileDrawer, {
    x: "100%",
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
      profileDrawer.style.visibility = "hidden";
    },
  });
}

function showSkeletons(container) {
  container.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    skeleton.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-stars"></div>
    `;
    container.appendChild(skeleton);
  }
  gsap.to(container.querySelectorAll(".skeleton-card"), {
    opacity: 0.4,
    duration: 0.8,
    repeat: -1,
    yoyo: true,
    stagger: 0.05,
    ease: "sine.inOut",
  });
}

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";
  card.dataset.id = game.id;

  const isAAA = game.rating >= 4.5;
  const imgSrc = game.background_image || `https://placehold.co/600x400/151515/ffffff?text=${encodeURIComponent(game.name)}`;
  const isNowLogged = isLogged(game.id);

  card.innerHTML = `
    <div class="game-image">
      <img src="${imgSrc}" alt="${game.name}" loading="lazy">
      <span class="badge ${isAAA ? "badge-aaa" : "badge-indie"}">${isAAA ? "AAA" : "Indie"}</span>
      ${getEsrbHTML(game, false)}
      <span class="log-indicator" style="display:${isNowLogged ? "block" : "none"}; position:absolute; bottom:12px; left:12px; background:var(--badge-indie-bg); color:#000; font-size:0.65rem; font-weight:800; padding:4px 8px; border-radius:4px; z-index:2;">✓ Logged</span>
    </div>
    <div class="game-info">
      <h3 class="game-title">${game.name}</h3>
      <div class="stars">${makeStars(game.rating)} <span class="stars-num">${game.rating.toFixed(1)}</span></div>
    </div>
  `;

  card.addEventListener("click", () => openModal(game));
  return card;
}

function updateHero(game) {
  currentFeaturedGame = game;
  gsap.to(heroBg, {
    opacity: 0,
    duration: 0.2,
    onComplete: () => {
      heroBg.style.backgroundImage = game.background_image ? `url('${game.background_image}')` : "";
      heroBg.style.opacity = 1;
    },
  });

  gsap.to([heroTitle, heroMeta], {
    opacity: 0,
    y: 10,
    duration: 0.2,
    stagger: 0.05,
    onComplete: () => {
      heroTitle.textContent = game.name;
      heroMeta.textContent =
        (game.released ? game.released.slice(0, 4) : "TBA") +
        " · " +
        (game.genres || []).map((g) => g.name).slice(0, 3).join(" · ");
      heroStats.innerHTML = `
        <div class="stars" style="display:inline-flex;">${makeStars(game.rating)} <span>${game.rating.toFixed(1)}</span></div>
        ${getEsrbHTML(game, true)}
      `;
      gsap.to([heroTitle, heroMeta, heroStats], {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      });
    },
  });
}

function loadFigmaGames() {
  showSkeletons(grid);
  errorBox.hidden = true;

  const fetchPromises = FIGMA_GAME_IDS.map(id => 
    fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`).then(res => res.ok ? res.json() : null)
  );

  Promise.all(fetchPromises)
    .then(results => {
      gsap.killTweensOf(".skeleton-card");
      const safeGames = results.filter(g => g !== null).filter((game) => {
        if (!game.esrb_rating) return true;
        return game.esrb_rating.slug !== "adults-only";
      });

      if (safeGames.length === 0) {
        grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><p>No games found.</p></div>`;
        countLabel.textContent = "0 Games";
        return;
      }

      if (safeGames[0]) updateHero(safeGames[0]);

      currentGames = safeGames;
      grid.innerHTML = "";
      safeGames.forEach((game) => grid.appendChild(createGameCard(game)));

      countLabel.textContent = `${safeGames.length} Games`;

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(grid.querySelectorAll(".game-card"), {
          y: 40, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all"
        });
      }
    })
    .catch((err) => {
      console.error("RAWG API Error:", err);
      gsap.killTweensOf(".skeleton-card");
      
      grid.innerHTML = `
        <div class="error-state" style="grid-column:1/-1;">
          <p>RAWG API is busy or blocking the request (Rate Limit).</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="window.location.reload()">Try Again</button>
        </div>
      `;
      countLabel.textContent = "0 Games";
    });
}

function loadGames(searchQuery = "", filter = currentFilter) {
  if (!searchQuery && filter === "popular") {
    loadFigmaGames();
    return;
  }

  let url = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=24&ordering=-rating`;

  if (filter === "new") {
    url = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=24&ordering=-released`;
  }

  if (searchQuery) {
    url += `&search=${searchQuery}`;
  }

  errorBox.hidden = true;
  showSkeletons(grid);

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Network error");
      return res.json();
    })
    .then((data) => {
      gsap.killTweensOf(".skeleton-card");

      const safeGames = (data.results || []).filter((game) => {
        if (!game.esrb_rating) return true;
        return game.esrb_rating.slug !== "adults-only";
      }).slice(0, 12);

      if (safeGames.length === 0) {
        grid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><p>No games found.</p></div>`;
        countLabel.textContent = "0 Games";
        return;
      }

      if (safeGames[0]) {
        fetch(`https://api.rawg.io/api/games/${safeGames[0].id}?key=${API_KEY}`)
          .then((res) => res.json())
          .then((fullGame) => updateHero(fullGame));
      }

      currentGames = safeGames;
      grid.innerHTML = "";
      safeGames.forEach((game) => grid.appendChild(createGameCard(game)));

      countLabel.textContent = `${safeGames.length} Games`;

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(grid.querySelectorAll(".game-card"), {
          y: 40, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all"
        });
      }
    })
    .catch((err) => {
      console.error(err);
      gsap.killTweensOf(".skeleton-card");
      grid.innerHTML = `
        <div class="error-state" style="grid-column:1/-1;">
          <p>Network error. Could not load games.</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="window.location.reload()">Try Again</button>
        </div>
      `;
      countLabel.textContent = "0 Games";
    });
}

function loadNews() {
  const newsGrid = document.getElementById("news-grid");
  showSkeletons(newsGrid);

  const newsContainer = document.createElement("div");
  newsContainer.style.gridColumn = "1 / -1";
  newsContainer.style.display = "flex";
  newsContainer.style.flexDirection = "column";
  newsContainer.style.gap = "24px";

  const reviewsHeader = document.createElement("h3");
  reviewsHeader.textContent = "Popular Reviews & Releases";
  reviewsHeader.style.fontFamily = "var(--font-display)";
  reviewsHeader.style.fontSize = "1.25rem";
  reviewsHeader.style.marginBottom = "8px";
  newsContainer.appendChild(reviewsHeader);

  const reviewsGrid = document.createElement("div");
  reviewsGrid.className = "grid";
  newsContainer.appendChild(reviewsGrid);

  const reviewsUrl = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=8&ordering=-rating&dates=2024-01-01,2026-12-31`;

  fetch(reviewsUrl)
    .then(r => r.json())
    .then((reviewsData) => {
      gsap.killTweensOf(".skeleton-card");
      newsGrid.innerHTML = "";

      const safeReviews = (reviewsData.results || []).filter(game => {
        if (!game.esrb_rating) return true;
        return game.esrb_rating.slug !== "adults-only";
      }).slice(0, 8);

      if (safeReviews.length > 0) {
        safeReviews.forEach(game => reviewsGrid.appendChild(createGameCard(game)));
      } else {
        reviewsGrid.innerHTML = `<p style="color:var(--text-secondary);">No recent reviews available.</p>`;
      }

      newsGrid.appendChild(newsContainer);

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(newsContainer.querySelectorAll(".game-card"), {
          y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out", clearProps: "all"
        });
      }
    })
    .catch(() => {
      gsap.killTweensOf(".skeleton-card");
      newsGrid.innerHTML = `<p style="color:var(--text-secondary);">Could not load news.</p>`;
    });
}

function loadRecommendations() {
  const recoGrid = document.getElementById("reco-grid");
  showSkeletons(recoGrid);

  const url = `https://api.rawg.io/api/games?key=${API_KEY}&page_size=12&ordering=-metacritic&metacritic=80,100`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      gsap.killTweensOf(".skeleton-card");
      recoGrid.innerHTML = "";
      
      const safeGames = (data.results || []).filter((game) => {
        if (!game.esrb_rating) return true;
        return game.esrb_rating.slug !== "adults-only";
      }).slice(0, 10);

      safeGames.forEach((game) => recoGrid.appendChild(createGameCard(game)));

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.from(recoGrid.querySelectorAll(".game-card"), {
          y: 40, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all"
        });
      }
    });
}

function loadLoggedGames() {
  const logGrid = document.getElementById("log-grid");
  const logCount = document.getElementById("log-count");
  logGrid.innerHTML = "";
  logCount.textContent = `${loggedGames.length} Games`;

  if (loggedGames.length === 0) {
    logGrid.innerHTML = `<div class="error-state" style="grid-column:1/-1;"><p>You haven't logged any games yet.</p></div>`;
    return;
  }

  loggedGames.forEach((gameId) => {
    fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`)
      .then((res) => res.json())
      .then((game) => {
        logGrid.appendChild(createGameCard(game));
      });
  });
}

function switchPage(pageName) {
  pages.forEach((p) => {
    p.hidden = true;
    p.classList.remove("active");
  });
  navLinks.forEach((l) => l.classList.remove("active"));

  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.hidden = false;
    targetPage.classList.add("active");
  }

  const activeLink = Array.from(navLinks).find((l) => l.dataset.page === pageName);
  if (activeLink) activeLink.classList.add("active");

  if (pageName === "home") loadGames("", currentFilter);
  if (pageName === "news") loadNews();
  if (pageName === "recommendations") loadRecommendations();
  if (pageName === "log") loadLoggedGames();

  ScrollTrigger.refresh();
}

function animateHero() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.from(".topnav", { y: -20, opacity: 0, duration: 0.5, ease: "power2.out" });
  gsap.from(".spotlight-title", { y: 20, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
  gsap.from(".spotlight-meta", { y: 20, opacity: 0, duration: 0.5, delay: 0.4, ease: "power2.out" });
  gsap.from(".spotlight-stats", { y: 20, opacity: 0, duration: 0.5, delay: 0.5, ease: "power2.out" });
  gsap.from(".spotlight-actions > *", { y: 20, opacity: 0, duration: 0.5, delay: 0.6, stagger: 0.1, ease: "power2.out" });

  const logoPath = document.querySelector(".logo-icon polyline");
  if (logoPath) {
    gsap.set(logoPath, { strokeDasharray: "100", strokeDashoffset: "100" });
    gsap.to(logoPath, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".library",
        start: "top 80%",
        end: "top 20%",
        scrub: 1,
      },
    });
  }

  gsap.to(scrollProgress, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
    },
  });
}

function initDraggableTabs() {
  const filterRow = document.querySelector(".filter-tabs");
  if (!filterRow) return;

  Draggable.create(filterRow, {
    type: "x",
    bounds: { minX: -50, maxX: 0 },
    edgeResistance: 0.65,
    dragResistance: 0.3,
    cursor: "grab",
    activeCursor: "grabbing",
  });
}

let searchTimer;
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    searchInput.hidden = !searchInput.hidden;
    if (!searchInput.hidden) searchInput.focus();
    else {
      searchInput.value = "";
      if (!document.getElementById("page-home").hidden) loadGames("", currentFilter);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (!document.getElementById("page-home").hidden) {
        loadGames(e.target.value.trim(), currentFilter);
      }
    }, 400);
  });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("tab-active"));
    tab.classList.add("tab-active");
    currentFilter = tab.dataset.filter;
    loadGames(searchInput.value.trim(), currentFilter);
  });
});

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

if (logo) {
  logo.addEventListener("click", (e) => {
    e.preventDefault();
    switchPage("home");
  });
}

if (heroLogItBtn) {
  heroLogItBtn.addEventListener("click", () => {
    if (currentFeaturedGame) toggleLog(currentFeaturedGame.id);
  });
}

if (heroLogBtn) {
  heroLogBtn.addEventListener("click", () => {
    if (currentFeaturedGame) toggleLog(currentFeaturedGame.id);
  });
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

if (profileBtn) profileBtn.addEventListener("click", openDrawer);
if (drawerClose) drawerClose.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal.style.visibility === "visible") closeModal();
    if (profileDrawer.style.visibility === "visible") closeDrawer();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  animateHero();
  initDraggableTabs();
  loadGames("", "popular");
  updateDrawerStats();
});
