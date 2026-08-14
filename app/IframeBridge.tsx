"use client";

import { useEffect } from "react";

/**
 * Posts the document height to the parent window so the host iframe
 * can resize perfectly (no inner scrollbars / no cut-offs).
 *
 * The SolutionsEmbedClient in the website listens for messages with:
 *   { type: "javari_IFRAME_HEIGHT", height: number }
 */
export default function IframeBridge() {
  useEffect(() => {
    const post = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight
      );
      window.parent?.postMessage({ type: "javari_IFRAME_HEIGHT", height: h }, "*");
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);

    const mo = new MutationObserver(post);
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });

    window.addEventListener("load", post);
    window.addEventListener("resize", post);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("load", post);
      window.removeEventListener("resize", post);
    };
  }, []);

  return null;
}
