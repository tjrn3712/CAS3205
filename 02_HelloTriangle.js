// Get the canvas and WebGL 2 context
const c = document.getElementById('glCanvas');
const gl = c.getContext('webgl2');
if (!gl) throw new Error('WebGL2 not supported');

c.width = 600;
c.height = 600;
gl.viewport(0, 0, c.width, c.height);
gl.clearColor(0.05, 0.05, 0.08, 1);

function rs() {
    const pr = window.devicePixelRatio || 1;
    const s = Math.min(innerWidth, innerHeight);
    c.style.width = s + 'px';
    c.style.height = s + 'px';
    const side = Math.floor(s * pr);
    c.width = side;
    c.height = side;
    gl.viewport(0, 0, c.width, c.height);
    render();
}
addEventListener('resize', rs);

const m = document.createElement('div');
m.textContent = 'Use arrow keys to move the rectangle';
Object.assign(m.style, {
    position: 'fixed',
    left: '8px',
    top: '8px',
    padding: '6px 8px',
    font: '14px system-ui, Segoe UI, Roboto, sans-serif',
    color: '#ddd',
    background: 'rgba(0,0,0,.45)',
    borderRadius: '6px',
    userSelect: 'none',
    pointerEvents: 'none',
    zIndex: 10
});
document.body.appendChild(m);

function shader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
}
function program(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(vsSrc, gl.VERTEX_SHADER));
    gl.attachShader(p, shader(fsSrc, gl.FRAGMENT_SHADER));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
}

const vert = `#version 300 es
layout(location = 0) in vec2 aPos;
uniform vec2 uOffset;
void main() {
    gl_Position = vec4(aPos + uOffset, 0.0, 1.0);
}`;

const frag = `#version 300 es
precision mediump float;
out vec4 FragColor;
void main() {
    FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

const h = 0.1;
const verts = new Float32Array([
    -h, -h,
    h, -h,
    h,  h,
    -h,  h
]);
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

let ox = 0, oy = 0;
const step = 0.01;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mn = -1 + h, mx = 1 - h;
addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ox -= step;
    else if (e.key === 'ArrowRight') ox += step;
    else if (e.key === 'ArrowUp') oy += step;
    else if (e.key === 'ArrowDown') oy -= step;
    ox = clamp(ox, mn, mx);
    oy = clamp(oy, mn, mx);
    render();
});

const prog = program(vert, frag);
const uOff = gl.getUniformLocation(prog, 'uOffset');

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(uOff, ox, oy);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

render();

