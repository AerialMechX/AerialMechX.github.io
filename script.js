/* ==========================================================================
   Portfolio interactions. Vanilla JavaScript, no dependencies.

   1. Demo videos   Posters load shortly before a video scrolls into view.
                    Muted loops autoplay while visible on larger screens and
                    pause when scrolled away. Phones, Save-Data and reduced-motion
                    visitors get a play button instead, so nothing large downloads
                    unless they ask for it. Every playing video can be paused.
   2. YouTube       Only a thumbnail loads; the player loads after a click.
   3. BibTeX        Adds a copy button inside each BibTeX block.
   4. Navigation    Marks the section currently in view.

   Without JavaScript the page still works: videos show native controls and
   YouTube thumbnails are ordinary links.
   ========================================================================== */
(function () {
  'use strict';

  /* Set to true to let short muted loops autoplay on phones too. */
  var AUTOPLAY_ON_SMALL_SCREENS = false;

  var doc = document;
  var hasObserver = 'IntersectionObserver' in window;

  function matches(query) {
    return window.matchMedia ? window.matchMedia(query).matches : false;
  }
  function forEach(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = !!(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));

  function autoplayAllowed() {
    return !matches('(prefers-reduced-motion: reduce)') &&
      !saveData &&
      (AUTOPLAY_ON_SMALL_SCREENS || !matches('(max-width: 44rem)'));
  }


  /* ---------- 1. Demo videos ---------- */

  function setState(frame, state) {
    frame.setAttribute('data-state', state);
    var toggle = frame.querySelector('.media__toggle');
    if (toggle) toggle.setAttribute('aria-label', state === 'playing' ? 'Pause video' : 'Play video');
  }

  function loadPoster(video) {
    var poster = video.getAttribute('data-poster');
    if (poster) {
      video.setAttribute('poster', poster);
      video.removeAttribute('data-poster');
    }
  }

  function start(frame) {
    var video = frame._video;
    if (frame.getAttribute('data-state') === 'error') return;
    loadPoster(video);
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {
        if (video.error || video.networkState === 3 /* NETWORK_NO_SOURCE */) {
          setState(frame, 'error');
        } else {
          // Autoplay was blocked (for example iOS Low Power Mode): offer the play button.
          frame._wantsPlay = false;
          setState(frame, 'idle');
        }
      });
    }
  }

  var visibility = hasObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var frame = entry.target;
      if (entry.isIntersecting) {
        if (frame._wantsPlay && frame._video.paused) start(frame);
      } else if (!frame._video.paused) {
        frame._video.pause();
      }
    });
  }, { threshold: 0.35 }) : null;

  var proximity = hasObserver ? new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      loadPoster(entry.target._video);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '600px 0px' }) : null;

  forEach(doc.querySelectorAll('[data-video]'), function (frame) {
    var video = frame.querySelector('video');
    if (!video) return;

    frame._video = video;
    frame._wantsPlay = autoplayAllowed();
    video.removeAttribute('controls');
    video.muted = true;
    setState(frame, frame._wantsPlay ? 'auto' : 'idle');

    video.addEventListener('playing', function () { setState(frame, 'playing'); });
    video.addEventListener('pause', function () {
      if (frame.getAttribute('data-state') !== 'error') setState(frame, 'paused');
    });
    video.addEventListener('error', function () { setState(frame, 'error'); });

    // A <source> that fails fires its own error event; when the last one fails, nothing can play.
    var sources = video.getElementsByTagName('source');
    if (sources.length) {
      sources[sources.length - 1].addEventListener('error', function () { setState(frame, 'error'); });
    }

    var playButton = frame.querySelector('.media__play');
    if (playButton) {
      playButton.addEventListener('click', function () {
        frame._wantsPlay = true;
        start(frame);
      });
    }

    var toggle = frame.querySelector('.media__toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (video.paused) {
          frame._wantsPlay = true;
          start(frame);
        } else {
          frame._wantsPlay = false;
          video.pause();
        }
      });
    }

    if (hasObserver) {
      proximity.observe(frame);
      visibility.observe(frame);
    } else {
      loadPoster(video);
      if (frame._wantsPlay) start(frame);
    }
  });


  /* ---------- 2. YouTube: load the player only on click ---------- */

  // If a thumbnail can't load (offline, blocked), keep the neutral backdrop instead of a broken image.
  forEach(doc.querySelectorAll('a[data-youtube] img'), function (img) {
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
  });

  forEach(doc.querySelectorAll('a[data-youtube]'), function (link) {
    link.addEventListener('click', function (event) {
      // Let people open the video on YouTube in a new tab or window.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var id = link.getAttribute('data-youtube');
      if (!/^[\w-]{11}$/.test(id)) return;
      event.preventDefault();

      var iframe = doc.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      iframe.title = link.getAttribute('data-title') || 'YouTube video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      link.parentNode.replaceChild(iframe, link);
      iframe.focus();
    });
  });


  /* ---------- 3. BibTeX copy buttons ---------- */

  if (navigator.clipboard && window.isSecureContext) {
    forEach(doc.querySelectorAll('.bib'), function (details) {
      var pre = details.querySelector('pre');
      if (!pre) return;
      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'bib__copy';
      button.textContent = 'Copy BibTeX';
      button.setAttribute('aria-live', 'polite');
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
          button.textContent = 'Copied';
          window.setTimeout(function () { button.textContent = 'Copy BibTeX'; }, 1800);
        }, function () {
          button.textContent = 'Copy failed. Select the text instead.';
        });
      });
      pre.parentNode.insertBefore(button, pre);
    });
  }


  /* ---------- 4. Highlight the section in view ---------- */

  var navLinks = doc.querySelectorAll('.site-nav a[href^="#"]');
  if (hasObserver && navLinks.length) {
    var linkFor = {};
    forEach(navLinks, function (link) {
      linkFor[link.getAttribute('href').slice(1)] = link;
    });

    var sections = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        forEach(navLinks, function (link) { link.removeAttribute('aria-current'); });
        var link = linkFor[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    // Watch every top-level section, so the intro and contact clear the highlight.
    forEach(doc.querySelectorAll('main > section'), function (section) {
      sections.observe(section);
    });
  }
})();
