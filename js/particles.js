import * as THREE from 'three';

(() => {
  'use strict';

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isMobile = window.matchMedia('(max-width: 700px)').matches;
  const PARTICLE_COUNT = isMobile ? 9000 : 18000;

  let scene, camera, renderer, particles, material;
  let animationId = 0;
  let currentShape = 0;
  let targetPositions = [];
  let pointer = new THREE.Vector2(0, 0);
  let scrollValue = 0;
  let lastFrame = 0;

  const clock = new THREE.Clock();

  // Deterministic random number generator
  let seed = 123456789;

  function random() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967295;
  }

  function makeShape(type, count) {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const u = random();
      const v = random();
      const angle = u * Math.PI * 2;
      const radius = Math.sqrt(random());

      let x = 0, y = 0, z = 0;

      if (type === 0) {
        // Corona
        const theta = angle;
        const phi = Math.acos(2 * v - 1);
        const r = 2.1 + random() * 1.7;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else if (type === 1) {
        // Galaxy
        const arm = i % 4;
        const r = Math.sqrt(random()) * 4;
        const a = angle + arm * Math.PI / 2 + r * 0.75;

        x = Math.cos(a) * r;
        y = Math.sin(a) * r * 0.65;
        z = (random() - 0.5) * (0.35 + r * 0.15);
      } else if (type === 2) {
        // Cortex
        const theta = angle;
        const phi = Math.acos(2 * v - 1);
        const r = 2.5 + Math.sin(theta * 6) * 0.35
          + Math.cos(phi * 8) * 0.25;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else {
        // Lattice
        const side = Math.ceil(Math.cbrt(count));
        const ix = i % side;
        const iy = Math.floor(i / side) % side;
        const iz = Math.floor(i / (side * side));

        x = (ix / side - 0.5) * 6;
        y = (iy / side - 0.5) * 6;
        z = (iz / side - 0.5) * 6;
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    return positions;
  }

  function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'low-power'
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75)
    );

    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();

    const initialPositions = makeShape(0, PARTICLE_COUNT);

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(initialPositions, 3)
    );

    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const mix = random();

      // Amber, rose and violet palette
      colors[i3] = 0.85 + mix * 0.15;
      colors[i3 + 1] = 0.43 + mix * 0.25;
      colors[i3 + 2] = 0.43 + random() * 0.3;

      sizes[i] = 0.6 + random() * 1.8;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    targetPositions = [
      makeShape(0, PARTICLE_COUNT),
      makeShape(1, PARTICLE_COUNT),
      makeShape(2, PARTICLE_COUNT),
      makeShape(3, PARTICLE_COUNT)
    ];

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    window.NOCTURNE = {
      ready: () => true,
      count: PARTICLE_COUNT,
      setShape,
      pulse
    };

    if (!reducedMotion) {
      animate();
    } else {
      renderer.render(scene, camera);
    }
  }

  function setShape(index) {
    if (!Number.isInteger(index)) return;

    currentShape = ((index % 4) + 4) % 4;

    const position = particles?.geometry?.getAttribute('position');
    if (!position) return;

    const target = targetPositions[currentShape];

    // Start the shape transition from current positions
    const current = position.array;
    const from = new Float32Array(current);

    const duration = reducedMotion ? 0 : 900;
    const start = performance.now();

    function morph(now) {
      const t = duration === 0
        ? 1
        : Math.min((now - start) / duration, 1);

      const eased = t * t * (3 - 2 * t);

      for (let i = 0; i < current.length; i++) {
        current[i] = from[i] + (target[i] - from[i]) * eased;
      }

      position.needsUpdate = true;

      if (t < 1) {
        requestAnimationFrame(morph);
      }
    }

    requestAnimationFrame(morph);
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onScroll() {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    scrollValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }

  function onResize() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function pulse() {
    if (!particles) return;

    particles.scale.setScalar(1.12);

    setTimeout(() => {
      if (particles) particles.scale.setScalar(1);
    }, 250);
  }

  function animate(timestamp = 0) {
    animationId = requestAnimationFrame(animate);

    if (document.hidden) return;

    // Limit animation frame work on slower devices
    if (timestamp - lastFrame < 30) return;
    lastFrame = timestamp;

    const elapsed = clock.getElapsedTime();

    if (particles) {
      particles.rotation.y = elapsed * 0.035 + pointer.x * 0.08;
      particles.rotation.x = pointer.y * 0.045;
      particles.rotation.z = scrollValue * 0.12;
      particles.position.y = -scrollValue * 0.45;

      renderer.render(scene, camera);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else if (!reducedMotion) {
      clock.start();
      animate();
    }
  });

  try {
    init();
  } catch (error) {
    console.error('NOCTURNE particle system could not start:', error);
  }
})();
