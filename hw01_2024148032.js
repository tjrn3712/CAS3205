// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;
halfW = canvas.width/2;
halfH = canvas.height/2;
setCanvasSize(true);

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0);
gl.enable(gl.SCISSOR_TEST);

// Start rendering
render();

window.addEventListener('resize', () => {
    setCanvasSize(false);
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

function setCanvasSize(initial) {
    const dpr = window.devicePixelRatio||1;

    let side;
    if (initial) {
        side = 500;
    } else {
        side = Math.min(window.innerWidth, window.innerHeight);
    }

    canvas.style.width = side + 'px';
    canvas.style.height = side + 'px';
  
    canvas.width  = Math.floor(side * dpr);
    canvas.height = Math.floor(side * dpr);
}

// Render loop
function render() {
    const w = canvas.width, h = canvas.height;
    const hw = w >> 1, hh = h >> 1;

    // 좌상
    gl.scissor(0, hh, hw, hh);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 우상
    gl.scissor(hw, hh, hw, hh);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 우하
    gl.scissor(hw, 0, hw, hh);
    gl.clearColor(1, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 좌하
    gl.scissor(0, 0, hw, hh);
    gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

}

