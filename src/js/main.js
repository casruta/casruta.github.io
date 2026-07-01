(function () {
  'use strict';

  // ── Heading anchor links (§) ──────────────────────────────────────────────
  function addHeadingAnchors() {
    var content = document.querySelector('.post-content');
    if (!content) return;

    content.querySelectorAll('h2, h3, h4').forEach(function (heading) {
      if (!heading.id) {
        heading.id = heading.textContent
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      var a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + heading.id;
      a.textContent = '§';
      a.setAttribute('aria-hidden', 'true');
      heading.appendChild(a);
    });
  }

  // ── Footnote → Sidenote conversion ───────────────────────────────────────
  // Only runs on wide screens. Converts markdown-it-footnote output into
  // sidenote <aside> elements placed next to their reference paragraphs.
  function convertFootnotesToSidenotes() {
    // Disabled: the two-column scholarly layout has no margin for sidenotes,
    // so footnotes stay in their section at the bottom (spanning both columns).
    return;

    /* eslint-disable no-unreachable */
    var content = document.querySelector('.post-content');
    var fnSection = document.querySelector('.footnotes');
    if (!content || !fnSection) return;
    if (window.innerWidth < 960) return;

    var refs = content.querySelectorAll('sup.footnote-ref');
    if (refs.length === 0) return;

    refs.forEach(function (sup) {
      var link = sup.querySelector('a');
      if (!link) return;

      var fnId = link.getAttribute('href').replace(/^#/, '');
      var fnItem = document.getElementById(fnId);
      if (!fnItem) return;

      // Clone footnote and strip the back-reference link
      var clone = fnItem.cloneNode(true);
      var backref = clone.querySelector('.footnote-backref');
      if (backref) backref.parentNode.removeChild(backref);

      // Extract inner HTML (strip outer <p> wrapper if present)
      var inner = clone.innerHTML.trim();
      inner = inner.replace(/^<p>/, '').replace(/<\/p>$/, '').trim();

      // Derive the number from the link text, e.g. "[1]" → "1"
      var num = link.textContent.replace(/[\[\]]/g, '').trim();

      // Build sidenote element
      var aside = document.createElement('aside');
      aside.className = 'sidenote';
      aside.innerHTML =
        '<span class="sidenote-number">' + num + '</span>' + inner;

      // Insert the sidenote as the next sibling after the parent paragraph
      var parent = sup.closest('p') || sup.parentElement;
      if (parent && parent.parentNode) {
        parent.parentNode.insertBefore(aside, parent.nextSibling);
      }

      // Replace the bracketed link text with just the number
      link.textContent = num;
    });

    // Hide the original footnote section on wide screens
    fnSection.style.display = 'none';
  }

  // ── Table of Contents ─────────────────────────────────────────────────────
  function buildTOC() {
    var content = document.querySelector('.post-content');
    if (!content) return;

    var headings = Array.from(content.querySelectorAll('h2, h3'));
    if (headings.length < 2) return;

    var toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', 'Table of contents');

    var title = document.createElement('p');
    title.className = 'toc-title';
    title.textContent = 'Contents';
    toc.appendChild(title);

    var list = document.createElement('ol');

    headings.forEach(function (heading) {
      var li = document.createElement('li');
      if (heading.tagName === 'H3') {
        li.className = 'toc-h3';
      }
      var a = document.createElement('a');
      a.href = '#' + heading.id;
      // Strip the § anchor character from display text
      a.textContent = heading.textContent.replace(/\s*§\s*$/, '').trim();
      li.appendChild(a);
      list.appendChild(li);
    });

    toc.appendChild(list);

    // Place the TOC as a full-width single column between the header and the
    // two-column body — not inside the column flow.
    var parent = content.parentNode;
    if (parent) {
      parent.insertBefore(toc, content);
    } else {
      content.insertBefore(toc, content.firstElementChild);
    }
  }

  // ── Floating hashtag panel ─────────────────────────────────────────────────
  // Mirrors the hashtag links from the .post-tags element rendered by post.njk
  // into a fixed panel on the right; each item links to its /tags/ page.
  function buildHashtagPanel() {
    var tagsParagraph = document.querySelector('.post-tags');
    if (!tagsParagraph) return;

    var tagLinks = tagsParagraph.querySelectorAll('a');
    if (tagLinks.length === 0) return;

    // Build the fixed panel (tags stay visible in the post header too)
    var panel = document.createElement('nav');
    panel.className = 'hashtag-panel';
    panel.setAttribute('aria-label', 'Post tags');

    tagLinks.forEach(function (link, i) {
      var a = document.createElement('a');
      a.className = 'hashtag-item';
      a.textContent = link.textContent;
      a.href = link.href;
      a.style.animationDelay = (i * 0.06) + 's';
      panel.appendChild(a);
    });

    document.body.appendChild(panel);
  }

  // ── Home page post filter ─────────────────────────────────────────────────
  // Live-filters the post list by title, subtitle, or #hashtag. Each search
  // term must be a PREFIX of a whole word in the post (not just any substring),
  // so "AI" matches the tag/word "AI" but not "gain" — and every term must
  // match, so multi-word queries narrow the list. Case-insensitive.
  function words(str) {
    return (str || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  }

  function initPostFilter() {
    var input = document.querySelector('.post-filter');
    if (!input) return;

    var items = Array.from(document.querySelectorAll('.post-list li'));
    var empty = document.querySelector('.post-filter-empty');

    input.addEventListener('input', function () {
      var terms = words(input.value);
      var visible = 0;

      items.forEach(function (li) {
        var tokens = words(li.getAttribute('data-search') || li.textContent);
        var match = terms.every(function (term) {
          return tokens.some(function (tok) { return tok.indexOf(term) === 0; });
        });
        li.hidden = !match;
        if (match) visible++;
      });

      if (empty) empty.hidden = visible > 0;
    });
  }

  // ── Reading progress bar ─────────────────────────────────────────────────
  function initProgressBar() {
    var bar = document.querySelector('.progress-bar');
    if (!bar || !document.querySelector('.post-content')) return;

    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, pct) + '%';
    }, { passive: true });
  }

  // ── Copy code button ───────────────────────────────────────────────────
  function initCopyButtons() {
    document.querySelectorAll('pre').forEach(function (pre) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');

      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        var text = code ? code.textContent : pre.textContent;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        });
      });

      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }

  // ── Active TOC highlighting ─────────────────────────────────────────────
  function initTOCHighlight() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var links = Array.from(toc.querySelectorAll('a'));
    if (links.length === 0) return;

    var headingEls = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('toc-active'); });
          var active = toc.querySelector('a[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('toc-active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });

    headingEls.forEach(function (h) { observer.observe(h); });
  }

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  // Every top-level block of the article unfolds (fade + slide up) as it
  // enters the viewport, and re-folds once it leaves — so the text animates
  // whether the reader is scrolling down or back up. Skipped entirely when the
  // reader prefers reduced motion, leaving all text visible.
  function initFadeIn() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var content = document.querySelector('.post-content');
    if (!content) return;

    var targets = content.querySelectorAll(
      ':scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > ul, ' +
      ':scope > ol, :scope > figure, :scope > blockquote, :scope > table, ' +
      ':scope > pre, :scope > .abstract, :scope > .footnotes'
    );
    if (targets.length === 0) return;

    targets.forEach(function (el) { el.classList.add('fade-target'); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Toggle in both directions: reveal on enter, re-fold on exit.
        entry.target.classList.toggle('fade-in', entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }

  // ── Image lightbox ────────────────────────────────────────────────────────
  // Click any chart/image in a post to enlarge it in a full-screen overlay.
  function initLightbox() {
    var images = document.querySelectorAll('.post-content img, .post-hero img');
    if (images.length === 0) return;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    var fullImg = document.createElement('img');
    fullImg.className = 'lightbox-img';
    fullImg.alt = '';
    overlay.appendChild(fullImg);
    document.body.appendChild(overlay);

    function open(src, alt) {
      fullImg.src = src;
      fullImg.alt = alt || '';
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    images.forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge image' + (img.alt ? ': ' + img.alt : ''));

      function activate() {
        open(img.currentSrc || img.src, img.alt);
      }
      img.addEventListener('click', activate);
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });

    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    addHeadingAnchors();
    convertFootnotesToSidenotes();
    buildTOC();
    buildHashtagPanel();
    initPostFilter();
    initProgressBar();
    initCopyButtons();
    initTOCHighlight();
    initFadeIn();
    initLightbox();
  });
})();
