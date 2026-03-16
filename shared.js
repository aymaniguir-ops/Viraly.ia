/* ── SHARED.JS ── VertexLink */
(function(){

/* ── CURSOR ── */
const cur = document.getElementById('cur');
if(cur){
  let mx=0,my=0,cx=-40,cy=-40;
  document.addEventListener('mousemove', e=>{
    mx = e.clientX - 10; my = e.clientY - 10;
    cur.style.left = mx+'px'; cur.style.top = my+'px';
  });
  document.querySelectorAll('a,button,[data-h]').forEach(el=>{
    el.addEventListener('mouseenter',()=>cur.classList.add('h'));
    el.addEventListener('mouseleave',()=>cur.classList.remove('h'));
  });
}

/* ── PROGRESS BAR ── */
const prog = document.getElementById('prog');
if(prog){
  window.addEventListener('scroll',()=>{
    const s = document.documentElement;
    prog.style.width = (s.scrollTop/(s.scrollHeight-s.clientHeight)*100)+'%';
  });
}

/* ── NAV SCROLL ── */
const nav = document.querySelector('nav');
if(nav) window.addEventListener('scroll',()=>nav.classList.toggle('scrolled', scrollY>40));

/* ── CANVAS NEURAL NETWORK ── */
const canvas = document.getElementById('cvs');
if(!canvas) return;
const ctx = canvas.getContext('2d');
let W, H, pts=[], DPR=window.devicePixelRatio||1;

function resize(){
  W = canvas.width  = window.innerWidth * DPR;
  H = canvas.height = window.innerHeight * DPR;
  canvas.style.width  = window.innerWidth+'px';
  canvas.style.height = window.innerHeight+'px';
  ctx.scale(DPR, DPR);
}

function makePt(){
  const r = Math.random();
  return {
    x: Math.random()*window.innerWidth,
    y: Math.random()*window.innerHeight,
    vx: (Math.random()-.5)*0.32,
    vy: (Math.random()-.5)*0.32,
    r:  Math.random()<.68 ? [61,111,255] : [0,215,255],
    sz: Math.random()*1.4+.6,
    pulse: Math.random()*Math.PI*2
  };
}

const N = 90;
function init(){ resize(); pts=[]; for(let i=0;i<N;i++) pts.push(makePt()); }

/* data flows */
let flows=[];
const MAX_FLOWS = 10;
function tryFlow(){
  if(flows.length>=MAX_FLOWS) return;
  const conns=[];
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
      if(Math.sqrt(dx*dx+dy*dy)<160) conns.push([i,j]);
    }
  }
  if(!conns.length) return;
  const [a,b] = conns[Math.floor(Math.random()*conns.length)];
  flows.push({ a, b, t:0, speed: .008+Math.random()*.012, col:[0,215,255] });
}
setInterval(tryFlow, 400);

/* mouse repulsion */
let mouse = { x: -999, y: -999 };
document.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });

function draw(){
  const iW=window.innerWidth, iH=window.innerHeight;
  ctx.clearRect(0,0,iW,iH);

  /* move */
  pts.forEach(p=>{
    p.pulse += .018;
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>iW) p.vx*=-1;
    if(p.y<0||p.y>iH) p.vy*=-1;
    const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.sqrt(dx*dx+dy*dy);
    if(d<120){ const f=.8*(1-d/120); p.vx+=dx/d*f*.6; p.vy+=dy/d*f*.6; }
    const sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    if(sp>.6){ p.vx=p.vx/sp*.6; p.vy=p.vy/sp*.6; }
  });

  /* connections */
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<160){
        ctx.beginPath();
        ctx.strokeStyle=`rgba(61,111,255,${(1-d/160)*.22})`;
        ctx.lineWidth=.6;
        ctx.moveTo(pts[i].x,pts[i].y);
        ctx.lineTo(pts[j].x,pts[j].y);
        ctx.stroke();
      }
    }
  }

  /* data flows */
  flows=flows.filter(f=>{
    f.t+=f.speed;
    if(f.t>1) return false;
    const ax=pts[f.a].x,ay=pts[f.a].y,bx=pts[f.b].x,by=pts[f.b].y;
    const x=ax+(bx-ax)*f.t, y=ay+(by-ay)*f.t;
    const [r,g,b]=f.col;
    /* trail */
    for(let i=0;i<6;i++){
      const tt=f.t-i*.015; if(tt<0) break;
      const tx=ax+(bx-ax)*tt, ty=ay+(by-ay)*tt;
      ctx.beginPath();
      ctx.arc(tx,ty,1.2*(1-i/6),0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${(1-i/6)*.5})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x,y,2.2,0,Math.PI*2);
    ctx.fillStyle=`rgba(${r},${g},${b},.9)`;
    ctx.shadowColor=`rgba(${r},${g},${b},.8)`;
    ctx.shadowBlur=8;
    ctx.fill();
    ctx.shadowBlur=0;
    return true;
  });

  /* dots */
  pts.forEach(p=>{
    const glow = .7+Math.sin(p.pulse)*.3;
    const [r,g,b]=p.r;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
    ctx.fillStyle=`rgba(${r},${g},${b},${glow*.55})`;
    ctx.shadowColor=`rgba(${r},${g},${b},.4)`;
    ctx.shadowBlur=6;
    ctx.fill();
    ctx.shadowBlur=0;
  });

  requestAnimationFrame(draw);
}

init();
window.addEventListener('resize', ()=>{ ctx.resetTransform(); init(); });
draw();

/* ── SCROLL REVEAL ── */
const ro = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in') });
},{ threshold:.06, rootMargin:'0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el=>ro.observe(el));

/* ── SCORE BARS ── */
const sro = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    e.target.querySelectorAll('.sfill').forEach((b,i)=>{
      setTimeout(()=>{ b.style.width=(parseFloat(b.dataset.v||0)*100)+'%' }, i*130+300);
    });
    sro.unobserve(e.target);
  });
},{ threshold:.2 });
document.querySelectorAll('.score-block').forEach(el=>sro.observe(el));

})();
