"use client";

import { useEffect } from "react";

export default function HeightReporter() {
  useEffect(() => {
    const post = () => {
      const h = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      if (window.parent && typeof window.parent.postMessage === "function") {
        window.parent.postMessage({ type: "javari_IFRAME_HEIGHT", height: h }, "*");
      }
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    ro.observe(document.body);

    const mo = new MutationObserver(post);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    window.addEventListener("load", post);
    window.addEventListener("resize", post);

    return () => {
      try { ro.disconnect(); } catch {}
      try { mo.disconnect(); } catch {}
      window.removeEventListener("load", post);
      window.removeEventListener("resize", post);
    };
  }, []);

  return null;
}
