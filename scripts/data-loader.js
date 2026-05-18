// ─────────────────────────────────────────────
// DATA LOADER  v3  — constellation projects
// ─────────────────────────────────────────────

async function loadJSON(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed: ${path}`);
    return await r.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─────────────────────────────────────────────
// BIO / HERO / ABOUT
// ─────────────────────────────────────────────
async function renderBio() {
  const bio = await loadJSON('./data/biodata.json');
  if (!bio) return;
  const heroEyebrow = document.querySelector('.hero-eyebrow');
  if (heroEyebrow) heroEyebrow.textContent = `${bio.name} · ${bio.institution}`;
  const heroName = document.querySelector('.hero-name');
  if (heroName) heroName.innerHTML = `${bio.heroTitle}<br><em>${bio.heroAccent}</em><br>${bio.heroSuffix}`;
  const heroRole = document.querySelector('.hero-role');
  if (heroRole && Array.isArray(bio.roles)) heroRole.innerHTML = bio.roles.join('<br>');
  const aboutStatement = document.querySelector('.about-statement');
  if (aboutStatement) aboutStatement.innerHTML = `${bio.about} <em>${bio.aboutContinuation}</em>`;
  const tagContainer = document.querySelector('.about-tags');
  if (tagContainer && Array.isArray(bio.tags)) {
    tagContainer.innerHTML = '';
    bio.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'about-tag';
      span.textContent = tag;
      tagContainer.appendChild(span);
    });
  }
}


// ─────────────────────────────────────────────
// PROJECTS — CONSTELLATION
// ─────────────────────────────────────────────
let constellationRAF = null;
let constellationCanvas = null;

async function renderProjects() {
  const projects = await loadJSON('./data/projects.json');
  if (!projects) return;

  const panel = document.getElementById('p-work');
  if (!panel) return;

  // Clear old .work-list and replace with constellation container
  const oldList = panel.querySelector('.work-list');
  if (oldList) oldList.remove();

  // Build wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'constellation-wrap';

  const canvas = document.createElement('canvas');
  canvas.className = 'constellation-canvas';
  wrapper.appendChild(canvas);

  // Detail strip (bottom overlay)
  const strip = document.createElement('div');
  strip.className = 'cs-strip hidden';
  strip.innerHTML = `
    <div class="css-inner">
      <div class="css-left">
        <span class="css-num"></span>
        <div>
          <h3 class="css-title"></h3>
          <p class="css-stack"></p>
        </div>
      </div>
      <div class="css-right">
        <p class="css-desc"></p>
        <div class="css-links"></div>
      </div>
      <button class="css-close">✕</button>
    </div>
  `;
  wrapper.appendChild(strip);

  panel.appendChild(wrapper);

  // Kick off canvas render
  initConstellation(canvas, strip, projects);
  attachCursorHoverEvents();
}

function initConstellation(canvas, strip, projects) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;

  function resize() {
    W = canvas.parentElement.offsetWidth;
    H = canvas.parentElement.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    placeStars();
  }

  // ── Star placement (Poisson-ish via rejection sampling) ──
  const MARGIN_X = 0.10;
  const MARGIN_Y = 0.15;
  const MIN_DIST = 0.13; // fraction of min(W,H)
  let stars = [];

  // seeded pseudo-random so positions are stable
  function seededRand(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  function placeStars() {
    const rand = seededRand(0xDEADBEEF);
    stars = [];
    const minD = MIN_DIST * Math.min(W, H);
    const attempts = 800;

    for (let i = 0; i < projects.length; i++) {
      let placed = false;
      for (let a = 0; a < attempts; a++) {
        const nx = (MARGIN_X + rand() * (1 - MARGIN_X * 2)) * W;
        const ny = (MARGIN_Y + rand() * (1 - MARGIN_Y * 2)) * H;
        let ok = true;
        for (let s of stars) {
          const dx = s.x - nx, dy = s.y - ny;
          if (Math.sqrt(dx*dx + dy*dy) < minD) { ok = false; break; }
        }
        if (ok) {
          stars.push({
            x: nx, y: ny,
            r: 2.5 + rand() * 2,       // star radius
            pulse: rand() * Math.PI * 2, // phase offset for twinkle
            project: projects[i],
            index: i,
            hovered: false,
            active: false
          });
          placed = true;
          break;
        }
      }
      // fallback: just place it
      if (!placed) {
        stars.push({
          x: (MARGIN_X + rand() * (1 - MARGIN_X * 2)) * W,
          y: (MARGIN_Y + rand() * (1 - MARGIN_Y * 2)) * H,
          r: 2.5 + rand() * 2,
          pulse: rand() * Math.PI * 2,
          project: projects[i],
          index: i,
          hovered: false,
          active: false
        });
      }
    }
  }

  // ── Build connection graph (k nearest neighbours) ──
  const K_NEIGHBOURS = 2;
  function getEdges() {
    const edges = [];
    for (let i = 0; i < stars.length; i++) {
      const dists = [];
      for (let j = 0; j < stars.length; j++) {
        if (i === j) continue;
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        dists.push({ j, d: Math.sqrt(dx*dx + dy*dy) });
      }
      dists.sort((a,b) => a.d - b.d);
      dists.slice(0, K_NEIGHBOURS).forEach(({ j }) => {
        if (j > i) edges.push([i, j]);
      });
    }
    return edges;
  }

  // ── Render loop ──
  const ctx = canvas.getContext('2d');
  let t = 0;
  let activeIndex = -1;

  function draw() {
    constellationRAF = requestAnimationFrame(draw);
    t += 0.008;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const edges = getEdges();

    // Draw edges
    edges.forEach(([i, j]) => {
      const a = stars[i], b = stars[j];
      const isHighlighted = (a.hovered || b.hovered || a.active || b.active ||
                              activeIndex === i || activeIndex === j);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHighlighted
        ? 'rgba(200,184,255,0.25)'
        : 'rgba(240,237,232,0.05)';
      ctx.lineWidth = isHighlighted ? 1 : 0.5;
      ctx.stroke();
    });

    // Draw stars
    stars.forEach((s, i) => {
      const twinkle = Math.sin(t * 1.5 + s.pulse) * 0.3 + 0.7;
      const isHov = s.hovered;
      const isAct = activeIndex === i;
      const baseR = s.r;
      const r = isHov ? baseR * 2.5 : isAct ? baseR * 2 : baseR;

      // Glow for hovered/active
      if (isHov || isAct) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
        grd.addColorStop(0, isAct ? 'rgba(200,184,255,0.4)' : 'rgba(126,255,212,0.3)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      if (isAct) {
        ctx.fillStyle = 'rgba(200,184,255,1)';
      } else if (isHov) {
        ctx.fillStyle = 'rgba(126,255,212,1)';
      } else {
        ctx.fillStyle = `rgba(240,237,232,${twinkle * 0.75})`;
      }
      ctx.fill();

      // Label — always show title near star
      const labelAlpha = isHov ? 1 : isAct ? 0.9 : 0.28;
      ctx.font = `${isHov ? '500 ' : ''}0.6rem "Space Mono", monospace`;
      ctx.fillStyle = isAct
        ? `rgba(200,184,255,${labelAlpha})`
        : `rgba(240,237,232,${labelAlpha})`;
      ctx.letterSpacing = '0.05em';

      // Position label — try to avoid edges
      const lx = s.x + (s.x > W * 0.75 ? -(r + 8) : (r + 8));
      const ly = s.y + (s.y > H * 0.8 ? -(r + 4) : (r - 4));
      const align = s.x > W * 0.75 ? 'right' : 'left';
      ctx.textAlign = align;
      ctx.fillText(s.project.title, lx, ly);

      // Stack hint on hover
      if (isHov) {
        ctx.font = '0.52rem "Space Mono", monospace';
        ctx.fillStyle = 'rgba(126,255,212,0.55)';
        ctx.fillText(s.project.metaBottom || '', lx, ly + 14);
      }
    });

    ctx.restore();
  }

  resize();
  draw();

  // ── Interaction ──
  function getHitStar(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const cx = mx - rect.left;
    const cy = my - rect.top;
    const HIT = 22;
    for (let i = 0; i < stars.length; i++) {
      const dx = stars[i].x - cx, dy = stars[i].y - cy;
      if (Math.sqrt(dx*dx + dy*dy) < Math.max(stars[i].r * 3, HIT)) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousemove', e => {
    const hit = getHitStar(e.clientX, e.clientY);
    stars.forEach((s, i) => s.hovered = (i === hit));
    canvas.style.cursor = hit >= 0 ? 'none' : 'none';
    if (hit >= 0) {
      document.body.classList.add('cursor-hover');
    } else {
      document.body.classList.remove('cursor-hover');
    }
  });

  canvas.addEventListener('mouseleave', () => {
    stars.forEach(s => s.hovered = false);
    document.body.classList.remove('cursor-hover');
  });

  canvas.addEventListener('click', e => {
    const hit = getHitStar(e.clientX, e.clientY);
    if (hit < 0) {
      // click empty space — close strip
      activeIndex = -1;
      stars.forEach(s => s.active = false);
      strip.classList.add('hidden');
      return;
    }
    if (activeIndex === hit) {
      // toggle off
      activeIndex = -1;
      stars.forEach(s => s.active = false);
      strip.classList.add('hidden');
      return;
    }
    activeIndex = hit;
    stars.forEach((s, i) => s.active = (i === hit));
    showStrip(stars[hit].project, strip);
  });

  // Touch support
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const hit = getHitStar(t.clientX, t.clientY);
    if (hit < 0) {
      activeIndex = -1;
      strip.classList.add('hidden');
      return;
    }
    activeIndex = hit;
    stars.forEach((s, i) => s.active = (i === hit));
    showStrip(stars[hit].project, strip);
  }, { passive: false });

  strip.querySelector('.css-close').addEventListener('click', () => {
    activeIndex = -1;
    stars.forEach(s => s.active = false);
    strip.classList.add('hidden');
  });

  // Resize
  window.addEventListener('resize', () => {
    resize();
  });
}

function showStrip(project, strip) {
  strip.querySelector('.css-num').textContent =
    project.number || '';
  strip.querySelector('.css-title').textContent =
    project.title || '';
  strip.querySelector('.css-stack').textContent =
    project.metaBottom || '';
  strip.querySelector('.css-desc').textContent =
    project.description || '';

  const linksEl = strip.querySelector('.css-links');
  linksEl.innerHTML = '';
  if (project.links) {
    if (project.links.github) {
      const a = document.createElement('a');
      a.href = project.links.github;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'css-link';
      a.textContent = 'GitHub ↗';
      linksEl.appendChild(a);
    }
    if (project.links.demo) {
      const a = document.createElement('a');
      a.href = project.links.demo;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'css-link';
      a.textContent = 'Demo ↗';
      linksEl.appendChild(a);
    }
    if (project.links.paper) {
      const a = document.createElement('a');
      a.href = project.links.paper;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'css-link';
      a.textContent = 'Paper ↗';
      linksEl.appendChild(a);
    }
  }

  strip.classList.remove('hidden');
  attachCursorHoverEvents();
}


// ─────────────────────────────────────────────
// BLOG — table listing + modal reader
// ─────────────────────────────────────────────
async function renderBlogs() {
  const blogs = await loadJSON('./data/blogs.json');
  if (!blogs || !Array.isArray(blogs)) return;
  const featuredEl = document.querySelector('.blog-featured');
  if (featuredEl) featuredEl.style.display = 'none';
  const grid = document.querySelector('.blog-grid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.className = 'blog-table';
  blogs.forEach((blog, i) => {
    const row = document.createElement('div');
    row.className = 'bt-row' + (blog.featured ? ' bt-featured' : '');
    const meta = blog.tag || blog.date || '';
    row.innerHTML = `
      <span class="bt-index">${String(i + 1).padStart(2, '0')}</span>
      <div class="bt-main">
        <span class="bt-title">${blog.title || ''}</span>
        <span class="bt-meta">${meta}</span>
      </div>
      <span class="bt-arrow">↗</span>
    `;
    row.addEventListener('click', () => openBlogModal(blog));
    grid.appendChild(row);
  });
  attachCursorHoverEvents();
}

// ─────────────────────────────────────────────
// BLOG MODAL — docx-style reader
// ─────────────────────────────────────────────
function openBlogModal(blog) {
  const existing = document.getElementById('blog-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'blog-modal';
  const content = blog.content || '<p style="color:var(--muted);font-style:italic;">This essay is coming soon. Stay tuned.</p>';
  const readTime = blog.readTime || '';
  modal.innerHTML = `
    <div class="bm-backdrop"></div>
    <div class="bm-paper">
      <div class="bm-toolbar">
        <div class="bm-toolbar-left">
          <span class="bm-doc-icon">◻</span>
          <span class="bm-doc-name">${blog.title || 'Essay'}</span>
        </div>
        <div class="bm-toolbar-right">
          ${readTime ? `<span class="bm-readtime">${readTime}</span>` : ''}
          <button class="bm-close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="bm-page">
        <div class="bm-page-inner">
          <div class="bm-meta-bar">
            <span class="bm-tag">${blog.tag || blog.date || 'Writing'}</span>
            ${blog.featured ? '<span class="bm-featured-badge">Latest</span>' : ''}
          </div>
          <h1 class="bm-h1">${blog.title || ''}</h1>
          <div class="bm-divider"></div>
          <div class="bm-body">${content}</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('bm-open')));
  modal.querySelector('.bm-backdrop').addEventListener('click', closeBlogModal);
  modal.querySelector('.bm-close').addEventListener('click', closeBlogModal);
  const onKey = e => {
    if (e.key === 'Escape') { closeBlogModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
  attachCursorHoverEvents();
}

function closeBlogModal() {
  const modal = document.getElementById('blog-modal');
  if (!modal) return;
  modal.classList.remove('bm-open');
  modal.classList.add('bm-closing');
  setTimeout(() => modal.remove(), 400);
}

// ─────────────────────────────────────────────
// CURRENTLY / NOW — activity feed
// ─────────────────────────────────────────────
async function renderNow() {
  const items = await loadJSON('./data/now.json');
  if (!items || !Array.isArray(items)) return;
  const nowGrid = document.querySelector('.now-grid');
  if (!nowGrid) return;
  const nowBlock = document.getElementById('p-now');
  if (!nowBlock) return;
  const oldStatus = nowBlock.querySelector('.now-status');
  const statusHTML = oldStatus ? oldStatus.outerHTML : '';
  if (oldStatus) oldStatus.remove();
  nowGrid.remove();
  const feed = document.createElement('div');
  feed.className = 'now-feed';
  const typeIcons = { 'Reading': '◎', 'Building': '◈', 'Listening': '◉', 'Learning': '◐' };
  items.forEach((item, i) => {
    const icon = typeIcons[item.type] || '◦';
    const row = document.createElement('div');
    row.className = 'nf-row';
    row.style.setProperty('--delay', `${i * 0.07}s`);
    row.innerHTML = `
      <div class="nf-left">
        <span class="nf-icon">${icon}</span>
        <span class="nf-type">${item.type || ''}</span>
      </div>
      <div class="nf-right">
        <span class="nf-title">${item.title || ''}</span>
        <span class="nf-detail">${item.details || ''}</span>
      </div>
    `;
    feed.appendChild(row);
  });
  const label = nowBlock.querySelector('.now-label');
  label.insertAdjacentElement('afterend', feed);
  if (statusHTML) feed.insertAdjacentHTML('afterend', statusHTML);
}

// ─────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────
async function renderContact() {
  const contact = await loadJSON('./data/contact.json');
  if (!contact) return;
  const links = document.querySelectorAll('.contact-links a');
  if (links[0] && contact.email)    links[0].href = contact.email;
  if (links[1] && contact.github)   links[1].href = contact.github;
  if (links[2] && contact.linkedin) links[2].href = contact.linkedin;
  if (links[3] && contact.resume)   links[3].href = contact.resume;
}

// ─────────────────────────────────────────────
// CURSOR
// ─────────────────────────────────────────────
function attachCursorHoverEvents() {
  document.querySelectorAll('a,button,.bt-row,.bm-close,.nf-row,.css-link').forEach(el => {
    el.removeEventListener('mouseenter', addCursorHover);
    el.removeEventListener('mouseleave', removeCursorHover);
    el.addEventListener('mouseenter', addCursorHover);
    el.addEventListener('mouseleave', removeCursorHover);
  });
}
function addCursorHover()    { document.body.classList.add('cursor-hover'); }
function removeCursorHover() { document.body.classList.remove('cursor-hover'); }

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
async function initPortfolio() {
  try {
    await renderBio();
    await renderProjects();
    await renderBlogs();
    await renderNow();
    await renderContact();
    console.log('%cPortfolio v3 — Constellation Active', 'color:#7effd4;font-weight:bold;');
  } catch (e) {
    console.error('Portfolio init failed:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initPortfolio();
  initializeNavigation();
});