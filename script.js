// ─── Data ─────────────────────────────────────────────────────────────────────
const projects = [
    {
        id: 1,
        title: "Kawa & Klimat",
        description: "Coffee shop landing page",
        url: "https://01cheese.github.io/projects10hl/web_projects/kawa_and_klimat.html",
        tags: ["landing"],
        image: null
    },
{
        id: 2,
        title: "Ticket Card",
        description: "Animation ticket",
        url: "https://01cheese.github.io/projects10hl/web_projects/ticket_card.html",
        tags: ["animation"],
        image: null
    }
];

// ─── State ────────────────────────────────────────────────────────────────────
let activeTag = "all";
let searchQuery = "";

// ─── DOM ──────────────────────────────────────────────────────────────────────
const grid           = document.getElementById("grid");
const emptyState     = document.getElementById("emptyState");
const searchInput    = document.getElementById("searchInput");
const searchMobile   = document.getElementById("searchMobile");
const clearBtn       = document.getElementById("clearBtn");
const projectCount   = document.getElementById("projectCount");
const footerCount    = document.getElementById("footerCount");
const drawerCount    = document.getElementById("drawerCount");
const modalOverlay   = document.getElementById("modalOverlay");
const modal          = document.getElementById("modal");
const modalTitle     = document.getElementById("modalTitle");
const modalUrl       = document.getElementById("modalUrl");
const modalOpenBtn   = document.getElementById("modalOpenBtn");
const modalCloseBtn  = document.getElementById("modalCloseBtn");
const previewIframe  = document.getElementById("previewIframe");
const iframeLoader   = document.getElementById("iframeLoader");
const themeToggle    = document.getElementById("themeToggle");
const burgerBtn      = document.getElementById("burgerBtn");
const drawer         = document.getElementById("drawer");
const drawerOverlay  = document.getElementById("drawerOverlay");
const drawerClose    = document.getElementById("drawerClose");
const drawerTags     = document.getElementById("drawerTags");

// ─── Theme ────────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
});

// ─── Burger / Drawer ──────────────────────────────────────────────────────────
function openDrawer() {
    drawer.classList.add("open");
    drawerOverlay.classList.add("open");
    burgerBtn.classList.add("open");
    document.body.style.overflow = "hidden";
}
function closeDrawer() {
    drawer.classList.remove("open");
    drawerOverlay.classList.remove("open");
    burgerBtn.classList.remove("open");
    document.body.style.overflow = "";
}

burgerBtn.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDomain(url) {
    try { return new URL(url).hostname.replace("www.", ""); }
    catch { return url; }
}

function filterProjects() {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
        const matchTag = activeTag === "all" || p.tags.includes(activeTag);
        const matchQ   = !q || p.title.toLowerCase().includes(q)
            || p.description.toLowerCase().includes(q)
            || p.url.toLowerCase().includes(q);
        return matchTag && matchQ;
    });
}

function updateCounts(n) {
    projectCount.textContent = n;
    const label = `${n} project${n !== 1 ? "s" : ""}`;
    footerCount.textContent = label;
    drawerCount.textContent = label;
}

// ─── Preview iframe scale ─────────────────────────────────────────────────────
function scalePreviewIframe(wrap, iframe) {
    const rect = wrap.getBoundingClientRect();
    const w = rect.width || wrap.offsetWidth || 300;
    const h = rect.height || wrap.offsetHeight || (w * 9/16);
    const scaleX = w / 1280;
    const scaleY = h / 720;
    const scale  = Math.min(scaleX, scaleY);
    iframe.style.transform = `scale(${scale})`;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderCards() {
    const filtered = filterProjects();
    const n = filtered.length;
    updateCounts(n);

    grid.innerHTML = "";
    emptyState.classList.toggle("visible", n === 0);
    if (n === 0) return;

    filtered.forEach((p, i) => {
        const card = buildCard(p, i + 1);
        grid.appendChild(card);
    });
}

function buildCard(p, num) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${(num - 1) * 0.04}s`;

    const domain   = getDomain(p.url);
    const tagsHtml = p.tags.slice(0, 2).map(t => `<span class="card-tag">${t}</span>`).join("");

    // Build thumbnail HTML
    let thumbInner = "";
    if (p.image) {
        // Static image
        thumbInner = `<img class="preview-img" src="${p.image}" alt="${p.title}" loading="lazy">`;
    } else {
        // Live iframe preview + skeleton
        thumbInner = `
            <div class="preview-iframe-wrap">
                <iframe data-src="${p.url}" title="${p.title}" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
            <div class="preview-cover"></div>
            <div class="preview-skeleton"><div class="preview-skeleton-inner"></div></div>`;
    }

    card.innerHTML = `
        <div class="card-preview">
            ${thumbInner}
            <span class="card-hover-label">open preview</span>
        </div>
        <div class="card-body">
            <div class="card-header-row">
                <span class="card-title">${p.title}</span>
                <span class="card-number">${String(num).padStart(2, "0")}</span>
            </div>
            <p class="card-desc">${p.description}</p>
            <div class="card-footer">
                <div class="card-tags">${tagsHtml}</div>
                <span class="card-url">${domain}</span>
            </div>
        </div>`;

    card.addEventListener("click", () => openModal(p));

    // Lazy-load iframe preview when card enters viewport
    if (!p.image) {
        const iframeEl  = card.querySelector("iframe");
        const skeleton  = card.querySelector(".preview-skeleton");
        const iframeWrap = card.querySelector(".preview-iframe-wrap");

        const observer = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();

            const src = iframeEl.dataset.src;
            iframeEl.src = src;

            // Scale to fit the preview box
            requestAnimationFrame(() => scalePreviewIframe(iframeWrap, iframeEl));

            // Hide skeleton once loaded (or after timeout)
            const hideTimer = setTimeout(() => skeleton.classList.add("loaded"), 4000);
            iframeEl.addEventListener("load", () => {
                clearTimeout(hideTimer);
                skeleton.classList.add("loaded");
                scalePreviewIframe(iframeWrap, iframeEl);
            }, { once: true });

            iframeEl.addEventListener("error", () => {
                clearTimeout(hideTimer);
                skeleton.classList.add("loaded");
            }, { once: true });
        }, { rootMargin: "100px" });

        observer.observe(card);
    }

    return card;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(p) {
    modalTitle.textContent = p.title;
    modalUrl.textContent   = getDomain(p.url);
    modalOpenBtn.href      = p.url;

    iframeLoader.classList.remove("hidden");
    previewIframe.src = "";
    const old = modal.querySelector(".iframe-blocked");
    if (old) old.remove();

    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        previewIframe.src = p.url;

        let fallback = setTimeout(() => {
            if (!iframeLoader.classList.contains("hidden")) showBlocked(p.url, p.title);
        }, 7000);

        previewIframe.onload = () => {
            clearTimeout(fallback);
            try {
                const doc = previewIframe.contentDocument || previewIframe.contentWindow?.document;
                if (!doc || !doc.body || doc.body.innerHTML.trim() === "") {
                    showBlocked(p.url, p.title); return;
                }
            } catch (e) { /* cross-origin — loaded fine */ }
            iframeLoader.classList.add("hidden");
        };
        previewIframe.onerror = () => { clearTimeout(fallback); showBlocked(p.url, p.title); };
    }, 150);
}

function showBlocked(url, title) {
    iframeLoader.classList.add("hidden");
    if (modal.querySelector(".iframe-blocked")) return;
    const el = document.createElement("div");
    el.className = "iframe-blocked";
    el.innerHTML = `
        <div class="block-label">Access Restricted</div>
        <h3>${title}</h3>
        <p>This site blocks embedding via iframe due to its security policy.</p>
        <a href="${url}" target="_blank" rel="noopener">Open in new tab ↗</a>`;
    modal.querySelector(".modal-body").appendChild(el);
}

function closeModal() {
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
        previewIframe.src = "";
        iframeLoader.classList.remove("hidden");
        const b = modal.querySelector(".iframe-blocked");
        if (b) b.remove();
    }, 250);
}

// ─── Tag sync helper ──────────────────────────────────────────────────────────
function setTag(tag) {
    activeTag = tag;
    // sync both desktop and mobile tag rows
    document.querySelectorAll(".tag").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tag === tag);
    });
    renderCards();
}

// ─── Events ───────────────────────────────────────────────────────────────────
// Desktop tags
document.getElementById("tagsRow").addEventListener("click", e => {
    const btn = e.target.closest(".tag");
    if (btn) setTag(btn.dataset.tag);
});

// Mobile drawer tags
drawerTags.addEventListener("click", e => {
    const btn = e.target.closest(".tag");
    if (btn) { setTag(btn.dataset.tag); closeDrawer(); }
});

// Desktop search
searchInput.addEventListener("input", e => {
    searchQuery = e.target.value;
    if (searchMobile) searchMobile.value = searchQuery;
    clearBtn.classList.toggle("visible", searchQuery.length > 0);
    renderCards();
});

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    if (searchMobile) searchMobile.value = "";
    searchQuery = "";
    clearBtn.classList.remove("visible");
    searchInput.focus();
    renderCards();
});

// Mobile search
searchMobile.addEventListener("input", e => {
    searchQuery = e.target.value;
    searchInput.value = searchQuery;
    clearBtn.classList.toggle("visible", searchQuery.length > 0);
    renderCards();
});

// Modal
modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        if (modalOverlay.classList.contains("open")) closeModal();
        else if (drawer.classList.contains("open")) closeDrawer();
    }
});

// Resize: rescale any visible preview iframes
window.addEventListener("resize", () => {
    document.querySelectorAll(".card-preview .preview-iframe-wrap").forEach(wrap => {
        const iframe = wrap.querySelector("iframe");
        if (iframe && iframe.src) scalePreviewIframe(wrap, iframe);
    });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderCards();
