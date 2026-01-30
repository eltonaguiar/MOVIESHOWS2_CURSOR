(() => {
  const STYLE = {
    rail: {
      position: "relative",
      zIndex: "80",
      pointerEvents: "auto",
    },
    desc: {
      position: "relative",
      zIndex: "90",
      maxHeight: "8.5em",
      overflow: "auto",
      padding: "6px 10px",
      borderRadius: "10px",
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      pointerEvents: "auto",
    },
  };

  const applyStyles = (el, styles) => {
    if (!el || !styles) return;
    for (const [k, v] of Object.entries(styles)) {
      try {
        el.style[k] = v;
      } catch {
        // ignore
      }
    }
  };

  const isElementVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 20) return false;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
    const cs = window.getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false;
    return true;
  };

  const scoreRailCandidate = (el) => {
    if (!isElementVisible(el)) return -1;
    const rect = el.getBoundingClientRect();
    const imgs = el.querySelectorAll("img").length;
    const buttons = el.querySelectorAll("button,[role=button],a").length;
    const nearBottom = rect.top > window.innerHeight * 0.55 ? 1 : 0;
    const horizontal = rect.width > window.innerWidth * 0.6 && rect.height < window.innerHeight * 0.35 ? 1 : 0;
    return imgs * 3 + buttons + nearBottom * 5 + horizontal * 5;
  };

  const findBottomRail = () => {
    const candidates = Array.from(document.querySelectorAll("div,section,nav"));
    let best = null;
    let bestScore = 0;
    for (const el of candidates) {
      const s = scoreRailCandidate(el);
      if (s > bestScore) {
        bestScore = s;
        best = el;
      }
    }
    if (!best || bestScore < 12) return null;
    return best;
  };

  const scoreDescCandidate = (el) => {
    if (!isElementVisible(el)) return -1;
    const text = (el.textContent || "").trim();
    if (text.length < 60) return -1;
    if (text.length > 900) return -1;
    const rect = el.getBoundingClientRect();
    const nearBottomLeft = rect.left < window.innerWidth * 0.55 && rect.top > window.innerHeight * 0.55 ? 1 : 0;
    const isParagraphLike = el.tagName === "P" || el.tagName === "DIV" || el.tagName === "SPAN" ? 1 : 0;
    return text.length / 20 + nearBottomLeft * 8 + isParagraphLike * 2;
  };

  const findDescriptionBlock = () => {
    const candidates = Array.from(document.querySelectorAll("p,div,span"));
    let best = null;
    let bestScore = 0;
    for (const el of candidates) {
      if (el.closest("button,a,[role=button],input,textarea,select")) continue;
      const s = scoreDescCandidate(el);
      if (s > bestScore) {
        bestScore = s;
        best = el;
      }
    }
    if (!best || bestScore < 10) return null;
    return best;
  };

  const fix = () => {
    const rail = findBottomRail();
    if (rail) {
      applyStyles(rail, STYLE.rail);
      const parent = rail.parentElement;
      if (parent) applyStyles(parent, { position: "relative", zIndex: "79", pointerEvents: "auto" });
    }

    const desc = findDescriptionBlock();
    if (desc) {
      applyStyles(desc, STYLE.desc);
      const parent = desc.parentElement;
      if (parent) applyStyles(parent, { position: "relative", zIndex: "89" });
    }
  };

  const start = () => {
    fix();
    const mo = new MutationObserver(() => fix());
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
    window.addEventListener("resize", () => fix(), { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
