/* =========================================================
   Elhadji Ndour — Portfolio
   ========================================================= */
(function () {
	'use strict';

	document.documentElement.classList.add('js');
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- Thème clair / sombre ---------- */
	var root = document.documentElement;
	var themeBtn = document.getElementById('theme-toggle');

	function currentTheme() {
		var t = root.getAttribute('data-theme');
		if (t) return t;
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	function syncThemeIcon() {
		var icon = themeBtn.querySelector('i');
		icon.className = currentTheme() === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
	}
	themeBtn.addEventListener('click', function () {
		var next = currentTheme() === 'dark' ? 'light' : 'dark';
		root.setAttribute('data-theme', next);
		try { localStorage.setItem('theme', next); } catch (e) {}
		syncThemeIcon();
	});
	syncThemeIcon();

	/* ---------- Menu mobile ---------- */
	var burger = document.getElementById('burger');
	var nav = document.getElementById('main-nav');

	function setMenu(open) {
		nav.classList.toggle('open', open);
		burger.setAttribute('aria-expanded', String(open));
		burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
		document.body.classList.toggle('menu-open', open);
	}
	burger.addEventListener('click', function () {
		setMenu(!nav.classList.contains('open'));
	});
	nav.querySelectorAll('a').forEach(function (a) {
		a.addEventListener('click', function () { setMenu(false); });
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); }
	});
	window.addEventListener('resize', function () {
		if (window.innerWidth > 1080 && nav.classList.contains('open')) setMenu(false);
	});

	/* ---------- En-tête, progression, retour en haut ---------- */
	var header = document.querySelector('.site-header');
	var progress = document.querySelector('.scroll-progress span');
	var toTop = document.getElementById('to-top');
	var ticking = false;

	function onScroll() {
		var y = window.scrollY;
		var max = document.documentElement.scrollHeight - window.innerHeight;
		header.classList.toggle('scrolled', y > 10);
		toTop.classList.toggle('show', y > 600);
		progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
		ticking = false;
	}
	window.addEventListener('scroll', function () {
		if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
	}, { passive: true });
	onScroll();

	/* ---------- Lien actif dans la navigation ---------- */
	var links = document.querySelectorAll('.nav-link');
	var sections = Array.prototype.map.call(links, function (l) {
		return document.querySelector(l.getAttribute('href'));
	}).filter(Boolean);

	if ('IntersectionObserver' in window) {
		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				links.forEach(function (l) {
					var on = l.getAttribute('href') === '#' + entry.target.id;
					l.classList.toggle('active', on);
					if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
				});
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		sections.forEach(function (s) { spy.observe(s); });
	}

	/* ---------- Animation de la signature ---------- */
	document.querySelectorAll('.signature path').forEach(function (p, i) {
		var len = Math.ceil(p.getTotalLength());
		p.style.setProperty('--len', len);
		p.style.setProperty('--i', i);
	});

	/* ---------- Texte défilant (rôles) ---------- */
	var typed = document.getElementById('typed');
	var roles = ['Communication digitale', 'Développement web', 'Design graphique', 'Motion design', 'Community management'];
	if (typed && !reduceMotion) {
		var r = 0, c = roles[0].length, deleting = true;
		var tick = function () {
			var word = roles[r];
			typed.textContent = word.slice(0, c);
			var delay = deleting ? 40 : 80;
			if (deleting) {
				if (--c < 0) { deleting = false; r = (r + 1) % roles.length; c = 0; delay = 300; }
			} else if (++c > roles[r].length) {
				deleting = true; c = roles[r].length; delay = 1800;
			}
			setTimeout(tick, delay);
		};
		setTimeout(tick, 2600);
	}

	/* ---------- Apparition au scroll + compteurs ---------- */
	function animateCount(el) {
		var target = parseInt(el.getAttribute('data-count'), 10);
		var prefix = el.getAttribute('data-prefix') || '';
		var suffix = el.getAttribute('data-suffix') || '';
		if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
		var start = null, duration = 1400;
		function step(ts) {
			if (!start) start = ts;
			var p = Math.min((ts - start) / duration, 1);
			var eased = 1 - Math.pow(1 - p, 3);
			el.textContent = prefix + Math.round(target * eased) + suffix;
			if (p < 1) window.requestAnimationFrame(step);
		}
		window.requestAnimationFrame(step);
	}

	var revealEls = document.querySelectorAll('.reveal, .stats');
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries, obs) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('visible');
				entry.target.querySelectorAll('[data-count]').forEach(animateCount);
				obs.unobserve(entry.target);
			});
		}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
		revealEls.forEach(function (el) { io.observe(el); });
	} else {
		revealEls.forEach(function (el) {
			el.classList.add('visible');
			el.querySelectorAll('[data-count]').forEach(animateCount);
		});
	}

	/* ---------- Filtres des projets ---------- */
	var filters = document.querySelectorAll('.filter');
	var projects = document.querySelectorAll('.project');
	filters.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var f = btn.getAttribute('data-filter');
			filters.forEach(function (b) {
				var on = b === btn;
				b.classList.toggle('is-active', on);
				b.setAttribute('aria-pressed', String(on));
			});
			projects.forEach(function (p) {
				var show = f === 'all' || p.getAttribute('data-cat') === f;
				p.classList.toggle('is-hidden', !show);
				p.classList.remove('is-entering');
				if (show) { void p.offsetWidth; p.classList.add('is-entering'); }
			});
		});
	});

	/* ---------- Onglets du parcours ---------- */
	var tabs = document.querySelectorAll('.tab');
	function selectTab(tab) {
		tabs.forEach(function (t) {
			var on = t === tab;
			var panel = document.getElementById(t.getAttribute('aria-controls'));
			t.classList.toggle('is-active', on);
			t.setAttribute('aria-selected', String(on));
			t.tabIndex = on ? 0 : -1;
			panel.hidden = !on;
			panel.classList.toggle('is-active', on);
		});
	}
	tabs.forEach(function (tab, i) {
		tab.addEventListener('click', function () { selectTab(tab); });
		tab.addEventListener('keydown', function (e) {
			if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
			var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
			selectTab(next); next.focus();
		});
	});

	/* ---------- Lecteur de démonstration Senfly ---------- */
	var phone = document.getElementById('senfly-player');
	if (phone) {
		var playBtn = document.getElementById('play-toggle');
		var bar = document.getElementById('track-progress');
		var timeEl = document.getElementById('time-current');
		var titleEl = document.getElementById('track-title');
		var artistEl = document.getElementById('track-artist');
		var tracks = [
			{ title: 'Dakar Nights', artist: 'Artiste à découvrir' },
			{ title: 'Teranga Vibes', artist: 'Nouveauté de la semaine' },
			{ title: 'Paris Sunset', artist: 'Playlist Découverte' }
		];
		var idx = 0, elapsed = 0, total = 204, timer = null;

		var render = function () {
			bar.style.width = (elapsed / total * 100) + '%';
			var s = Math.floor(elapsed);
			timeEl.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
		};
		var setPlaying = function (on) {
			phone.classList.toggle('playing', on);
			playBtn.innerHTML = on ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
			playBtn.setAttribute('aria-label', on ? 'Pause' : 'Lecture');
			clearInterval(timer);
			if (on) {
				timer = setInterval(function () {
					elapsed += 1;
					if (elapsed >= total) { change(1); return; }
					render();
				}, 250); // accéléré pour la démo
			}
		};
		var change = function (dir) {
			idx = (idx + dir + tracks.length) % tracks.length;
			titleEl.textContent = tracks[idx].title;
			artistEl.textContent = tracks[idx].artist;
			elapsed = 0; render();
		};
		playBtn.addEventListener('click', function () { setPlaying(!phone.classList.contains('playing')); });
		document.getElementById('next-track').addEventListener('click', function () { change(1); });
		document.getElementById('prev-track').addEventListener('click', function () { change(-1); });
	}

	/* ---------- Formulaire de contact (ouvre la messagerie) ---------- */
	var form = document.getElementById('contact-form');
	var status = document.getElementById('form-status');
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var valid = true;
			['name', 'email', 'message'].forEach(function (id) {
				var input = form.elements[id];
				var ok = input.value.trim() !== '' && (id !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
				input.parentElement.classList.toggle('invalid', !ok);
				input.setAttribute('aria-invalid', String(!ok));
				if (!ok) valid = false;
			});
			if (!valid) {
				status.className = 'form-status err';
				status.textContent = 'Merci de remplir correctement tous les champs.';
				return;
			}
			var subject = form.elements.subject.value + ' — ' + form.elements.name.value.trim();
			var body = form.elements.message.value.trim() + '\n\n' + form.elements.name.value.trim() + '\n' + form.elements.email.value.trim();
			window.location.href = 'mailto:mamefadilou@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
			status.className = 'form-status ok';
			status.textContent = 'Votre messagerie va s\'ouvrir avec le message pré-rempli. Merci !';
		});
	}

	/* ---------- Année du footer ---------- */
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();
})();
