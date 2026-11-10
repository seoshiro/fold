import { useCallback, useEffect, useRef, useState } from "react";
import { cities, ui, type CityId, type Lang } from "./content";
import {
  initialNavigation,
  navigationUrl,
  readLanguage,
  readSaved,
  safeSet,
  type Navigation,
} from "./navigation";
import type { FoldScene } from "./scene";

type Anchor = { id: string; x: number; y: number; visible: boolean };
type Sheet = "saved" | "about" | null;
const base = import.meta.env.BASE_URL;
const Arrow = ({ back = false }: { back?: boolean }) => (
  <span aria-hidden="true">{back ? "←" : "↗"}</span>
);
const Bookmark = ({ filled = false }: { filled?: boolean }) => (
  <svg
    aria-hidden="true"
    width="18"
    height="20"
    viewBox="0 0 18 20"
    fill={filled ? "currentColor" : "none"}
  >
    <path
      d="M4 2.5h10v15l-5-3.5-5 3.5z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);
function sessionSeen() {
  try {
    return sessionStorage.getItem("fold-seen") === "1";
  } catch {
    return false;
  }
}
function App() {
  const [nav, setNav] = useState<Navigation>(initialNavigation),
    [lang, setLang] = useState<Lang>(readLanguage),
    [saved, setSaved] = useState<string[]>(readSaved);
  const [tab, setTab] = useState<"places" | "walk" | "notes">("places"),
    [walkStep, setWalkStep] = useState(0),
    [sheet, setSheet] = useState<Sheet>(null);
  const [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(() =>
      new URLSearchParams(location.search).has("fallback"),
    ),
    [retry, setRetry] = useState(0),
    [status, setStatus] = useState("loading");
  const [intro, setIntro] = useState(
      () => !sessionSeen() && !initialNavigation().city,
    ),
    [storageError, setStorageError] = useState(false),
    [copyNotice, setCopyNotice] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const canvas = useRef<HTMLCanvasElement>(null),
    scene = useRef<FoldScene | null>(null),
    anchors = useRef(new Map<string, HTMLButtonElement>()),
    anchorPositions = useRef(new Map<string, Anchor>()),
    placeTrigger = useRef<HTMLElement | null>(null),
    lastTrigger = useRef<HTMLElement | null>(null),
    article = useRef<HTMLElement>(null),
    sheetRef = useRef<HTMLElement>(null);
  const readyRef = useRef(false),
    intent = useRef(nav);
  intent.current = nav;
  const t = ui[lang],
    city = cities.find((c) => c.id === nav.city),
    place = city?.places.find((p) => p.id === nav.place);
  const activePoint = place
    ? city!.places.indexOf(place)
    : tab === "walk"
      ? walkStep
      : null;
  const updateAnchors = useCallback((items: Anchor[]) => {
    for (const a of items) {
      anchorPositions.current.set(a.id, a);
      const el = anchors.current.get(a.id);
      if (el) {
        el.style.transform = `translate3d(${a.x}px,${a.y}px,0) translate(-50%,-50%)`;
        el.style.visibility = a.visible ? "visible" : "hidden";
        el.dataset.visible = String(a.visible);
      }
    }
  }, []);
  const seen = () => {
    try {
      sessionStorage.setItem("fold-seen", "1");
    } catch {}
  };
  const skipIntro = useCallback(() => {
    scene.current?.skipIntro();
    setIntro(false);
    seen();
  }, []);
  const go = useCallback((n: Navigation, replace = false) => {
    if (n.place && !intent.current.place)
      placeTrigger.current = document.activeElement as HTMLElement;
    const closingPlace = !n.place && !!intent.current.place;
    const closingCity = !n.city && !!intent.current.city;
    const returnCity = intent.current.city;
    const returnKey = `${intent.current.city}/${intent.current.place}`;
    lastTrigger.current = document.activeElement as HTMLElement;
    const u = navigationUrl(n);
    if (replace) history.replaceState(n, "", u);
    else if (u !== location.pathname + location.search + location.hash)
      history.pushState(n, "", u);
    setNav(n);
    setSheet(null);
    if (n.city !== intent.current.city) {
      setTab("places");
      setWalkStep(0);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    if (closingCity)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            `.city-choices [data-city-key="${returnCity}"]`,
          )
          ?.focus({ preventScroll: true }),
      );
    if (closingPlace)
      requestAnimationFrame(() => {
        if (placeTrigger.current?.isConnected)
          placeTrigger.current.focus({ preventScroll: true });
        else
          document
            .querySelector<HTMLElement>(
              `[data-place-key="${returnKey}"]:not(.poi-anchor)`,
            )
            ?.focus({ preventScroll: true });
      });
  }, []);
  const back = useCallback(() => {
    if (sheet) {
      setSheet(null);
      lastTrigger.current?.focus();
    } else if (intent.current.place) {
      go({ city: intent.current.city, place: null });
      setTimeout(
        () => lastTrigger.current?.isConnected && lastTrigger.current.focus(),
        50,
      );
    } else if (intent.current.city) go({ city: null, place: null });
    else if (intro) skipIntro();
  }, [go, intro, sheet, skipIntro]);
  useEffect(() => {
    const h = () => {
      setNav(initialNavigation());
      setSheet(null);
      setTab("places");
      setWalkStep(0);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", h);
    return () => window.removeEventListener("popstate", h);
  }, []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const h = () => setReduced(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "kk" ? "kk-KZ" : lang;
    safeSet("fold-language", lang);
  }, [lang]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [back]);
  useEffect(() => {
    let disposed = false;
    setReady(false);
    readyRef.current = false;
    if (fallback) {
      setReady(true);
      setIntro(false);
      setStatus("fallback");
      return;
    }
    setStatus("loading");
    import("./scene")
      .then(({ FoldScene }) => {
        if (disposed || !canvas.current) return;
        scene.current = new FoldScene(canvas.current, {
          onReady: () => {
            if (disposed) return;
            readyRef.current = true;
            setReady(true);
          },
          onError: () => {
            if (!disposed) {
              setFallback(true);
              setReady(true);
              setIntro(false);
            }
          },
          onAnchors: updateAnchors,
          onState: (s: string) => {
            if (!disposed) {
              setStatus(s);
              if (s === "crane") {
                setIntro(false);
                seen();
              }
            }
          },
        });
      })
      .catch(() => {
        if (!disposed) {
          setFallback(true);
          setReady(true);
          setIntro(false);
        }
      });
    return () => {
      disposed = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [fallback, retry, updateAnchors]);
  useEffect(() => {
    if (ready && !fallback)
      scene.current?.setTarget({
        city: nav.city,
        place: place ? city!.places.indexOf(place) : null,
        focus: tab === "walk" ? walkStep : null,
        intro: intro && !reduced,
        reducedMotion: reduced,
      });
  }, [
    nav.city,
    nav.place,
    activePoint,
    tab,
    walkStep,
    intro,
    reduced,
    ready,
    fallback,
  ]);
  useEffect(() => {
    if (!ready || fallback || !canvas.current) return;
    const observer = new ResizeObserver(() => scene.current?.resize());
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [ready, fallback]);
  useEffect(() => {
    if (place)
      requestAnimationFrame(() =>
        article.current?.focus({ preventScroll: true }),
      );
  }, [nav.place]);
  useEffect(() => {
    if (sheet) {
      requestAnimationFrame(() => sheetRef.current?.focus());
      const trap = (e: KeyboardEvent) => {
        if (e.key !== "Tab" || !sheetRef.current) return;
        const f = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button,a[href],[tabindex="0"]',
          ),
        );
        const first = f[0],
          last = f[f.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === sheetRef.current ||
            !sheetRef.current.contains(document.activeElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !sheetRef.current.contains(document.activeElement))
        ) {
          e.preventDefault();
          first?.focus();
        }
      };
      document.addEventListener("keydown", trap);
      return () => document.removeEventListener("keydown", trap);
    }
  }, [sheet]);
  const toggleSave = (key: string) => {
    setSaved((old) => {
      const n = old.includes(key)
        ? old.filter((x) => x !== key)
        : [...old, key];
      setStorageError(!safeSet("fold-saved", JSON.stringify(n)));
      return n;
    });
  };
  const openSheet = (s: Sheet) => {
    lastTrigger.current = document.activeElement as HTMLElement;
    setSheet(s);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 2200);
    } catch {
      window.prompt(t.share, location.href);
    }
  };
  const chooseCity = (id: CityId) => {
    if (scene.current?.isDragging) return;
    skipIntro();
    go({ city: id, place: null });
  };
  const anchorRef = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      anchors.current.set(id, el);
      const a = anchorPositions.current.get(id);
      if (a) {
        el.style.transform = `translate3d(${a.x}px,${a.y}px,0) translate(-50%,-50%)`;
        el.style.visibility = a.visible ? "visible" : "hidden";
      }
    } else anchors.current.delete(id);
  };
  return (
    <div
      className={`app ${city ? "city-mode" : "home-mode"} ${place ? "story-mode" : ""} ${fallback ? "fallback-mode" : ""} ${intro && !ready ? "is-loading" : ""}`}
      data-scene={status}
    >
      <a className="skip-link" href="#content">
        {t.fullList}
      </a>
      <header className="header">
        <button
          className="wordmark"
          onClick={() => go({ city: null, place: null })}
          aria-label="FOLD"
        >
          FOLD<span className="edition">PAPER ATLAS / 01</span>
        </button>
        <nav className="main-nav" aria-label={t.destinations}>
          <button onClick={() => go({ city: null, place: null })}>
            {t.destinations}
          </button>
          <i>/</i>
          <button onClick={() => openSheet("saved")}>
            {t.savedPlaces}
            <span className="saved-count">
              {saved.length.toString().padStart(2, "0")}
            </span>
          </button>
        </nav>
        <div className="language" role="group" aria-label={t.language}>
          {(["en", "ru", "kk"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              lang={l}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main id="content" className="experience">
        {!city && (
          <div className="home-copy">
            <span className="eyebrow">{t.atlas}</span>
            <h1>{t.tagline}</h1>
            <p>{t.selectFold}</p>
          </div>
        )}
        <div className="scene-stage" aria-label={t.sceneDescription}>
          {!fallback && <canvas ref={canvas} aria-hidden="true" />}
          {fallback && (
            <img
              className="fallback-poster"
              onError={({ currentTarget }) => {
                if (!currentTarget.src.endsWith("paper-crane.svg"))
                  currentTarget.src = base + "paper-crane.svg";
              }}
              src={`${base}posters/${city?.id || "crane"}.webp`}
              alt={city ? city.name[lang] : t.sceneDescription}
            />
          )}
          {!ready && (
            <div className="loading" role="status">
              <div className="paper-loader" />
              <p>{t.loadingPaper}</p>
              <div className="ink-line" />
            </div>
          )}
          {ready && !fallback && !intro && (
            <div className="anchors" aria-label={t.chooseCity}>
              {!city
                ? cities.map((c) => (
                    <button
                      className="fold-anchor"
                      key={c.id}
                      ref={anchorRef("city-" + c.id)}
                      onClick={() => chooseCity(c.id)}
                    >
                      <span>{c.number}</span>
                      {c.id.toUpperCase()}
                      <span className="anchor-line" />
                    </button>
                  ))
                : city.places.map((p, i) => (
                    <button
                      className={`poi-anchor ${activePoint === i ? "active" : ""}`}
                      key={p.id}
                      ref={anchorRef("poi-" + i)}
                      data-place-key={`${city.id}/${p.id}`}
                      onClick={() => go({ city: city.id, place: p.id })}
                      aria-label={p.name[lang]}
                    >
                      <span className="poi-dot">{i + 1}</span>
                      <span className="poi-label">{p.name[lang]}</span>
                    </button>
                  ))}
            </div>
          )}
          {ready && !intro && !fallback && (
            <div className="scene-tools">
              <span>{t.dragHint}</span>
              <button
                onClick={() => scene.current?.rotate(-0.1)}
                aria-label={t.rotateLeft}
              >
                ‹
              </button>
              <button
                onClick={() => scene.current?.rotate(0.1)}
                aria-label={t.rotateRight}
              >
                ›
              </button>
              <button
                onClick={() => scene.current?.zoom(0.1)}
                aria-label={t.zoomIn}
              >
                +
              </button>
              <button
                onClick={() => scene.current?.zoom(-0.1)}
                aria-label={t.zoomOut}
              >
                −
              </button>
              <button
                onClick={() => scene.current?.resetView()}
                aria-label={t.resetView}
                title={t.resetView}
              >
                ↶
              </button>
            </div>
          )}
          {intro && ready && !city && !fallback && (
            <button className="skip-intro" onClick={skipIntro}>
              {t.skipIntro}
              <Arrow />
            </button>
          )}
        </div>
        {city && !place && (
          <section className="city-panel" aria-labelledby="city-title">
            <div className="chapter">
              <span>{city.number} / 03</span>
              <button
                className="back-link"
                onClick={() => go({ city: null, place: null })}
              >
                <Arrow back />
                {t.backToCrane}
              </button>
            </div>
            <h1 id="city-title">
              {city.name[lang]}
              <span className="title-period">.</span>
            </h1>
            <p className="city-subtitle">{city.subtitle[lang]}</p>
            <div className="tabs" role="tablist" aria-label={city.name[lang]}>
              {(["walk", "places", "notes"] as const).map((x) => (
                <button
                  key={x}
                  role="tab"
                  id={"tab-" + x}
                  aria-controls="city-tab-panel"
                  aria-selected={tab === x}
                  onClick={() => setTab(x)}
                >
                  {t[x]}
                </button>
              ))}
            </div>
            <div
              id="city-tab-panel"
              role="tabpanel"
              aria-labelledby={"tab-" + tab}
              className="tab-panel"
            >
              {tab === "places" && (
                <ol className="place-list">
                  {city.places.map((p, i) => (
                    <li key={p.id}>
                      <button
                        data-place-key={`${city.id}/${p.id}`}
                        onClick={() => go({ city: city.id, place: p.id })}
                      >
                        <span className="place-index">0{i + 1}</span>
                        <span>
                          <small>{p.kind[lang]}</small>
                          <strong>{p.name[lang]}</strong>
                        </span>
                        <Arrow />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {tab === "walk" && (
                <div className="walk-panel">
                  <p className="guide-note">{t.guideIntro}</p>
                  <span className="eyebrow">
                    {t.stop} {walkStep + 1} {t.of} 3
                  </span>
                  <h2>{city.places[walkStep].name[lang]}</h2>
                  <p>{city.places[walkStep].teaser[lang]}</p>
                  <button
                    className="text-link"
                    data-place-key={`${city.id}/${city.places[walkStep].id}`}
                    onClick={() =>
                      go({ city: city.id, place: city.places[walkStep].id })
                    }
                  >
                    {t.readStory}
                    <Arrow />
                  </button>
                  <div className="walk-nav">
                    <button
                      disabled={walkStep === 0}
                      onClick={() => setWalkStep((s) => s - 1)}
                      aria-label={t.previous}
                    >
                      ←
                    </button>
                    <div className="walk-dots">
                      {city.places.map((p, i) => (
                        <button
                          key={p.id}
                          aria-label={`${t.stop} ${i + 1}`}
                          aria-current={walkStep === i ? "step" : undefined}
                          onClick={() => setWalkStep(i)}
                        />
                      ))}
                    </div>
                    <button
                      disabled={walkStep === 2}
                      onClick={() => setWalkStep((s) => s + 1)}
                      aria-label={t.next}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
              {tab === "notes" && (
                <div className="notes-panel">
                  <p>{city.notes[lang]}</p>
                  <p className="caption">{t.artNote}</p>
                </div>
              )}
            </div>
            <div className="city-switcher" aria-label={t.chooseCity}>
              {cities.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={city.id === c.id}
                  onClick={() => chooseCity(c.id)}
                >
                  {c.id.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        )}
        {city && place && (
          <article
            className="story-paper"
            ref={article}
            tabIndex={-1}
            aria-labelledby="story-title"
          >
            <div className="story-top">
              <span className="eyebrow">
                {city.name[lang]} / 0{city.places.indexOf(place) + 1}
              </span>
              <button
                className="icon-button"
                onClick={() => go({ city: city.id, place: null })}
                aria-label={t.close}
              >
                ×
              </button>
            </div>
            <span className="story-kind">{place.kind[lang]}</span>
            <h1 id="story-title">{place.name[lang]}</h1>
            <div className="story-rule" />
            <p className="story-lead">{place.teaser[lang]}</p>
            {place.paragraphs[lang].map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <a
              className="source-link"
              href={place.source.url}
              target="_blank"
              rel="noreferrer"
            >
              {t.source}: {place.source.label}
              <Arrow />
            </a>
            <div className="story-actions">
              <button
                className="paper-button"
                onClick={() => toggleSave(city.id + "/" + place.id)}
                aria-pressed={saved.includes(city.id + "/" + place.id)}
              >
                <Bookmark filled={saved.includes(city.id + "/" + place.id)} />
                {saved.includes(city.id + "/" + place.id) ? t.saved : t.save}
              </button>
              <button
                className="text-link"
                onClick={() => go({ city: city.id, place: null })}
              >
                <Arrow back />
                {t.backToCity}
              </button>
              <button className="share-link" onClick={share}>
                {copyNotice ? t.copied : t.share}
              </button>
            </div>
          </article>
        )}
      </main>
      {!city && (
        <div className="home-bottom">
          <span className="choose-prompt">
            <i />
            {t.chooseCity}
            <i />
          </span>
          <nav className="city-choices" aria-label={t.chooseCity}>
            {cities.map((c) => (
              <button
                key={c.id}
                data-city-key={c.id}
                onClick={() => chooseCity(c.id)}
              >
                <span className="choice-number">{c.number}</span>
                <strong>{c.id.toUpperCase()}</strong>
                <span className="choice-dot" />
              </button>
            ))}
          </nav>
        </div>
      )}
      {fallback && (
        <div className="fallback-notice" role="status">
          <span>{t.fallback}</span>
          <button
            onClick={() => {
              setFallback(false);
              setRetry((r) => r + 1);
            }}
          >
            {t.retry3d}
          </button>
        </div>
      )}
      {storageError && (
        <p className="storage-notice" role="status">
          {t.savedUnavailable}
        </p>
      )}
      <footer>
        <button onClick={() => openSheet("about")}>{t.about}</button>
        <span>{t.artNote}</span>
        <a href="https://seoshiro.github.io/" target="_blank" rel="noreferrer">
          Beibars Ileskhan <Arrow />
        </a>
      </footer>
      <div className="sr-only" aria-live="polite">
        {city ? city.name[lang] : t.chooseCity}
        {place ? ". " + place.name[lang] : ""}
      </div>
      {sheet && (
        <div
          className="sheet-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(null);
          }}
        >
          <section
            className="utility-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            ref={sheetRef}
            tabIndex={-1}
          >
            <div className="sheet-top">
              <span className="eyebrow">
                FOLD / {sheet === "saved" ? "COLLECTION" : "COLOPHON"}
              </span>
              <button
                className="icon-button"
                onClick={() => {
                  setSheet(null);
                  lastTrigger.current?.focus();
                }}
                aria-label={t.close}
              >
                ×
              </button>
            </div>
            <h2 id="sheet-title">
              {sheet === "saved" ? t.savedPlaces : t.aboutTitle}
            </h2>
            {sheet === "saved" ? (
              saved.length ? (
                <ul className="saved-list">
                  {saved.map((key) => {
                    const [cid, pid] = key.split("/");
                    const c = cities.find((c) => c.id === cid)!,
                      p = c.places.find((p) => p.id === pid)!;
                    return (
                      <li key={key}>
                        <button onClick={() => go({ city: c.id, place: p.id })}>
                          <small>{c.name[lang]}</small>
                          <strong>{p.name[lang]}</strong>
                          <Arrow />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`${t.remove}: ${p.name[lang]}`}
                          onClick={() => toggleSave(key)}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>{t.noSavedPlaces}</p>
              )
            ) : (
              <>
                <p>{t.aboutBody}</p>
                <p>{t.artNote}</p>
                <a
                  className="text-link"
                  href="https://seoshiro.github.io/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.portfolio}
                  <Arrow />
                </a>
                <div className="colophon">
                  React · Three.js · GSAP · Blender
                  <br />© 2026 Beibars Ileskhan
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export default App;
