(() => {
  if (!("serviceWorker" in navigator)) return;
  let refreshRequested = false;
  const showUpdate = (worker) => {
    if (document.querySelector(".app-update")) return;
    const notice = document.createElement("aside");
    notice.className = "app-update";
    notice.setAttribute("role", "status");
    const text = document.createElement("span");
    text.textContent = "Eine neue Version ist bereit. Offene Eingaben zuerst speichern.";
    const button = document.createElement("button");
    button.className = "ui-button ui-button--secondary";
    button.type = "button";
    button.textContent = "Jetzt neu laden";
    button.addEventListener("click", () => {
      refreshRequested = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    });
    notice.append(text, button);
    document.body.append(notice);
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshRequested) window.location.reload();
  });
  window.setTimeout(() => {
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller)
            showUpdate(worker);
        });
      });
    });
  }, 2_500);
})();
