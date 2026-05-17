// ─────────────────────────────────────────────
// DATA LOADER
// Dynamic content rendering for portfolio
// Keeps original UI + animations untouched
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Generic JSON Loader
// ─────────────────────────────────────────────
async function loadJSON(path) {

    try {

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to load: ${path}`);
        }

        return await response.json();

    } catch (error) {

        console.error(`JSON Load Error (${path}):`, error);

        return null;
    }
}


// ─────────────────────────────────────────────
// BIO / HERO / ABOUT
// ─────────────────────────────────────────────
async function renderBio() {

    const bio = await loadJSON('./data/biodata.json');

    if (!bio) return;


    // HERO EYEBROW
    const heroEyebrow = document.querySelector('.hero-eyebrow');

    if (heroEyebrow) {
        heroEyebrow.textContent =
            `${bio.name} · ${bio.institution}`;
    }


    // HERO TITLE
    const heroName = document.querySelector('.hero-name');

    if (heroName) {

        heroName.innerHTML = `
            ${bio.heroTitle}<br>
            <em>${bio.heroAccent}</em><br>
            ${bio.heroSuffix}
        `;
    }


    // HERO ROLE
    const heroRole = document.querySelector('.hero-role');

    if (heroRole && Array.isArray(bio.roles)) {

        heroRole.innerHTML = bio.roles.join('<br>');
    }


    // ABOUT STATEMENT
    const aboutStatement =
        document.querySelector('.about-statement');

    if (aboutStatement) {

        aboutStatement.innerHTML = `
            ${bio.about}
            <em>${bio.aboutContinuation}</em>
        `;
    }


    // ABOUT TAGS
    const tagContainer =
        document.querySelector('.about-tags');

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
// PROJECTS / WORK
// ─────────────────────────────────────────────
async function renderProjects() {

    const projects =
        await loadJSON('./data/projects.json');

    if (!projects) return;


    const workList =
        document.querySelector('.work-list');

    if (!workList) return;


    workList.innerHTML = '';


    projects.forEach((project, index) => {

        const item = document.createElement('div');

        item.className = 'work-item';


        item.innerHTML = `

            <span class="wi-num">
                ${project.number || String(index + 1).padStart(2, '0')}
            </span>

            <span class="wi-title">
                ${project.title || ''}
            </span>

            <span class="wi-meta">
                ${project.metaTop || ''}<br>
                ${project.metaBottom || ''}
            </span>

        `;


        // Optional future modal support
        if (project.description) {
            item.dataset.description =
                project.description;
        }

        if (project.thumbnail) {
            item.dataset.thumbnail =
                project.thumbnail;
        }

        if (project.media) {
            item.dataset.media =
                JSON.stringify(project.media);
        }


        workList.appendChild(item);
    });


    // Re-attach hover cursor listeners
    attachCursorHoverEvents();
}



// ─────────────────────────────────────────────
// BLOGS
// ─────────────────────────────────────────────
async function renderBlogs() {

    const blogs =
        await loadJSON('./data/blogs.json');

    if (!blogs || !Array.isArray(blogs)) return;


    // FEATURED BLOG
    const featured =
        blogs.find(blog => blog.featured);


    if (featured) {

        const bfTag =
            document.querySelector('.bf-tag');

        const bfTitle =
            document.querySelector('.bf-title');


        if (bfTag) {
            bfTag.textContent =
                featured.tag || 'Latest Essay';
        }

        if (bfTitle) {

            if (featured.url) {

                bfTitle.innerHTML = `
                    <a href="${featured.url}"
                       style="color:inherit;text-decoration:none;">
                        ${featured.title}
                    </a>
                `;

            } else {

                bfTitle.textContent =
                    featured.title;
            }
        }
    }


    // BLOG GRID
    const grid =
        document.querySelector('.blog-grid');

    if (!grid) return;


    grid.innerHTML = '';


    blogs
        .filter(blog => !blog.featured)
        .forEach(blog => {

            const div =
                document.createElement('div');

            div.className = 'blog-small';


            div.innerHTML = `

                <div class="bs-date">
                    ${blog.date || ''}
                </div>

                <p class="bs-title">
                    ${blog.title || ''}
                </p>

            `;


            // Optional click support
            if (blog.url) {

                div.addEventListener('click', () => {
                    window.location.href = blog.url;
                });
            }


            grid.appendChild(div);
        });


    attachCursorHoverEvents();
}



// ─────────────────────────────────────────────
// CURRENTLY / NOW
// ─────────────────────────────────────────────
async function renderProjects() {

    const projects =
        await loadJSON('./data/projects.json');

    if (!projects) return;


    const workList =
        document.querySelector('.work-list');

    if (!workList) return;


    workList.innerHTML = '';


    projects.forEach((project, index) => {

        const item =
            document.createElement('div');

        item.className = 'work-item';


        // ─────────────────────────────────────
        // CLICKABLE PROJECTS
        // ─────────────────────────────────────
        if (
            project.links &&
            (
                project.links.github ||
                project.links.demo ||
                project.links.paper
            )
        ) {

            item.style.cursor = 'pointer';

            item.dataset.clickable = 'true';
        }


        item.innerHTML = `

            <span class="wi-num">
                ${project.number || String(index + 1).padStart(2, '0')}
            </span>

            <span class="wi-title">
                ${project.title || ''}
            </span>

            <span class="wi-meta">
                ${project.metaTop || ''}<br>
                ${project.metaBottom || ''}
            </span>

        `;


        // ─────────────────────────────────────
        // SAVE OPTIONAL DATA
        // ─────────────────────────────────────
        if (project.description) {

            item.dataset.description =
                project.description;
        }


        // ─────────────────────────────────────
        // CLICK HANDLER
        // Priority:
        // github > demo > paper
        // ─────────────────────────────────────
        item.addEventListener('click', () => {

            if (!project.links) return;


            const targetLink =

                project.links.github ||

                project.links.demo ||

                project.links.paper;


            if (targetLink) {

                window.open(
                    targetLink,
                    '_blank'
                );
            }

        });


        workList.appendChild(item);

    });


    attachCursorHoverEvents();
}

// ─────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────
async function renderContact() {

    const contact =
        await loadJSON('./data/contact.json');

    if (!contact) return;


    const links =
        document.querySelectorAll('.contact-links a');


    // EMAIL
    if (links[0] && contact.email) {
        links[0].href = contact.email;
    }


    // GITHUB
    if (links[1] && contact.github) {
        links[1].href = contact.github;
    }


    // LINKEDIN
    if (links[2] && contact.linkedin) {
        links[2].href = contact.linkedin;
    }


    // RESUME
    if (links[3] && contact.resume) {
        links[3].href = contact.resume;
    }
}



// ─────────────────────────────────────────────
// CURSOR RE-BINDING
// Because dynamic HTML replaces elements
// ─────────────────────────────────────────────
function attachCursorHoverEvents() {

    document
        .querySelectorAll(
            'a,button,.work-item,.bf-title,.blog-small'
        )
        .forEach(el => {

            el.removeEventListener(
                'mouseenter',
                addCursorHover
            );

            el.removeEventListener(
                'mouseleave',
                removeCursorHover
            );


            el.addEventListener(
                'mouseenter',
                addCursorHover
            );

            el.addEventListener(
                'mouseleave',
                removeCursorHover
            );
        });
}


function addCursorHover() {
    document.body.classList.add('cursor-hover');
}


function removeCursorHover() {
    document.body.classList.remove('cursor-hover');
}



// ─────────────────────────────────────────────
// OPTIONAL PRELOADER
// Smooth loading before showing content
// ─────────────────────────────────────────────
async function preloadAllData() {

    const files = [

        './data/biodata.json',
        './data/projects.json',
        './data/blogs.json',
        './data/now.json',
        './data/contact.json'

    ];


    return Promise.all(
        files.map(file => loadJSON(file))
    );
}



// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
async function initPortfolio() {

    try {

        await preloadAllData();

        await renderBio();

        await renderProjects();

        await renderBlogs();

        await renderNow();

        await renderContact();


        console.log(
            '%cPortfolio Loaded Successfully',
            'color:#7effd4;font-weight:bold;'
        );

    } catch (error) {

        console.error(
            'Portfolio Initialization Failed:',
            error
        );
    }

}



// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await initPortfolio();

        initializeNavigation();

    }
);