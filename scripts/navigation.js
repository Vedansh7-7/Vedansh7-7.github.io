const panels = document.querySelectorAll('.panel');
const dots = document.querySelectorAll('.prog-dot');
const counter = document.getElementById('page-counter');

let current = 0;
let isTransitioning = false;


// ─────────────────────────────────────────────
// PANEL SWITCH
// ─────────────────────────────────────────────
function goTo(idx){

    if(
        isTransitioning ||
        idx === current ||
        idx < 0 ||
        idx >= panels.length
    ) return;

    isTransitioning = true;

    const prev = panels[current];
    const next = panels[idx];

    const dir = idx > current ? 1 : -1;


    // OUT
    prev.style.transform =
        `translateY(${-dir * 100}vh)`;

    prev.style.opacity = '0';


    setTimeout(() => {

        prev.classList.add('hidden');
        prev.classList.remove('active');

        prev.style.transform = '';

    }, 900);


    // IN
    next.style.transform =
        `translateY(${dir * 60}vh)`;

    next.style.opacity = '0';

    next.classList.remove('hidden');
    next.classList.add('active');


    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            next.style.transition =
                'transform 1s cubic-bezier(0.76,0,0.24,1), opacity .8s';

            next.style.transform =
                'translateY(0)';

            next.style.opacity = '1';
        });
    });


    current = idx;


    dots.forEach((dot, i) => {

        dot.classList.toggle(
            'active',
            i === current
        );
    });


    counter.textContent =
        String(current + 1).padStart(2, '0') +
        ' / ' +
        String(panels.length).padStart(2, '0');


    setTimeout(() => {

        isTransitioning = false;

        next.style.transition = '';
        next.style.transform = '';
        next.style.opacity = '';

    }, 1000);
}



// ─────────────────────────────────────────────
// INITIALIZE NAVIGATION
// ─────────────────────────────────────────────
function initializeNavigation(){


    // DOTS
    dots.forEach(dot => {

        dot.addEventListener('click', () => {

            goTo(+dot.dataset.i);

        });
    });


    // NAV LINKS
    document
        .querySelectorAll('[data-goto]')
        .forEach(link => {

            link.addEventListener('click', e => {

                e.preventDefault();

                goTo(+link.dataset.goto);

            });
        });


    // WHEEL
    let wheelAcc = 0;

    let wheelTimer;


    window.addEventListener(
        'wheel',
        e => {

            e.preventDefault();

            wheelAcc += e.deltaY;

            clearTimeout(wheelTimer);

            wheelTimer = setTimeout(() => {

                if(Math.abs(wheelAcc) > 30){

                    goTo(
                        current +
                        (wheelAcc > 0 ? 1 : -1)
                    );
                }

                wheelAcc = 0;

            }, 50);

        },
        { passive:false }
    );


    // KEYS
    window.addEventListener('keydown', e => {

        if(
            e.key === 'ArrowDown' ||
            e.key === 'PageDown'
        ){

            goTo(current + 1);
        }

        if(
            e.key === 'ArrowUp' ||
            e.key === 'PageUp'
        ){

            goTo(current - 1);
        }
    });


    // TOUCH
    let touchY = 0;


    window.addEventListener(
        'touchstart',
        e => {

            touchY =
                e.touches[0].clientY;

        },
        { passive:true }
    );


    window.addEventListener(
        'touchend',
        e => {

            const dy =
                touchY -
                e.changedTouches[0].clientY;

            if(Math.abs(dy) > 40){

                goTo(
                    current +
                    (dy > 0 ? 1 : -1)
                );
            }
        }
    );
}