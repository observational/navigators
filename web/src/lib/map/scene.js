// The three.js scene for the landscape tab (plain JS, ported from site/js/main.js).
// createMap(els) builds the scene on els.canvas and returns a controller the Svelte component drives.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { S, FAMS, FCOL, fmt, esc } from '../data.js';
import { GN, AMP, LIFT, field, wellsOf } from './heights.js';
import { SHORT } from './shapes.js';

export function createMap({ canvas, leaders, labels: labDiv, names: namesDiv, tip }) {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 760;
const nodes = S.nodes, N = nodes.length, CN = S.stats.canon;
const famIdx = k => FAMS.indexOf(S.mod[k]?.family);
let glOK = true, active = true, raf = 0;
const cleanups = [];
const listen = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };

/* ---------- WebGL ---------- */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); if (!renderer.capabilities.isWebGL2) throw new Error('webgl2'); }
catch (e) { glOK = false; }

let PR = Math.min(devicePixelRatio || 1, mobile() ? 1.25 : 1.5);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x14110d);
const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 5, 9000); cam.up.set(0, 0, 1);
const ctl = new OrbitControls(cam, canvas);
ctl.enableDamping = true; ctl.dampingFactor = .09; ctl.zoomSpeed = 1.25; ctl.rotateSpeed = .7; ctl.panSpeed = .9;
ctl.screenSpacePanning = false; ctl.minDistance = 60; ctl.maxDistance = 3200; ctl.maxPolarAngle = 1.22;
if (glOK) { renderer.setPixelRatio(PR); ctl.listenToKeyEvents(window); }

const tex = new THREE.DataTexture(new Float32Array(GN * GN * 2), GN, GN, THREE.RGFormat, THREE.FloatType);
tex.minFilter = tex.magFilter = THREE.NearestFilter;
const U = { uTex: { value: tex }, uMix: { value: 0 }, uAmp: { value: AMP }, uInk: { value: 0 }, uInkTo: { value: 0 }, uScale: { value: 1 }, uMode: { value: 0 },
  uCol: { value: FAMS.map(f => new THREE.Color(FCOL[f])) } };
let cur = 'all', fromF = field('all'), toF = fromF, mix = 1, mixT0 = 0, morphing = false;
function setTex() { const d = tex.image.data; for (let i = 0; i < GN * GN; i++) { d[i * 2] = fromF[i]; d[i * 2 + 1] = toF[i]; } tex.needsUpdate = true; }
setTex(); U.uMix.value = 1;
function hAt(x, y) { // layout coords 0..1000 -> normalised height, current blend
  const gx = Math.min(GN - 1.001, Math.max(0, x / 1000 * (GN - 1))), gy = Math.min(GN - 1.001, Math.max(0, y / 1000 * (GN - 1)));
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j;
  const s = Fd => (Fd[j * GN + i] * (1 - fx) + Fd[j * GN + i + 1] * fx) * (1 - fy) + (Fd[(j + 1) * GN + i] * (1 - fx) + Fd[(j + 1) * GN + i + 1] * fx) * fy;
  return mix >= 1 ? s(toF) : s(fromF) * (1 - mix) + s(toF) * mix;
}
const wz = (x, y) => hAt(x, y) * AMP;
const P = (x, y) => [x - 500, 500 - y];

const GLSL_H = `
uniform sampler2D uTex; uniform float uMix; uniform float uAmp;
const int GN=${GN};
float fetchH(vec2 uv){
  vec2 g=clamp(uv,0.,1.)*float(GN-1); ivec2 i0=ivec2(floor(g)); ivec2 i1=min(i0+1,ivec2(GN-1)); vec2 f=g-vec2(i0);
  vec2 a=texelFetch(uTex,i0,0).rg, b=texelFetch(uTex,ivec2(i1.x,i0.y),0).rg, c=texelFetch(uTex,ivec2(i0.x,i1.y),0).rg, d=texelFetch(uTex,i1,0).rg;
  vec2 v=mix(mix(a,b,f.x),mix(c,d,f.x),f.y); return mix(v.x,v.y,uMix);
}
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }`;

/* terrain: the engraved relief of the round-1 prototype, a touch quieter so the roads read first */
const tg = new THREE.BufferGeometry();
{ const Sd = GN, pos = new Float32Array(Sd * Sd * 3), uv = new Float32Array(Sd * Sd * 2), idx = [];
  for (let j = 0; j < Sd; j++) for (let i = 0; i < Sd; i++) { const k = j * Sd + i, u = i / (Sd - 1), v = j / (Sd - 1); pos[k * 3] = u * 1000 - 500; pos[k * 3 + 1] = 500 - v * 1000; uv[k * 2] = u; uv[k * 2 + 1] = v; }
  for (let j = 0; j < Sd - 1; j++) for (let i = 0; i < Sd - 1; i++) { const a = j * Sd + i; idx.push(a, a + Sd, a + 1, a + 1, a + Sd, a + Sd + 1); }
  tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); tg.setIndex(idx); }
const terrain = new THREE.Mesh(tg, new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: GLSL_H + `varying float vH; varying vec3 vP; varying vec2 vUv;
  void main(){ float h=fetchH(uv); vH=h; vUv=uv; vec3 p=position; p.z=h*uAmp; vP=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
  fragmentShader: GLSL_H + `uniform float uInk; varying float vH; varying vec3 vP; varying vec2 vUv;
  void main(){
    // smooth normal from the height field itself (no per-triangle facets)
    float du=1./float(GN-1); float cell=1000./float(GN-1);
    float hx=fetchH(vUv+vec2(du,0.))-fetchH(vUv-vec2(du,0.)), hy=fetchH(vUv+vec2(0.,du))-fetchH(vUv-vec2(0.,du));
    vec3 n=normalize(vec3(-hx*uAmp/(2.*cell), hy*uAmp/(2.*cell), 1.));
    float lam=clamp(dot(n,normalize(vec3(-.55,.30,.60))),0.,1.); lam=pow(lam,1.3);
    float rim=smoothstep(.86,1.,vH);
    // a solid surface, a step lighter than the night around it; the empty plateau is matte, not a hole
    vec3 ground=mix(vec3(.062,.053,.042),vec3(.215,.178,.135),lam);
    ground=mix(ground,vec3(.118,.101,.080)+.05*lam,rim*.85);
    float iso=vH*38.; float w=fwidth(iso);
    float d1=abs(fract(iso-.5)-.5)/w; float l1=1.-smoothstep(0.,1.15,d1);
    float i5=iso/5.; float w5=fwidth(i5); float d5=abs(fract(i5-.5)-.5)/w5; float l5=1.-smoothstep(0.,1.9,d5);
    float far=1.-smoothstep(.5,1.25,w);
    float gr=hash(floor(gl_FragCoord.xy)); float broken=smoothstep(.04,.3,gr);
    vec3 inkA=vec3(.78,.72,.58), inkH=vec3(.50,.70,.84); vec3 ink=mix(inkA,inkH,uInk);
    float fade=1.-smoothstep(.93,.985,vH);
    float line=max(l1*.22*far,l5*.62*mix(.55,1.,far))*broken*fade;
    // survey grid every 50 layout units, faint, strongest on the plateau where there are no contours
    vec2 gq=vP.xy/50.; vec2 gw=fwidth(gq); vec2 gd=abs(fract(gq-.5)-.5)/max(gw,vec2(1e-4)); float grid=(1.-smoothstep(0.,1.,min(gd.x,gd.y)))*(1.-smoothstep(.15,.5,max(gw.x,gw.y)));
    float slope=1.-n.z; float hat=step(.72,fract((vP.x*.62+vP.y)*.34)); float hs=hat*smoothstep(.10,.38,slope)*.15*(1.-rim)*far;
    vec3 col=ground+ink*hs*.5;
    col=mix(col,ink,clamp(line,0.,1.));
    col=mix(col,ink,grid*mix(.05,.16,rim));
    col*=.94+.12*hash(floor(gl_FragCoord.xy*.5)+7.);
    // borders dissolve into the background: an organic radial falloff plus a guard at the square's edges
    vec2 c=vUv-.5; float rr=length(c*vec2(1.,1.04))*2.;
    float wob=.035*sin(atan(c.y,c.x)*5.+1.3)+.025*sin(atan(c.y,c.x)*9.-.7);
    vec2 e=min(vUv,1.-vUv); float edgeF=smoothstep(0.,.10,min(e.x,e.y));
    float vis=(1.-smoothstep(.70+wob,1.02+wob,rr))*edgeF;
    vis=clamp(vis+(hash(floor(gl_FragCoord.xy*.5)+3.)-.5)*.08*(1.-vis)*vis*4.,0.,1.); // grain in the fade, none inside or outside it
    if(vis<.3) discard;   // what has faded away no longer hides what lies behind it
    col=mix(vec3(.078,.066,.052),col,clamp(vis,0.,1.));
    gl_FragColor=vec4(col,1.);
  }`,
  extensions: { derivatives: true },
}));
scene.add(terrain);

/* page marks: shape = family (non-colour cue); agents bone/warm, reader-only pages ice */
const SHAPE = `
float shape(vec2 q,float f){
  float ax=abs(q.x), ay=abs(q.y);
  if(f<.5) return length(q);
  if(f<1.5) return (ax+ay)*.98;
  if(f<2.5) return max(ax*.866+q.y*.5,-q.y)*2.;
  if(f<3.5) return max(ax,ay)*1.12;
  if(f<4.5) return min(max(ax*3.,ay),max(ax,ay*3.));
  if(f<5.5) return max(ax*.866+ay*.5,ay)*1.14;
  return abs(length(q)-.7)*3.4;
}`;
const famV = FAMS.map(() => new Float32Array(N));
for (const [si, mk, cond, term, path] of S.derived.runs) { const f = famIdx(mk); if (f < 0) continue; for (let i = 1; i < path.length; i++) { const q = S.byId.get(path[i]); if (q != null) famV[f][q]++; } }
const pp = new Float32Array(N * 3), psz = new Float32Array(N), pf = new Float32Array(N), ps = new Float32Array(N), pSel = new Float32Array(N).fill(1);
nodes.forEach((n, i) => {
  const [x, y] = P(n.x, n.y); pp[i * 3] = x; pp[i * 3 + 1] = y;
  ps[i] = n.A + n.H === 0 ? -1 : (n.A ? (n.A / 4e3) / (n.A / 4e3 + n.H / 3e7) : 0);
  let b = -1, m = 0; for (let f = 0; f < FAMS.length; f++) if (famV[f][i] > m) { m = famV[f][i]; b = f; } pf[i] = b;
  psz[i] = n.A ? .9 + .75 * Math.log1p(n.A) : (n.H ? 1.0 : .8);
});
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aSize', new THREE.BufferAttribute(psz, 1));
pg.setAttribute('aFam', new THREE.BufferAttribute(pf, 1)); pg.setAttribute('aShare', new THREE.BufferAttribute(ps, 1));
const selAttr = new THREE.BufferAttribute(pSel, 1); pg.setAttribute('aSel', selAttr);
const U2 = Object.assign({ uLift: { value: 0 } }, U);
const pmat = new THREE.ShaderMaterial({
  uniforms: U2, transparent: true, depthWrite: false,
  vertexShader: GLSL_H + `attribute float aSize; attribute float aFam; attribute float aShare; attribute float aSel; uniform float uScale; uniform float uLift;
  varying float vF; varying float vS; varying float vSz; varying float vSel; varying float vFade;
  void main(){ vec2 c=vec2((position.x+500.)/1000.,(500.-position.y)/1000.)-.5; vFade=1.-smoothstep(.70,1.0,length(c)*2.); vF=aFam; vS=aShare; vSz=aSize; vSel=aSel; float h=fetchH(vec2((position.x+500.)/1000.,(500.-position.y)/1000.));
    float z=mix(h*uAmp+1.6, ${LIFT}.+1., uLift*step(.0,aShare)*step(2.2,aSize));
    vec4 mv=modelViewMatrix*vec4(position.xy,z,1.); gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(aSize*uScale/-mv.z,1.4,10.)*mix(.75,1.,aSel); }`,
  fragmentShader: `uniform int uMode; uniform vec3 uCol[7]; varying float vF; varying float vS; varying float vSz; varying float vSel; varying float vFade;` + SHAPE + `
  void main(){
    vec2 q=(gl_PointCoord-.5)*2.; q.y=-q.y;
    bool fam=(uMode==1&&vF>-.5&&vS>.5);
    float d=shape(q,fam?vF:0.);
    if(d>1.) discard;
    vec3 col; float a;
    if(vS<0.){ col=vec3(.9,.86,.75); a=.12; }
    else if(uMode==1){ col=vF>-.5?uCol[int(vF)]:vec3(.50,.70,.84); a=vF>-.5?(vSz<2.2?.55:.95):.7; }
    else { col=mix(vec3(.50,.70,.84),vec3(.93,.88,.76),vS); a=vS<.02?.6:(vSz<2.2?.45:.92); }
    a*=mix(.18,1.,vSel)*vFade;
    gl_FragColor=vec4(col,a*(1.-smoothstep(.82,1.,d)));
  }`,
});
const points = new THREE.Points(pg, pmat); points.frustumCulled = false; points.renderOrder = 2; scene.add(points);
/* ---------- roads: agents' traffic (warm, solid) ---------- */
const ROAD = [{ min: 25, w: 3.4, c: 0xffb066, o: 1 }, { min: 8, w: 2.1, c: 0xf0924a, o: .95 }, { min: 3, w: 1.15, c: 0xc9783f, o: .75 }];
const roadMats = ROAD.map(r => new LineMaterial({ color: r.c, linewidth: r.w, transparent: true, opacity: r.o, depthWrite: false }));
const roadObjs = ROAD.map((r, i) => { const o = new LineSegments2(new LineSegmentsGeometry(), roadMats[i]); o.frustumCulled = false; o.renderOrder = 3 + i * 0; scene.add(o); return o; });
let roads = [], lifted = 0, liftT = 0, liftFrom = 0, liftTo = 0;
const edgeKey = (a, b) => a < b ? a + ':' + b : b + ':' + a;
function roadsFor(k) {
  if (k === 'readers') return [];
  if (k === 'all') return S.hw.bundles.filter(b => b.runs >= 3).map(b => ({ pts: b.pts, runs: b.runs, a: b.a, b: b.b }));
  const cnt = new Map();
  for (const [si, mk, cond, term, path] of S.derived.runs) { if (mk !== k) continue; const seen = new Set();
    for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; if (a === b) continue; const e = edgeKey(a, b); if (seen.has(e)) continue; seen.add(e); cnt.set(e, (cnt.get(e) || 0) + 1); } }
  const out = [];
  for (const [e, c] of cnt) { if (c < 2) continue; const [a, b] = e.split(':').map(Number), A = S.byId.get(a), B = S.byId.get(b); if (A == null || B == null) continue;
    const na = nodes[A], nb = nodes[B], L = Math.hypot(nb.x - na.x, nb.y - na.y), n = Math.max(2, Math.ceil(L / 18)), pts = [];
    for (let s = 0; s <= n; s++) pts.push([na.x + (nb.x - na.x) * s / n, na.y + (nb.y - na.y) * s / n]);
    out.push({ pts, runs: c * 3, a, b }); } // x3: same width classes read for one model's ~1/8 of the traffic
  return out;
}
function placeRoads() {
  const L = liftNow();
  ROAD.forEach((r, ci) => {
    const pos = [];
    for (const rd of roads) { const cls = rd.runs >= ROAD[0].min ? 0 : rd.runs >= ROAD[1].min ? 1 : 2; if (cls !== ci) continue;
      for (let i = 0; i < rd.pts.length - 1; i++) { const [x0, y0] = rd.pts[i], [x1, y1] = rd.pts[i + 1], [a0, b0] = P(x0, y0), [a1, b1] = P(x1, y1);
        const z0 = wz(x0, y0) + 2.6, z1 = wz(x1, y1) + 2.6; pos.push(a0, b0, z0 + (LIFT - z0) * L, a1, b1, z1 + (LIFT - z1) * L); } }
    roadObjs[ci].geometry.dispose(); const g = new LineSegmentsGeometry(); if (pos.length) g.setPositions(pos); roadObjs[ci].geometry = g; roadObjs[ci].visible = pos.length > 0;
  });
  placeDrops();
}
/* drop lines from the 16 busiest stations, visible when the roads are lifted */
const dropMat = new THREE.LineDashedMaterial({ color: 0xe6dcc3, dashSize: 4, gapSize: 4, transparent: true, opacity: .55 });
const drops = new THREE.LineSegments(new THREE.BufferGeometry(), dropMat); drops.frustumCulled = false; scene.add(drops);
let dropIdx = [];
function pickDrops(k) {
  const wt = k === 'all' ? i => nodes[i].A : k === 'readers' ? i => 0 : i => S.visits[k][i];
  dropIdx = [...Array(N).keys()].filter(i => wt(i) > 0).sort((a, b) => wt(b) - wt(a)).slice(0, 16);
}
function placeDrops() {
  const L = liftNow(); drops.visible = L > .02 && dropIdx.length > 0; if (!drops.visible) return;
  const pos = []; for (const i of dropIdx) { const n = nodes[i], [x, y] = P(n.x, n.y), z = wz(n.x, n.y); pos.push(x, y, z + 1, x, y, z + (LIFT - z) * L); }
  drops.geometry.dispose(); drops.geometry = new THREE.BufferGeometry(); drops.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); drops.computeLineDistances(); dropMat.opacity = .55 * L;
}
const liftNow = () => lifted;
/* ---------- one start page: runs as moving marks, readers' first clicks as ice dashed arcs ---------- */
const SUB = 6, HOPS = 15;
let startId = 1029, runPaths = [], runFam = [], balls, trail, trailCol, arcs, ring, T = 0, playing = !RM;
const bmat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
  vertexShader: `attribute float aFam; uniform float uScale; varying float vF; void main(){ vF=aFam; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(7.*uScale/-mv.z,5.,12.); }`,
  fragmentShader: `uniform int uMode; uniform vec3 uCol[7]; varying float vF;` + SHAPE + `
  void main(){ vec2 q=(gl_PointCoord-.5)*2.; q.y=-q.y; float d=shape(q,uMode==1?vF:0.); if(d>1.) discard; vec3 col=uMode==1?uCol[int(vF)]:vec3(1.,.78,.52); col=d>.72?vec3(.08,.065,.05):col; gl_FragColor=vec4(col,1.); }` });
const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false });
const arcMat = new LineMaterial({ color: 0x7fb2d6, linewidth: 1.6, dashed: true, dashSize: 7, gapSize: 5, transparent: true, opacity: .95, depthWrite: false });
const ringMat = new THREE.LineBasicMaterial({ color: 0xe5532d });
function loadStart(id) {
  startId = id; const si = S.startIdx[id];
  [balls, trail, ring].forEach(o => { if (o) { scene.remove(o); o.geometry.dispose(); } });
  if (arcs) { scene.remove(arcs); arcs.geometry.dispose(); }
  runPaths = []; runFam = [];
  for (const [s, mk, cond, term, path] of S.derived.runs) {
    if (s !== si || (cur !== 'all' && cur !== 'readers' && mk !== cur)) continue;
    const p = path.filter(x => S.byId.has(x)).slice(0, HOPS + 1); if (p.length < 2) continue;
    runPaths.push(p.map(x => { const n = nodes[S.byId.get(x)]; return [n.x, n.y]; })); runFam.push(Math.max(0, famIdx(mk)));
  }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(runPaths.length * 3), 3)); bg.setAttribute('aFam', new THREE.BufferAttribute(Float32Array.from(runFam), 1));
  balls = new THREE.Points(bg, bmat); balls.frustumCulled = false; balls.renderOrder = 6; scene.add(balls);
  const tgm = new THREE.BufferGeometry(); tgm.setAttribute('position', new THREE.BufferAttribute(new Float32Array(runPaths.length * HOPS * SUB * 6), 3));
  trailCol = new THREE.BufferAttribute(new Float32Array(runPaths.length * HOPS * SUB * 6), 3); tgm.setAttribute('color', trailCol);
  trail = new THREE.LineSegments(tgm, trailMat); trail.frustumCulled = false; trail.renderOrder = 5; scene.add(trail); trailColors();
  arcs = new LineSegments2(new LineSegmentsGeometry(), arcMat); arcs.frustumCulled = false; arcs.renderOrder = 4; scene.add(arcs);
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
  ring = new THREE.LineSegments(rg, ringMat); ring.frustumCulled = false; ring.renderOrder = 7; scene.add(ring);
  placeStatic(); T = 0; updateRuns(0); buildCallouts(); wake();
}
function trailColors() {
  if (!trailCol) return; const a = trailCol.array, c = new THREE.Color(); let k = 0;
  runFam.forEach(f => { if (U.uMode.value === 1) c.set(FCOL[FAMS[f]]).multiplyScalar(.85); else c.setRGB(.62, .44, .26); for (let v = 0; v < HOPS * SUB * 2; v++) { a[k++] = c.r; a[k++] = c.g; a[k++] = c.b; } });
  trailCol.needsUpdate = true;
}
const eo = f => 1 - Math.pow(1 - f, 3);
function updateRuns(dt) {
  if (!balls || !runPaths.length) return;
  const LC = HOPS + 3; T = (T + dt * .75) % LC;
  const bp = balls.geometry.attributes.position.array, tp = trail.geometry.attributes.position.array, L = liftNow();
  const Z = (x, y, o) => { const z = wz(x, y) + o; return z + (LIFT + o - z) * L; };
  runPaths.forEach((p, r) => {
    const hops = p.length - 1, cu = Math.min(T, hops), i = Math.min(hops - 1, Math.floor(cu)), f = cu - i, e = eo(f);
    const x = p[i][0] + (p[i + 1][0] - p[i][0]) * e, y = p[i][1] + (p[i + 1][1] - p[i][1]) * e, [X, Y] = P(x, y);
    bp[r * 3] = X; bp[r * 3 + 1] = Y; bp[r * 3 + 2] = Z(x, y, 4);
    for (let h = 0; h < HOPS; h++) for (let s = 0; s < SUB; s++) {
      const o = ((r * HOPS + h) * SUB + s) * 6;
      if (!(h <= i && h < hops)) { tp[o] = tp[o + 3] = 0; tp[o + 1] = tp[o + 4] = 0; tp[o + 2] = tp[o + 5] = -9999; continue; }
      const lim = h < i ? 1 : e;
      for (let q = 0; q < 2; q++) { const t = (s + q) / SUB * lim, xx = p[h][0] + (p[h + 1][0] - p[h][0]) * t, yy = p[h][1] + (p[h + 1][1] - p[h][1]) * t, [XX, YY] = P(xx, yy);
        tp[o + q * 3] = XX; tp[o + q * 3 + 1] = YY; tp[o + q * 3 + 2] = Z(xx, yy, 3.2); }
    }
  });
  balls.geometry.attributes.position.needsUpdate = true; trail.geometry.attributes.position.needsUpdate = true;
}
function placeStatic() {
  if (canonOn) placeCanon();
  if (!arcs) return;
  const s = nodes[S.byId.get(startId)], rd = S.derived.readers[startId], pos = [];
  if (rd && (cur === 'all' || cur === 'readers')) rd.dist.slice(0, 10).forEach(([t, sh]) => {
    const q = S.byId.get(t); if (q == null) return; const b = nodes[q], n = 22, len = Math.hypot(b.x - s.x, b.y - s.y);
    for (let k = 0; k < n; k++) for (let w = 0; w < 2; w++) { const tt = (k + w) / n, x = s.x + (b.x - s.x) * tt, y = s.y + (b.y - s.y) * tt, [X, Y] = P(x, y);
      pos.push(X, Y, wz(x, y) + 6 + Math.sin(Math.PI * tt) * (14 + len * .12 * (.4 + sh))); }
  });
  arcs.geometry.dispose(); const g = new LineSegmentsGeometry(); if (pos.length) g.setPositions(pos); arcs.geometry = g; if (pos.length) arcs.computeLineDistances(); arcs.visible = pos.length > 0;
  const rp = ring.geometry.attributes.position.array, [sx, sy] = P(s.x, s.y), sz = wz(s.x, s.y) + 3;
  for (let i = 0; i < 32; i++) for (let q = 0; q < 2; q++) { const t = (i + q) / 32 * Math.PI * 2, o = (i * 2 + q) * 3; rp[o] = sx + Math.cos(t) * 11; rp[o + 1] = sy + Math.sin(t) * 11; rp[o + 2] = sz; }
  ring.geometry.attributes.position.needsUpdate = true;
}

/* ---------- the free-search canon: pages a blank-page search opens first ---------- */
let canonOn = false, canonRings = null;
const canonPages = () => CN.pages.filter(p => S.byId.has(p.id) && (p.families >= 2 || p.runs >= 3));
function placeCanon() {
  if (!canonRings) return; const pos = [];
  for (const p of canonPages()) { const n = nodes[S.byId.get(p.id)], [x, y] = P(n.x, n.y), z = wz(n.x, n.y) + 3, r = 7 + 2.2 * Math.sqrt(p.runs);
    for (let i = 0; i < 40; i++) for (let q = 0; q < 2; q++) { const t = (i + q) / 40 * Math.PI * 2; pos.push(x + Math.cos(t) * r, y + Math.sin(t) * r, z); } }
  canonRings.geometry.dispose(); canonRings.geometry = new THREE.BufferGeometry(); canonRings.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
}
function showCanon(on = !canonOn) {
  canonOn = on;
  if (on && !canonRings && glOK) { canonRings = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd09a, transparent: true, opacity: .9 })); canonRings.frustumCulled = false; canonRings.renderOrder = 8; scene.add(canonRings); }
  if (canonRings) { canonRings.visible = on; if (on) placeCanon(); }
  buildCallouts(); if (on && glOK) overview(); wake();
}

/* ---------- labels: well callouts with leaders, and page names that appear as you go closer ---------- */
let labs = [];
function buildCallouts() {
  labDiv.innerHTML = ''; leaders.innerHTML = ''; labs = [];
  const add = (txt, sub, wx, wy, g) => { const d = document.createElement('div'); d.innerHTML = `${esc(txt)}<small>${esc(sub)}</small>`; labDiv.appendChild(d);
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); leaders.appendChild(ln); const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 3); leaders.appendChild(c);
    labs.push({ d, ln, c, wx, wy, g, w: Math.max(txt.length * 7.4, sub.length * 6.6) }); };
  const unit = cur === 'readers' ? 'readers’ pile' : cur === 'all' ? 'agent visits' : `visits by ${SHORT[cur]}`;
  if (canonOn) canonPages().forEach(p => { const n = nodes[S.byId.get(p.id)]; add(n.t, `opened first in ${p.runs} of ${CN.runs} free searches`, n.x, n.y, 3); });
  else wellsOf(cur).forEach(b => add(b.page, `${b.topic} · ${cur === 'readers' ? unit : fmt(b.n) + ' ' + unit}`, b.x, b.y, 0));
  const s = nodes[S.byId.get(startId)]; add('start page', s.t, s.x, s.y, 2);
}
const v3 = new THREE.Vector3();
// line of sight over the height field: is the point hidden behind a ridge?
function hidden(X, Y, Z) {
  const c = cam.position; if (liftNow() > .5) return false;
  for (let k = 1; k < 28; k++) { const t = k / 28, qx = c.x + (X - c.x) * t, qy = c.y + (Y - c.y) * t, qz = c.z + (Z - c.z) * t, lx = qx + 500, ly = 500 - qy;
    if (lx < 0 || ly < 0 || lx > 1000 || ly > 1000) continue; if (Math.hypot(lx / 1000 - .5, (ly / 1000 - .5) * 1.04) * 2 > .88) continue; if (wz(lx, ly) > qz + 3) return true; }
  return false;
}
function placeCallouts(dist) {
  const W = innerWidth, H = innerHeight, placed = [], left0 = mobile() ? 8 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--side')) + 4;
  const show0 = dist > 600; // closer in, page names take over from the well callouts
  labs.forEach((l, i) => {
    const on = l.g === 2 || l.g === 3 || (show0 && !(mobile() && i > 3));
    v3.set(...P(l.wx, l.wy), wz(l.wx, l.wy) + (LIFT - wz(l.wx, l.wy)) * (l.g === 2 ? liftNow() : 0)).project(cam);
    const sx = (v3.x * .5 + .5) * W, sy = (-v3.y * .5 + .5) * H;
    const [hx, hy] = P(l.wx, l.wy);
    const vis = on && v3.z < 1 && !hidden(hx, hy, wz(l.wx, l.wy) + 2) && sx > left0 + 10 && sx < W - 20 && sy > 70 && sy < H - (mobile() ? H * .42 + 130 : 130);
    const lft = sx > W * .62, up = l.g === 2 ? -1 : (i % 2 ? 1 : -1), ox = lft ? -34 : 34, oy = up * 38;
    const x0 = lft ? sx + ox - l.w : sx + ox, y0 = sy + oy - 18;
    const hit = placed.some(r => x0 < r[2] && x0 + l.w > r[0] && y0 < r[3] && y0 + 38 > r[1]) || x0 < left0;
    const show = vis && !hit; if (show) placed.push([x0, y0, x0 + l.w, y0 + 38]);
    l.d.style.opacity = show ? 1 : 0; l.ln.style.opacity = show ? .55 : 0; l.c.style.opacity = show ? 1 : 0;
    l.d.style.transform = `translate(${sx + ox}px,${sy + oy - 16}px)${lft ? ' translateX(-100%)' : ''}`; l.d.style.textAlign = lft ? 'right' : 'left';
    l.ln.setAttribute('x1', sx); l.ln.setAttribute('y1', sy); l.ln.setAttribute('x2', sx + ox * .9); l.ln.setAttribute('y2', sy + oy * .55);
    l.c.setAttribute('cx', sx); l.c.setAttribute('cy', sy);
  });
  return placed;
}
// page names: ranked by traffic (agent visits and reader clicks on one scale), more appear the closer you are
let maxA = 0, maxH = 0; nodes.forEach(n => { if (n.A > maxA) maxA = n.A; if (n.H > maxH) maxH = n.H; });
const rank = [...Array(N).keys()].map(i => [i, Math.log1p(nodes[i].A) / Math.log1p(maxA) + .6 * Math.log1p(nodes[i].H) / Math.log1p(maxH)]).sort((a, b) => b[1] - a[1]).slice(0, 2500).map(a => a[0]);
const POOL = 110, pool = [];
for (let i = 0; i < POOL; i++) { const d = document.createElement('div'); d.style.opacity = 0; namesDiv.appendChild(d); pool.push({ d, node: -1 }); }
function placeNames(dist, taken) {
  const budget = dist > 900 ? 0 : dist > 600 ? 8 : dist > 420 ? 20 : dist > 260 ? 40 : dist > 150 ? 60 : 80;
  const W = innerWidth, H = innerHeight, left0 = mobile() ? 8 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--side')) + 4, rects = taken.slice();
  let used = 0;
  for (const i of rank) {
    if (used >= budget) break;
    if (nodes[i].id === startId) continue;
    const n = nodes[i], [x, y] = P(n.x, n.y), z = wz(n.x, n.y);
    v3.set(x, y, z + 4 + (LIFT - z) * liftNow()).project(cam); if (v3.z > 1) continue;
    if (hidden(x, y, z + 3)) continue;
    const sx = (v3.x * .5 + .5) * W + 7, sy = (-v3.y * .5 + .5) * H - 6;
    if (sx < left0 || sx > W - 40 || sy < 70 || sy > H - (mobile() ? H * .42 + 130 : 110)) continue;
    const big = used < 12, w = n.t.length * (big ? 7.2 : 6.1), r = [sx, sy - 8, sx + w, sy + 8];
    if (rects.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) continue;
    rects.push(r); const p = pool[used++];
    if (p.node !== i) { p.d.textContent = n.t; p.node = i; }
    p.d.className = big ? 'big' : ''; p.d.style.transform = `translate(${sx}px,${sy - 7}px)`; p.d.style.opacity = 1;
  }
  for (let k = used; k < POOL; k++) pool[k].d.style.opacity = 0;
}

/* ---------- hover ---------- */
let mx = -1, my = -1, moved = false;
canvas.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; moved = true; wake(); });
canvas.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
function pick() {
  if (!moved) return; moved = false; let best = -1, bd = 90;
  for (let i = 0; i < N; i++) { const n = nodes[i]; if (!n.A && !n.H) continue; const [x, y] = P(n.x, n.y);
    v3.set(x, y, wz(n.x, n.y) + 1.6).project(cam); if (v3.z > 1) continue;
    const dx = (v3.x * .5 + .5) * innerWidth - mx, dy = (-v3.y * .5 + .5) * innerHeight - my, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
  if (best < 0) { tip.style.display = 'none'; return; }
  const n = nodes[best], mv = cur !== 'all' && cur !== 'readers' ? ` · ${S.visits[cur][best]} by ${SHORT[cur]}` : '';
  tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 330, mx + 14) + 'px'; tip.style.top = (my + 14) + 'px';
  tip.innerHTML = `${esc(n.t)}<b>${fmt(n.A)} agent visits${mv} · ${fmt(n.H)} reader clicks into it</b>`;
}

/* ---------- controls ---------- */

function setGround(k) {
  if (!glOK) { cur = k; return; }
  const snap = new Float32Array(GN * GN); for (let i = 0; i < snap.length; i++) snap[i] = mix >= 1 ? toF[i] : fromF[i] * (1 - mix) + toF[i] * mix;
  cur = k; fromF = snap; toF = field(k); mix = RM ? 1 : 0; mixT0 = performance.now(); morphing = !RM; setTex(); U.uMix.value = mix;
  U.uInkTo.value = k === 'readers' ? 1 : 0; if (RM) U.uInk.value = U.uInkTo.value;
  for (let i = 0; i < N; i++) pSel[i] = k === 'all' ? 1 : k === 'readers' ? (nodes[i].H > 0 ? 1 : 0) : (S.visits[k][i] > 0 ? 1 : 0);
  selAttr.needsUpdate = true;
  roads = roadsFor(k); pickDrops(k); placeRoads(); loadStart(startId);
}

/* ---------- camera: start close on the start page's interchange; zoom out to the whole map ---------- */
let tween = null, planMode = false;
function camAt(target, dist, polar, az) { return new THREE.Vector3(target.x + dist * Math.sin(polar) * Math.sin(az), target.y - dist * Math.sin(polar) * Math.cos(az), target.z + dist * Math.cos(polar)); }
function flyTo(id, dist, polar) {
  const n = nodes[S.byId.get(id)], [x, y] = P(n.x, n.y), tgt = new THREE.Vector3(x, y, wz(n.x, n.y));
  const off = cam.position.clone().sub(ctl.target), az = Math.atan2(off.x, -off.y), pol = polar ?? (planMode ? .001 : Math.min(1.0, Math.acos(off.z / off.length())));
  go(tgt, camAt(tgt, dist, pol, az));
}
function go(tgt, pos, ms = 1100) { tween = { t0: performance.now(), ms: RM ? 1 : ms, p0: cam.position.clone(), t0v: ctl.target.clone(), p1: pos, t1: tgt }; wake(); }
function overview() { const off = cam.position.clone().sub(ctl.target), az = Math.atan2(off.x, -off.y); go(new THREE.Vector3(0, 30, 60), camAt(new THREE.Vector3(0, 30, 60), mobile() ? 1900 : 1500, planMode ? .001 : .86, az)); }
function setView(plan) {
  planMode = plan;
  ctl.minPolarAngle = 0; ctl.maxPolarAngle = planMode ? .001 : 1.22; ctl.enableRotate = !planMode;
  const off = cam.position.clone().sub(ctl.target), d = off.length(), az = Math.atan2(off.x, -off.y);
  go(ctl.target.clone(), camAt(ctl.target, d, planMode ? .001 : .9, planMode ? 0 : az), 900);
}
function dolly(f) { const off = cam.position.clone().sub(ctl.target); const d = Math.min(ctl.maxDistance, Math.max(ctl.minDistance, off.length() * f)); go(ctl.target.clone(), ctl.target.clone().add(off.setLength(d)), 420); }
listen(window, 'keydown', e => { if (!active || e.target.closest?.('select,input')) return; if (e.key === '+' || e.key === '=') dolly(.7); if (e.key === '-') dolly(1.45); if (e.key === '0') overview(); });
const ray = new THREE.Raycaster();
listen(canvas, 'dblclick', e => {
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
  const hit = ray.intersectObject(terrain)[0]; if (!hit) return;
  const off = cam.position.clone().sub(ctl.target); go(hit.point.clone(), hit.point.clone().add(off.multiplyScalar(.55)), 600);
});
/* Wheel and touchpad zoom: proportional to the gesture (OrbitControls 0.160 zooms a fixed step per event, which makes a touchpad
   jumpy), towards the point under the cursor. Runs before OrbitControls' own wheel handler and stops it; touch pinch stays with
   OrbitControls. A touchpad pinch arrives as a wheel event with ctrlKey and small deltas, so it gets a higher gain. */
const zoomPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), zoomHit = new THREE.Vector3(), zoomNdc = new THREE.Vector2();
listen(window, 'wheel', e => {
  if (e.target !== canvas || !glOK || !active) return;
  e.preventDefault(); e.stopPropagation(); tween = null;
  const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);
  const f = Math.min(1.5, Math.max(.67, Math.exp(dy * (e.ctrlKey ? .011 : .0016))));
  const off = cam.position.clone().sub(ctl.target), d0 = off.length();
  const d1 = Math.min(ctl.maxDistance, Math.max(ctl.minDistance, d0 * f));
  if (d1 === d0) return;
  const r = canvas.getBoundingClientRect();
  zoomNdc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(zoomNdc, cam); zoomPlane.constant = -ctl.target.z;
  if (d1 < d0 && ray.ray.intersectPlane(zoomPlane, zoomHit)) {           // in: move towards the cursor
    const t = 1 - d1 / d0; ctl.target.lerp(zoomHit, t); cam.position.lerp(zoomHit, t);
  } else cam.position.copy(ctl.target).add(off.setLength(d1));           // out: straight back
  ctl.update(); wake();
}, { capture: true, passive: false });

/* ---------- loop: render only when something changes ---------- */
let need = true, lastAct = performance.now(), lastF = performance.now(), slow = 0, frames = 0;
function wake() { need = true; lastAct = performance.now(); }
ctl.addEventListener('change', () => { need = true; });
listen(canvas, 'pointerdown', wake); listen(canvas, 'wheel', wake, { passive: true });
function resize() {
  if (!glOK) return;
  const side = mobile() ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--side'));
  renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight;
  if (mobile()) cam.setViewOffset(innerWidth, innerHeight, 0, innerHeight * .26, innerWidth, innerHeight); else cam.setViewOffset(innerWidth, innerHeight, -side / 2, 0, innerWidth, innerHeight);
  cam.updateProjectionMatrix();
  U.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(cam.fov * Math.PI / 360));
  [...roadMats, arcMat].forEach(m => m.resolution.set(innerWidth, innerHeight));
  wake();
}
listen(window, 'resize', resize);
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (!active || !glOK) return;
  const dt = Math.max(0, Math.min(.05, (now - lastF) / 1000)); lastF = now;
  let busy = false;
  if (tween) { const t = Math.min(1, (now - tween.t0) / tween.ms), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    cam.position.lerpVectors(tween.p0, tween.p1, e); ctl.target.lerpVectors(tween.t0v, tween.t1, e); if (t >= 1) tween = null; busy = true; }
  if (morphing) { const t = Math.min(1, (now - mixT0) / 1100); mix = 1 - Math.pow(1 - t, 3); U.uMix.value = mix; U.uInk.value += (U.uInkTo.value - U.uInk.value) * .12;
    if (t >= 1) { morphing = false; U.uInk.value = U.uInkTo.value; }
    if (frames % 3 === 0 || !morphing) { placeRoads(); placeStatic(); } busy = true; }
  if (liftTo !== lifted) { const t = Math.min(1, (now - liftT) / 800); lifted = liftFrom + (liftTo - liftFrom) * (1 - Math.pow(1 - t, 3)); U2.uLift.value = lifted; if (t >= 1) lifted = liftTo; placeRoads(); busy = true; }
  const idle = now - lastAct > 45000;
  if (playing && !idle) { updateRuns(dt); busy = true; } else if (frames === 0) updateRuns(0);
  const moving = ctl.update();
  if (!(busy || moving || need)) return;
  need = false; frames++;
  renderer.render(scene, cam);
  const dist = cam.position.distanceTo(ctl.target);
  if (frames % 2 === 0 || !busy) { const taken = placeCallouts(dist); placeNames(dist, taken); }
  if (frames % 4 === 0) pick();
  // adaptive quality: if frames are slow while moving, render fewer pixels
  if (busy && dt > .034) { if (++slow > 40 && PR > 1) { PR = Math.max(1, PR - .25); renderer.setPixelRatio(PR); resize(); slow = 0; } } else slow = Math.max(0, slow - 1);
}
listen(document, 'visibilitychange', () => { if (!document.hidden) wake(); });

/* ---------- start ---------- */
if (glOK) {
  resize();
  const n0 = nodes[S.byId.get(startId)], [x0, y0] = P(n0.x, n0.y), t0 = new THREE.Vector3(x0, y0, wz(n0.x, n0.y));
  ctl.target.copy(t0); cam.position.copy(camAt(t0, mobile() ? 760 : 560, .92, .35));
}
setGround('all');
raf = requestAnimationFrame(frame);

return {
  get glOK() { return glOK; },
  playing: playing,
  setGround,
  setStart(id) { loadStart(id); flyTo(id, 520); },
  setInk(v) { U.uMode.value = v; trailColors(); wake(); },
  setLift(v) { liftFrom = lifted; liftTo = v; liftT = performance.now(); wake(); },
  setView,
  setPlaying(p) { playing = p; wake(); },
  overview, dolly, flyTo,
  showCanon,
  isCanon: () => canonOn,
  setActive(a) { active = a; if (a) wake(); },
  dispose() {
    cancelAnimationFrame(raf); cleanups.forEach(f => f());
    ctl.dispose(); if (glOK) renderer.dispose();
  },
};
}
