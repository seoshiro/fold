import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cities, ui, type CityId, type Lang } from "./content";
import {
  readLanguage,
  readSaved,
  safeSet,
  type Navigation,
} from "./navigation";
import type { FoldScene, SceneFrame, SceneAnchor } from "./scene";
import { useAtlasNavigation } from "./useAtlasNavigation";
import { contextAtCityCommit, placeLabel, storyAppearance, PosterTransition, preloadPoster, type Rect } from "./presentation";
import { MODEL_REVISION } from "./model-revision";

type Anchor = SceneAnchor;
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
  const { nav, navigate, back: navigationBack, setTab, setWalkStep, pendingRestore, completeRestore } = useAtlasNavigation();
  const [viewContext, setViewContext] = useState({ tab: nav.tab, walkStep: nav.walkStep });
  const { tab, walkStep } = viewContext;
  const [presented, setPresented] = useState<Navigation>({ city: null, place: null });
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [settledContext, setSettledContext] = useState("");
  const contextKey = [nav.city, nav.place, nav.tab, nav.walkStep].join(":");
  const [lang, setLang] = useState<Lang>(readLanguage),
    [saved, setSaved] = useState<string[]>(readSaved);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(() =>
      new URLSearchParams(location.search).has("fallback"),
    ),
    [retry, setRetry] = useState(0),
    [status, setStatus] = useState("loading");
  const [intro, setIntro] = useState(
      () => !sessionSeen() && !nav.city,
    ),
    [storageError, setStorageError] = useState(false),
    [copyNotice, setCopyNotice] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const app = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    scene = useRef<FoldScene | null>(null),
    anchors = useRef(new Map<string, HTMLButtonElement>()),
    anchorPositions = useRef(new Map<string, Anchor>()),
    lastTrigger = useRef<HTMLElement | null>(null),
    article = useRef<HTMLElement>(null),
    sheetRef = useRef<HTMLElement>(null);
  const posterTransition = useRef(new PosterTransition<typeof nav>()),
    freshStory = useRef<string | null>(null),
    latestFrame = useRef<SceneFrame>({ story: 0, origin: { x: 0, y: 0 }, panel: 0 }),
    geometryRects = useRef<Rect[]>([]),
    presentationRef = useRef(presented),
    intent = useRef(nav);
  intent.current = nav;
  presentationRef.current = presented;
  const t = ui[lang],
    city = cities.find((c) => c.id === presented.city),
    place = city?.places.find((p) => p.id === presented.place);
  const activePoint = place
    ? city!.places.indexOf(place)
    : tab === "walk"
      ? walkStep
      : null;
  const updateFrame = useCallback((frame: SceneFrame) => {
    latestFrame.current = frame;
    app.current?.style.setProperty("--panel-opacity", String(frame.panel));
    app.current?.querySelectorAll<HTMLElement>(".city-panel,.home-copy").forEach(el => { el.inert = frame.panel < .96; });
    const el = article.current, area = stage.current;
    if (!el || !area) return;
    const parent = (el.offsetParent as HTMLElement).getBoundingClientRect();
    const sceneRect = area.getBoundingClientRect();
    const visual = storyAppearance(frame.story,
      { x: sceneRect.left + frame.origin.x, y: sceneRect.top + frame.origin.y },
      { left: parent.left + el.offsetLeft, top: parent.top + el.offsetTop });
    el.style.transform = visual.transform;
    el.style.opacity = String(visual.opacity);
    el.style.setProperty("--story-ink", String(visual.ink));
    el.dataset.readable = String(visual.readable);
    el.dataset.progress = frame.story.toFixed(3);
    el.inert = !visual.readable;
  }, []);
  const updateAnchors = useCallback((items: Anchor[], geometry: Rect[] = []) => {
    geometryRects.current = geometry;
    const area = stage.current;
    if (!area) return;
    const stageRect = area.getBoundingClientRect();
    const occupied: Rect[] = [];
    app.current?.querySelectorAll<HTMLElement>(".city-panel,.story-paper,.home-copy,.scene-tools").forEach(el => {
      const r = el.getBoundingClientRect();
      occupied.push({ left: r.left - stageRect.left, top: r.top - stageRect.top, right: r.right - stageRect.left, bottom: r.bottom - stageRect.top });
    });
    const frame = { left: 12, top: 12, right: stageRect.width - 12, bottom: stageRect.height - 12 };
    const prioritized = [...items].sort((a, b) => Number(b.id === `poi-${intent.current.walkStep}` && intent.current.tab === "walk") - Number(a.id === `poi-${intent.current.walkStep}` && intent.current.tab === "walk"));
    for (const a of prioritized) {
      anchorPositions.current.set(a.id, a);
      const el = anchors.current.get(a.id);
      if (!el) continue;
      el.dataset.compact = "false";
      let placement = a.visible ? placeLabel(a, { width: el.offsetWidth, height: el.offsetHeight }, frame, occupied, geometry, a.id.startsWith("city-")) : null;
      if (!placement && a.visible && a.id.startsWith("poi-")) {
        el.dataset.compact = "true";
        placement = placeLabel(a, { width: el.offsetWidth, height: el.offsetHeight }, frame, occupied, geometry);
      }
      if (placement) {
        occupied.push(placement.rect);
        el.style.transform = `translate3d(${placement.x}px,${placement.y}px,0) translate(-50%,-50%)`;
      }
      el.style.visibility = placement ? "visible" : "hidden";
      el.dataset.visible = String(!!placement);
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
  const go = useCallback((n: Navigation) => {
    const previous = intent.current;
    lastTrigger.current = document.activeElement as HTMLElement;
    setSheet(null);
    navigate(n);
    if (n.city !== previous.city || n.place !== previous.place) {
      freshStory.current = n.place ? `${n.city}/${n.place}` : null;
      // The navigation store captured the outgoing viewport before this move.
      // Show the physical unfold, instead of animating above a scrolled list.
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [navigate]);
  const back = useCallback(() => {
    if (sheet) {
      setSheet(null);
      lastTrigger.current?.focus();
    } else if (intent.current.city) navigationBack();
    else if (intro) skipIntro();
  }, [navigationBack, intro, sheet, skipIntro]);
  useEffect(() => {
    setSheet(null);
    if (freshStory.current !== `${nav.city}/${nav.place}`) freshStory.current = null;
  }, [nav.city, nav.place]);
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
    if (fallback) {
      setIntro(false);
      return;
    }
    setStatus("loading");
    import("./scene")
      .then(({ FoldScene }) => {
        if (disposed || !canvas.current) return;
        scene.current = new FoldScene(canvas.current, {
          onReady: () => {
            if (disposed) return;
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
          onFrame: updateFrame,
          onSettled: target => {
            if (disposed) return;
            setSettledContext(target.context || "");
            setViewContext({ tab: intent.current.tab, walkStep: intent.current.walkStep });
          },
          onPresentation: ({ city: cityId, place: index }) => {
            if (disposed) return;
            const c = cities.find(c => c.id === cityId);
            setPresented({ city: cityId, place: index == null ? null : c?.places[index]?.id ?? null });
            setViewContext(current => contextAtCityCommit(presentationRef.current.city, cityId, current, intent.current));
          },
          onState: (s: string) => {
            if (!disposed) {
              setStatus(s);
              if (s === "city" || s === "place" || s === "crane") setViewContext({ tab: intent.current.tab, walkStep: intent.current.walkStep });
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
  }, [fallback, retry, updateAnchors, updateFrame]);
  useEffect(() => {
    if (ready && !fallback)
      scene.current?.setTarget({
        city: nav.city,
        place: nav.place ? cities.find(c => c.id === nav.city)!.places.findIndex(p => p.id === nav.place) : null,
        focus: nav.tab === "walk" ? nav.walkStep : null,
        intro: intro && !reduced,
        reducedMotion: reduced,
        context: contextKey,
      });
  }, [
    nav.city,
    nav.place,
    nav.tab,
    nav.walkStep,
    intro,
    reduced,
    ready,
    fallback,
    contextKey,
  ]);
  useEffect(() => {
    if (!ready || fallback || !canvas.current) return;
    const observer = new ResizeObserver(() => scene.current?.resize());
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [ready, fallback]);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => { if (!cancelled) scene.current?.resize(); };
    document.fonts.ready.then(refresh);
    document.fonts.addEventListener("loadingdone", refresh);
    return () => { cancelled = true; document.fonts.removeEventListener("loadingdone", refresh); };
  }, []);
  useEffect(() => {
    if (!fallback) { posterTransition.current.cancel(); return; }
    setStatus("loading-poster");
    void posterTransition.current.request(nav,
      `${base}posters/${nav.city || "crane"}.webp?v=${MODEL_REVISION}`, preloadPoster,
      (next, src) => {
        setPosterSrc(src); setPresented({ city: next.city, place: next.place });
        setViewContext({ tab: next.tab, walkStep: next.walkStep });
        setSettledContext([next.city, next.place, next.tab, next.walkStep].join(":"));
        setReady(true); setStatus("fallback");
      }, base + "paper-crane.svg");
    return () => posterTransition.current.cancel();
  }, [fallback, nav]);
  useLayoutEffect(() => {
    if (fallback) updateFrame({ story: presented.place ? 1 : 0, origin: { x: 0, y: 0 }, panel: 1 });
    else updateFrame(latestFrame.current);
    updateAnchors([...anchorPositions.current.values()], geometryRects.current);
    scene.current?.resize();
  }, [presented, lang, tab, walkStep, fallback, updateFrame, updateAnchors]);
  useEffect(() => {
    if (!pendingRestore || !ready) return;
    const settled = fallback ? status === "fallback" : status === (nav.place ? "place" : nav.city ? "city" : "crane");
    if (!settled || settledContext !== contextKey || presented.city !== nav.city || presented.place !== nav.place) return;
    const id = requestAnimationFrame(() => {
      if (!completeRestore(pendingRestore.id)) return;
      if (freshStory.current === `${nav.city}/${nav.place}` && window.innerWidth <= 800 && article.current) {
        const rect = article.current.getBoundingClientRect();
        if (rect.top > window.innerHeight * .45) window.scrollTo({ top: window.scrollY + rect.top - 24, behavior: reduced ? "instant" : "smooth" });
      }
      freshStory.current = null;
    });
    return () => cancelAnimationFrame(id);
  }, [pendingRestore, ready, fallback, status, presented, nav, settledContext, contextKey, completeRestore, reduced]);
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
    if (el) anchors.current.set(id, el);
    else anchors.current.delete(id);
  };
  return (
    <div
      ref={app}
      data-presented-city={presented.city || "crane"}
      data-presented-place={presented.place || ""}
      className={`app ${city ? "city-mode" : "home-mode"} ${place ? "story-mode" : ""} ${fallback ? "fallback-mode" : ""} ${intro && !ready ? "is-loading" : ""}`}
      data-scene={status}
    >
      <a className="skip-link" href="#content">
        {t.fullList}
      </a>
      <header className="header">
        <button
          className="wordmark"
          data-focus-key="home"
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
        <div className="scene-stage" ref={stage} aria-label={t.sceneDescription}>
          {!fallback && <canvas ref={canvas} aria-hidden="true" />}
          {fallback && posterSrc && (
            <img className="fallback-poster" src={posterSrc} alt={city ? city.name[lang] : t.sceneDescription} />
          )}
          {(!ready || (fallback && !posterSrc)) && (
            <div className="loading" role="status">
              <p>{t.loadingPaper}</p>
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
                      data-focus-key={`pin:${city.id}:${p.id}`}
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
                onClick={navigationBack}
              >
                <Arrow back />
                {t.backToCrane}
              </button>
            </div>
            <h1 id="city-title" tabIndex={-1} data-focus-key={`city-title:${city.id}`}>
              {city.name[lang]}
              <span className="title-period">.</span>
            </h1>
            <p className="city-subtitle">{city.subtitle[lang]}</p>
            <div className="tabs" role="tablist" aria-label={city.name[lang]} onKeyDown={(event) => {
              if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
              event.preventDefault();
              const order = ['walk','places','notes'] as const;
              const i = order.indexOf(tab);
              const next = event.key === 'Home' ? order[0] : event.key === 'End' ? order[2] : order[(i + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
              setTab(next);
              event.currentTarget.querySelector<HTMLButtonElement>('#tab-' + next)?.focus();
            }}>
              {(["walk", "places", "notes"] as const).map((x) => (
                <button
                  key={x}
                  role="tab"
                  id={"tab-" + x}
                  data-focus-key={"tab:" + x}
                  aria-controls="city-tab-panel"
                  aria-selected={tab === x}
                  tabIndex={tab === x ? 0 : -1}
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
                        data-focus-key={`place:${city.id}:${p.id}`}
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
                    data-focus-key={`walk:${city.id}:${walkStep}`}
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
            data-focus-key={`story:${city.id}:${place.id}`}
            data-story-key={`${city.id}/${place.id}`}
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
                onClick={navigationBack}
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
                onClick={navigationBack}
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
                data-focus-key={`city:${c.id}`}
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
