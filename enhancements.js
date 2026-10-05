// Enhancements layer — loaded after the inline page script.
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const EMAIL = 'sanjitoffl@gmail.com';

    // ---------- Smooth scroll (Lenis) ----------
    let lenis = null;
    if (window.Lenis && !reduceMotion) {
        lenis = new Lenis({
            duration: 1.15,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        const raf = time => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }

    function scrollToTarget(target) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (lenis) {
            lenis.start();
            lenis.scrollTo(el || 0, { offset: el ? -20 : 0 });
        } else if (el) {
            el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }

    // Route every in-page link and progress checkpoint through one smooth scroller.
    // Capture phase runs before the inline handlers so they don't fight over the scroll.
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"], .checkpoint');
        if (!link || e.target.closest('.leaflet-container')) return;
        const id = link.classList.contains('checkpoint')
            ? `#${link.dataset.section}`
            : link.getAttribute('href');
        e.preventDefault();
        e.stopPropagation();
        setMenu(false);
        scrollToTarget(id === '#' ? null : id);
    }, true);

    // ---------- Loader: boot sequence -> name slam -> panel sweep ----------
    const loaderEl = document.querySelector('.loader-overlay');
    if (loaderEl && !loaderEl.classList.contains('hidden')) {
        lenis?.stop();
        // Repeat visits in the same session get the short version
        let fast = false;
        try {
            fast = sessionStorage.getItem('sanjit-intro-seen') === '1';
            sessionStorage.setItem('sanjit-intro-seen', '1');
        } catch (err) { /* storage blocked */ }

        const logEl = loaderEl.querySelector('.ld-log');
        const countEl = loaderEl.querySelector('.ld-count');
        const barEl = loaderEl.querySelector('.ld-bar span');
        let pageLoaded = document.readyState === 'complete';
        window.addEventListener('load', () => { pageLoaded = true; });
        setTimeout(() => { pageLoaded = true; }, 3500); // slow map tiles shouldn't hold the intro hostage

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            loaderEl.classList.add('hidden');
            setTimeout(() => lenis?.start(), 900);
        };
        const slam = () => {
            if (finished) return;
            loaderEl.classList.add('phase-name');
            setTimeout(finish, fast ? 700 : 1350);
        };

        loaderEl.addEventListener('click', finish);
        window.addEventListener('keydown', finish, { once: true });
        loaderEl.addEventListener('pointermove', e => {
            loaderEl.style.setProperty('--mx', `${e.clientX}px`);
            loaderEl.style.setProperty('--my', `${e.clientY}px`);
        });

        if (reduceMotion) {
            finish();
        } else if (fast) {
            loaderEl.classList.add('fast');
            requestAnimationFrame(slam);
        } else {
            const lines = [
                ['boot', 'sanjit.dev'],
                ['loading', 'products'],
                ['compiling', 'android apps'],
                ['wiring', 'full-stack apis'],
                ['training', 'ai features'],
                ['ready', '&#10022; welcome in'],
            ];
            lines.forEach(([verb, what], i) => setTimeout(() => {
                if (finished) return;
                const row = document.createElement('div');
                row.className = 'ld-line';
                row.innerHTML = `<span class="ld-prompt">&rsaquo;</span> ${verb} <b>${what}</b>${i < lines.length - 1 ? ' <i>ok</i>' : ''}`;
                logEl.appendChild(row);
            }, 150 + i * 200));

            // Counter eases toward 100 over ~1.4s, but holds at 92 until the page has actually loaded
            let shown = 0;
            const start = performance.now();
            const step = now => {
                if (finished) return;
                const t = Math.min(1, (now - start) / 1400);
                const desired = Math.min(pageLoaded ? 100 : 92, 100 * (1 - Math.pow(1 - t, 2)));
                shown += (desired - shown) * 0.2;
                if (desired === 100 && shown > 99.4) shown = 100;
                const label = String(Math.round(shown)).padStart(3, '0');
                countEl.textContent = label;
                countEl.dataset.count = label;
                countEl.style.setProperty('--p', `${shown}%`);
                barEl.style.transform = `scaleX(${shown / 100})`;
                if (shown === 100) {
                    setTimeout(slam, 180);
                } else {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        }
    }

    // ---------- Hero entrance ----------
    const heroName = document.querySelector('.hero-name');
    if (heroName) {
        let w = 0;
        const splitWords = node => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(part));
                        } else {
                            const word = document.createElement('span');
                            word.className = 'word';
                            word.innerHTML = `<span style="--w:${w++}"></span>`;
                            word.firstChild.textContent = part;
                            frag.appendChild(word);
                        }
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    splitWords(child);
                }
            });
        };
        splitWords(heroName);
    }
    document.querySelectorAll('.tech-badges .tech-badge').forEach((b, i) => b.style.setProperty('--b', i));

    let heroPlayed = false;
    function playHero() {
        if (heroPlayed) return;
        heroPlayed = true;
        document.body.classList.add('is-loaded');
        setTimeout(() => document.body.classList.add('hero-settled'), 2000);
    }

    const loader = document.querySelector('.loader-overlay');
    if (loader && !loader.classList.contains('hidden')) {
        new MutationObserver((_, obs) => {
            if (loader.classList.contains('hidden')) {
                setTimeout(playHero, 650); // lands as the exit panels clear the screen
                obs.disconnect();
            }
        }).observe(loader, { attributes: true, attributeFilter: ['class'] });
        setTimeout(playHero, 9000); // failsafe if the loader never hides
    } else {
        playHero();
    }

    // ---------- Theme switch with circular reveal ----------
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn && document.startViewTransition && !reduceMotion) {
        // Document capture phase reliably runs before the inline toggle handler on the button
        document.addEventListener('click', e => {
            if (!e.target.closest('#theme-toggle')) return;
            e.stopPropagation();
            const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            const rect = themeBtn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

            const transition = document.startViewTransition(() => {
                document.body.setAttribute('data-theme', next);
                try { localStorage.setItem('theme', next); } catch (err) { /* storage blocked */ }
                if (typeof window.updateIcon === 'function') window.updateIcon(next);
            });
            transition.ready.then(() => {
                document.documentElement.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
                    { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            });
        }, true);
    }

    // ---------- Toast ----------
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    let toastTimer;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(EMAIL);
            showToast('📋 Email copied to clipboard!');
            return true;
        } catch (e) {
            window.location.href = `mailto:${EMAIL}`;
            return false;
        }
    }

    // ---------- Role rotator ----------
    const rotator = document.getElementById('role-rotator');
    const roles = ['products end-to-end', 'full-stack web apps', 'native Android apps', 'AI-powered features', 'hackathon-winning prototypes'];

    if (rotator && !reduceMotion) {
        let roleIndex = 0;

        const typeRole = (text, i = 0) => {
            rotator.textContent = text.slice(0, i);
            if (i < text.length) {
                setTimeout(() => typeRole(text, i + 1), 55);
            } else {
                setTimeout(eraseRole, 1800);
            }
        };

        const eraseRole = () => {
            const current = rotator.textContent;
            if (current.length > 0) {
                rotator.textContent = current.slice(0, -1);
                setTimeout(eraseRole, 28);
            } else {
                roleIndex = (roleIndex + 1) % roles.length;
                typeRole(roles[roleIndex]);
            }
        };

        setTimeout(eraseRole, 2600);
    }

    // ---------- Mobile menu ----------
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    function setMenu(open) {
        if (!menuToggle || !mobileMenu) return;
        mobileMenu.classList.toggle('open', open);
        mobileMenu.setAttribute('aria-hidden', String(!open));
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('menu-open', open);
        if (lenis) open ? lenis.stop() : lenis.start();
    }

    // Menu links close the menu via the shared in-page link handler above
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    }

    // ---------- Count-up stats ----------
    const counters = document.querySelectorAll('.count-up');

    function runCounter(el) {
        const target = Number(el.dataset.target);
        const decimals = Number(el.dataset.decimals || 0);
        if (reduceMotion) {
            el.textContent = target.toFixed(decimals);
            return;
        }
        const duration = 1400;
        const start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (target * eased).toFixed(decimals);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });

    counters.forEach(el => counterObserver.observe(el));

    // ---------- Project cards: reveal, filter, tilt ----------
    const cards = Array.from(document.querySelectorAll('.project-card'));
    const filterButtons = document.querySelectorAll('.filter-btn');

    const cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach((card, i) => {
        card.style.setProperty('--d', `${(i % 3) * 0.1}s`);
        cardObserver.observe(card);
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filterButtons.forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-pressed', String(active));
            });
            cards.forEach(card => {
                const match = filter === 'all' || card.dataset.category.split(' ').includes(filter);
                card.classList.toggle('is-hidden', !match);
                card.classList.remove('pop-in');
                if (match) {
                    card.classList.add('revealed');
                    void card.offsetWidth; // restart animation
                    card.classList.add('pop-in');
                }
            });
            projectsGrid.scrollTo({ left: 0 });
            updateCarousel();
        });
    });

    // Phone carousel chrome: "swipe" hint, progress bar and "3 / 9" counter (hidden by CSS on larger screens)
    const projectsGrid = document.querySelector('.projects-grid');
    const carouselMeta = document.createElement('div');
    carouselMeta.className = 'carousel-meta';
    carouselMeta.setAttribute('aria-hidden', 'true');
    carouselMeta.innerHTML = '<span class="carousel-hint">swipe <span>&rarr;</span></span><div class="carousel-progress"><span></span></div><span class="carousel-count"></span>';
    projectsGrid.after(carouselMeta);
    const carouselFill = carouselMeta.querySelector('.carousel-progress span');
    const carouselCount = carouselMeta.querySelector('.carousel-count');

    function updateCarousel() {
        const visible = cards.filter(c => !c.classList.contains('is-hidden'));
        const max = projectsGrid.scrollWidth - projectsGrid.clientWidth;
        const progress = max > 0 ? projectsGrid.scrollLeft / max : 1;
        const index = Math.min(visible.length, Math.round(progress * (visible.length - 1)) + 1);
        carouselFill.style.transform = `scaleX(${Math.max(1 / visible.length, progress)})`;
        carouselCount.textContent = `${index} / ${visible.length}`;
    }

    let carouselTicking = false;
    projectsGrid.addEventListener('scroll', () => {
        if (carouselTicking) return;
        carouselTicking = true;
        requestAnimationFrame(() => { updateCarousel(); carouselTicking = false; });
    }, { passive: true });
    updateCarousel();

    if (finePointer && !reduceMotion) {
        cards.forEach(card => {
            card.addEventListener('pointermove', e => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
                card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }

    // ---------- Copy email ----------
    const copyBtn = document.querySelector('.copy-email');
    if (copyBtn) {
        const action = copyBtn.querySelector('.copy-email-action');
        copyBtn.addEventListener('click', async () => {
            if (await copyEmail()) {
                copyBtn.classList.add('copied');
                action.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    action.innerHTML = '<i class="far fa-copy"></i> Copy';
                }, 2000);
            }
        });
    }

    // ---------- Back to top with progress outline ----------
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.type = 'button';
    backToTop.setAttribute('aria-label', 'Back to top');
    backToTop.innerHTML = `
        <svg viewBox="0 0 60 60" preserveAspectRatio="none" aria-hidden="true">
            <rect x="3" y="3" width="54" height="54" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"></rect>
        </svg>
        <i class="fas fa-arrow-up"></i>`;
    document.body.appendChild(backToTop);
    const progressRect = backToTop.querySelector('rect');

    backToTop.addEventListener('click', () => scrollToTarget(null));

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? window.scrollY / max : 0;
            backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.8);
            progressRect.style.strokeDashoffset = String(100 - progress * 100);
            scrollTicking = false;
        });
    }, { passive: true });

    // ---------- Custom cursor ----------
    if (finePointer && !reduceMotion) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor-box';
        cursor.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cursor);

        let mouseX = 0, mouseY = 0, curX = 0, curY = 0, following = false;
        const interactive = 'a, button, .project-card, .tag, .tech-badge, .stat-box, .checkpoint, .timeline-item-flat';

        // Eases toward the pointer, then goes idle once it has caught up (no rAF loop burning frames at rest)
        const follow = () => {
            curX += (mouseX - curX) * 0.22;
            curY += (mouseY - curY) * 0.22;
            if (Math.abs(mouseX - curX) < 0.1 && Math.abs(mouseY - curY) < 0.1) {
                curX = mouseX;
                curY = mouseY;
                following = false;
            } else {
                requestAnimationFrame(follow);
            }
            cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
        };

        document.addEventListener('pointermove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.classList.add('active');
            cursor.classList.toggle('hovering', !!e.target.closest(interactive));
            if (!following) {
                following = true;
                requestAnimationFrame(follow);
            }
        }, { passive: true });
        document.addEventListener('pointerdown', () => cursor.classList.add('pressed'));
        document.addEventListener('pointerup', () => cursor.classList.remove('pressed'));
        document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('active'));
    }

    // ---------- Hero playground: parallax, draggable stickers, talking portrait, live clock ----------
    const heroWrap = document.querySelector('.hero-image-wrapper');
    const stickers = Array.from(document.querySelectorAll('.hero-image-wrapper .sticker'));

    // Live Chennai time
    const clockEl = document.getElementById('chennai-time');
    if (clockEl) {
        const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        const tick = () => { clockEl.textContent = `${fmt.format(new Date()).toUpperCase()} IST`; };
        tick();
        setInterval(tick, 20000);
    }

    // Talking portrait
    const bubble = document.getElementById('speech-bubble');
    const portrait = document.querySelector('.hero-photo');
    const lines = [
        'Hey there! 👋 Click me again',
        'I ship products end-to-end 🚀',
        'Won NextGen Hackathon @ NIT Trichy 🏆',
        'Currently building Android apps in Kotlin 📱',
        'Ask me about ATHLENTIQ 🎯',
        'Psst… my resume is one click away 📄',
    ];
    let lineIndex = 0;
    let bubbleTimer;

    function say(text) {
        if (!bubble) return;
        bubble.textContent = text;
        bubble.classList.remove('show');
        void bubble.offsetWidth; // replay pop animation
        bubble.classList.add('show');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 3600);
    }

    if (portrait && bubble) {
        portrait.addEventListener('click', () => {
            say(lines[lineIndex]);
            lineIndex = (lineIndex + 1) % lines.length;
        });
        // One friendly hello after the hero entrance
        setTimeout(() => {
            if (window.scrollY < 200) {
                say(lines[0]);
                lineIndex = 1;
            }
        }, 3400);
    }

    if (heroWrap && finePointer && !reduceMotion) {
        const hero = document.querySelector('.hero');
        let dragging = null;

        // Depth parallax: stickers drift against the mouse, the frame tilts toward it.
        // Coalesced to one update per frame (high-rate mice can fire several moves per frame).
        let parallaxPoint = null;
        const applyParallax = () => {
            const p = parallaxPoint;
            parallaxPoint = null;
            if (!p || dragging) return;
            const r = heroWrap.getBoundingClientRect();
            const nx = (p.x - (r.left + r.width / 2)) / window.innerWidth;
            const ny = (p.y - (r.top + r.height / 2)) / window.innerHeight;
            heroWrap.style.setProperty('--tilt-x', `${(-ny * 6).toFixed(2)}deg`);
            heroWrap.style.setProperty('--tilt-y', `${(nx * 8).toFixed(2)}deg`);
            stickers.forEach(st => {
                const depth = Number(st.dataset.depth || 15);
                st.style.setProperty('--px', `${(-nx * depth * 2).toFixed(1)}px`);
                st.style.setProperty('--py', `${(-ny * depth * 2).toFixed(1)}px`);
            });
        };
        hero.addEventListener('pointermove', e => {
            if (dragging) return;
            if (!parallaxPoint) requestAnimationFrame(applyParallax);
            parallaxPoint = { x: e.clientX, y: e.clientY };
        }, { passive: true });
        hero.addEventListener('pointerleave', () => {
            parallaxPoint = null;
            heroWrap.style.setProperty('--tilt-x', '0deg');
            heroWrap.style.setProperty('--tilt-y', '0deg');
            stickers.forEach(st => {
                st.style.setProperty('--px', '0px');
                st.style.setProperty('--py', '0px');
            });
        });

        // Drag & toss: stickers follow the pointer, wobble with speed, then spring home
        stickers.forEach(st => {
            st.classList.add('is-draggable');
            st.addEventListener('pointerdown', e => {
                e.preventDefault();
                st.setPointerCapture(e.pointerId);
                dragging = { st, x: e.clientX, y: e.clientY, lastX: e.clientX };
                st.classList.remove('returning');
                st.classList.add('dragging');
                document.querySelector('.drag-hint')?.classList.add('hidden');
            });
            st.addEventListener('pointermove', e => {
                if (!dragging || dragging.st !== st) return;
                const vx = e.clientX - dragging.lastX;
                dragging.lastX = e.clientX;
                st.style.setProperty('--dx', `${e.clientX - dragging.x}px`);
                st.style.setProperty('--dy', `${e.clientY - dragging.y}px`);
                st.style.setProperty('--dr', `${Math.max(-25, Math.min(25, vx * 1.5))}deg`);
            });
            const release = () => {
                if (!dragging || dragging.st !== st) return;
                dragging = null;
                st.classList.remove('dragging');
                st.classList.add('returning');
                st.style.setProperty('--dx', '0px');
                st.style.setProperty('--dy', '0px');
                st.style.setProperty('--dr', '0deg');
            };
            st.addEventListener('pointerup', release);
            st.addEventListener('pointercancel', release);
        });
    }

    // ---------- Resume viewer ----------
    // Desktop: in-page PDF viewer. Phones can't render PDFs in an iframe, so links open the file directly.
    const RESUME = 'Sanjit_P_Resume.pdf';
    const canEmbedPdf = window.matchMedia('(min-width: 769px) and (pointer: fine)').matches;
    const resumeModal = document.createElement('div');
    resumeModal.className = 'resume-backdrop';
    resumeModal.innerHTML = `
        <div class="resume-modal" role="dialog" aria-modal="true" aria-label="Sanjit P resume">
            <div class="resume-bar">
                <span class="resume-title"><i class="fas fa-file-lines"></i> Sanjit_P_Resume.pdf</span>
                <div class="resume-actions">
                    <a class="resume-btn" href="${RESUME}" download><i class="fas fa-download"></i> Download</a>
                    <a class="resume-btn" href="${RESUME}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i> Open</a>
                    <button class="resume-btn resume-close" type="button" aria-label="Close resume"><i class="fas fa-xmark"></i></button>
                </div>
            </div>
            <div class="resume-frame-wrap" data-lenis-prevent>
                <iframe class="resume-frame" title="Sanjit P resume"></iframe>
            </div>
        </div>`;
    document.body.appendChild(resumeModal);
    const resumeFrame = resumeModal.querySelector('.resume-frame');
    let resumeLastFocus = null;

    function openResume() {
        if (!canEmbedPdf) {
            window.open(RESUME, '_blank', 'noopener');
            return;
        }
        if (!resumeFrame.src) resumeFrame.src = `${RESUME}#view=FitH`;
        resumeLastFocus = document.activeElement;
        setMenu(false);
        resumeModal.classList.add('open');
        lenis?.stop();
        resumeModal.querySelector('.resume-close').focus();
    }

    function closeResume() {
        resumeModal.classList.remove('open');
        lenis?.start();
        resumeLastFocus?.focus?.();
    }

    resumeModal.querySelector('.resume-close').addEventListener('click', closeResume);
    resumeModal.addEventListener('click', e => { if (e.target === resumeModal) closeResume(); });
    document.addEventListener('click', e => {
        const link = e.target.closest('[data-resume]');
        if (!link) return;
        setMenu(false);
        if (!canEmbedPdf) return; // phones: let the link open the PDF normally
        e.preventDefault();
        openResume();
    });

    // ---------- Command palette (Ctrl/Cmd + K) ----------
    const go = id => () => scrollToTarget(`#${id}`);
    const commands = [
        { group: 'Navigate', icon: 'fas fa-home', label: 'Home', run: go('hero') },
        { group: 'Navigate', icon: 'fas fa-user', label: 'About', run: go('about') },
        { group: 'Navigate', icon: 'fas fa-map', label: 'Journey', run: go('experience') },
        { group: 'Navigate', icon: 'fas fa-code', label: 'Skills', run: go('skills') },
        { group: 'Navigate', icon: 'fas fa-rocket', label: 'Projects', run: go('projects') },
        { group: 'Navigate', icon: 'fas fa-paper-plane', label: 'Contact', run: go('contact') },
        { group: 'Actions', icon: 'far fa-copy', label: 'Copy email address', hint: EMAIL, run: copyEmail },
        { group: 'Actions', icon: 'fas fa-adjust', label: 'Toggle dark / light theme', run: () => document.getElementById('theme-toggle')?.click() },
        { group: 'Actions', icon: 'fas fa-file-lines', label: 'View resume', hint: 'PDF', run: openResume },
        { group: 'Actions', icon: 'fas fa-download', label: 'Download resume', run: () => {
            const a = document.createElement('a');
            a.href = RESUME;
            a.download = RESUME;
            a.click();
        } },
        { group: 'Actions', icon: 'fas fa-terminal', label: 'Open terminal mode', hint: '/terminal', run: () => { window.location.href = 'terminal.html'; } },
        { group: 'Links', icon: 'fab fa-github', label: 'GitHub', hint: 'sanjitp-23', run: () => window.open('https://github.com/sanjitp-23', '_blank', 'noopener') },
        { group: 'Links', icon: 'fab fa-linkedin', label: 'LinkedIn', run: () => window.open('https://www.linkedin.com/in/sanjit-p-a16b99283/', '_blank', 'noopener') },
    ];

    // Lets playground.js add its own commands (achievements, sound, dev mode)
    window.addPaletteCommand = cmd => commands.push(cmd);

    const backdrop = document.createElement('div');
    backdrop.className = 'palette-backdrop';
    backdrop.innerHTML = `
        <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
            <div class="palette-input-wrap">
                <i class="fas fa-search"></i>
                <input class="palette-input" type="text" placeholder="Type a command or search…" aria-label="Search commands" autocomplete="off" spellcheck="false">
                <kbd>Esc</kbd>
            </div>
            <ul class="palette-list" role="listbox" data-lenis-prevent></ul>
            <div class="palette-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> select</span></div>
        </div>`;
    document.body.appendChild(backdrop);

    const paletteInput = backdrop.querySelector('.palette-input');
    const paletteList = backdrop.querySelector('.palette-list');
    let filtered = commands;
    let selected = 0;
    let lastFocus = null;

    function renderPalette() {
        const q = paletteInput.value.trim().toLowerCase();
        filtered = commands.filter(c => (c.label + ' ' + c.group + ' ' + (c.hint || '')).toLowerCase().includes(q));
        selected = Math.min(selected, Math.max(0, filtered.length - 1));

        if (!filtered.length) {
            paletteList.innerHTML = '<li class="palette-empty">No results. Try “projects” or “email”.</li>';
            return;
        }

        let html = '';
        let lastGroup = '';
        filtered.forEach((c, i) => {
            if (c.group !== lastGroup) {
                html += `<li class="palette-group" role="presentation">${c.group}</li>`;
                lastGroup = c.group;
            }
            html += `<li class="palette-item${i === selected ? ' selected' : ''}" role="option" aria-selected="${i === selected}" data-index="${i}">
                <i class="${c.icon}"></i><span>${c.label}</span>${c.hint ? `<span class="palette-hint">${c.hint}</span>` : ''}
            </li>`;
        });
        paletteList.innerHTML = html;
        paletteList.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
    }

    function openPalette() {
        lastFocus = document.activeElement;
        setMenu(false);
        paletteInput.value = '';
        selected = 0;
        renderPalette();
        backdrop.classList.add('open');
        lenis?.stop();
        setTimeout(() => paletteInput.focus(), 30);
    }

    function closePalette() {
        backdrop.classList.remove('open');
        lenis?.start();
        lastFocus?.focus?.();
    }

    function runSelected(index = selected) {
        const cmd = filtered[index];
        if (!cmd) return;
        closePalette();
        cmd.run();
    }

    paletteInput.addEventListener('input', () => { selected = 0; renderPalette(); });
    paletteInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % filtered.length; renderPalette(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + filtered.length) % filtered.length; renderPalette(); }
        else if (e.key === 'Enter') { e.preventDefault(); runSelected(); }
    });
    paletteList.addEventListener('click', e => {
        const item = e.target.closest('.palette-item');
        if (item) runSelected(Number(item.dataset.index));
    });
    paletteList.addEventListener('mousemove', e => {
        const item = e.target.closest('.palette-item');
        if (item && Number(item.dataset.index) !== selected) {
            selected = Number(item.dataset.index);
            renderPalette();
        }
    });
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closePalette(); });

    document.querySelector('.palette-trigger')?.addEventListener('click', openPalette);

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            backdrop.classList.contains('open') ? closePalette() : openPalette();
        } else if (e.key === 'Escape') {
            if (resumeModal.classList.contains('open')) closeResume();
            else if (backdrop.classList.contains('open')) closePalette();
            else if (mobileMenu?.classList.contains('open')) setMenu(false);
        }
    });

    // ---------- Browser chrome colour follows the site theme (mobile address bars) ----------
    const syncThemeColor = () => {
        const color = document.body.getAttribute('data-theme') === 'dark' ? '#0f0f12' : '#ffd93d';
        document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color));
    };
    syncThemeColor();
    new MutationObserver(syncThemeColor).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // ---------- Safety net: never leave a section invisible ----------
    // The inline IntersectionObserver reveals sections; if it ever misses one (odd browsers, jump-scrolls),
    // this reveals anything already on screen. Stops listening once everything is visible.
    let pendingReveal = Array.from(document.querySelectorAll('.section, .skill-box'));
    const revealCheck = () => {
        pendingReveal = pendingReveal.filter(el => {
            if (el.classList.contains('fade-in')) return false;
            if (el.getBoundingClientRect().top < innerHeight * 0.92) {
                el.classList.add('fade-in');
                return false;
            }
            return true;
        });
        if (!pendingReveal.length) window.removeEventListener('scroll', onRevealScroll);
    };
    let revealQueued = false;
    const onRevealScroll = () => {
        if (revealQueued) return;
        revealQueued = true;
        setTimeout(() => { revealCheck(); revealQueued = false; }, 120);
    };
    window.addEventListener('scroll', onRevealScroll, { passive: true });
    setTimeout(revealCheck, 1500);

    // ---------- Ambient atmosphere: aurora + cursor spotlight that lights up the page grid ----------
    const pageWrapper = document.querySelector('.page-wrapper');
    const ambient = document.createElement('div');
    ambient.className = 'ambient';
    ambient.setAttribute('aria-hidden', 'true');
    ambient.innerHTML = '<div class="amb-blob amb-blob-1"></div><div class="amb-blob amb-blob-2"></div><div class="amb-blob amb-blob-3"></div><div class="amb-spot"></div>';
    pageWrapper?.prepend(ambient);

    if (finePointer && !reduceMotion && pageWrapper) {
        const spot = ambient.querySelector('.amb-spot');
        let sx = innerWidth / 2, sy = innerHeight / 2, tx = sx, ty = sy, spotRunning = false;
        const GRID = 20;
        const mod = (n, m) => ((n % m) + m) % m;

        // The wrapper's page offset only changes with layout, so cache it instead of
        // calling getBoundingClientRect (a forced reflow) on every animation frame
        let wrapLeft = 0, wrapTop = 0;
        const measureWrapper = () => {
            const r = pageWrapper.getBoundingClientRect();
            wrapLeft = r.left + window.scrollX;
            wrapTop = r.top + window.scrollY;
        };
        measureWrapper();
        new ResizeObserver(measureWrapper).observe(document.body);

        const moveSpot = () => {
            sx += (tx - sx) * 0.16;
            sy += (ty - sy) * 0.16;
            spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
            // Keep the spotlight's grid locked to the page grid (which scrolls with the wrapper)
            spot.style.setProperty('--gx', `${mod(wrapLeft - window.scrollX - (sx - 280), GRID)}px`);
            spot.style.setProperty('--gy', `${mod(wrapTop - window.scrollY - (sy - 280), GRID)}px`);
            if (Math.abs(tx - sx) > 0.3 || Math.abs(ty - sy) > 0.3) {
                requestAnimationFrame(moveSpot);
            } else {
                spotRunning = false;
            }
        };
        const kickSpot = () => {
            if (!spotRunning) {
                spotRunning = true;
                requestAnimationFrame(moveSpot);
            }
        };
        document.addEventListener('pointermove', e => {
            tx = e.clientX;
            ty = e.clientY;
            ambient.classList.add('active');
            kickSpot();
        }, { passive: true });
        window.addEventListener('scroll', kickSpot, { passive: true });
        document.documentElement.addEventListener('pointerleave', () => ambient.classList.remove('active'));
    }

    // ---------- Click bursts: little brand shapes pop where you click ----------
    if (!reduceMotion) {
        const burstColors = ['#ffd93d', '#66d9ef', '#ff6b9d', '#a8e6cf'];
        document.addEventListener('pointerdown', e => {
            if (e.button !== 0 || e.target.closest('input, textarea, .sticker, .loader-overlay, .leaflet-container, .resume-backdrop')) return;
            for (let i = 0; i < 7; i++) {
                const bit = document.createElement('span');
                bit.className = `burst-bit${i % 3 === 0 ? ' round' : ''}`;
                bit.style.left = `${e.clientX}px`;
                bit.style.top = `${e.clientY}px`;
                bit.style.background = burstColors[i % burstColors.length];
                document.body.appendChild(bit);
                const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.6;
                const dist = 34 + Math.random() * 30;
                bit.animate([
                    { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
                    { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${Math.random() * 240 - 120}deg) scale(0.4)`, opacity: 0 },
                ], { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => bit.remove();
            }
        });
    }

    // ---------- Text scramble on nav & footer links ----------
    if (finePointer && !reduceMotion) {
        const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+<>/';
        document.querySelectorAll('.nav-link, .footer-nav-compact a').forEach(link => {
            const original = link.textContent;
            let frame = 0, timer = null;
            link.addEventListener('mouseenter', () => {
                clearInterval(timer);
                frame = 0;
                timer = setInterval(() => {
                    link.textContent = original.split('').map((ch, i) =>
                        i < frame / 2 || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]).join('');
                    if (++frame > original.length * 2) {
                        clearInterval(timer);
                        link.textContent = original;
                    }
                }, 28);
            });
        });
    }

    // ---------- Marquee reacts to scroll: speeds up, and reverses when you scroll up ----------
    const marqueeTrack = document.querySelector('.marquee-track');
    const marqueeAnim = marqueeTrack?.getAnimations?.()[0];
    if (marqueeAnim && !reduceMotion) {
        let lastY = window.scrollY, rate = 1, targetRate = 1, rafOn = false;
        const ease = () => {
            rate += (targetRate - rate) * 0.08;
            targetRate += ((targetRate > 0 ? 1 : -1) - targetRate) * 0.05; // settle back to cruising speed
            marqueeAnim.playbackRate = rate;
            if (Math.abs(rate - targetRate) > 0.01 || Math.abs(Math.abs(targetRate) - 1) > 0.01) {
                requestAnimationFrame(ease);
            } else {
                rafOn = false;
            }
        };
        window.addEventListener('scroll', () => {
            const dy = window.scrollY - lastY;
            lastY = window.scrollY;
            if (!dy) return;
            targetRate = Math.sign(dy) * Math.min(6, 1 + Math.abs(dy) * 0.12);
            if (!rafOn) {
                rafOn = true;
                requestAnimationFrame(ease);
            }
        }, { passive: true });
    }

    // ---------- Magnetic buttons ----------
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.btn-cta, .btn-ghost, .social-btn, .nav-cta, .nav-resume, .copy-email').forEach(btn => {
            btn.style.transition = `${getComputedStyle(btn).transition}, translate 0.35s cubic-bezier(0.16, 1, 0.3, 1)`;
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
                const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
                btn.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.translate = '0px 0px'; });
        });
    }

    // ---------- Console greeting for curious devs ----------
    console.log('%c👋 Hey, fellow dev! Press Ctrl+K to explore, or visit /terminal.html', 'background:#ffd93d;color:#000;padding:6px 10px;border:2px solid #000;font-weight:bold;');
})();
