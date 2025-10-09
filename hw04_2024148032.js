const canvas = document.getElementById('c');
const g = canvas.getContext('2d');

const TOWER_W = 50;
const TOWER_H = 250;
const BASE_H  = 40;
const LONG_LEN = 100;
const LONG_WID = 30;
const SHORT_LEN = 50;
const SHORT_WID = 10;

function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
resize();

function layout() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const cx = Math.round(W * 0.5);
    const cy = Math.round(H * 0.55 - TOWER_H);
    return {W,H,cx,cy};
}

let t0 = performance.now();
let tPrev = t0;
let aL = 0;
let aS = 0;

function drawBladeSet(angle, L, colLong, colShort) {
    g.save();
    g.translate(L.cx, L.cy);
    g.rotate(angle);
    g.fillStyle = colLong;
    g.fillRect(-0.1, -LONG_WID/2, LONG_LEN, LONG_WID);
    const beta = aS - aL;
    g.save();
    g.translate(LONG_LEN, 0);
    g.rotate(beta);
    g.fillStyle = colShort;
    g.fillRect(-SHORT_LEN/2, -SHORT_WID/2, SHORT_LEN, SHORT_WID);
    g.restore();
    g.restore();
}

function draw(now) {
    const L = layout();
    const t = (now - t0) * 0.001;
    const dt = Math.max(0, (now - tPrev) * 0.001);
    tPrev = now;


    const wL = Math.sin(t) * Math.PI * 2.0;
    const wS = Math.sin(t) * Math.PI * (-10.0);
    aL += wL * dt;
    aS += wS * dt;
    aL %= Math.PI*2.0;
    aL %= Math.PI*2.0;
    aS %= Math.PI*2.0;
    aS %= Math.PI*2.0;

    g.clearRect(0, 0, L.W, L.H);
    g.fillStyle = '#0e2a45';
    g.fillRect(0, 0, L.W, L.H);

    g.fillStyle = '#000000';
    g.fillRect(0, L.H - BASE_H, L.W, BASE_H);

    const tx = L.cx - TOWER_W / 2, ty = L.cy;
    g.fillStyle = '#8c5a2b';
    g.fillRect(tx, ty, TOWER_W, TOWER_H);

    drawBladeSet(aL, L, '#ffffff', '#999999');
    drawBladeSet(aL + Math.PI, L, '#ffffff', '#999999');

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);