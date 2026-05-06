/* ═══════════════════════════════════════════════════════════
   CHIRANJIBI KIRANA PASAL — main.js
═══════════════════════════════════════════════════════════ */

/* ── PAGE ENGINE ── */
const PAGES_EL  = document.getElementById('pages');
const PGS       = document.querySelectorAll('.pg');
const NAVA      = document.querySelectorAll('[data-go]');
const NAV_LINKS = document.querySelectorAll('.nav-links a[data-go]');
const HAM       = document.getElementById('ham');
const MOB       = document.getElementById('mob');
let curPage = 0;
let busy = false;

function goTo(n) {
  if (busy || n === curPage || n < 0 || n >= PGS.length) return;
  busy = true;
  const from = PGS[curPage], to = PGS[n];
  from.classList.add('leaving');
  NAV_LINKS.forEach(a => a.classList.toggle('active', +a.dataset.go === n));
  setTimeout(() => {
    from.classList.remove('active','leaving');
    to.classList.add('active');
    from.querySelectorAll('.r').forEach(el => el.classList.remove('in'));
    revealPage(to);
    const b = to.querySelector('.pg-body');
    if (b) b.scrollTop = 0;
    curPage = n;
    busy = false;
  }, 160);
}

function revealPage(pg) {
  pg.querySelectorAll('.r').forEach((el,i) => {
    el.classList.remove('in');
    setTimeout(() => el.classList.add('in'), 80 + i*55);
  });
}

NAVA.forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const t = +a.dataset.go;
  if (!isNaN(t)) { goTo(t); closeMob(); }
}));
HAM.addEventListener('click', () => {
  const o = MOB.classList.toggle('open');
  HAM.classList.toggle('open', o);
});
function closeMob() { MOB.classList.remove('open'); HAM.classList.remove('open'); }
setTimeout(() => revealPage(PGS[0]), 80);

/* ══ SCROLL ══ */
let lastNav = 0;
const NAV_GAP = 1100; /* longer cooldown prevents accidental switches */

/* Accumulate small trackpad deltas — only fire when intentional */
let wheelAccum = 0;
let wheelDecayTimer = null;

function canNavigate(dir) {
  const pb = PGS[curPage].querySelector('.pg-body');
  if (!pb) return true;
  const scrollable = pb.scrollHeight > pb.clientHeight + 6;
  if (!scrollable) return true;
  if (dir > 0) return pb.scrollTop + pb.clientHeight >= pb.scrollHeight - 6;
  if (dir < 0) return pb.scrollTop <= 6;
  return true;
}

PAGES_EL.addEventListener('wheel', e => {
  if (MOB.classList.contains('open')) return;

  /* Normalise delta: trackpad fires many small events, mouse fires one large */
  const LINE = 40, PAGE = 600;
  let delta = e.deltaY;
  if (e.deltaMode === 1) delta *= LINE;
  if (e.deltaMode === 2) delta *= PAGE;

  wheelAccum += delta;

  /* Reset accumulator when wheel goes idle */
  clearTimeout(wheelDecayTimer);
  wheelDecayTimer = setTimeout(()=>{ wheelAccum = 0; }, 180);

  /* Only act when accumulated enough intentional scroll */
  const THRESHOLD = 80;
  if (Math.abs(wheelAccum) < THRESHOLD) return;

  const dir = wheelAccum > 0 ? 1 : -1;
  wheelAccum = 0; /* reset after consuming */

  const now = Date.now();
  if (!canNavigate(dir)) return;
  if (now - lastNav < NAV_GAP) return;

  e.preventDefault();
  lastNav = now;
  goTo(curPage + dir);
}, { passive: false });

/* Touch swipe — same boundary check */
let ty0=0, tx0=0, ts0=0;
window.cubeDown = false; window.galleryDragging = false;

PAGES_EL.addEventListener('touchstart', e => {
  ty0 = e.touches[0].clientY;
  tx0 = e.touches[0].clientX;
  ts0 = Date.now();
}, { passive: true });

PAGES_EL.addEventListener('touchend', e => {
  if (MOB.classList.contains('open') || window.cubeDown || window.galleryDragging) return;
  const dy = ty0 - e.changedTouches[0].clientY;
  const dx = tx0 - e.changedTouches[0].clientX;
  if (Math.abs(dy) < 55 || Math.abs(dx) > Math.abs(dy)) return;
  if (Date.now() - ts0 > 700) return;
  const dir = dy > 0 ? 1 : -1;
  if (!canNavigate(dir)) return;
  const now = Date.now();
  if (now - lastNav < NAV_GAP) return;
  lastNav = now;
  goTo(curPage + dir);
}, { passive: true });

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();goTo(curPage+1);}
  if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();goTo(curPage-1);}
  if(e.key==='Home'){e.preventDefault();goTo(0);}
  if(e.key==='End'){e.preventDefault();goTo(PGS.length-1);}
  if(e.key==='Escape'&&MOB.classList.contains('open'))closeMob();
});

/* ══ STORE STATUS ══ */
(function tick(){
  const se=document.getElementById('store-status'),de=document.getElementById('store-dot'),te=document.getElementById('store-text');
  if(!se)return;
  const npt=new Date(Date.now()+new Date().getTimezoneOffset()*60000+345*60000);
  const m=npt.getHours()*60+npt.getMinutes();
  if(m>=360&&m<1140){
    const left=1140-m;
    de.style.cssText='background:#388e3c;animation:pulse 2.6s ease-in-out infinite';
    Object.assign(se.style,{background:'rgba(237,247,237,.9)',borderColor:'#c8e6c9',color:'#1b5e20'});
    te.textContent=`Open today · 6 AM – 7 PM${left<=30?' · Closes in '+left+'m':''}`;
  }else{
    const mtu=m<360?360-m:1440-m+360,h=Math.floor(mtu/60),mn=mtu%60;
    de.style.cssText='background:#e57373;animation:none';
    Object.assign(se.style,{background:'rgba(255,235,235,.9)',borderColor:'rgba(229,115,115,.3)',color:'#b71c1c'});
    te.textContent=`Closed · Opens in ${h>0?h+'h ':''}${mn>0?mn+'m':''}`;
  }
  setTimeout(tick,60000);
})();

/* ══ ORB BACKGROUND ══ */
(function(){
  const canvas=document.getElementById('orbCanvas');
  if(!canvas||typeof THREE==='undefined')return;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,premultipliedAlpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const vert=`precision highp float;attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0.0,1.0);}`;
  const frag=`precision highp float;uniform float iTime;uniform vec3 iResolution;uniform float hue;uniform float hover;uniform float rot;uniform float hoverIntensity;uniform vec3 backgroundColor;varying vec2 vUv;
    vec3 rgb2yiq(vec3 c){return vec3(dot(c,vec3(0.299,0.587,0.114)),dot(c,vec3(0.596,-0.274,-0.322)),dot(c,vec3(0.211,-0.523,0.312)));}
    vec3 yiq2rgb(vec3 c){return vec3(c.x+0.956*c.y+0.621*c.z,c.x-0.272*c.y-0.647*c.z,c.x-1.106*c.y+1.703*c.z);}
    vec3 adjustHue(vec3 color,float hueDeg){float hr=hueDeg*3.14159265/180.0;vec3 yiq=rgb2yiq(color);float ca=cos(hr),sa=sin(hr);yiq=vec3(yiq.x,yiq.y*ca-yiq.z*sa,yiq.y*sa+yiq.z*ca);return yiq2rgb(yiq);}
    vec3 hash33(vec3 p){p=fract(p*vec3(0.1031,0.11369,0.13787));p+=dot(p,p.yxz+19.19);return -1.0+2.0*fract(vec3(p.x+p.y,p.x+p.z,p.y+p.z)*p.zyx);}
    float snoise3(vec3 p){const float K1=0.333333333,K2=0.166666667;vec3 i=floor(p+(p.x+p.y+p.z)*K1);vec3 d0=p-(i-(i.x+i.y+i.z)*K2);vec3 e=step(vec3(0.0),d0-d0.yzx);vec3 i1=e*(1.0-e.zxy),i2=1.0-e.zxy*(1.0-e);vec3 d1=d0-(i1-K2),d2=d0-(i2-K1),d3=d0-0.5;vec4 h=max(0.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.0);vec4 n=h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.0)));return dot(vec4(31.316),n);}
    vec4 extractAlpha(vec3 c){float a=max(max(c.r,c.g),c.b);return vec4(c/(a+1e-5),a);}
    const vec3 baseColor1=vec3(0.611765,0.262745,0.996078);const vec3 baseColor2=vec3(0.298039,0.760784,0.913725);const vec3 baseColor3=vec3(0.062745,0.078431,0.600000);
    const float innerRadius=0.6;const float noiseScale=0.65;
    float light1(float i,float a,float d){return i/(1.0+d*a);}float light2(float i,float a,float d){return i/(1.0+d*d*a);}
    vec4 draw(vec2 uv){vec3 c1=adjustHue(baseColor1,hue),c2=adjustHue(baseColor2,hue),c3=adjustHue(baseColor3,hue);float ang=atan(uv.y,uv.x),len=length(uv),inv=len>0.0?1.0/len:0.0;float bgL=dot(backgroundColor,vec3(0.299,0.587,0.114));float n0=snoise3(vec3(uv*noiseScale,iTime*0.5))*0.5+0.5;float r0=mix(mix(innerRadius,1.0,0.4),mix(innerRadius,1.0,0.6),n0);float d0=distance(uv,(r0*inv)*uv);float v0=light1(1.0,10.0,d0);v0*=smoothstep(r0*1.05,r0,len);float innerFade=smoothstep(r0*0.8,r0*0.95,len);v0*=mix(innerFade,1.0,bgL*0.7);float cl=cos(ang+iTime*2.0)*0.5+0.5;float a=iTime*-1.0;vec2 pos=vec2(cos(a),sin(a))*r0;float d=distance(uv,pos);float v1=light2(1.5,5.0,d)*light1(1.0,50.0,d0);float v2=smoothstep(1.0,mix(innerRadius,1.0,n0*0.5),len);float v3=smoothstep(innerRadius,mix(innerRadius,1.0,0.5),len);vec3 colBase=mix(c1,c2,cl);float fade=mix(1.0,0.1,bgL);vec3 darkCol=clamp((mix(c3,colBase,v0)+v1)*v2*v3,0.0,1.0);vec3 lightCol=clamp(mix(backgroundColor,(colBase+v1)*mix(1.0,v2*v3,fade),v0),0.0,1.0);return extractAlpha(mix(darkCol,lightCol,bgL));}
    vec4 mainImage(vec2 fragCoord){vec2 center=iResolution.xy*0.5;float size=min(iResolution.x,iResolution.y);vec2 uv=(fragCoord-center)/size*2.0;float s=sin(rot),c=cos(rot);uv=vec2(c*uv.x-s*uv.y,s*uv.x+c*uv.y);uv.x+=hover*hoverIntensity*0.1*sin(uv.y*10.0+iTime);uv.y+=hover*hoverIntensity*0.1*sin(uv.x*10.0+iTime);return draw(uv);}
    void main(){vec2 fragCoord=vUv*iResolution.xy;vec4 col=mainImage(fragCoord);gl_FragColor=vec4(col.rgb*col.a,col.a);}`;
  const geo=new THREE.BufferGeometry();
  /* THREE r128 BufferGeometry needs 3-component positions to avoid NaN bounding sphere */
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array([-1,-1,0, 3,-1,0, -1,3,0]),3));
  geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,2,0,0,2]),2));
  const mat=new THREE.RawShaderMaterial({vertexShader:vert,fragmentShader:frag,transparent:true,uniforms:{iTime:{value:0},iResolution:{value:new THREE.Vector3(1,1,1)},hue:{value:120},hover:{value:0},rot:{value:0},hoverIntensity:{value:2},backgroundColor:{value:new THREE.Vector3(1,1,1)}}});
  scene.add(new THREE.Mesh(geo,mat));
  function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);mat.uniforms.iResolution.value.set(w,h,w/h);}
  resize();window.addEventListener('resize',resize);
  let targetHover=0,currentRot=0,lastT=0;

  /* Mouse hover */
  window.addEventListener('mousemove',e=>{
    const cx=window.innerWidth/2,cy=window.innerHeight/2,size=Math.min(window.innerWidth,window.innerHeight);
    const ux=(e.clientX-cx)/size*2,uy=(e.clientY-cy)/size*2;
    targetHover=Math.sqrt(ux*ux+uy*uy)<0.8?1:0;
  });
  window.addEventListener('mouseleave',()=>{targetHover=0;});

  /* Touch hover — finger position acts as cursor, resets on touchend */
  window.addEventListener('touchstart',e=>{
    const t=e.touches[0];
    const cx=window.innerWidth/2,cy=window.innerHeight/2,size=Math.min(window.innerWidth,window.innerHeight);
    const ux=(t.clientX-cx)/size*2,uy=(t.clientY-cy)/size*2;
    targetHover=Math.sqrt(ux*ux+uy*uy)<1.2?1:0;
  },{passive:true});
  window.addEventListener('touchmove',e=>{
    const t=e.touches[0];
    const cx=window.innerWidth/2,cy=window.innerHeight/2,size=Math.min(window.innerWidth,window.innerHeight);
    const ux=(t.clientX-cx)/size*2,uy=(t.clientY-cy)/size*2;
    targetHover=Math.sqrt(ux*ux+uy*uy)<1.2?1:0;
  },{passive:true});
  window.addEventListener('touchend',()=>{ targetHover=0; },{passive:true});

  const t0=performance.now();
  (function loop(){requestAnimationFrame(loop);const now=(performance.now()-t0)/1000,dt=now-lastT;lastT=now;mat.uniforms.iTime.value=now;mat.uniforms.hover.value+=(targetHover-mat.uniforms.hover.value)*0.08;if(mat.uniforms.hover.value>0.5)currentRot+=dt*0.3;mat.uniforms.rot.value=currentRot;renderer.render(scene,camera);})();
})();

/* ══════════════════════════════════════════════════════════
   THREE.JS CUBE
   • Richer green background (#a8d9ab→#81c784)
   • Each row: [SVG icon] [LABEL TEXT]  ← on same line, top
                [big value]
                [sub value]
══════════════════════════════════════════════════════════ */
(function(){
  const wrap=document.getElementById('cubeCanvasWrap');
  const canvas=document.getElementById('threeCube');
  if(!wrap||!canvas||typeof THREE==='undefined')return;

  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,100);
  camera.position.set(2.8,2.1,3.4); camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0xffffff,1.2));
  const key=new THREE.DirectionalLight(0xffffff,0.5);
  key.position.set(4,6,4); scene.add(key);

  function makeFace(){
    const S=512;
    const cv=document.createElement('canvas');
    cv.width=cv.height=S;
    const c=cv.getContext('2d');

    /* ── Richer green background ── */
    const bg=c.createLinearGradient(0,0,0,S);
    bg.addColorStop(0,'#b2dfb4');
    bg.addColorStop(0.5,'#95cf97');
    bg.addColorStop(1,'#76c17a');
    c.fillStyle=bg; c.fillRect(0,0,S,S);

    /* sheen top-left */
    const sh=c.createLinearGradient(0,0,S*.6,S*.45);
    sh.addColorStop(0,'rgba(255,255,255,0.45)');
    sh.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=sh; c.fillRect(0,0,S,S);

    /* border */
    c.strokeStyle='rgba(27,94,32,0.35)';
    c.lineWidth=3; c.strokeRect(2,2,S-4,S-4);

    /* ── 3 equal rows ── */
    const ROW_H=Math.floor(S/3);
    const PAD=28;
    /* 24×24 viewbox SVG paths */
    /* Clock: outer circle + hour hand + minute hand clearly visible */
    const CLOCK='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z';
    const PHONE='M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C9.61 21 3 14.39 3 6c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z';
    const PIN='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

    const rows=[
      {path:CLOCK, label:'OPEN HOUR',  line1:'6AM – 7PM',    line2:'EVERYDAY'},
      {path:PHONE, label:'CONTACT',    line1:'9705388647',    line2:null},
      {path:PIN,   label:'LOCATION',   line1:'Pipal Danda',   line2:'Hatuwagadhi-6, Bhojpur'},
    ];

    const ICON=31;         /* +10%: was 28 */
    const FONT=24;         /* +10%: was 22 */
    const FONT_VAL=29;     /* +10%: was 26 */
    const FONT_SUB=FONT;   /* same as label */

    rows.forEach((row,idx)=>{
      const rowTop=idx*ROW_H;
      const subH=row.line2 ? FONT_SUB+6 : 0;
      const blockH=ICON+8+FONT_VAL+subH;
      const blockTop=rowTop+(ROW_H-blockH)/2;
      const iconScale=ICON/24;

      /* ── Icon — pure black, filled ── */
      c.save();
      c.translate(PAD, blockTop);
      c.scale(iconScale,iconScale);
      c.fillStyle='#000000';
      c.fill(new Path2D(row.path));
      c.restore();

      /* ── Label beside icon — pure black ── */
      c.font=`700 ${FONT}px system-ui,sans-serif`;
      c.fillStyle='#000000';
      c.textAlign='left'; c.textBaseline='middle';
      c.fillText(row.label, PAD+ICON+10, blockTop+ICON/2);

      /* ── Value line — pure black, slightly larger ── */
      c.font=`700 ${FONT_VAL}px system-ui,sans-serif`;
      c.fillStyle='#000000';
      c.textBaseline='top';
      c.fillText(row.line1, PAD, blockTop+ICON+8);

      /* ── Sub line — same size and weight as value ── */
      if(row.line2){
        c.font=`700 ${FONT_VAL}px system-ui,sans-serif`;
        c.fillStyle='#000000';
        c.fillText(row.line2, PAD, blockTop+ICON+8+FONT_VAL+4);
      }

      /* row divider */
      if(idx<rows.length-1){
        c.strokeStyle='rgba(0,0,0,0.20)'; c.lineWidth=1;
        c.beginPath(); c.moveTo(PAD,rowTop+ROW_H); c.lineTo(S-PAD,rowTop+ROW_H); c.stroke();
      }
    });

    /* shop name footer */
    c.font='400 9px system-ui,sans-serif';
    c.fillStyle='rgba(27,94,32,0.22)';
    c.textAlign='center'; c.textBaseline='alphabetic';
    c.fillText('Chiranjibi Kirana Pasal',S/2,S-5);

    return new THREE.CanvasTexture(cv);
  }

  const tex=makeFace();
  const mats=Array(6).fill(null).map(()=>new THREE.MeshStandardMaterial({map:tex,roughness:.28,metalness:0}));
  const cube=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),mats); scene.add(cube);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.012,2.012,2.012)),new THREE.LineBasicMaterial({color:0x4caf50,transparent:true,opacity:.5}));
  scene.add(edges);

  function resize(){const w=wrap.clientWidth||310,h=wrap.clientHeight||310;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  resize(); new ResizeObserver(resize).observe(wrap);

  let drag=false,px=0,py=0,vx=0,vy=0,rx=-0.42,ry=0.72;
  function dn(x,y){drag=true;window.cubeDown=true;px=x;py=y;vx=0;vy=0;}
  function mv(x,y){if(!drag)return;vx=(x-px)*.013;vy=(y-py)*.013;ry+=vx;rx=Math.max(-1.3,Math.min(1.3,rx+vy));px=x;py=y;}
  function up(){drag=false;setTimeout(()=>{window.cubeDown=false;},120);}
  wrap.addEventListener('mousedown',e=>{e.preventDefault();dn(e.clientX,e.clientY);});
  window.addEventListener('mousemove',e=>mv(e.clientX,e.clientY));
  window.addEventListener('mouseup',up);
  wrap.addEventListener('touchstart',e=>{const t=e.touches[0];dn(t.clientX,t.clientY);},{passive:true});
  wrap.addEventListener('touchmove', e=>{const t=e.touches[0];mv(t.clientX,t.clientY);},{passive:true});
  wrap.addEventListener('touchend',up,{passive:true});

  let lt=0;
  (function loop(t){
    requestAnimationFrame(loop);
    const dt=Math.min((t-lt)/1000,.05);lt=t;
    if(!drag){vx*=.92;vy*=.92;ry+=vx;rx+=vy;if(Math.abs(vx)<.002&&Math.abs(vy)<.002)ry+=dt*.20;}
    cube.rotation.set(rx,ry,0);edges.rotation.set(rx,ry,0);
    renderer.render(scene,camera);
  })(0);
})();

/* ══════════════════════════════════════════════════════════
   WHY US GALLERY — gentle 7° arc, continuous drag (no snap-reset)
══════════════════════════════════════════════════════════ */
(function(){
  const container=document.getElementById('whyGallery');
  if(!container)return;

  const ITEMS=[
    {num:'01',icon:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',title:'Right in the Village',  desc:'No need to travel to the bazaar. Everything you need is steps away in Pipal Danda.'},
    {num:'02',icon:'<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',              title:'Trusted Since 2061 BS', desc:'A Rai family business for over two decades. Fair prices and honest service, always.'},
    {num:'03',icon:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',title:'Always Stocked',     desc:'Shelves always full so you never leave empty-handed, rain or shine.'},
    {num:'04',icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',title:'A Face You Know',   desc:'A family shop run by your neighbours. Not a franchise — a community pillar.'},
  ];

  container.innerHTML='';
  container.style.cssText='width:100%;height:100%;overflow:visible;position:relative;cursor:grab;user-select:none;';

  const N=ITEMS.length; /* 4 */
  /* triple for seamless infinite scroll */
  const allItems=[...ITEMS,...ITEMS,...ITEMS];
  const TOTAL=allItems.length; /* 12 */

  const cardEls=allItems.map(item=>{
    const el=document.createElement('article');
    el.style.cssText=`
      position:absolute;
      width:clamp(150px,16vw,210px);
      background:linear-gradient(160deg,#e8f5e9 0%,#c8e6c9 55%,#a5d6a7 100%);
      border-radius:16px;
      padding:clamp(14px,1.8vw,20px) clamp(12px,1.5vw,16px);
      display:flex;flex-direction:column;gap:8px;
      box-shadow:0 8px 28px rgba(46,125,50,0.22);
      border:1px solid rgba(255,255,255,0.85);
      will-change:transform;
      backface-visibility:hidden;
      transform-origin:50% 50%;
      left:50%;top:50%;
    `;
    el.innerHTML=`
      <span style="font-family:'DM Serif Display',serif;font-style:italic;font-size:.82rem;color:#2e7d32;font-weight:600">${item.num}</span>
      <span style="width:28px;height:28px;border-radius:7px;background:rgba(46,125,50,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1b5e20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
      </span>
      <h3 style="font-family:'DM Serif Display',serif;font-size:clamp(.95rem,1.25vw,1.08rem);line-height:1.15;color:#0a1a0c;margin:0;font-weight:700">${item.title}</h3>
      <p style="font-size:clamp(.74rem,.9vw,.82rem);line-height:1.55;color:#1a2e1c;margin:0;flex:1;font-weight:500">${item.desc}</p>
    `;
    container.appendChild(el);
    return el;
  });

  /* ── Arc transform ──
     tx: spread cards using fraction of viewport width so they fill the screen
     ty: very gentle downward sag (large R)
     rz: gentle 5° tilt per slot
  ── */
  const ARC_STEP=5;
  const R=2000; /* very large = almost flat arc, just a hint of curvature */

  function arcTransform(offset){
    const deg=offset*ARC_STEP;
    const rad=deg*Math.PI/180;
    /* Use viewport width fraction for spread so it scales with screen */
    const vw=window.innerWidth;
    const tx=(vw*0.17)*offset;          /* 17% of vw per slot = 4 cards span ~68vw */
    const ty=R*(1-Math.cos(rad));       /* subtle drop at edges */
    const rz=deg*0.80;
    const abs=Math.abs(offset);
    const sc=Math.max(0.78,1-abs*0.05);
    const opacity=abs>2.6?0:abs>2.0?Math.max(0,(2.6-abs)/0.6):1;
    const zIdx=Math.round(20-abs*3);
    const bright=Math.max(0.84,1-abs*0.04);
    return{tx,ty,rz,sc,opacity,zIdx,bright};
  }

  let scrollPos=0, targetPos=0;

  function applyLayout(pos){
    const centreIdx=N+1;
    let centreCardEl=null;
    let minOff=Infinity;

    cardEls.forEach((el,i)=>{
      let off=i-centreIdx-pos;
      while(off>TOTAL/2)  off-=TOTAL;
      while(off<-TOTAL/2) off+=TOTAL;
      const{tx,ty,rz,sc,opacity,zIdx,bright}=arcTransform(off);
      el.style.transform=`translateX(calc(-50% + ${tx}px)) translateY(calc(-50% + ${ty}px)) rotate(${rz}deg) scale(${sc})`;
      el.style.opacity=opacity;
      el.style.zIndex=zIdx;
      el.style.filter=`brightness(${bright})`;
      el.style.pointerEvents=opacity>0.2?'auto':'none';
      if(Math.abs(off)<minOff){ minOff=Math.abs(off); centreCardEl=el; }
    });

    /* Apply centre card class and inline popup styles */
    cardEls.forEach(el=>{
      const isCentre=el===centreCardEl && minOff<0.45;
      el.classList.toggle('card-centre',isCentre);
      const svgIcon=el.querySelector('svg');
      const h3=el.querySelector('h3');
      if(isCentre){
        /* Card: extra lift via translateY offset baked into transform string */
        const cur=el.style.transform;
        el.style.transform=cur.replace(/translateY\(calc\(-50% \+ ([\d.]+)px\)\)/,
          (_,n)=>`translateY(calc(-50% + ${+n-10}px))`);
        el.style.boxShadow='0 0 0 2.5px rgba(46,125,50,0.55), 0 24px 56px rgba(46,125,50,0.42)';
        el.style.outline='none';
        /* SVG icon: pop-up and tilt */
        if(svgIcon){
          svgIcon.parentElement.style.transform='translateY(-6px) rotate(-12deg) scale(1.25)';
          svgIcon.parentElement.style.background='rgba(46,125,50,0.22)';
          svgIcon.parentElement.style.boxShadow='0 4px 14px rgba(46,125,50,0.28)';
          svgIcon.parentElement.style.transition='transform .35s cubic-bezier(.34,1.56,.64,1), background .25s, box-shadow .25s';
        }
        /* Title: slight green tint */
        if(h3){ h3.style.color='#0d3312'; h3.style.transition='color .25s'; }
      } else {
        el.style.boxShadow='0 6px 24px rgba(46,125,50,0.16)';
        el.style.outline='none';
        if(svgIcon){
          svgIcon.parentElement.style.transform='';
          svgIcon.parentElement.style.background='rgba(46,125,50,.12)';
          svgIcon.parentElement.style.boxShadow='';
        }
        if(h3){ h3.style.color=''; }
      }
    });
  }

  let isDragging=false;
  (function loop(){
    requestAnimationFrame(loop);
    if(!isDragging){
      /* ease to nearest integer after release */
      scrollPos+=(targetPos-scrollPos)*0.09;
    } else {
      /* lock-step during drag — no easing lag */
      scrollPos=targetPos;
    }
    applyLayout(scrollPos);
  })();

  const SENS=1/90; /* pixels per scroll unit */
  let startX=0, startPos=0, lastX=0, velX=0;

  function onDown(x){
    isDragging=true; window.galleryDragging=true;
    startX=x; lastX=x; startPos=targetPos; velX=0;
  }
  function onMove(x){
    if(!isDragging)return;
    velX=(x-lastX); lastX=x;
    /* continuous: targetPos tracks pointer directly — no wrapping mid-drag */
    targetPos=startPos-(x-startX)*SENS;
  }
  function onUp(){
    if(!isDragging)return;
    isDragging=false;
    /* add small momentum from last velocity */
    targetPos+=(-velX*SENS)*2.5;
    /* snap to nearest integer */
    targetPos=Math.round(targetPos);
    /* normalise both to [0,N) so the ease goes the short way */
    scrollPos=((scrollPos%N)+N)%N;
    targetPos=((targetPos%N)+N)%N;
    /* pick shortest arc direction */
    let diff=targetPos-scrollPos;
    if(diff>N/2) scrollPos+=N;
    if(diff<-N/2) scrollPos-=N;
    /* Clear IMMEDIATELY — no delay — so page swipe handler isn't blocked */
    window.galleryDragging=false;
  }

  let gTouchStartX=0, gTouchStartY=0, gIsHoriz=false;
  container.addEventListener('mousedown',e=>{e.preventDefault();onDown(e.clientX);container.style.cursor='grabbing';});
  window.addEventListener('mousemove',e=>{if(isDragging)onMove(e.clientX);});
  window.addEventListener('mouseup',()=>{if(isDragging){onUp();container.style.cursor='grab';}});

  container.addEventListener('touchstart',e=>{
    gTouchStartX=e.touches[0].clientX;
    gTouchStartY=e.touches[0].clientY;
    gIsHoriz=false;
    window.galleryDragging=false;
  },{passive:true});

  container.addEventListener('touchmove',e=>{
    const dx=Math.abs(e.touches[0].clientX-gTouchStartX);
    const dy=Math.abs(e.touches[0].clientY-gTouchStartY);
    if(!gIsHoriz && dy>dx && dy>8){
      /* Vertical — don't interfere, let page swipe handle it */
      return;
    }
    if(dx>dy && dx>8){
      gIsHoriz=true;
      window.galleryDragging=true;
      if(!isDragging) onDown(gTouchStartX);
      onMove(e.touches[0].clientX);
    }
  },{passive:true});

  container.addEventListener('touchend',()=>{
    if(isDragging) onUp();
    else window.galleryDragging=false;
  },{passive:true});
})();

/* ══════════════════════════════════════════════════════════
   TEXT HOVER EFFECT — glow + underline ripple on [data-vp]
   paragraphs. No variable font (avoids reflow).
   Words get a warm green glow that follows the cursor.
══════════════════════════════════════════════════════════ */
(function(){
  const vpEls=document.querySelectorAll('[data-vp]');
  if(!vpEls.length)return;

  let mouseX=0,mouseY=0;
  window.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});

  vpEls.forEach(el=>{
    /* Wrap each word in a span for the effect */
    const text=el.textContent.trim();
    el.setAttribute('aria-label',text);
    el.innerHTML='';
    text.split(' ').forEach((word,wi,wa)=>{
      const span=document.createElement('span');
      span.textContent=word;
      span.style.cssText='display:inline-block;transition:color .2s ease,text-shadow .2s ease;cursor:default;';
      el.appendChild(span);
      if(wi<wa.length-1){
        const sp=document.createElement('span');
        sp.style.display='inline-block';
        sp.innerHTML='&nbsp;';
        el.appendChild(sp);
      }
    });
  });

  /* rAF loop — colour each word by distance */
  const RADIUS=90;
  function update(){
    requestAnimationFrame(update);
    vpEls.forEach(el=>{
      el.querySelectorAll('span[style]').forEach(span=>{
        if(!span.textContent.trim())return;
        const r=span.getBoundingClientRect();
        const cx=r.left+r.width/2,cy=r.top+r.height/2;
        const dist=Math.sqrt((mouseX-cx)**2+(mouseY-cy)**2);
        const t=Math.max(0,Math.min(1,1-dist/RADIUS));
        if(t>0.02){
          const green=Math.round(46+t*(80-46));
          span.style.color=`rgb(${Math.round(26-t*0)},${green},${Math.round(28)})`;
          span.style.textShadow=`0 0 ${Math.round(t*14)}px rgba(56,142,60,${(t*0.4).toFixed(2)})`;
        }else{
          span.style.color='';
          span.style.textShadow='';
        }
      });
    });
  }
  update();
})();

/* ════════════════════════════════════════════════════════
   ROTATING TEXT — nav logo "Kirana" ↔ "Grocery"
   • Hover over the word pauses rotation
   • Resumes automatically on mouseleave
════════════════════════════════════════════════════════ */
(function(){
  const wrap = document.getElementById('rotatingWord');
  if(!wrap) return;

  const TEXTS    = ['Kirana', 'Grocery'];
  const INTERVAL = 2800;
  let idx     = 0;
  let paused  = false;
  let timerId = null;

/* ════════════════════════════════════════════════════════
   ROTATING TEXT — FIX
════════════════════════════════════════════════════════ */
(function() {
  const wrap = document.getElementById('rotatingWord');
  if (!wrap) return;

  const TEXTS = ['Kirana', 'Grocery'];
  const INTERVAL = 2800;
  let idx = 0;
  let timerId = null;
  let paused = false;

  function rotate() {
    if (paused) return; // Don't run if hovering
    const current = wrap.querySelector('.rotating-word');
    if (!current) return;

    // PINNED TO LEFT: Remove old 50% centering logic
    current.style.left = '0';
    current.style.top = '0';

    idx = (idx + 1) % TEXTS.length;
    const next = document.createElement('em');
    next.className = 'rotating-word';
    next.textContent = TEXTS[idx];

    // INITIAL STATE: Attached to the left (0) to match image
      next.style.cssText = `
      display: inline-block;
      font-style: italic;
      color: var(--g600);
      position: absolute;
      left: 0; 
      /* No top: 0; Let the parent's align-items: center handle it */
      transform: translateY(100%); 
      opacity: 0;
      white-space: nowrap;
      will-change: transform, opacity;
      line-height: 1;
      font-size: inherit;
      padding-right: 0.5ch;
    `;

    wrap.appendChild(next);

    // Transition OUT: Slide up
    current.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1), opacity .3s ease';
    current.style.transform = 'translateY(-100%)';
    current.style.opacity = '0';

    // Transition IN: Slide up to baseline
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        next.style.transition = 'transform .45s cubic-bezier(.34,1.56,.64,1), opacity .3s ease';
        next.style.transform = 'translateY(0)'; 
        next.style.opacity = '1';
      });
    });

    setTimeout(() => {
      if (current.parentNode === wrap) current.remove();
    }, 500);
  }

  function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(rotate, INTERVAL);
  }

  // Handle Pause/Resume on the Logo Link
  const logoLink = wrap.closest('a');
  if (logoLink) {
    logoLink.addEventListener('mouseenter', () => { paused = true; });
    logoLink.addEventListener('mouseleave', () => {
      paused = false;
      startTimer(); // Reset timer so it doesn't rotate immediately
    });
  }

  startTimer();
})(); // Only one closing scope needed

if (typeof goTo !== 'undefined') window.goTo = goTo;
})();
