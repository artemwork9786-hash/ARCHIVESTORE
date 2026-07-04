import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const WHEEL_SPEED = 0.003;

export default function Lightbox({ isOpen, images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex || 0);
  const [, rerender] = useState(0);

  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const vpRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef({ on: false, moved: false, sx: 0, sy: 0, stx: 0, sty: 0 });
  const pinchRef = useRef({ d: 0, s: 1 });

  const uniqueImages = useMemo(() => [...new Set(images || [])], [images]);

  const apply = useCallback(() => {
    const el = imgRef.current;
    if (el) el.style.transform = `translate(${txRef.current}px,${tyRef.current}px) scale(${scaleRef.current})`;
  }, []);

  const clamp = useCallback((tx, ty, s) => {
    if (s <= 1) return { tx: 0, ty: 0 };
    const vp = vpRef.current;
    const img = imgRef.current;
    if (!vp || !img) return { tx, ty };
    const mx = Math.max(0, (img.naturalWidth * s - vp.clientWidth) / 2);
    const my = Math.max(0, (img.naturalHeight * s - vp.clientHeight) / 2);
    return { tx: Math.max(-mx, Math.min(mx, tx)), ty: Math.max(-my, Math.min(my, ty)) };
  }, []);

  const reset = useCallback(() => {
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    apply();
    rerender((n) => n + 1);
  }, [apply]);

  const zoom = useCallback((cx, cy, delta) => {
    const vp = vpRef.current;
    if (!vp) return;
    const os = scaleRef.current;
    const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, os * (1 + delta)));
    if (ns === os) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const ix = (cx - vw / 2 - txRef.current) / os;
    const iy = (cy - vh / 2 - tyRef.current) / os;
    const c = clamp(cx - vw / 2 - ix * ns, cy - vh / 2 - iy * ns, ns);
    scaleRef.current = ns;
    txRef.current = c.tx;
    tyRef.current = c.ty;
    apply();
    rerender((n) => n + 1);
  }, [clamp, apply]);

  // Callback ref: attach wheel listener when DOM node is available
  const vpCallbackRef = useCallback((node) => {
    if (vpRef.current) {
      vpRef.current.removeEventListener('wheel', vpRef.current._wheelHandler);
    }
    vpRef.current = node;
    if (node) {
      const handler = (e) => {
        e.preventDefault();
        zoom(e.clientX, e.clientY, -e.deltaY * WHEEL_SPEED);
      };
      node._wheelHandler = handler;
      node.addEventListener('wheel', handler, { passive: false });
    }
  }, [zoom]);

  useEffect(() => {
    if (isOpen) {
      const unique = [...new Set(images)];
      const idx = Math.min(startIndex || 0, unique.length - 1);
      setIndex(Math.max(0, idx));
      reset();
    }
  }, [isOpen, startIndex, reset, images]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && uniqueImages.length > 1) { setIndex((i) => (i - 1 + uniqueImages.length) % uniqueImages.length); reset(); }
      if (e.key === 'ArrowRight' && uniqueImages.length > 1) { setIndex((i) => (i + 1) % uniqueImages.length); reset(); }
      if (e.key === '+' || e.key === '=') zoom(window.innerWidth / 2, window.innerHeight / 2, 0.2);
      if (e.key === '-') zoom(window.innerWidth / 2, window.innerHeight / 2, -0.2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, uniqueImages.length, onClose, reset, zoom]);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = { on: true, moved: false, sx: e.clientX, sy: e.clientY, stx: txRef.current, sty: tyRef.current };
    vpRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.on) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    if (scaleRef.current <= 1) return;
    const c = clamp(dragRef.current.stx + dx, dragRef.current.sty + dy, scaleRef.current);
    txRef.current = c.tx;
    tyRef.current = c.ty;
    apply();
  }, [clamp, apply]);

  const onPointerUp = useCallback((e) => {
    dragRef.current.on = false;
    vpRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  const onBackdropClick = useCallback((e) => {
    if (dragRef.current.moved) return;
    if (e.target === vpRef.current) onClose();
  }, [onClose]);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current = {
        d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY),
        s: scaleRef.current,
      };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const nd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.s * (nd / pinchRef.current.d)));
    const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const vp = vpRef.current;
    if (!vp) return;
    const os = scaleRef.current;
    const ix = (mx - vp.clientWidth / 2 - txRef.current) / os;
    const iy = (my - vp.clientHeight / 2 - tyRef.current) / os;
    const c = clamp(mx - vp.clientWidth / 2 - ix * ns, my - vp.clientHeight / 2 - iy * ns, ns);
    scaleRef.current = ns;
    txRef.current = c.tx;
    tyRef.current = c.ty;
    apply();
    rerender((n) => n + 1);
  }, [clamp, apply]);

  if (!isOpen || !images || images.length === 0) return null;

  const total = uniqueImages.length;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95">
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors text-2xl font-light">
        &times;
      </button>

      {total > 1 && (
        <button onClick={() => { setIndex((i) => (i - 1 + total) % total); reset(); }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors text-3xl font-light">
          &lsaquo;
        </button>
      )}
      {total > 1 && (
        <button onClick={() => { setIndex((i) => (i + 1) % total); reset(); }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors text-3xl font-light">
          &rsaquo;
        </button>
      )}

      <div ref={vpCallbackRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none touch-none p-10 sm:p-16"
        style={{ cursor: scaleRef.current > 1 ? 'grab' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onBackdropClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}>
        <img ref={imgRef}
          key={uniqueImages[index]}
          src={uniqueImages[index]}
          className="max-w-full max-h-full origin-center pointer-events-none"
          draggable="false"
          style={{ transform: `translate(${txRef.current}px,${tyRef.current}px) scale(${scaleRef.current})` }}
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 font-mono text-xs text-white/50 uppercase tracking-widest">
        {index + 1} / {total}
      </div>
    </div>
  );
}
