import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { MODEL_REVISION, PAPER_ALBEDO_REVISION, PAPER_HEIGHT_REVISION } from './model-revision';

export type CityId = 'kyoto' | 'lisbon' | 'almaty';
export type SceneAnchor = { id: string; x: number; y: number; visible: boolean };
export type FoldSceneOptions = {
  onReady: () => void;
  onError: (err: Error) => void;
  onAnchors: (anchors: SceneAnchor[]) => void;
  onState?: (state: string) => void;
};
export type FoldTarget = { city: CityId | null; place: number | null; focus?: number | null; intro?: boolean; reducedMotion: boolean };
type Hinge = { node: THREE.Object3D; closed: number; delay: number; base: THREE.Quaternion };
const cities: CityId[] = ['kyoto', 'lisbon', 'almaty'];
const X = new THREE.Vector3(1, 0, 0);
const clamp = THREE.MathUtils.clamp;
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

/** One canvas, one transform owner. Intent replaces, rather than queues, motion. */
export class FoldScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-6, 6, 4, -4, .1, 100);
  private model = new THREE.Group();
  private orbit = new THREE.Group();
  private covers: { node: THREE.Object3D; open: number }[] = [];
  private cityRoots = new Map<CityId, THREE.Object3D>();
  private hinges = new Map<CityId, Hinge[]>();
  private anchors = new Map<string, THREE.Object3D>();
  private story: THREE.Object3D | null = null;
  private storyOriginal = new THREE.Vector3();
  private neckPivot = new THREE.Group();
  private tailPivot = new THREE.Group();
  private target: FoldTarget = { city: null, place: null, reducedMotion: false };
  private pose = { wing: 0, kyoto: 0, lisbon: 0, almaty: 0, story: 0, view: 0, intro: 1, dragX: 0, dragY: 0, zoom: 1, focus: 0, focusX: 0, focusY: 0, focusZ: 0, storyX: 0, storyZ: 0 };
  private transition: gsap.core.Timeline | null = null;
  private viewTween: gsap.core.Tween | null = null;
  private raf = 0;
  private ready = false;
  private disposed = false;
  private startedIntro = false;
  private state = 'loading';
  private dirty = true;
  private width = 1;
  private height = 1;
  private activeUntil = 0;
  private pointer: { id: number; x: number; y: number; originX: number; originY: number; moved: boolean } | null = null;
  private suppressUntil = 0;
  private stats = { frames: 0, draws: 0, triangles: 0, meshes: 0, geometries: 0, loadMs: 0, assetBytes: 0 };
  private projected = new THREE.Vector3();
  private focusPoint = new THREE.Vector3();
  private lastAnchorHash = '';
  private onPointerDown = (e: PointerEvent) => this.pointerDown(e);
  private onPointerMove = (e: PointerEvent) => this.pointerMove(e);
  private onPointerUp = (e: PointerEvent) => this.pointerUp(e);
  private onLost = (e: Event) => { e.preventDefault(); this.options.onError(new Error('WebGL context lost')); this.stopLoop(); };

  constructor(private canvas: HTMLCanvasElement, private options: FoldSceneOptions) {
    this.emit('loading');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0xa11b10, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.6 : 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.scene.add(this.orbit);
    const sky = new THREE.HemisphereLight(0xfff8e9, 0x652013, .8);
    this.scene.add(sky);
    const key = new THREE.DirectionalLight(0xffefce, 2.8);
    key.position.set(-3.5, 8, 5); key.castShadow = true;
    key.shadow.mapSize.set(window.innerWidth < 700 ? 512 : 1024, window.innerWidth < 700 ? 512 : 1024);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 6, bottom: -5, near: .1, far: 25 });
    key.shadow.bias = -.00035; key.shadow.normalBias = .018; key.shadow.radius = 7; key.shadow.blurSamples = 10;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9e1ee, .32); fill.position.set(4, 5, -5); this.scene.add(fill);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x2a0703, opacity: .13 }));
    shadow.name = 'Contact shadow receiver'; shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005; shadow.receiveShadow = true;
    this.scene.add(shadow);
    // Broad indirect contact, independent of the crisp directional cast shadow.
    const contactCanvas = document.createElement('canvas'); contactCanvas.width = contactCanvas.height = 128;
    const contactContext = contactCanvas.getContext('2d');
    if (contactContext) {
      const gradient = contactContext.createRadialGradient(64, 64, 2, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(31, 4, 2, 0.34)'); gradient.addColorStop(.45, 'rgba(31, 4, 2, 0.17)'); gradient.addColorStop(1, 'rgba(31, 4, 2, 0)');
      contactContext.fillStyle = gradient; contactContext.fillRect(0, 0, 128, 128);
      const contact = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 4.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(contactCanvas), transparent: true, depthWrite: false, opacity: .78 }));
      contact.name = 'Soft indirect paper contact'; contact.rotation.x = -Math.PI / 2; contact.position.set(.2, .012, .6); this.scene.add(contact);
    }
    this.canvas.style.touchAction = 'pan-y';
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('webglcontextlost', this.onLost);
    this.resize();
    const start = performance.now();
    new GLTFLoader().load(`${import.meta.env.BASE_URL}models/fold-master.glb?v=${MODEL_REVISION}`, async gltf => {
      if (this.disposed) { this.disposeObject(gltf.scene); return; }
      this.model = gltf.scene; this.orbit.add(this.model);
      this.prepareModel();
      await this.preparePaper();
      if (this.disposed) return;
      this.stats.loadMs = Math.round(performance.now() - start);
      this.ready = true;
      this.applyPose(); this.render();
      this.options.onReady();
      this.setTarget(this.target, true);
    }, progress => { this.stats.assetBytes = progress.loaded; }, e => this.options.onError(e instanceof Error ? e : new Error('The paper model could not be loaded')));
    this.loop();
    // The debug surface is deliberately read-only except for documented deterministic pose controls.
    (window as unknown as { __FOLD_SCENE?: FoldScene }).__FOLD_SCENE = this;
  }

  private emit(state: string) { if (state !== this.state || state === 'loading') { this.state = state; this.options.onState?.(state); } }
  private prepareModel() {
    this.model.traverse(o => {
      if (o.name.startsWith('COVER_')) { this.covers.push({ node: o, open: Number(o.userData.fold_open ?? -2.55) }); o.rotation.x = 0; }
      if (o.name.startsWith('CITY_')) {
        const id = o.name.slice(5) as CityId; this.cityRoots.set(id, o); this.hinges.set(id, []); o.visible = false;
      }
      if (o.name.startsWith('ANCHOR_')) this.anchors.set(o.name.slice(7), o);
      if (o.name === 'STORY_TAB') { this.story = o; this.storyOriginal.copy(o.position); this.pose.storyX = o.position.x; this.pose.storyZ = o.position.z; o.visible = false; }
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh; mesh.castShadow = true; mesh.receiveShadow = true; this.stats.meshes++;
        const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of ms) {
          const p = m as THREE.MeshStandardMaterial;
          p.roughness = 1; p.metalness = 0;
          if (p.name === 'Warm cotton paper' && p.normalMap) { p.normalMap.dispose(); p.normalMap = null; }
          if (p.map) { p.map.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4); }
          p.side = THREE.FrontSide; // The mesh has an actual closed underside; no duplicate double-sided shading.
        }
      }
    });
    for (const [id, root] of this.cityRoots) root.traverse(o => {
      if (o.userData.fold_role === 'architecture') this.hinges.get(id)!.push({ node: o, closed: Number(o.userData.fold_closed), delay: Number(o.userData.fold_delay || 0), base: o.quaternion.clone() });
    });
    // Model is exported open at local X=0 for architecture, with all rigid sheets inspectable.
    this.attachPivot('CRANE_neck', this.neckPivot, new THREE.Vector3(-1.45, .25, .39));
    this.attachPivot('CRANE_tail', this.tailPivot, new THREE.Vector3(.35, .83, -.28));
  }
  private async preparePaper() {
    // Approved single Higgsfield washi generation, documented in the asset ledger.
    // The embedded original texture remains a usable fallback if this optional enhancement fails.
    try {
      const loader = new THREE.TextureLoader();
      const [albedo, height] = await Promise.all([
        loader.loadAsync(`${import.meta.env.BASE_URL}textures/higgsfield-washi-albedo.webp?v=${PAPER_ALBEDO_REVISION}`),
        loader.loadAsync(`${import.meta.env.BASE_URL}textures/higgsfield-washi-height.webp?v=${PAPER_HEIGHT_REVISION}`),
      ]);
      albedo.colorSpace = THREE.SRGBColorSpace;
      for (const t of [albedo, height]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4); }
      if (this.disposed) { albedo.dispose(); height.dispose(); return; }
      const originals = new Set<THREE.Texture>();
      this.model.traverse(o => {
        if (!(o as THREE.Mesh).isMesh) return;
        const mesh = o as THREE.Mesh;
        for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
          const paper = m as THREE.MeshStandardMaterial;
          if (!paper.name.startsWith('Warm cotton paper')) continue;
          if (paper.map && paper.map !== albedo) originals.add(paper.map);
          paper.map = albedo; paper.bumpMap = height; paper.bumpScale = .007; paper.needsUpdate = true;
        }
      });
      originals.forEach(t => t.dispose());
    } catch { /* A failed optional texture never strands the site in loading. */ }
  }
  private attachPivot(name: string, pivot: THREE.Group, point: THREE.Vector3) {
    const node = this.model.getObjectByName(name); if (!node || !node.parent) return;
    const parent = node.parent; parent.add(pivot); pivot.position.copy(point); pivot.updateMatrixWorld(true); pivot.attach(node);
  }

  private focusDestination(next: FoldTarget): THREE.Vector3 | null {
    if (!next.city || next.focus == null) return null;
    const anchor = this.anchors.get(`${next.city}-poi-${next.focus}`);
    if (!anchor) return null;
    // Orbit-local coordinates retain the old endpoint and follow deliberate dragging.
    // Unlike the selected anchor ID, these coordinates can be tweened from the live pose.
    const point = anchor.getWorldPosition(new THREE.Vector3());
    return this.orbit.worldToLocal(point);
  }
  private storyDestination(next: FoldTarget): THREE.Vector3 | null {
    if (!next.city || next.place === null || !this.story?.parent) return null;
    const anchor = this.anchors.get(`${next.city}-poi-${next.place}`);
    if (!anchor) return this.storyOriginal.clone();
    const point = this.story.parent.worldToLocal(anchor.getWorldPosition(new THREE.Vector3()));
    return new THREE.Vector3(point.x + .10, this.storyOriginal.y, point.z + .07);
  }
  private animateStory(timeline: gsap.core.Timeline, next: FoldTarget, changingCity: boolean, duration: number) {
    const destination = this.storyDestination(next);
    if (!destination) {
      // Retain the actual origin throughout closing. Resetting it here teleports a visible sheet.
      timeline.to(this.pose, { story: 0, duration: .25 * duration, ease: 'power2.in' }, 0);
      return;
    }
    const movingOrigin = Math.abs(this.pose.storyX - destination.x) > 1e-6 || Math.abs(this.pose.storyZ - destination.z) > 1e-6;
    const closeFirst = this.pose.story > 0 && (movingOrigin || changingCity);
    const closedAt = closeFirst ? .25 * duration : 0;
    if (closeFirst) timeline.to(this.pose, { story: 0, duration: closedAt, ease: 'power2.in' }, 0);
    // A replacement timeline kills this pending relocation too. The origin changes only
    // at story=0, so interruptions always continue from the last physically displayed sheet.
    if (movingOrigin) timeline.set(this.pose, { storyX: destination.x, storyZ: destination.z, immediateRender: false }, closedAt);
    timeline.to(this.pose, { story: 1, duration: .70 * duration, ease: 'power2.inOut' }, Math.max(closedAt, (changingCity ? 1.25 : .03) * duration));
  }

  setTarget(next: FoldTarget, force = false) {
    const prev = this.target;
    this.target = { ...next, focus: next.focus ?? null };
    if (!this.ready || this.disposed) return;
    if (!force && prev.city === next.city && prev.place === next.place && (prev.focus ?? null) === (next.focus ?? null) && prev.intro === next.intro && prev.reducedMotion === next.reducedMotion) return;
    // Finishing/skipping the intro updates React's remembered flag, not the physical pose.
    // Do not create a redundant folding timeline for that state-only acknowledgment.
    if (!force && prev.city === next.city && prev.place === next.place && (prev.focus ?? null) === (next.focus ?? null) && prev.reducedMotion === next.reducedMotion && prev.intro && !next.intro && this.pose.intro === 1) return;
    this.transition?.kill(); this.transition = null;
    const fast = next.reducedMotion;
    if (next.intro && !this.startedIntro && !next.city && !fast) {
      this.startedIntro = true; this.pose.intro = 0; this.emit('intro');
      this.transition = gsap.timeline({ onUpdate: () => this.invalidate(), onComplete: () => { this.emit('crane'); this.invalidate(); } });
      this.transition.to(this.pose, { intro: 1, duration: 3.05, ease: 'power2.inOut' });
      return;
    }
    this.pose.intro = 1;
    const changingCity = prev.city !== next.city || force;
    const duration = fast ? .12 : 1;
    this.transition = gsap.timeline({ onUpdate: () => this.invalidate(), onComplete: () => {
      this.emit(next.place !== null && next.city ? 'place' : next.city ? 'city' : 'crane'); this.invalidate();
    } });
    const tl = this.transition;
    this.emit(next.city ? 'unfolding' : 'folding');
    this.animateStory(tl, next, changingCity, duration);
    if (!next.city) {
      tl.to(this.pose, { kyoto: 0, lisbon: 0, almaty: 0, duration: .68 * duration, ease: 'power2.inOut' }, 0);
      tl.to(this.pose, { wing: 0, view: 0, focus: 0, duration: 1.05 * duration, ease: 'power2.inOut' }, .40 * duration);
    } else {
      const others = Object.fromEntries(cities.filter(id => id !== next.city).map(id => [id, 0]));
      tl.to(this.pose, { ...others, duration: .61 * duration, ease: 'power2.inOut' }, 0);
      tl.to(this.pose, { wing: 1, view: 1, duration: 1.02 * duration, ease: 'power2.inOut' }, 0);
      tl.to(this.pose, { [next.city]: 1, duration: 1.18 * duration, ease: 'power2.inOut' }, (changingCity ? .50 : 0) * duration);
      const focus = this.focusDestination(next);
      if (focus && this.pose.focus === 0) {
        this.pose.focusX = focus.x; this.pose.focusY = focus.y; this.pose.focusZ = focus.z;
      }
      tl.to(this.pose, {
        focus: focus ? 1 : 0,
        ...(focus ? { focusX: focus.x, focusY: focus.y, focusZ: focus.z } : {}),
        duration: .7 * duration, ease: 'power2.inOut',
      }, 0);
    }
    this.invalidate();
  }

  /** Explicit QA control: settle the real current timeline for static inspection only. */
  finishTransition() { this.transition?.progress(1); this.viewTween?.progress(1); this.render(); }

  skipIntro() { if (this.state !== 'intro') return; this.transition?.kill(); this.pose.intro = 1; this.emit('crane'); this.invalidate(); }
  resetView() { this.viewTween?.kill(); this.viewTween = gsap.to(this.pose, { dragX: 0, dragY: 0, zoom: 1, duration: this.target.reducedMotion ? .1 : .65, ease: 'power2.out', onUpdate: () => this.invalidate() }); }
  rotate(delta: number) { this.viewTween?.kill(); this.viewTween = gsap.to(this.pose, { dragX: clamp(this.pose.dragX + delta, -.34, .34), duration: this.target.reducedMotion ? .1 : .4, onUpdate: () => this.invalidate() }); }
  zoom(delta: number) { this.viewTween?.kill(); this.viewTween = gsap.to(this.pose, { zoom: clamp(this.pose.zoom + delta, .82, 1.32), duration: .3, onUpdate: () => this.invalidate() }); }
  get isDragging() { return !!this.pointer?.moved || performance.now() < this.suppressUntil; }
  getStats() { return { ...this.stats, state: this.state, asset: { expectedRevision: MODEL_REVISION, primitiveMeshes: this.stats.meshes, covers: this.covers.map(c => ({ name: c.node.name, foldOpen: c.open, pivot: c.node.position.toArray(), currentRotationX: c.node.rotation.x })) }, pose: Object.fromEntries(Object.entries(this.pose).filter(([, value]) => typeof value === 'number')), renderer: { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles }, size: [this.width, this.height] }; }

  /** Reproducible proof poses, shared by QA and screenshots. Does not replace normal navigation. */
  setProgress(city: CityId, progress: number) {
    this.transition?.kill(); this.pose.intro = 1; this.target = { ...this.target, city, place: null };
    const p = clamp(progress, 0, 1); this.pose.wing = p; this.pose.view = p;
    for (const id of cities) this.pose[id] = id === city ? p : 0;
    this.pose.story = 0; this.invalidate();
  }
  resize() {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect(); this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    this.renderer.setSize(this.width, this.height, false); this.invalidate();
  }

  private pointerDown(e: PointerEvent) {
    if (e.button !== 0 || this.target.place !== null) return;
    this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, originX: this.pose.dragX, originY: this.pose.dragY, moved: false };
  }
  private pointerMove(e: PointerEvent) {
    const p = this.pointer; if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.moved) {
      if (Math.hypot(dx, dy) < 8) return;
      // A vertical phone gesture remains a native page scroll, not an orbit gesture.
      if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.2) { this.pointer = null; return; }
      p.moved = true; this.canvas.setPointerCapture?.(e.pointerId);
    }
    this.viewTween?.kill();
    this.pose.dragX = clamp(p.originX + dx * .0035, -.34, .34);
    this.pose.dragY = clamp(p.originY + dy * .0025, -.14, .18);
    this.invalidate();
  }
  private pointerUp(e: PointerEvent) { if (this.pointer?.id !== e.pointerId) return; if (this.pointer.moved) this.suppressUntil = performance.now() + 200; this.pointer = null; }

  private applyPose() {
    const p = this.pose;
    this.orbit.rotation.y = p.dragX + p.view * -.045;
    this.orbit.rotation.x = p.dragY;
    this.orbit.position.y = (1 - smooth(p.intro)) * -.12;
    this.neckPivot.rotation.z = (1 - smooth(p.intro)) * .62;
    this.tailPivot.rotation.z = (1 - smooth(p.intro)) * -1.20;
    for (const c of this.covers) c.node.rotation.x = c.open * smooth(p.wing);
    for (const [id, root] of this.cityRoots) {
      const rise = p[id]; root.visible = rise > .002;
      for (const h of this.hinges.get(id) || []) {
        const v = smooth((rise - h.delay * .35) / (1 - h.delay * .35));
        h.node.quaternion.copy(h.base).multiply(new THREE.Quaternion().setFromAxisAngle(X, h.closed * (1 - v)));
      }
    }
    if (this.story) {
      this.story.visible = p.story > .004;
      this.story.position.set(p.storyX, this.storyOriginal.y, p.storyZ);
      this.story.rotation.x = -.15 - smooth(p.story) * 1.03;
      // Same sheet stays attached; no shrink-to-zero hiding of geometry.
      this.story.position.y += .015;
    }
    this.model.updateMatrixWorld(true); this.frameCamera();
  }
  private frameCamera() {
    const aspect = this.width / this.height; const mobile = this.width < 760;
    const v = smooth(this.pose.view), story = smooth(this.pose.story);
    // Fit both actual width and height. Desktop leaves 34% canvas clear for readable HTML.
    const fitWidth = mobile ? 9.5 : THREE.MathUtils.lerp(11.0, 15.9, v);
    const fitHeight = mobile ? 5.3 : 5.75;
    let halfH = Math.max(fitHeight / 2, fitWidth / (2 * aspect));
    halfH /= this.pose.zoom;
    this.camera.left = -halfH * aspect; this.camera.right = halfH * aspect; this.camera.top = halfH; this.camera.bottom = -halfH;
    const target = new THREE.Vector3(.25 + (mobile ? 0 : v * 2.45), 1.88 - v * .10, -.20);
    if (this.pose.focus !== 0) {
      this.focusPoint.set(this.pose.focusX, this.pose.focusY, this.pose.focusZ);
      this.orbit.localToWorld(this.focusPoint);
      target.x += (this.focusPoint.x - 2.2) * .15 * this.pose.focus;
      target.y += (this.focusPoint.y - 1.4) * .13 * this.pose.focus;
    }
    const cameraOffset = new THREE.Vector3(1.3, 5.7 + (mobile ? .5 : 0) + v * .2, 12.5);
    this.camera.position.copy(target).add(cameraOffset); this.camera.lookAt(target);
    if (story > .01 && !mobile) this.camera.position.y += story * .10;
    this.camera.updateProjectionMatrix(); this.camera.updateMatrixWorld();
  }
  private updateAnchors() {
    const items: SceneAnchor[] = [];
    for (const [id, node] of this.anchors) {
      const isCity = id.startsWith('city-');
      const relevant = isCity ? !this.target.city && this.pose.wing < .18 && this.pose.intro > .94 : !!this.target.city && id.startsWith(this.target.city + '-poi-') && this.pose[this.target.city] > .82 && this.target.place === null;
      if (!isCity && !id.startsWith((this.target.city || '__') + '-poi-')) continue;
      node.getWorldPosition(this.projected); this.projected.project(this.camera);
      const x = (this.projected.x * .5 + .5) * this.width, y = (-this.projected.y * .5 + .5) * this.height;
      items.push({ id: isCity ? id : id.replace(this.target.city + '-', ''), x, y, visible: relevant && x > 28 && x < this.width - 28 && y > 20 && y < this.height - 20 && this.projected.z > -1 && this.projected.z < 1 });
    }
    const hash = items.map(a => `${a.id}:${Math.round(a.x)}:${Math.round(a.y)}:${a.visible}`).join('|');
    if (hash !== this.lastAnchorHash) { this.lastAnchorHash = hash; this.options.onAnchors(items); }
  }
  private invalidate() { this.dirty = true; this.activeUntil = performance.now() + 150; }
  private render() {
    if (!this.ready || this.disposed) return;
    this.applyPose(); this.renderer.render(this.scene, this.camera); this.updateAnchors();
    this.stats.frames++; this.stats.draws = this.renderer.info.render.calls; this.stats.triangles = this.renderer.info.render.triangles; this.stats.geometries = this.renderer.info.memory.geometries;
    this.dirty = false;
  }
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    // No floating idle motion, no heavy idle draws. The renderer sleeps between interactions.
    if (this.dirty || performance.now() < this.activeUntil) this.render();
  };
  private stopLoop() { cancelAnimationFrame(this.raf); }
  private disposeObject(object: THREE.Object3D) {
    const materials = new Set<THREE.Material>(); const textures = new Set<THREE.Texture>();
    object.traverse(o => { if ((o as THREE.Mesh).isMesh) { const m = o as THREE.Mesh; m.geometry.dispose(); for (const material of (Array.isArray(m.material) ? m.material : [m.material])) materials.add(material); } });
    materials.forEach(m => { for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value); m.dispose(); }); textures.forEach(t => t.dispose());
  }
  dispose() {
    this.disposed = true; this.stopLoop(); this.transition?.kill(); this.viewTween?.kill();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown); this.canvas.removeEventListener('pointermove', this.onPointerMove); this.canvas.removeEventListener('pointerup', this.onPointerUp); this.canvas.removeEventListener('pointercancel', this.onPointerUp); this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.disposeObject(this.scene); this.renderer.dispose();
    if ((window as unknown as { __FOLD_SCENE?: FoldScene }).__FOLD_SCENE === this) delete (window as unknown as { __FOLD_SCENE?: FoldScene }).__FOLD_SCENE;
  }
}
