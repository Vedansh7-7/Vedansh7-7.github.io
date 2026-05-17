const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
let cx=0,cy=0,rx=0,ry=0;

document.addEventListener('mousemove',e=>{
  cx=e.clientX; cy=e.clientY;
  tgt_mx=(e.clientX/window.innerWidth-.5)*2;
  tgt_my=(e.clientY/window.innerHeight-.5)*2;
});

(function tickCursor(){
  requestAnimationFrame(tickCursor);
  rx+=(cx-rx)*.12;
  ry+=(cy-ry)*.12;
  cursorDot.style.left=cx+'px';
  cursorDot.style.top=cy+'px';
  cursorRing.style.left=rx+'px';
  cursorRing.style.top=ry+'px';
})();

document.querySelectorAll('a,button,.work-item,.bf-title,.blog-small').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('cursor-hover'));
});