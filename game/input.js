// Layangan Perang — input.js
// Mouse + keyboard. Canvas melaporkan posisi dalam koordinat game
// (render menyesuaikan ukuran canvas ke jendela, jadi konversi ada di sini).

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 640;
    this.mouseY = 300;
    this.mouseHeld = false; // tombol kiri ditahan = tarik benang
    this.keys = new Set();
    this._pressed = new Set(); // tombol yang ditekan sejak frame terakhir

    canvas.addEventListener('mousemove', (e) => {
      const p = this.toGame(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseHeld = true;
      const p = this.toGame(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseHeld = false;
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.preventDefault();
      if (!e.repeat) this._pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.mouseHeld = false;
      this.keys.clear();
    });
  }

  // Ubah titik piksel CSS menjadi ruang game 1280x720.
  toGame(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 1280,
      y: ((clientY - r.top) / r.height) * 720,
    };
  }

  get spaceHeld() {
    return this.keys.has('Space');
  }

  // True sekali pada frame tombol itu ditekan. Dipanggil sekali per frame.
  wasPressed(code) {
    return this._pressed.has(code);
  }

  endFrame() {
    this._pressed.clear();
  }
}
