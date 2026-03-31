'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Home() {
  const leftTextRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const ticketInnerRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const dinoRef = useRef<HTMLImageElement>(null);
  const dinoWrapperRef = useRef<HTMLDivElement>(null);
  const clickTextRef = useRef<HTMLSpanElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const totalSections = 3;

  useEffect(() => {
    const tl = gsap.timeline();

    tl.from(leftTextRef.current, {
      x: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    })
      .from(
        ticketRef.current,
        {
          scale: 0.8,
          rotation: 30,
          opacity: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)',
        },
        '-=0.5'
      )
      .from(
        rightTextRef.current,
        {
          x: 100,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        },
        '-=0.8'
      );

    // Flip (horizontal) + bob for the ticket using a two-sided card
    const ticket = ticketRef.current;
    const ticketInner = ticketInnerRef.current;
    let flip: any = null;
    let bob: any = null;

    let onEnter: (() => void) | null = null;
    let onLeave: (() => void) | null = null;

    if (ticket && ticketInner) {
      // ensure 3D preserved
      gsap.set(ticketInner, { transformStyle: 'preserve-3d', transformPerspective: 1400, webkitTransformStyle: 'preserve-3d' });

      // horizontal flip: rotateY between 0 and 180 (yoyo) - slower for a calmer effect
      flip = gsap.to(ticketInner, {
        rotationY: 180,
        duration: 5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        transformOrigin: '50% 50%'
      });

      // gentle up-down bob applied to outer wrapper (slower)
      bob = gsap.to(ticket, {
        y: -8,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });

      // Hover: scale slightly, tilt forward (rotateX) and pause flip for clarity
      onEnter = () => {
        gsap.to(ticket, { scale: 1.06, duration: 0.25, ease: 'power2.out' });
        if (flip) flip.pause();
        gsap.to(ticketInner, { rotationX: -8, duration: 0.25, ease: 'power2.out' });
      };

      onLeave = () => {
        gsap.to(ticket, { scale: 1, duration: 0.3, ease: 'power2.out' });
        if (flip) flip.resume();
        gsap.to(ticketInner, { rotationX: 0, duration: 0.3, ease: 'power2.out' });
      };

      ticket.addEventListener('mouseenter', onEnter);
      ticket.addEventListener('mouseleave', onLeave);
      // ticket click handled via JSX onClick; avoid duplicate listeners here
    }

    return () => {
      tl.kill();
      if (flip) flip.kill();
      if (bob) bob.kill();
      if (ticket) {
        if (onEnter) ticket.removeEventListener('mouseenter', onEnter);
        if (onLeave) ticket.removeEventListener('mouseleave', onLeave);
      }
    };
  }, []);

  // lock scroll on all devices
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const preventKey = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown',' ','Spacebar'].includes(e.key)) e.preventDefault();
    };
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.addEventListener('wheel', prevent as EventListener, { passive: false });
    window.addEventListener('keydown', preventKey as any, { passive: false });
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      window.removeEventListener('wheel', prevent as EventListener);
      window.removeEventListener('keydown', preventKey as any);
    };
  }, []);

  // animate section transitions on all devices
  useEffect(() => {
    const el = sectionsRef.current;
    if (!el) return;
    const y = -sectionIndex * window.innerHeight;
    gsap.to(el, { y, duration: 0.7, ease: 'power2.inOut' });
  }, [sectionIndex]);

  // swipe gesture for mobile
  useEffect(() => {
    let startY = 0;
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    const onEnd = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      const dx = Math.abs(startX - e.changedTouches[0].clientX);
      if (Math.abs(dy) > 50 && Math.abs(dy) > dx) {
        setSectionIndex(prev =>
          dy > 0 ? Math.min(totalSections - 1, prev + 1) : Math.max(0, prev - 1)
        );
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  // Ensure the dino GIF keeps replaying by resetting its src periodically.
  useEffect(() => {
    const img = dinoRef.current;
    if (!img) return;

    const base = '/dino.gif';
    // kick off immediately with a cache-busting query so it starts fresh
    img.src = `${base}?t=${Date.now()}`;

    const interval = setInterval(() => {
      if (dinoRef.current) {
        dinoRef.current.src = `${base}?t=${Date.now()}`;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Spawn emoji particles from the dino's center when clicked
  const spawnParticles = (count = 100) => {
    const wrapper = dinoWrapperRef.current;
    if (!wrapper) return;

    const emojis = ['💖', '🌹', '🥰','💩',];

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'absolute text-xl select-none pointer-events-none';
      span.style.left = '50%';
      span.style.top = '50%';
      span.style.transform = 'translate(-50%, -50%)';
      span.style.willChange = 'transform, opacity';
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      wrapper.appendChild(span);

      // random direction and distance
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 140; // px
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - (20 * Math.random());
      const rot = (Math.random() - 0.5) * 720;
      const dur = 0.9 + Math.random() * 0.9;

      gsap.to(span, {
        x,
        y,
        rotation: rot,
        opacity: 50,
        scale: 0.7 + Math.random() * 0.6,
        duration: dur,
        ease: 'power3.out',
        onComplete: () => {
          if (span && span.parentNode) span.parentNode.removeChild(span);
        },
      });
    }

    // Fade out the 'click me' text over 3 seconds
    const textEl = clickTextRef.current;
    if (textEl) {
      // ensure visible then fade
      textEl.style.opacity = '1';
      gsap.to(textEl, { opacity: 0, duration: 1, ease: 'power1.out' });
    }
  };

  return (
    <div className="h-screen overflow-hidden relative" style={{background: '#0c0818'}}>

      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute rounded-full" style={{top: '-12rem', left: '-12rem', width: '44rem', height: '44rem', background: 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 70%)'}} />
        <div className="absolute rounded-full" style={{top: '28%', right: '-10rem', width: '38rem', height: '38rem', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)'}} />
        <div className="absolute rounded-full" style={{bottom: '-10rem', left: '28%', width: '38rem', height: '38rem', background: 'radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 70%)'}} />
      </div>

      {/* ── Sections wrapper ── */}
      <div ref={sectionsRef} className="absolute inset-x-0 top-0 w-full z-10" style={{height: `${totalSections * 100}vh`}}>

        {/* ── Section 1: Hero + Ticket ── */}
        <section className="w-full h-screen flex items-center justify-center px-5 py-6 md:p-12">
          <div className="w-full max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-10 items-center">

            {/* Top text (mobile) / Left text (desktop) */}
            <div ref={leftTextRef} className="text-center md:text-right space-y-2 md:space-y-6">
              <div
                className="inline-flex items-center gap-2 text-pink-300 text-xs font-medium tracking-widest uppercase"
                style={{padding: '6px 14px', borderRadius: 9999, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.28)'}}
              >
                <span>💌</span> Surat Undangan Resmi
              </div>
              <p className="text-white/55 text-xs md:text-base font-light leading-relaxed">
                Dengan segala hormat<br />
                dan keberanian yang dikumpulkan berminggu-minggu,<br />
                Sekar dengan ini resmi diundang. 🌹
              </p>
            </div>

            {/* Center Ticket */}
            <div
              ref={ticketRef}
              onClick={() => setSectionIndex(1)}
              className="flex justify-center cursor-pointer"
              style={{transform: 'rotate(-6deg) rotateX(8deg)', transformOrigin: '50% 50%'}}
            >
              <div style={{perspective: 1400, WebkitPerspective: 1400}}>
                <div
                  ref={ticketInnerRef}
                  style={{
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                    width: 'min(200px, 52vw)',
                    height: 'min(460px, 56vh)',
                    borderRadius: 24,
                    boxShadow: '0 32px 80px -8px rgba(236,72,153,0.45), 0 12px 32px -4px rgba(0,0,0,0.6)',
                  }}
                  className="relative"
                >
                  {/* Front face */}
                  <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 24, background: 'linear-gradient(160deg, #fffaf8 0%, #fff0ee 100%)'}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" style={{borderRadius: 24}}>
                      <div className="absolute top-0 inset-x-0 h-1.5" style={{borderRadius: '24px 24px 0 0', background: 'linear-gradient(90deg, #f9a8d4, #ec4899, #f9a8d4)'}} />
                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(236,72,153,0.07) 1px, transparent 1px)', backgroundSize: '8px 8px'}} />
                      <div className="text-center space-y-3 md:space-y-4 px-5 py-4 relative z-10">
                        <p className="text-pink-400/80 font-medium uppercase" style={{fontSize: 10, letterSpacing: '0.25em'}}>Kepada Yth.</p>
                        <div className="mx-auto h-px" style={{width: 32, background: 'linear-gradient(90deg, transparent, #f9a8d4, transparent)'}} />
                        <div className="text-[#db2777] font-bold italic leading-snug" style={{fontSize: 'clamp(16px, 4vw, 22px)'}}>Sekar</div>
                        <p className="text-rose-400/80 text-sm italic leading-relaxed">Diharap berkenan hadir. Penolakan akan diterima dengan lapang dada (bohong). 🥲</p>
                        <div className="text-2xl py-1">🌹</div>
                        <div className="mx-auto h-px" style={{width: 32, background: 'linear-gradient(90deg, transparent, #f9a8d4, transparent)'}} />
                        <p className="text-pink-300/55 uppercase" style={{fontSize: 9, letterSpacing: '0.3em'}}>Ketuk untuk Membuka</p>
                      </div>
                      {/* Corner brackets */}
                      <div className="absolute top-5 left-5 w-5 h-5 border-t-2 border-l-2 border-pink-300/50" />
                      <div className="absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 border-pink-300/50" />
                      <div className="absolute bottom-5 left-5 w-5 h-5 border-b-2 border-l-2 border-pink-300/50" />
                      <div className="absolute bottom-5 right-5 w-5 h-5 border-b-2 border-r-2 border-pink-300/50" />
                    </div>
                  </div>

                  {/* Back face */}
                  <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', WebkitTransform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 24, background: 'linear-gradient(160deg, #fff5f8 0%, #ffeff7 100%)'}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" style={{borderRadius: 24}}>
                      <div className="absolute top-0 inset-x-0 h-1.5" style={{borderRadius: '24px 24px 0 0', background: 'linear-gradient(90deg, #fda4af, #f43f5e, #fda4af)'}} />
                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(244,63,94,0.07) 1px, transparent 1px)', backgroundSize: '8px 8px'}} />
                      <div className="text-center space-y-3 md:space-y-4 px-5 py-4 relative z-10">
                        <p className="text-rose-400/80 font-medium uppercase" style={{fontSize: 10, letterSpacing: '0.25em'}}>UNDANGAN RESMI</p>
                        <div className="mx-auto h-px" style={{width: 32, background: 'linear-gradient(90deg, transparent, #fda4af, transparent)'}} />
                        <p className="text-[#be185d] text-base italic leading-relaxed">"Dengan hormat, mari kita nikmati secangkir kopi bersama. Kehadiran Anda tidak dapat diganggu gugat."</p>
                        <div className="text-2xl py-1">☕</div>
                        <div className="mx-auto h-px" style={{width: 32, background: 'linear-gradient(90deg, transparent, #fda4af, transparent)'}} />
                        <p className="text-rose-300/55 uppercase" style={{fontSize: 9, letterSpacing: '0.3em'}}>Ttd. Orang Yang Deg-degan ☕</p>
                      </div>
                      <div className="absolute top-5 left-5 w-5 h-5 border-t-2 border-l-2 border-rose-300/50" />
                      <div className="absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 border-rose-300/50" />
                      <div className="absolute bottom-5 left-5 w-5 h-5 border-b-2 border-l-2 border-rose-300/50" />
                      <div className="absolute bottom-5 right-5 w-5 h-5 border-b-2 border-r-2 border-rose-300/50" />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right decorative */}
            <div ref={rightTextRef} className="hidden md:flex flex-col items-start gap-4">
              <p className="text-white/35 text-sm font-light leading-relaxed italic">"sentuh kartunya<br/>untuk selengkapnya"</p>
              <div className="flex flex-col gap-1">
                <span className="text-xl">🌹</span>
                <span className="text-xl opacity-50">🌹</span>
                <span className="text-xl opacity-25">🌹</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Section 2: Map + Info ── */}
        <section className="w-full h-screen flex items-center justify-center px-4 py-4 md:p-10 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6 h-full pt-4 pb-16 md:py-6">

            {/* Map — fixed short height on mobile, flex-1 on desktop */}
            <div
              className="md:col-span-2 relative rounded-2xl overflow-hidden flex-shrink-0"
              style={{height: 'clamp(180px, 38vh, 400px)', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.55)', outline: '1px solid rgba(255,255,255,0.07)'}}
            >
              <iframe
                title="map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14355.377290411883!2d106.79851412773132!3d-6.289726284520299!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f10010ac28bb%3A0xc2da01728ee3a8f5!2sStarbucks%20Ampera%20Raya%20Jakarta!5e1!3m2!1sen!2sid!4v1774925726213!5m2!1sen!2sid"
                className="absolute inset-0 w-full h-full border-0"
                style={{minHeight: '280px'}}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Info card */}
            <div className="md:col-span-1 flex items-start md:items-center justify-center flex-1 min-h-0">
              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{
                  maxWidth: 420,
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 60px -10px rgba(0,0,0,0.4)',
                }}
              >
                <div className="px-4 py-2.5" style={{background: 'linear-gradient(135deg, rgba(236,72,153,0.65), rgba(251,113,133,0.65))'}}>
                  <h3 className="text-white font-semibold text-xs md:text-sm tracking-wide">☕ Detail Pertemuan</h3>
                </div>
                <div className="px-4 py-3 md:p-6">
                  <ul className="text-left space-y-2 md:space-y-4">
                    {([
                      {icon: 'fa-mug-hot', text: 'Starbucks Ampera Raya Jakarta'},
                      {icon: 'fa-map-marker-alt', text: 'Jl. Ampera Raya No.4, RT.4/RW.4, East Cilandak, Pasar Minggu, South Jakarta City, Jakarta'},
                      {icon: 'fa-mug-hot', text: 'Agenda: Ngopi, ngemil nyantai, ngonrolin apa aja bebass'},
                      {icon: 'fa-shirt', text: 'Dress code: bebas rapi '},
                      {icon: 'fa-calendar', text: 'Rabu, 01 Apr 2026'},
                      {icon: 'fa-clock', text: 'Setelah jam kantor resmi berakhir'},
                    ] as {icon: string; text: string}[]).map(({icon, text}, i) => (
                      <li key={i} className="flex items-start gap-2 md:gap-3">
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{width: 22, height: 22, borderRadius: 9999, background: 'rgba(236,72,153,0.18)', marginTop: 1}}
                        >
                          <i className={`fa-solid ${icon} text-pink-400`} style={{fontSize: 9}} aria-hidden />
                        </div>
                        <span className="text-white/75 leading-relaxed text-xs md:text-sm">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Section 3: Dino click ── */}
        <section className="w-full h-screen flex items-center justify-center px-4 py-8 md:p-8">
          <div className="flex flex-col items-center gap-5 md:gap-7">
            <div className="relative flex items-center justify-center">
              {/* outer glow */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{inset: '-3rem', background: 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 65%)'}}
              />
              {/* ring */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 'min(168px, 46vw)',
                  height: 'min(168px, 46vw)',
                  borderRadius: 9999,
                  border: '1px solid rgba(236,72,153,0.28)',
                  boxShadow: '0 0 0 8px rgba(236,72,153,0.06)',
                }}
              >
                <div
                  ref={dinoWrapperRef}
                  onClick={() => spawnParticles(100)}
                  className="relative cursor-pointer"
                  style={{width: '80%', height: '80%'}}
                >
                  <img ref={dinoRef} src="/dino.gif" alt="dino" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            <span ref={clickTextRef} style={{lineHeight: 1, opacity: 1}} className="text-white/50 text-base md:text-lg font-light tracking-widest">
              klik sini dong~ ✨
            </span>
          </div>
        </section>

      </div>

      {/* ── Desktop: dot indicators + up/down buttons ── */}
      <div className="hidden md:flex fixed right-6 md:right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-50 items-center">
        {/* section dots */}
        <div className="flex flex-col gap-2 items-center mb-1">
          {Array.from({length: totalSections}).map((_, i) => (
            <button
              key={i}
              onClick={() => setSectionIndex(i)}
              aria-label={`Go to section ${i + 1}`}
              style={{
                width: 6,
                height: i === sectionIndex ? 24 : 6,
                borderRadius: 9999,
                background: i === sectionIndex ? '#f472b6' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {sectionIndex > 0 && (
          <button
            onClick={() => setSectionIndex(Math.max(0, sectionIndex - 1))}
            aria-label="Previous section"
            style={{
              width: 40, height: 40, borderRadius: 9999,
              background: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 8l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {sectionIndex < totalSections - 1 && (
          <button
            onClick={() => setSectionIndex(Math.min(totalSections - 1, sectionIndex + 1))}
            aria-label="Next section"
            style={{
              width: 40, height: 40, borderRadius: 9999,
              background: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 16l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Mobile: bottom dot navigation ── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 items-center">
        {Array.from({length: totalSections}).map((_, i) => (
          <button
            key={i}
            onClick={() => setSectionIndex(i)}
            aria-label={`Go to section ${i + 1}`}
            style={{
              height: 6,
              width: i === sectionIndex ? 24 : 6,
              borderRadius: 9999,
              background: i === sectionIndex ? '#f472b6' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>


    </div>
  );
}
