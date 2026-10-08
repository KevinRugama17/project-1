/**
 * Generador de Sonido de Fuego Dinámico con Web Audio API
 */
class FireSoundSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.noiseNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.crackleInterval = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Genera Ruido Rosa/Blanco para la base del fuego
  createNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Algoritmo de Paul Kellet para ruido rosa (sonido más natural de combustión)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Nodo de Fuente de Ruido
    this.noiseNode = this.audioCtx.createBufferSource();
    this.noiseNode.buffer = this.createNoiseBuffer();
    this.noiseNode.loop = true;

    // Filtro Paso Bajo para simular el rugido grave del fuego
    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(450, this.audioCtx.currentTime);

    // Control de Ganancia Principal
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.3);

    // Conexiones de Audio
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.noiseNode.start();

    // Iniciar chispas/crujidos
    this.crackleInterval = setInterval(() => this.triggerCrackle(), 80);
  }

  // Genera chasquidos/crujidos aleatorios de madera o basura quemándose
  triggerCrackle() {
    if (!this.isPlaying) return;

    if (Math.random() > 0.35) {
      const crackleOsc = this.audioCtx.createBufferSource();
      crackleOsc.buffer = this.createPopBuffer();

      const crackleGain = this.audioCtx.createGain();
      const val = Math.random() * 0.4 + 0.1;
      crackleGain.gain.setValueAtTime(val, this.audioCtx.currentTime);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(this.audioCtx.destination);

      crackleOsc.start();
    }
  }

  createPopBuffer() {
    const samples = Math.floor(this.audioCtx.sampleRate * 0.03);
    const buffer = this.audioCtx.createBuffer(1, samples, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples * 0.15));
    }
    return buffer;
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.gainNode) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
      setTimeout(() => {
        if (this.noiseNode) {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
        }
      }, 200);
    }

    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
    }
  }
}

/**
 * Sistema de Partículas para Fuego Visual (Canvas)
 */
class FireParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
  }

  resize() {
    this.canvas.width = 130;
    this.canvas.height = 130;
  }

  start() {
    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  stop() {
    this.animating = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
  }

  spawnParticle() {
    this.particles.push({
      x: 65 + (Math.random() * 40 - 20),
      y: 85,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2.5 - 1.5,
      size: Math.random() * 8 + 4,
      alpha: 1,
      color: Math.random() > 0.3 ? '#ff4500' : '#ffa500'
    });
  }

  loop() {
    if (!this.animating) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.particles.length < 25) {
      this.spawnParticle();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      p.size *= 0.96;

      if (p.alpha <= 0 || p.size <= 0.5) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.loop());
  }
}

// Inicialización de Eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const fireIcon = document.getElementById('fireIcon');
  const fireCanvas = document.getElementById('fireCanvas');

  const synthesizer = new FireSoundSynthesizer();
  const particleSystem = new FireParticleSystem(fireCanvas);

  const startFireEffect = () => {
    fireIcon.classList.add('active');
    synthesizer.start();
    particleSystem.start();
  };

  const stopFireEffect = () => {
    fireIcon.classList.remove('active');
    synthesizer.stop();
    particleSystem.stop();
  };

  // Eventos para Desktop y Mobile
  fireIcon.addEventListener('mouseenter', startFireEffect);
  fireIcon.addEventListener('mouseleave', stopFireEffect);

  fireIcon.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startFireEffect();
  });

  fireIcon.addEventListener('touchend', stopFireEffect);

  // Toggle con Clic/Teclado (Accesibilidad)
  let toggled = false;
  fireIcon.addEventListener('click', () => {
    toggled = !toggled;
    if (toggled) {
      startFireEffect();
    } else {
      stopFireEffect();
    }
  });
});