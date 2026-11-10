/* Photo viewer for the gallery pages.
 *
 * Replaces the old NextGEN/fancybox lightbox, which had stopped working.
 * Click a thumbnail to open its full-size photo in a dialog, then:
 *   - step through that gallery with the arrow buttons, the ← → keys, or a swipe
 *   - close with Esc, the × button, or a click on the dark area around the photo.
 * When a photo has a caption (the link's title), it is shown under the photo.
 * Without <dialog> support the links simply open the image file, as before.
 */
(function () {
  "use strict";

  if (typeof HTMLDialogElement !== "function") return;

  var LINK = "a.ngg-fancybox";
  var dialog, figure, img, caption, counter, prevBtn, nextBtn;
  var links = [];
  var index = 0;
  var opener = null;
  var swipeStartX = null;
  var ignoreNextClick = false;

  function icon(path) {
    return (
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
      '<path d="' + path + '" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  function pageTitle() {
    var h = document.querySelector(".page-header-title");
    return h ? h.textContent.trim() : document.title;
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "viewer";
    dialog.setAttribute("aria-label", "Foto");
    dialog.innerHTML =
      '<button type="button" class="viewer-btn viewer-close" aria-label="Sulge">' +
      icon("M6 6l12 12M18 6L6 18") + "</button>" +
      '<p class="viewer-count" aria-live="polite"></p>' +
      '<figure class="viewer-figure"><img class="viewer-img" alt=""></figure>' +
      '<p class="viewer-caption"></p>' +
      '<button type="button" class="viewer-btn viewer-prev" aria-label="Eelmine">' +
      icon("M15 5l-7 7 7 7") + "</button>" +
      '<button type="button" class="viewer-btn viewer-next" aria-label="Järgmine">' +
      icon("M9 5l7 7-7 7") + "</button>";
    document.body.appendChild(dialog);

    figure = dialog.querySelector(".viewer-figure");
    img = dialog.querySelector(".viewer-img");
    caption = dialog.querySelector(".viewer-caption");
    counter = dialog.querySelector(".viewer-count");
    prevBtn = dialog.querySelector(".viewer-prev");
    nextBtn = dialog.querySelector(".viewer-next");

    dialog.querySelector(".viewer-close").addEventListener("click", function () {
      dialog.close();
    });
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });

    // The dialog fills the screen, so a click that lands on the dialog itself
    // (not on the photo, caption or a button) was on the dark area: close.
    dialog.addEventListener("click", function (e) {
      if (ignoreNextClick) { ignoreNextClick = false; return; }
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener("keydown", function (e) {
      if (links.length < 2) return;
      if (e.key === "ArrowLeft") { show(index - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { show(index + 1); e.preventDefault(); }
    });

    // Swipe left/right on touch screens.
    dialog.addEventListener("pointerdown", function (e) {
      swipeStartX = e.pointerType === "mouse" ? null : e.clientX;
    });
    dialog.addEventListener("pointerup", function (e) {
      if (swipeStartX === null || links.length < 2) return;
      var dx = e.clientX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(dx) > 50) {
        ignoreNextClick = true;
        show(index + (dx < 0 ? 1 : -1));
      }
    });

    img.addEventListener("load", function () { figure.classList.add("is-loaded"); });

    // Return focus to the thumbnail of the photo last viewed, so keyboard users
    // (and the scroll position) end up where they left off.
    dialog.addEventListener("close", function () {
      var last = links[index] || opener;
      if (last) last.focus();
    });
  }

  function show(i) {
    var n = links.length;
    index = (i + n) % n;
    var link = links[index];
    var text = (link.getAttribute("title") || "").trim();

    if (img.getAttribute("src") !== link.getAttribute("href")) {
      figure.classList.remove("is-loaded");
      img.src = link.href;
    }
    img.alt = text || pageTitle() + ", foto " + (index + 1);
    caption.textContent = text;
    caption.hidden = !text;
    counter.textContent = index + 1 + " / " + n;

    // Fetch the neighbouring photos ahead of time so stepping feels instant.
    if (n > 1) {
      new Image().src = links[(index + 1) % n].href;
      new Image().src = links[(index - 1 + n) % n].href;
    }
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let "open in new tab" work
    var link = e.target.closest ? e.target.closest(LINK) : null;
    if (!link) return;
    e.preventDefault();

    if (!dialog) build();
    var gallery = link.closest(".ngg-galleryoverview") || document;
    links = Array.prototype.slice.call(gallery.querySelectorAll(LINK));
    opener = link;

    var many = links.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
    counter.hidden = !many;

    show(links.indexOf(link));
    dialog.showModal();
  });
})();
