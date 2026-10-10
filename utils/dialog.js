/** Keyboard focus and inert background management shared by extension dialogs. */
'use strict';
globalThis.IYT_Dialog = (() => {
  let current = null, previous = null;
  const inertNodes = new Map();
  const focusable = () => current ? [...current.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length) : [];
  function isolate() {
    if (!current?.isConnected) { close(); return; }
    // YouTube replaces page sections during SPA navigation. Do not keep those
    // detached trees alive for the entire lifetime of a scheduled block.
    for (const [node, inert] of inertNodes) {
      if (!node.isConnected) {
        node.inert = inert;
        inertNodes.delete(node);
      }
    }
    if (previous && !previous.isConnected) previous = null;
    let child = current;
    while (child.parentElement) {
      for (const sibling of child.parentElement.children) {
        if (sibling !== child && !inertNodes.has(sibling)) { inertNodes.set(sibling, sibling.inert); sibling.inert = true; }
      }
      child = child.parentElement;
      if (child === document.body || child === document.documentElement) break;
    }
  }
  const observer = new MutationObserver(isolate);
  function close(element) {
    if (element && element !== current) return;
    observer.disconnect();
    for (const [node, inert] of inertNodes) node.inert = inert;
    inertNodes.clear();
    current = null;
    if (previous?.isConnected && previous.getClientRects().length) previous.focus();
    previous = null;
  }
  function open(element) {
    if (current === element) return;
    close();
    previous = document.activeElement;
    current = element;
    current.setAttribute('role', 'dialog');
    current.setAttribute('aria-modal', 'true');
    if (!current.hasAttribute('aria-label') && !current.hasAttribute('aria-labelledby')) {
      const title = current.querySelector('.iyt-modal-title, h1, h2');
      if (title) current.setAttribute('aria-label', title.textContent);
    }
    current.tabIndex = -1;
    isolate();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    (focusable()[0] || current).focus();
  }
  document.addEventListener('keydown', event => {
    if (!current || event.key !== 'Tab') return;
    const items = focusable(), first = items[0] || current, last = items.at(-1) || current;
    if (!current.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last) || !items.length) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  }, true);
  return { open, close };
})();
