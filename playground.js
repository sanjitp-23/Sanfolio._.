// Playground layer — loaded after enhancements.js.
// Header pill, achievements, sounds, confetti, dev mode, come-back tab, Byte the mascot, physics playground.
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const small = window.matchMedia('(max-width: 768px)').matches;
    const store = {
        get(key, fallback) {
            try {
                const v = localStorage.getItem(key);
                return v === null ? fallback : JSON.parse(v);
            } catch (err) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* storage blocked */ }
        },
    };

    // ---------- Sound (opt-in, synthesized — no audio files) ----------
    let soundOn = store.get('sanjit-sound', false);
    let audioCtx = null;

    function tone(freq, duration = 0.05, type = 'square', volume = 0.035, delay = 0) {
        if (!soundOn) return;
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const t = audioCtx.currentTime + delay;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(volume, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.02);
        } catch (err) { /* audio unavailable */ }
    }

    const sfx = {
        click: () => tone(720, 0.03, 'square', 0.02),
        pop: () => { tone(420, 0.06, 'triangle', 0.05); tone(840, 0.05, 'triangle', 0.03, 0.04); },
        chime: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, i * 0.08)),
        power: () => [196, 262, 330, 392, 523, 784].forEach((f, i) => tone(f, 0.12, 'square', 0.03, i * 0.06)),
    };

    const soundBtn = document.getElementById('sound-toggle');
    function renderSoundBtn() {
        if (!soundBtn) return;
        soundBtn.setAttribute('aria-pressed', String(soundOn));
        soundBtn.innerHTML = soundOn
            ? '<i class="fas fa-volume-high"></i> <span>Sound on</span>'
            : '<i class="fas fa-volume-xmark"></i> <span>Sound off</span>';
    }
    function toggleSound() {
        soundOn = !soundOn;
        store.set('sanjit-sound', soundOn);
        renderSoundBtn();
        sfx.chime();
    }
    renderSoundBtn();
    soundBtn?.addEventListener('click', toggleSound);

    document.addEventListener('pointerdown', e => {
        if (e.target.closest('a, button, .pg-chip, .sticker, .filter-btn')) sfx.click();
    });

    // ---------- Header: compact on scroll + sliding "you are here" pill ----------
    const navbar = document.querySelector('.navbar');
    const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link'));
    const pill = document.querySelector('.nav-pill');
    let hoveringNav = false;

    function placePill(link) {
        if (!pill) return;
        if (!link) {
            pill.style.opacity = '0';
            navLinks.forEach(l => l.classList.remove('pill-on'));
            return;
        }
        pill.style.width = `${link.offsetWidth}px`;
        pill.style.transform = `translateX(${link.offsetLeft}px)`;
        pill.style.opacity = '1';
        navLinks.forEach(l => l.classList.toggle('pill-on', l === link));
    }
    const activeLink = () => navLinks.find(l => l.classList.contains('active')) || (window.scrollY < 200 ? navLinks[0] : null);
    const refreshPill = () => { if (!hoveringNav) placePill(activeLink()); };

    if (pill && navLinks.length) {
        // The inline script toggles .active as you scroll; follow it
        const mo = new MutationObserver(refreshPill);
        navLinks.forEach(l => {
            mo.observe(l, { attributes: true, attributeFilter: ['class'] });
            l.addEventListener('mouseenter', () => { hoveringNav = true; placePill(l); });
        });
        document.querySelector('.nav-links').addEventListener('mouseleave', () => { hoveringNav = false; refreshPill(); });
        window.addEventListener('resize', refreshPill);
        document.fonts?.ready.then(refreshPill);
        setTimeout(refreshPill, 400);
    }

    let navTicking = false;
    window.addEventListener('scroll', () => {
        if (navTicking) return;
        navTicking = true;
        requestAnimationFrame(() => {
            navbar?.classList.toggle('is-scrolled', window.scrollY > 40);
            if (window.scrollY < 200) refreshPill();
            navTicking = false;
        });
    }, { passive: true });

    // ---------- Confetti ----------
    const brand = ['#ffd93d', '#66d9ef', '#ff6b9d', '#a8e6cf', '#ffffff'];
    function confetti(count = 80) {
        if (reduceMotion) return;
        for (let i = 0; i < count; i++) {
            const bit = document.createElement('span');
            bit.className = 'confetti-bit';
            bit.style.left = `${Math.random() * 100}vw`;
            bit.style.background = brand[i % brand.length];
            if (i % 4 === 0) bit.style.borderRadius = '50%';
            document.body.appendChild(bit);
            const drift = (Math.random() - 0.5) * 240;
            bit.animate([
                { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${drift}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 900 - 450}deg)`, opacity: 0.9 },
            ], {
                duration: 1600 + Math.random() * 1400,
                delay: Math.random() * 350,
                easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)',
                fill: 'forwards',
            }).onfinish = () => bit.remove();
        }
    }

    // ---------- Achievements ----------
    const ACHIEVEMENTS = [
        { id: 'explorer', emoji: '🧭', name: 'Explorer', desc: 'Scrolled all the way to the end', hint: 'Reach the very bottom of the page' },
        { id: 'night', emoji: '🌙', name: 'Night Owl', desc: 'Switched on dark mode', hint: 'Somewhere there is a moon…' },
        small
            ? { id: 'picky', emoji: '🔎', name: 'Picky', desc: 'Filtered the projects', hint: 'Try the project filters' }
            : { id: 'sticker', emoji: '🧲', name: 'Sticker Thief', desc: 'Dragged a hero sticker', hint: 'Those hero stickers look loose…' },
        { id: 'recruiter', emoji: '📄', name: 'Recruiter Mode', desc: 'Opened the resume', hint: 'Check the paperwork' },
        small
            ? { id: 'navigator', emoji: '🗺️', name: 'Navigator', desc: 'Opened the menu', hint: 'Three little lines, top right' }
            : { id: 'power', emoji: '⌨️', name: 'Power User', desc: 'Opened the command palette', hint: 'Real devs press Ctrl + K' },
        { id: 'hacker', emoji: '🕹️', name: 'Hacker', desc: 'Unlocked dev mode', hint: small ? 'Tap the logo five times, fast' : 'Type my name anywhere… or try the Konami code' },
        { id: 'physicist', emoji: '🍎', name: 'Physicist', desc: 'Threw the tech stack around', hint: 'The skills section has a toy box' },
        small
            ? { id: 'chatty', emoji: '💬', name: 'Small Talk', desc: 'Chatted with the portrait 3 times', hint: 'Tap my portrait a few times' }
            : { id: 'buddy', emoji: '👾', name: 'Byte Buddy', desc: 'Said hi to Byte', hint: 'Someone lives in the bottom-left corner' },
    ];
    const unlocked = new Set(store.get('sanjit-achievements', []).filter(id => ACHIEVEMENTS.some(a => a.id === id)));
    const countEl = document.getElementById('ach-count');
    const renderCount = () => { if (countEl) countEl.textContent = `${unlocked.size} / ${ACHIEVEMENTS.length}`; };
    renderCount();

    const toast = document.createElement('div');
    toast.className = 'ach-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    const toastQueue = [];
    let toastBusy = false;

    function showNextToast() {
        if (toastBusy || !toastQueue.length) return;
        toastBusy = true;
        const a = toastQueue.shift();
        toast.innerHTML = `<span class="ach-toast-icon">${a.emoji}</span><div><small>${a.label || 'Achievement unlocked'}</small><strong>${a.name}</strong><span>${a.desc}</span></div>`;
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toastBusy = false; showNextToast(); }, 550);
        }, 3200);
    }
    toast.addEventListener('click', () => openPanel());

    function unlock(id) {
        if (unlocked.has(id)) return;
        const a = ACHIEVEMENTS.find(x => x.id === id);
        if (!a) return;
        unlocked.add(id);
        store.set('sanjit-achievements', [...unlocked]);
        renderCount();
        toastQueue.push(a);
        showNextToast();
        sfx.chime();
        confetti(24);
        if (unlocked.size === ACHIEVEMENTS.length) {
            setTimeout(() => {
                toastQueue.push({ emoji: '🎉', label: 'All secrets found', name: 'Completionist!', desc: "You found everything. Let's talk?" });
                showNextToast();
                confetti(160);
                sfx.power();
            }, 900);
        }
    }

    // Panel
    const panel = document.createElement('div');
    panel.className = 'ach-backdrop';
    panel.innerHTML = `
        <div class="ach-panel" role="dialog" aria-modal="true" aria-label="Achievements">
            <div class="ach-head">
                <h3>Secrets <em>found</em></h3>
                <span class="ach-progress"></span>
                <button class="ach-close" type="button" aria-label="Close achievements"><i class="fas fa-xmark"></i></button>
            </div>
            <div class="ach-grid"></div>
            <p class="ach-foot"></p>
        </div>`;
    document.body.appendChild(panel);

    function openPanel() {
        panel.querySelector('.ach-progress').textContent = `${unlocked.size} / ${ACHIEVEMENTS.length}`;
        panel.querySelector('.ach-grid').innerHTML = ACHIEVEMENTS.map(a => {
            const got = unlocked.has(a.id);
            return `<div class="ach-item${got ? '' : ' locked'}">
                <span class="ach-emoji">${got ? a.emoji : '🔒'}</span>
                <div><strong>${got ? a.name : '???'}</strong><span>${got ? a.desc : a.hint}</span></div>
            </div>`;
        }).join('');
        panel.querySelector('.ach-foot').textContent = unlocked.size === ACHIEVEMENTS.length
            ? 'All found. You are officially thorough. 🏆'
            : 'Hints are under each locked badge. Happy hunting!';
        panel.classList.add('open');
        panel.querySelector('.ach-close').focus();
    }
    const closePanel = () => panel.classList.remove('open');
    panel.querySelector('.ach-close').addEventListener('click', closePanel);
    panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
    document.getElementById('ach-open')?.addEventListener('click', openPanel);

    // Palette commands
    if (window.addPaletteCommand) {
        window.addPaletteCommand({ group: 'Fun', icon: 'fas fa-trophy', label: 'Achievements', hint: 'secrets', run: openPanel });
        window.addPaletteCommand({ group: 'Fun', icon: 'fas fa-volume-high', label: 'Toggle sound effects', run: toggleSound });
    }

    // Triggers
    const footer = document.querySelector('footer');
    if (footer) {
        new IntersectionObserver((entries, obs) => {
            if (entries.some(en => en.isIntersecting)) {
                unlock('explorer');
                obs.disconnect();
            }
        }, { threshold: 0.4 }).observe(footer);
    }

    new MutationObserver(() => {
        if (document.body.getAttribute('data-theme') === 'dark') unlock('night');
    }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    const watchOpen = (selector, id, cls = 'open') => {
        const el = document.querySelector(selector);
        if (!el) return;
        new MutationObserver(() => { if (el.classList.contains(cls)) unlock(id); })
            .observe(el, { attributes: true, attributeFilter: ['class'] });
    };
    watchOpen('.resume-backdrop', 'recruiter');
    watchOpen('.palette-backdrop', 'power');
    watchOpen('#mobile-menu', 'navigator');
    document.addEventListener('click', e => { if (e.target.closest('[data-resume]')) unlock('recruiter'); }, true);
    document.addEventListener('click', e => {
        const f = e.target.closest('.filter-btn');
        if (f && f.dataset.filter !== 'all') unlock('picky');
    });

    let stickerStart = null;
    document.addEventListener('pointerdown', e => {
        const st = e.target.closest('.sticker.is-draggable');
        stickerStart = st ? { x: e.clientX, y: e.clientY } : null;
    });
    document.addEventListener('pointermove', e => {
        if (stickerStart && Math.hypot(e.clientX - stickerStart.x, e.clientY - stickerStart.y) > 30) {
            unlock('sticker');
            stickerStart = null;
        }
    });
    document.addEventListener('pointerup', () => { stickerStart = null; });

    let portraitClicks = 0;
    document.querySelector('.hero-photo')?.addEventListener('click', () => {
        if (++portraitClicks >= 3) unlock('chatty');
    });

    // ---------- Dev mode: Konami code, typing "sanjit", or 5 fast logo taps ----------
    const badge = document.createElement('div');
    badge.className = 'dev-badge';
    badge.textContent = 'DEV MODE · ESC TO EXIT';
    document.body.appendChild(badge);

    function setDevMode(on) {
        document.body.classList.toggle('dev-mode', on);
        if (on) {
            confetti(110);
            sfx.power();
            unlock('hacker');
        }
    }

    const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let keyBuffer = [];
    let typed = '';
    document.addEventListener('keydown', e => {
        if (e.target.closest('input, textarea, [contenteditable]')) return;
        const key = e.key.toLowerCase();
        if (key === 'escape' && document.body.classList.contains('dev-mode')) {
            setDevMode(false);
            return;
        }
        keyBuffer = [...keyBuffer, key].slice(-KONAMI.length);
        if (keyBuffer.join() === KONAMI.join()) {
            setDevMode(!document.body.classList.contains('dev-mode'));
            keyBuffer = [];
        }
        if (key.length === 1) {
            typed = (typed + key).slice(-6);
            if (typed === 'sanjit') {
                setDevMode(!document.body.classList.contains('dev-mode'));
                typed = '';
            }
        }
    });

    let logoTaps = [];
    document.querySelector('.nav-brand')?.addEventListener('click', () => {
        const now = Date.now();
        logoTaps = [...logoTaps.filter(t => now - t < 2000), now];
        if (logoTaps.length >= 5) {
            setDevMode(!document.body.classList.contains('dev-mode'));
            logoTaps = [];
        }
    });

    // ---------- Come-back tab: title + sleepy favicon while you're away ----------
    const realTitle = document.title;
    const favLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    const realFav = favLink?.getAttribute('href');
    const sleepyFav = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect x="9" y="9" width="52" height="52" rx="9" fill="#000"/>' +
        '<rect x="3" y="3" width="52" height="52" rx="9" fill="#ffd93d" stroke="#000" stroke-width="4"/>' +
        '<path d="M14 28q6 6 12 0M33 28q6 6 12 0" fill="none" stroke="#000" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M24 41q5 3 10 0" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>' +
        '<text x="40" y="20" font-family="Arial" font-weight="900" font-size="13" fill="#000">z</text></svg>');
    let titleTimer;
    document.addEventListener('visibilitychange', () => {
        clearTimeout(titleTimer);
        if (document.hidden) {
            document.title = '👀 psst… more projects here!';
            if (favLink) favLink.setAttribute('href', sleepyFav);
        } else {
            document.title = '🎉 Welcome back!';
            if (favLink && realFav) favLink.setAttribute('href', realFav);
            titleTimer = setTimeout(() => { document.title = realTitle; }, 1800);
        }
    });

    // ---------- Byte the mascot (desktop) ----------
    if (!small) {
        const byte = document.createElement('button');
        byte.type = 'button';
        byte.className = 'byte';
        byte.setAttribute('aria-label', 'Byte the mascot. Click for a joke');
        byte.innerHTML = `
            <svg viewBox="0 0 64 64" aria-hidden="true">
                <rect x="8" y="10" width="52" height="50" rx="12" fill="#000"/>
                <rect x="3" y="5" width="52" height="50" rx="12" fill="#ffd93d" stroke="#000" stroke-width="4"/>
                <circle cx="20" cy="26" r="7.5" fill="#fff" stroke="#000" stroke-width="3"/>
                <circle cx="38" cy="26" r="7.5" fill="#fff" stroke="#000" stroke-width="3"/>
                <circle class="pupil" cx="20" cy="26" r="3.4" fill="#000"/>
                <circle class="pupil" cx="38" cy="26" r="3.4" fill="#000"/>
                <rect class="lid" x="11.5" y="17.5" width="17" height="17" rx="8.5" fill="#ffd93d" stroke="#000" stroke-width="3"/>
                <rect class="lid" x="29.5" y="17.5" width="17" height="17" rx="8.5" fill="#ffd93d" stroke="#000" stroke-width="3"/>
                <circle cx="12" cy="38" r="3" fill="#ff6b9d"/>
                <circle cx="46" cy="38" r="3" fill="#ff6b9d"/>
                <path d="M22 40q7 6 14 0" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round"/>
                <text class="zzz" x="50" y="6">z z</text>
            </svg>`;
        document.body.appendChild(byte);
        const byteBubble = document.createElement('div');
        byteBubble.className = 'byte-bubble';
        byteBubble.setAttribute('role', 'status');
        byteBubble.setAttribute('aria-live', 'polite');
        document.body.appendChild(byteBubble);

        let bubbleTimer;
        const byteSay = (text, ms = 4200) => {
            byteBubble.textContent = text;
            byteBubble.classList.add('show');
            clearTimeout(bubbleTimer);
            bubbleTimer = setTimeout(() => byteBubble.classList.remove('show'), ms);
        };

        const jokes = [
            "I'm Byte! I live here rent-free. 👾",
            "Why do Android devs love Kotlin? Fewer null surprises. 🙃",
            "I'd tell you a UDP joke, but you might not get it.",
            "There are 10 kinds of people: those who get binary and those who don't.",
            "git commit -m 'fixed it'… narrator: it was not fixed.",
            "Psst… try typing 'sanjit' anywhere 👀",
            "Hire Sanjit and I get extra RAM. Please. 🥺",
            "It works on my machine™, and on his. He tested it.",
            "Psst… there are 8 secrets hidden on this page 🏆",
        ];
        let jokeIndex = 0;

        byte.addEventListener('click', () => {
            unlock('buddy');
            byte.classList.remove('bounce');
            void byte.offsetWidth;
            byte.classList.add('bounce');
            sfx.pop();
            byteSay(jokes[jokeIndex]);
            jokeIndex = (jokeIndex + 1) % jokes.length;
        });

        // Eyes follow the cursor
        const pupils = byte.querySelectorAll('.pupil');
        document.addEventListener('pointermove', e => {
            const r = byte.getBoundingClientRect();
            const angle = Math.atan2(e.clientY - (r.top + r.height * 0.42), e.clientX - (r.left + r.width / 2));
            const dist = Math.min(3.4, Math.hypot(e.clientX - r.left, e.clientY - r.top) / 60);
            const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
            pupils.forEach(p => p.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`));
        }, { passive: true });

        // Blink, nap when idle, wake up when you come back
        let lastActive = Date.now();
        const wake = () => {
            lastActive = Date.now();
            if (byte.classList.contains('sleeping')) {
                byte.classList.remove('sleeping');
                byteSay('Huh?! I was NOT sleeping. 😳', 2600);
            }
        };
        ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach(evt => window.addEventListener(evt, wake, { passive: true }));
        setInterval(() => {
            if (Date.now() - lastActive > 20000) {
                byte.classList.add('sleeping');
            } else if (!reduceMotion && Math.random() < 0.5) {
                byte.classList.add('blink');
                setTimeout(() => byte.classList.remove('blink'), 160);
            }
        }, 2600);

        // Arrive after the intro, then say hello with Chennai's real time
        const loader = document.querySelector('.loader-overlay');
        const arrive = () => {
            byte.classList.add('ready');
            setTimeout(() => {
                const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
                const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
                const doing = h < 6 ? 'probably still coding ☕' : h < 12 ? 'probably debugging over chai ☕'
                    : h < 18 ? 'probably shipping something 🚀' : 'probably deep in a side project 💻';
                byteSay(`It's ${fmt.format(new Date()).toUpperCase()} in Chennai. Sanjit's ${doing}`, 5200);
            }, 6000);
        };
        if (loader && !loader.classList.contains('hidden')) {
            new MutationObserver((_, obs) => {
                if (loader.classList.contains('hidden')) {
                    obs.disconnect();
                    setTimeout(arrive, 2500);
                }
            }).observe(loader, { attributes: true, attributeFilter: ['class'] });
        } else {
            setTimeout(arrive, 2500);
        }
    }

    // ---------- Skills physics playground (matter.js, lazy-loaded) ----------
    const box = document.querySelector('.playground-box');
    if (box) {
        const CHIPS = [
            ['Kotlin', 'var(--pink)', 'fas fa-k'], ['Android', 'var(--accent)', 'fab fa-android'],
            ['React', 'var(--cyan)', 'fab fa-react'], ['Node.js', 'var(--yellow)', 'fab fa-node-js'],
            ['Firebase', 'var(--yellow)', 'fas fa-fire'], ['Python', 'var(--cyan)', 'fab fa-python'],
            ['Figma', 'var(--pink)', 'fab fa-figma'], ['Django', 'var(--accent)', 'fas fa-server'],
            ['TensorFlow', 'var(--yellow)', 'fas fa-cubes'], ['Docker', 'var(--cyan)', 'fab fa-docker'],
            ['AWS', 'var(--yellow)', 'fab fa-aws'], ['JavaScript', 'var(--yellow)', 'fab fa-js'],
            ['Java', 'var(--pink)', 'fab fa-java'], ['REST APIs', 'var(--accent)', 'fas fa-plug'],
            ['Git', 'var(--pink)', 'fab fa-git-alt'], ['PyTorch', 'var(--accent)', 'fas fa-fire-flame-curved'],
            ['ML Kit', 'var(--cyan)', 'fab fa-google'], ['Tailwind', 'var(--cyan)', 'fas fa-wind'],
            ['SQL', 'var(--accent)', 'fas fa-database'], ['Product thinking', '#ffffff', 'fas fa-lightbulb'],
        ];

        const loadMatter = () => new Promise((resolve, reject) => {
            if (window.Matter) return resolve(window.Matter);
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
            s.onload = () => resolve(window.Matter);
            s.onerror = reject;
            document.head.appendChild(s);
        });

        const start = Matter => {
            const { Engine, Runner, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = Matter;
            const engine = Engine.create();
            engine.gravity.y = 1;
            let W = box.clientWidth, H = box.clientHeight;
            const T = 200;
            const walls = {
                floor: Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
                ceil: Bodies.rectangle(W / 2, -T / 2, W * 3, T, { isStatic: true }),
                left: Bodies.rectangle(-T / 2, H / 2, T, H * 3, { isStatic: true }),
                right: Bodies.rectangle(W + T / 2, H / 2, T, H * 3, { isStatic: true }),
            };
            Composite.add(engine.world, Object.values(walls));

            const list = W < 520 ? CHIPS.slice(0, 13) : CHIPS;
            const hint = box.querySelector('.playground-hint');
            let interacted = false;
            const touched = () => {
                if (interacted) return;
                interacted = true;
                hint?.remove();
                unlock('physicist');
            };

            const chips = list.map(([label, color, icon], i) => {
                const el = document.createElement('span');
                el.className = 'pg-chip';
                el.style.setProperty('--c', color);
                el.innerHTML = `<i class="${icon}"></i>${label}`;
                box.appendChild(el);
                const w = el.offsetWidth, h = el.offsetHeight;
                const body = Bodies.rectangle(40 + Math.random() * (W - 80), -60 - i * 45, w, h, {
                    chamfer: { radius: 4 }, restitution: 0.45, friction: 0.3, density: 0.002,
                });
                body.angle = (Math.random() - 0.5) * 0.6;
                if (!finePointer) {
                    // Touch: tap a chip to flick it (dragging would fight with page scrolling)
                    el.addEventListener('pointerdown', () => {
                        Body.setVelocity(body, { x: (Math.random() - 0.5) * 12, y: -14 * Math.sign(engine.gravity.y || 1) });
                        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
                        sfx.pop();
                        touched();
                    });
                }
                return { el, body, w, h };
            });
            // Make it rain: chips drop in one after another
            chips.forEach((c, i) => setTimeout(() => Composite.add(engine.world, c.body), reduceMotion ? 0 : i * 70));

            if (finePointer) {
                const mouse = Mouse.create(box);
                // Don't hijack page scrolling with the wheel
                ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(evt => mouse.element.removeEventListener(evt, mouse.mousewheel));
                // Releasing the mouse outside the box should still drop the chip
                window.addEventListener('mouseup', e => mouse.mouseup(e));
                const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
                Composite.add(engine.world, mc);
                Events.on(mc, 'startdrag', () => { sfx.pop(); touched(); });
            }

            Events.on(engine, 'afterUpdate', () => {
                chips.forEach(({ el, body, w, h }) => {
                    const { x, y } = body.position;
                    if (body.isSleeping) return;
                    // Rescue anything that escaped through a wall at high speed
                    if (x < -100 || x > W + 100 || y > H + 300 || y < -400) {
                        Body.setPosition(body, { x: W / 2, y: H / 3 });
                        Body.setVelocity(body, { x: 0, y: 0 });
                    }
                    el.style.transform = `translate(${(x - w / 2).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px) rotate(${body.angle.toFixed(3)}rad)`;
                });
            });

            const runner = Runner.create();
            Runner.run(runner, engine);
            // Pause the simulation while the box is off-screen
            new IntersectionObserver(entries => {
                runner.enabled = entries.some(en => en.isIntersecting);
            }).observe(box);

            document.querySelector('.playground-actions')?.addEventListener('click', e => {
                const btn = e.target.closest('.pg-btn');
                if (!btn) return;
                touched();
                if (btn.dataset.pg === 'shake') {
                    chips.forEach(({ body }) => {
                        Body.setVelocity(body, { x: (Math.random() - 0.5) * 18, y: -10 - Math.random() * 10 });
                        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
                    });
                    sfx.pop();
                } else if (btn.dataset.pg === 'gravity') {
                    engine.gravity.y *= -1;
                    btn.setAttribute('aria-pressed', String(engine.gravity.y < 0));
                } else if (btn.dataset.pg === 'reset') {
                    engine.gravity.y = 1;
                    document.querySelector('[data-pg="gravity"]')?.setAttribute('aria-pressed', 'false');
                    chips.forEach(({ body }, i) => {
                        Body.setPosition(body, { x: 40 + Math.random() * (W - 80), y: -60 - i * 40 });
                        Body.setVelocity(body, { x: 0, y: 0 });
                        Body.setAngle(body, (Math.random() - 0.5) * 0.6);
                    });
                }
            });

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    W = box.clientWidth;
                    H = box.clientHeight;
                    Body.setPosition(walls.floor, { x: W / 2, y: H + T / 2 });
                    Body.setPosition(walls.ceil, { x: W / 2, y: -T / 2 });
                    Body.setPosition(walls.right, { x: W + T / 2, y: H / 2 });
                }, 200);
            });
        };

        new IntersectionObserver((entries, obs) => {
            if (!entries.some(en => en.isIntersecting)) return;
            obs.disconnect();
            loadMatter().then(start).catch(() => {
                const hint = box.querySelector('.playground-hint');
                if (hint) hint.textContent = 'playground offline, but the skills above are real ✦';
            });
        }, { rootMargin: '300px 0px' }).observe(box);
    }
})();
