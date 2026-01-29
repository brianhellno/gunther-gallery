(() => {
  const PHOTOS_PATH = "./Photos/";     // Capital P
  const INDEX_JSON = "./photos.json";  // generated file

  const gallery = document.getElementById("gallery");
  const statusBox = document.getElementById("status");

  const modeBtn = document.getElementById("modeBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  const lightbox = document.getElementById("lightbox");
  const lbBackdrop = document.getElementById("lbBackdrop");
  const lbImg = document.getElementById("lbImg");
  const lbTitle = document.getElementById("lbTitle");
  const lbOpen = document.getElementById("lbOpen");
  const lbClose = document.getElementById("lbClose");

  function setStatus(title, sub, spinning=true){
    statusBox.style.display = "flex";
    statusBox.querySelector(".status-title").textContent = title;
    statusBox.querySelector(".status-sub").innerHTML = sub;
    statusBox.querySelector(".spinner").style.display = spinning ? "block" : "none";
  }

  function hideStatus(){
    statusBox.style.display = "none";
  }

  function render(files){
    gallery.innerHTML = "";
    const frag = document.createDocumentFragment();

    files.forEach((file, idx) => {
      const src = PHOTOS_PATH + encodeURIComponent(file).replaceAll("%2F","/");

      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = src;
      img.alt = file;

      const meta = document.createElement("div");
      meta.className = "meta";

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = file;

      meta.appendChild(name);
      card.appendChild(img);
      card.appendChild(meta);

      const open = () => openLightbox({src, title:file, index: idx, files});
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });

      frag.appendChild(card);
    });

    gallery.appendChild(frag);
  }

  function openLightbox({src, title, index, files}){
    lbImg.src = src;
    lbImg.alt = title;
    lbTitle.textContent = title;
    lbOpen.href = src;

    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };

    const nav = (delta) => {
      const next = index + delta;
      if (next < 0 || next >= files.length) return;
      index = next;
      const nextFile = files[index];
      const nextSrc = PHOTOS_PATH + encodeURIComponent(nextFile).replaceAll("%2F","/");
      lbImg.src = nextSrc;
      lbImg.alt = nextFile;
      lbTitle.textContent = nextFile;
      lbOpen.href = nextSrc;
    };

    window.__lbKeyHandler = onKey;
    window.addEventListener("keydown", onKey);
  }

  function closeLightbox(){
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (window.__lbKeyHandler) {
      window.removeEventListener("keydown", window.__lbKeyHandler);
      window.__lbKeyHandler = null;
    }
  }

  async function load(){
    try{
      setStatus("Loading Photos…", `Reading <code>photos.json</code>`, true);

      const res = await fetch(INDEX_JSON, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not fetch photos.json (HTTP ${res.status}).`);

      const data = await res.json();

      // data can be ["file.jpg", ...] OR [{"file":"x","mtime":...}, ...]
      const files = Array.isArray(data)
        ? data.map(x => (typeof x === "string" ? x : x.file)).filter(Boolean)
        : [];

      if (!files.length){
        throw new Error("photos.json loaded, but it contains no files.");
      }

      hideStatus();
      render(files);

    } catch(err){
      setStatus(
        "Couldn’t load gallery",
        `${String(err.message || err)}<br/>Make sure <code>photos.json</code> is in the Gunther folder (same place as index.html).`,
        false
      );
    }
  }

  modeBtn.addEventListener("click", () => {
    document.body.classList.toggle("compact");
  });

  refreshBtn.addEventListener("click", () => load());

  lbBackdrop.addEventListener("click", closeLightbox);
  lbClose.addEventListener("click", closeLightbox);

  load();
})();