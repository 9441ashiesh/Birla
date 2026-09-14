'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import slides from './slides.json';

/** Trusted, locally authored slide content; no remote or user-entered HTML. */
export default function Presentation() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState('');
  const stage = useRef<HTMLElement>(null);
  const overview = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((index: number, updateHash = true) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setCurrent(next);
    if (updateHash) window.history.replaceState(null, '', `#${slides[next].id}`);
  }, []);

  useEffect(() => {
    const readHash = () => {
      const index = slides.findIndex(s => `#${s.id}` === window.location.hash);
      if (index >= 0) go(index, false);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [go]);

  useEffect(() => {
    const fit = () => {
      if (!stage.current) return;
      const scale = Math.min((stage.current.clientWidth - 24) / 1440, (stage.current.clientHeight - 20) / 810);
      document.documentElement.style.setProperty('--scale', String(Math.max(0.1, scale)));
    };
    const fullChange = () => { setFullscreen(Boolean(document.fullscreenElement)); fit(); };
    const observer = new ResizeObserver(fit);
    if (stage.current) observer.observe(stage.current);
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fullChange);
    let mounted = true;
    document.fonts.ready.then(() => { if (mounted) fit(); });
    fit();
    return () => {
      mounted = false;
      observer.disconnect();
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fullChange);
    };
  }, []);

  useEffect(() => {
    document.getElementById(slides[current].id)?.querySelector('.slide-content')?.scrollTo(0, 0);
  }, [current]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setMessage('Use your browser’s full-screen command for a larger presentation.');
    } catch {
      setMessage('Use your browser’s full-screen command for a larger presentation.');
    }
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (overview.current?.open || event.ctrlKey || event.metaKey || event.altKey || target?.matches('input,textarea,select')) return;
      if (['ArrowRight', 'PageDown'].includes(event.key) || (event.code === 'Space' && !target?.closest('button,a'))) {
        event.preventDefault(); go(current + 1);
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault(); go(current - 1);
      } else if (event.key === 'Home') {
        event.preventDefault(); go(0);
      } else if (event.key === 'End') {
        event.preventDefault(); go(slides.length - 1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault(); void fullscreen();
      } else if (event.key.toLowerCase() === 'g') {
        event.preventDefault(); overview.current?.showModal();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [current, go, fullscreen]);

  return <>
    <header className="viewer-top">
      <span><b>OMYRA</b> <i>×</i> BIRLA OPEN MINDS</span>
      <span className="viewer-label">ADMISSIONS GROWTH PARTNERSHIP</span>
      <button id="fullscreen" onClick={() => void fullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
        {isFullscreen ? 'Exit full screen ⛶' : 'Full screen ⛶'}
      </button>
    </header>
    <main className="stage" id="stage" ref={stage} aria-label="Proposal slides"
      onClick={event => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('[data-print]')) { event.preventDefault(); window.print(); return; }
        const link = target?.closest('a[href^="#"]');
        if (!link) return;
        const index = slides.findIndex(s => `#${s.id}` === link.getAttribute('href'));
        if (index >= 0) { event.preventDefault(); go(index); }
      }}
      onTouchStart={event => {
        if (event.touches.length === 1) touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={event => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}>
      <div className="canvas" id="canvas">
        {slides.map((slide, index) => <section key={slide.id} id={slide.id}
          className={`${slide.className}${index === current ? ' active' : ''}`}
          data-title={slide.title} data-group={slide.group}
          aria-label={`Slide ${index + 1}: ${slide.title}`} aria-hidden={index !== current} hidden={index !== current}
          dangerouslySetInnerHTML={{ __html: slide.html }} />)}
      </div>
    </main>
    <footer className="viewer-bottom">
      <button id="contents" aria-haspopup="dialog" onClick={() => overview.current?.showModal()}>▦ <span>All slides</span></button>
      <div className="position"><span id="group-label">{slides[current].group}</span><span id="slide-title">{slides[current].title}</span></div>
      <div className="navigation">
        <button id="previous" aria-label="Previous slide" disabled={current === 0} onClick={() => go(current - 1)}>←</button>
        <span id="counter" aria-live="polite">{String(current + 1).padStart(2, '0')} / {slides.length}</span>
        <button id="next" aria-label="Next slide" disabled={current === slides.length - 1} onClick={() => go(current + 1)}>→</button>
      </div>
    </footer>
    <div className="progress" aria-hidden="true"><div id="progress-fill" style={{ width: `${(current + 1) / slides.length * 100}%` }} /></div>
    <dialog id="overview" ref={overview} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) overview.current?.close();
    }}>
      <div className="overview-head"><div><span className="eyebrow">THE FULL PRESENTATION</span><h2>Choose a slide.</h2></div>
        <button id="close-overview" aria-label="Close slide overview" onClick={() => overview.current?.close()}>✕</button>
      </div>
      <nav id="slide-list" aria-label="All presentation slides">
        {slides.map((slide, index) => <Fragment key={slide.id}>
          {(index === 0 || slides[index - 1].group !== slide.group) && <h3 className="overview-group">{slide.group}</h3>}
          <a href={`#${slide.id}`} aria-current={index === current ? 'true' : 'false'} onClick={event => { event.preventDefault(); overview.current?.close(); go(index); }}>
            <span>{String(index + 1).padStart(2, '0')}</span>{slide.title}
          </a>
        </Fragment>)}
      </nav>
      <p className="keyboard-help">Use ← → or Space to navigate · Home returns to the opening · F for full screen</p>
    </dialog>
    <div id="notice" role="status" className={message ? 'visible' : undefined}>{message}</div>
    <noscript><p>Please enable JavaScript to navigate the presentation.</p></noscript>
  </>;
}
