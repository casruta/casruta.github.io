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

    // Insert just before the first h2 (after intro paragraphs / abstract)
    var firstH2 = content.querySelector('h2');
    if (firstH2) {
      content.insertBefore(toc, firstH2);
    } else {
      content.insertBefore(toc, content.firstElementChild);
    }
  }

  // ── Floating hashtag panel ─────────────────────────────────────────────────
  // Reads hashtags from the dedicated .post-tags element rendered by post.njk,
  // hides that element, and builds a fixed panel on the right.
  function buildHashtagPanel() {
    var tagsParagraph = document.querySelector('.post-tags');
    if (!tagsParagraph) return;

    var tags = tagsParagraph.textContent.trim().split(/\s+/).filter(function (w) {
      return /^#\S+$/.test(w);
    });

    if (tags.length === 0) return;

    // Build the fixed panel (tags stay visible in the post header too)
    var panel = document.createElement('nav');
    panel.className = 'hashtag-panel';
    panel.setAttribute('aria-label', 'Post tags');

    tags.forEach(function (tag) {
      var span = document.createElement('span');
      span.className = 'hashtag-item';
      span.textContent = tag;
      panel.appendChild(span);
    });

    document.body.appendChild(panel);
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

  // ── Back-to-top button ──────────────────────────────────────────────────
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > window.innerHeight);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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

  // ── Scroll fade-in animations ───────────────────────────────────────────
  function initFadeIn() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var content = document.querySelector('.post-content');
    if (!content) return;

    var targets = content.querySelectorAll('h2, h3, figure, blockquote, .abstract');
    targets.forEach(function (el) { el.classList.add('fade-target'); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    addHeadingAnchors();
    convertFootnotesToSidenotes();
    buildTOC();
    buildHashtagPanel();
    initProgressBar();
    initBackToTop();
    initCopyButtons();
    initTOCHighlight();
    initFadeIn();
  });
})();
