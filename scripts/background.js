const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.z = 6;

// Floating grain-like points
const geo = new THREE.BufferGeometry();
const N = 1200;
const pos = new Float32Array(N*3);
const sizes = new Float32Array(N);
for(let i=0;i<N;i++){
  pos[i*3]=(Math.random()-.5)*18;
  pos[i*3+1]=(Math.random()-.5)*12;
  pos[i*3+2]=(Math.random()-.5)*10;
  sizes[i]=Math.random()*.8+.1;
}
geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
const mat = new THREE.PointsMaterial({size:.025,color:0x333333,transparent:true,opacity:.9});
const pts = new THREE.Points(geo,mat);
scene.add(pts);

// Thin grid plane
const gridHelper = new THREE.GridHelper(24,24,0x1a1a1a,0x111111);
gridHelper.position.y = -3;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.4;
scene.add(gridHelper);

// Ambient glow sphere (invisible, just for lighting feel)
const ambLight = new THREE.AmbientLight(0xffffff,.1);
scene.add(ambLight);

let mx=0,my=0,tgt_mx=0,tgt_my=0;
let animT=0;

function animate(){
  requestAnimationFrame(animate);
  animT+=0.0005;
  mx += (tgt_mx - mx)*.04;
  my += (tgt_my - my)*.04;
  pts.rotation.y = animT*.15 + mx*.05;
  pts.rotation.x = my*.03;
  gridHelper.position.y = -3 + Math.sin(animT*2)*.05;
  camera.position.x += (mx*.4 - camera.position.x)*.03;
  camera.position.y += (-my*.2 - camera.position.y)*.03;
  camera.lookAt(scene.position);
  renderer.render(scene,camera);
}
animate();

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});