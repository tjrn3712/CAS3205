const cvs = document.getElementById('glCanvas');
const info = document.getElementById('info');
const gl = cvs.getContext('webgl2');
if (!gl) throw new Error('WebGL2 only, bro.');

const THICK_AXES = false;

function thickLineVerts(p0, p1, w) {
  const dx = p1[0]-p0[0], dy = p1[1]-p0[1];
  const len = Math.hypot(dx, dy) || 1.0;
  const nx = -dy/len, ny = dx/len;
  const hx = nx * (w*0.5), hy = ny * (w*0.5);
  return [
    p0[0]+hx, p0[1]+hy,
    p0[0]-hx, p0[1]-hy,
    p1[0]+hx, p1[1]+hy,
    p1[0]-hx, p1[1]-hy,
  ];
}

function drawAxes() {
  const hColor = [0.65, 0.35, 0.20, 1.0];
  const vColor = [0.00, 0.80, 0.60, 1.0];

  if (THICK_AXES) {
    const h = thickLineVerts([-1, 0], [1, 0], AXIS_W);
    const v = thickLineVerts([ 0,-1], [0, 1], AXIS_W);
    draw(h, gl.TRIANGLE_STRIP, hColor);
    draw(v, gl.TRIANGLE_STRIP, vColor);
  } else {
    draw([-1,0, 1,0], gl.LINES, hColor);
    draw([ 0,-1, 0,1], gl.LINES, vColor);
  }
}

function buildVert({ pointSize = 10.0 } = {}) {
  const lines = [];
  lines.push('#version 300 es');
  lines.push('precision highp float;');
  lines.push('layout(location=0) in vec2 aPos;');
  lines.push('void main(){');
  lines.push('  gl_Position = vec4(aPos, 0.0, 1.0);');
  lines.push('  gl_PointSize = ' + pointSize.toFixed(1) + ';');
  lines.push('}');
  return lines.join('\n');
}
function buildFrag() {
  return [
    '#version 300 es',
    'precision mediump float;',
    'uniform vec4 uColor;',
    'out vec4 outColor;',
    'void main(){',
    '  outColor = uColor;',
    '}'
  ].join('\n');
}

const VERT_SRC = buildVert({ pointSize: 10.0 });
const FRAG_SRC = buildFrag();


function compile(type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if(!gl.getShaderParameter(sh, gl.COMPLETE_STATUS) &&
     !gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    throw new Error(gl.getShaderInfoLog(sh));
  }
  return sh;
}
const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SRC));
gl.linkProgram(prog);
if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
  throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);


const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const uColor = gl.getUniformLocation(prog, 'uColor');
gl.clearColor(0.05, 0.05, 0.07, 1);


let mode = 'await_circle';
let circle = { center:null, radius:0, final:false };
let seg    = { a:null, b:null, final:false };
let intersections = [];


function toNDC(ev){
  const r = cvs.getBoundingClientRect();
  const x = ((ev.clientX - r.left)/r.width)*2 - 1;
  const y = 1 - ((ev.clientY - r.top)/r.height)*2;
  return [x,y];
}
const dist = (a,b)=>Math.hypot(a[0]-b[0], a[1]-b[1]);

function intersectCircleSegment(C, r, P0, P1, eps = 1e-6) {
  const dx = P1[0] - P0[0], dy = P1[1] - P0[1];
  const fx = P0[0] - C[0],  fy = P0[1] - C[1];
  const A = dx*dx + dy*dy;
  const B = 2*(fx*dx + fy*dy);
  const Cc = fx*fx + fy*fy - r*r;
  const D = B*B - 4*A*Cc;
  
  if (D < -eps) return [];
  
  if (Math.abs(A) < eps) {
    if (Math.abs(Cc) <= eps) return [[P0[0], P0[1]]];
    return [];
  }


  const out = [];

  if (Math.abs(D) <= eps) {
    const t = -B / (2*A);
    if (t >= -eps && t <= 1 + eps) {
      const tt = Math.min(1, Math.max(0, t)); 
      out.push([P0[0] + tt*dx, P0[1] + tt*dy]);
    }
    return out;
  }

  const s = Math.sqrt(D);
  let t1 = (-B - s) / (2*A);
  let t2 = (-B + s) / (2*A);

  if (t1 >= -eps && t1 <= 1 + eps) {
    t1 = Math.min(1, Math.max(0, t1));
    out.push([P0[0] + t1*dx, P0[1] + t1*dy]);
  }
  if (t2 >= -eps && t2 <= 1 + eps) {
    t2 = Math.min(1, Math.max(0, t2));
    if (!(out.length && Math.abs(t2 - t1) <= 1e-6)) {
      out.push([P0[0] + t2*dx, P0[1] + t2*dy]);
    }
  }
  return out;
}

function buildCircleVerts(c, r, n=128){
  const v=[];
  for(let i=0;i<n;i++){
    const th = i*6.28318530718/n;
    v.push(c[0]+r*Math.cos(th), c[1]+r*Math.sin(th));
  }
  return v;
}
function draw(verts, mode, color){
  gl.uniform4fv(uColor, color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  gl.drawArrays(mode, 0, verts.length/2);
}
function fmt(n){ return (Math.abs(n)<1e-6?0:n).toFixed(3); }
function updateInfo(){
  const c = circle.center ? `center (${fmt(circle.center[0])}, ${fmt(circle.center[1])}) radius = ${fmt(circle.radius)}` : '-';
  const s = seg.a ? `(${fmt(seg.a[0])}, ${fmt(seg.a[1])}) ~ (${fmt(seg.b[0])}, ${fmt(seg.b[1])})` : '-';
  let it = '';
  if(mode==='done'){
    it = intersections.length
      ? `Intersect Points: ${intersections.length} `+intersections.map(p=>`(${fmt(p[0])}, ${fmt(p[1])})`).join(' ')
      : 'No intersection';
  }
  if (!circle.center) info.textContent = ``;
  else {
    if (!seg.a) info.textContent = `Circle: ${c}`;
    else info.textContent = `Circle: ${c}\nLine segment: ${s}\n${it}`;
  }
}

// ---- Mouse ----
let down=false;
cvs.addEventListener('mousedown', e=>{
  down=true;
  const p=toNDC(e);
  if(mode==='await_circle'){ circle.center=p; circle.radius=0; mode='drag_circle'; }
  else if(mode==='await_seg_start'){ seg.a=p; seg.b=p; mode='drag_seg'; }
});
cvs.addEventListener('mousemove', e=>{
  if(!down) return;
  const p=toNDC(e);
  if(mode==='drag_circle') circle.radius = dist(circle.center, p);
  else if(mode==='drag_seg') seg.b = p;
});
cvs.addEventListener('mouseup', ()=>{
  down=false;
  if(mode==='drag_circle'){ circle.final=true; mode='await_seg_start'; }
  else if(mode==='drag_seg'){ seg.final=true; mode='done';
    intersections = intersectCircleSegment(circle.center, circle.radius, seg.a, seg.b);
  }
});


function render(){
  gl.viewport(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawAxes();
  if(circle.center && circle.radius>0){
    draw(buildCircleVerts(circle.center, circle.radius), gl.LINE_LOOP, [0.2,0.8,1.0,1.0]);
  }
  if(seg.a){
    draw([seg.a[0],seg.a[1], seg.b[0],seg.b[1]], gl.LINES, [1.0,0.85,0.2,1.0]);
  }
  if(mode==='done' && intersections.length){
    draw(intersections.flat(), gl.POINTS, [1.0,0.2,0.25,1.0]);
  }
  updateInfo();
  requestAnimationFrame(render);
}
render();

