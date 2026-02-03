// Minimal TikTok-style scroll navigation shim for MovieShows (scroll-only)
(function () {
  "use strict";

  let initialized = false;
  let scrollContainer = null;
  let videoSlides = [];
  let currentIndex = -1;
  let isScrolling = false;
  let scrollTimeout = null;

  const SCROLL_COOLDOWN = 500;
  const MIN_WHEEL_DELTA = 20;

  function safeBlurActiveElement() {
    try {
      const ae = document.activeElement;
      if (ae && typeof ae.blur === "function") {
        ae.blur();
      }
    } catch {
      // ignore
    }

    // Make youtube iframes harder to focus-trap keyboard
    try {
      const iframe = document.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie"]');
      if (iframe) {
        iframe.setAttribute("tabindex", "-1");
      }
    } catch {
      // ignore
    }
  }

  function findScrollContainer() {
    // Prefer a snap-y vertical scroll container (the main feed)
    const candidates = Array.from(document.querySelectorAll('[class*="overflow-y-scroll"], [class*="overflow-y-auto"]'));
    for (const el of candidates) {
      const cls = el.className || "";
      if (typeof cls === "string" && cls.includes("snap-y")) return el;
    }

    // Fallback: find a snap-center slide and use its parent
    const snapCenter = document.querySelector('[class*="snap-center"]');
    if (snapCenter && snapCenter.parentElement) return snapCenter.parentElement;

    return null;
  }

  function findVideoSlides() {
    if (!scrollContainer) return [];
    return Array.from(scrollContainer.querySelectorAll('[class*="snap-center"]'));
  }

  function getCurrentVisibleIndex() {
    if (!scrollContainer || videoSlides.length === 0) return 0;
    const h = scrollContainer.clientHeight;
    if (!h) return 0;
    return Math.max(0, Math.min(videoSlides.length - 1, Math.round(scrollContainer.scrollTop / h)));
  }

  function scrollToSlide(index) {
    if (!scrollContainer || index < 0 || index >= videoSlides.length) return;

    const h = scrollContainer.clientHeight;
    scrollContainer.scrollTo({ top: index * h, behavior: "smooth" });
    currentIndex = index;
  }

  function clickQueuePlayButton() {
    // Keep this very conservative: only click when found.
    const buttons = Array.from(document.querySelectorAll("button"));
    for (const btn of buttons) {
      const txt = (btn.textContent || "").trim();
      if (txt === "Play Queue" || txt.includes("Play Queue")) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function shouldIgnoreEventTarget(target) {
    if (!target || typeof target.closest !== "function") return false;

    // Don’t steal input from controls, overlays, or panels
    return Boolean(
      target.closest("#player-size-control") ||
        target.closest("select") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest('[class*="overflow-y-auto"]:not([class*="snap-y"])') ||
        target.closest('[class*="Queue"]') ||
        target.closest('[class*="fixed"][class*="right"]')
    );
  }

  function handleWheel(e) {
    if (shouldIgnoreEventTarget(e.target)) return;
    if (!scrollContainer || videoSlides.length === 0) return;

    safeBlurActiveElement();

    if (isScrolling) {
      e.preventDefault();
      return;
    }

    if (Math.abs(e.deltaY) < MIN_WHEEL_DELTA) return;

    e.preventDefault();

    const actualIndex = getCurrentVisibleIndex();
    if (currentIndex === -1 || currentIndex !== actualIndex) currentIndex = actualIndex;

    const direction = e.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(videoSlides.length - 1, currentIndex + direction));

    if (next !== currentIndex) {
      isScrolling = true;
      scrollToSlide(next);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        currentIndex = getCurrentVisibleIndex();
      }, SCROLL_COOLDOWN);
    }
  }

  function handleKeydown(e) {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (!scrollContainer || videoSlides.length === 0) return;
    if (isScrolling) return;

    let direction = 0;
    if (e.key === "ArrowDown" || e.key === "j" || e.key === "J") direction = 1;
    if (e.key === "ArrowUp" || e.key === "k" || e.key === "K") direction = -1;
    if (direction === 0) return;

    safeBlurActiveElement();
    e.preventDefault();

    const actualIndex = getCurrentVisibleIndex();
    if (currentIndex === -1 || currentIndex !== actualIndex) currentIndex = actualIndex;

    const next = Math.max(0, Math.min(videoSlides.length - 1, currentIndex + direction));
    if (next !== currentIndex) {
      isScrolling = true;
      scrollToSlide(next);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        currentIndex = getCurrentVisibleIndex();
      }, SCROLL_COOLDOWN);
    }
  }

  let touchStartY = 0;
  let touchStartTime = 0;

  function handleTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  function handleTouchEnd(e) {
    if (!scrollContainer || videoSlides.length === 0) return;
    if (isScrolling) return;

    const touchEndY = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY;
    const deltaY = touchStartY - touchEndY;
    const duration = Date.now() - touchStartTime;

    if (duration < 300 && Math.abs(deltaY) > 50) {
      const actualIndex = getCurrentVisibleIndex();
      if (currentIndex === -1 || currentIndex !== actualIndex) currentIndex = actualIndex;

      const direction = deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(videoSlides.length - 1, currentIndex + direction));

      if (next !== currentIndex) {
        isScrolling = true;
        scrollToSlide(next);

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
          currentIndex = getCurrentVisibleIndex();
        }, SCROLL_COOLDOWN);
      }
    }
  }

  function init() {
    if (initialized) return;

    scrollContainer = findScrollContainer();
    if (!scrollContainer) {
      setTimeout(init, 1000);
      return;
    }

    videoSlides = findVideoSlides();
    if (videoSlides.length === 0) {
      setTimeout(init, 1000);
      return;
    }

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeydown, { passive: true });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    currentIndex = getCurrentVisibleIndex();

    // If queue mode exists, try to enable it once (non-blocking)
    setTimeout(() => {
      try {
        clickQueuePlayButton();
      } catch {
        // ignore
      }
    }, 2000);

    initialized = true;
  }

  function setupMutationObserver() {
    const observer = new MutationObserver(() => {
      // Reacquire container/slides if app rerenders
      if (!scrollContainer) {
        scrollContainer = findScrollContainer();
      }

      if (scrollContainer) {
        const newSlides = findVideoSlides();
        if (newSlides.length) videoSlides = newSlides;
      }

      if (!initialized) {
        init();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupMutationObserver();
      setTimeout(init, 2000);
    });
  } else {
    setupMutationObserver();
    setTimeout(init, 2000);
  }
})();
