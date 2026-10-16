(() => {
  'use strict';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  };

  ready(() => {
    // Preloader
    const preloader = document.querySelector('.preloader');

    window.addEventListener('load', () => {
      setTimeout(() => preloader?.classList.add('hidden'), 700);
    });

    setTimeout(() => preloader?.classList.add('hidden'), 2500);

    // Footer year
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    // Mobile navigation
    const menuButton = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');

    menuButton?.addEventListener('click', () => {
      const open = nav?.classList.toggle('open') ?? false;
      menuButton.setAttribute('aria-expanded', String(open));
    });

    nav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton?.setAttribute('aria-expanded', 'false');
      });
    });

    // FAQ: keep only one answer open
    document.querySelectorAll('.faq-item').forEach((item) => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          document.querySelectorAll('.faq-item').forEach((other) => {
            if (other !== item) other.open = false;
          });
        }
      });
    });

    // Particle shape controls
    document.querySelectorAll('[data-shape]').forEach((button) => {
      button.addEventListener('click', () => {
        const shape = Number(button.dataset.shape);

        if (window.NOCTURNE?.setShape) {
          window.NOCTURNE.setShape(shape);
        }

        document.querySelectorAll('[data-shape]').forEach((other) => {
          other.classList.toggle('active', other === button);
          other.setAttribute('aria-pressed', String(other === button));
        });
      });
    });

    // Contact form validation
    const form = document.querySelector('.contact-form');
    const message = document.querySelector('.form-message');

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      const email = form.querySelector('input[type="email"]');

      if (!email || !email.checkValidity()) {
        email?.reportValidity();
        return;
      }

      if (message) {
        message.textContent =
          'Thanks for your interest! This demo form is not connected to a server yet.';
      }
    });

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Keyboard shortcut: cycle particle shapes
    let currentShape = 0;

    document.addEventListener('keydown', (event) => {
      const target = event.target;

      if (
        event.key.toLowerCase() !== 'n' ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      currentShape = (currentShape + 1) % 4;

      if (window.NOCTURNE?.setShape) {
        window.NOCTURNE.setShape(currentShape);
      }

      document.querySelectorAll('[data-shape]').forEach((button) => {
        const active = Number(button.dataset.shape) === currentShape;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });

    // Scroll progress readout
    const progress = document.querySelector('[data-scroll-progress]');

    const updateProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      const value = maxScroll > 0 ? window.scrollY / maxScroll : 0;

      if (progress) {
        progress.style.transform = `scaleX(${value})`;
      }
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    console.info('NOCTURNE interface initialized.');
  });
})();
