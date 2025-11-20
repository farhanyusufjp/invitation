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
      gsap.set(ticketInner, { transformStyle: 'preserve-3d', transformPerspective: 1400 });

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

  // disable native scrolling (wheel/touch/keys) so navigation only via our buttons/click
  useEffect(() => {
    const prevent = (e: Event) => {
      e.preventDefault();
    };

    const preventKey = (e: KeyboardEvent) => {
      // prevent arrow keys, space, page up/down from scrolling
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Spacebar'];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    };

    // hide overflow as a fallback
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    window.addEventListener('wheel', prevent as EventListener, { passive: false });
    window.addEventListener('touchmove', prevent as EventListener, { passive: false });
    window.addEventListener('keydown', preventKey as any, { passive: false });

    return () => {
      html.style.overflow = prevHtmlOverflow || '';
      body.style.overflow = prevBodyOverflow || '';
      window.removeEventListener('wheel', prevent as EventListener);
      window.removeEventListener('touchmove', prevent as EventListener);
      window.removeEventListener('keydown', preventKey as any);
    };
  }, []);

  // animate section transitions when sectionIndex changes
  useEffect(() => {
    const el = sectionsRef.current;
    if (!el) return;
    const y = -sectionIndex * window.innerHeight;
    gsap.to(el, { y, duration: 0.8, ease: 'power2.inOut' });
  }, [sectionIndex]);

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

    const emojis = ['💖', '🌹', '🥰'];

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
    <div className="min-h-screen bg-linear-to-br from-[#ea4c89] to-[#d64279] flex items-center justify-center p-0 overflow-hidden">
      {/* sections wrapper: two full-height sections stacked vertically; movement via buttons only */}
      <div ref={sectionsRef} className="w-full relative" style={{height: `${totalSections * 100}vh`}}>
        {/* Section 1 (hero + ticket) */}
        <section className="w-full h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left Section */}
            <div
              ref={leftTextRef}
              className="text-white text-center md:text-right space-y-4"
            >
              <div className="w-16 h-16 mx-auto md:ml-auto md:mr-0 flex items-center justify-center" aria-hidden>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span style={{lineHeight:1}} className="text-2xl">🥰</span>
                </div>
              </div>
              <p className="text-lg font-light leading-relaxed">
                An invitation for<br />
                my beloved to share<br /> 
                a moment with me.
              </p>
            </div>

            {/* Center Ticket */}
            <div ref={ticketRef} onClick={() => setSectionIndex(1)} className="flex justify-center cursor-pointer" style={{transform: 'rotate(-12deg) rotateX(6deg)', transformOrigin: '50% 50%'}}>
              <div style={{perspective: 1400}} className="relative">
                <div ref={ticketInnerRef} style={{transformStyle: 'preserve-3d', width: 220, height: 520}} className="relative bg-[#f5f0e8] rounded-[28px] shadow-2xl p-6 flex items-center justify-center">
                  {/* Front face */}
                  <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 28}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="text-center space-y-6 px-4">
                        <h2 className="text-[#ea4c89] text-sm font-light tracking-widest">Dear sweetheart 💖</h2>
                        <div className="text-[#ea4c89] text-2xl font-script italic max-w-40 mx-auto">Syafiera Muraqbah Ahdiatuzzati</div>
                        <div className="w-12 h-12 mx-auto" aria-hidden>
                          <span style={{lineHeight:1}} className="text-2xl">🌹</span> 
                        </div>
                      </div>

                      {/* subtle paper texture overlay */}
                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(0,0,0,0.012) 1px, transparent 1px)', backgroundSize: '6px 6px', opacity: 1}} />

                      <div className="absolute inset-6 border-2 border-[#ea4c89] rounded-[22px] opacity-80" />
                    </div>
                  </div>

                  {/* Back face (invitation message) */}
                  <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', borderRadius: 28}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="text-center space-y-6 px-4">
                        <h2 className="text-[#ea4c89] text-sm font-light tracking-widest">invitation</h2>
                        <div className="text-[#ea4c89] text-2xl font-script italic max-w-40 mx-auto">"I want to invite my partner somewhere."</div>
                        <div className="w-12 h-12 mx-auto" aria-hidden>
                          <span style={{lineHeight:1}} className="text-2xl">🌹</span>
                        </div>
                      </div>

                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(0,0,0,0.012) 1px, transparent 1px)', backgroundSize: '6px 6px', opacity: 1}} />

                      <div className="absolute inset-6 border-2 border-[#ea4c89] rounded-[22px] opacity-80" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Map + Info panel (matches provided layout) */}
        <section className="w-full h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch h-full">
            {/* Left: Map area (spans 2 columns on md) */}
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden shadow-inner bg-[linear-gradient(180deg,#eef2f5,#f7f7fb)]">
              {/* Embed Google Maps using provided link. If iframe blocked, clicking opens the link in a new tab. */}
              <iframe
                title="map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50361.27323837043!2d106.93910621138605!3d-6.302867752584137!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f348293e1ad3%3A0xeb360c2c015ef668!2sNustro%20-%20Tebet%20Skyline!5e0!3m2!1sid!2sid!4v1763630109181!5m2!1sid!2sid"
                className="absolute inset-0 w-full h-full border-0"
                style={{minHeight: '100%'}}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* search bar removed as requested */}

              {/* left floating menu removed per request */}

              {/* decorative markers removed per request */}

              {/* bottom toolbar removed per request */}
            </div>

            {/* Right: Info card replaced with user-specified list */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden relative" style={{maxWidth: 420}}>
                <div className="p-8">
                  <ul className="text-left pl-0 space-y-4 text-gray-700">
                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-map-marker-alt text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">Nustro, Tebet</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-city text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">city light</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-utensils text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">Makanan inysaAllah ada banyak (mayoritas daging)</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-tshirt text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">Nanti aku akan berpakaian warna coklat (maaf yang tersedia ini di lemari aku maaf ga prepare)</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-calendar text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">Jumat, 21 Nov 2025</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-6 flex items-start justify-center">
                        <i className="fa-solid fa-briefcase text-[#ea4c89]" aria-hidden />
                      </div>
                      <span className="leading-relaxed">setelah pulang kantor</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 (Thank you) */}
        <section className="w-full h-screen flex items-center justify-center p-8">
          {/* <img src="/thankyou.png" alt="Thank you" className="w-64" /> */}
          <div className="flex flex-col items-center gap-3">
            <div ref={dinoWrapperRef} onClick={() => spawnParticles(100)} className="w-40 h-40 relative cursor-pointer">
              <img ref={dinoRef} src="/dino.gif" alt="dino" className="w-full h-full object-contain" />
            </div>

            <span ref={clickTextRef} style={{lineHeight:1, opacity: 1}} className="text-xl">click me!</span>
          </div>
        </section>
      </div>
      {/* navigation buttons fixed: up and down - show only on sections 2 and 3 */}
      {(sectionIndex === 1 || sectionIndex === 2) && (
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
          <button
            onClick={() => setSectionIndex(Math.max(0, sectionIndex - 1))}
            aria-label="Previous section"
            className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#ea4c89]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 8l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setSectionIndex(Math.min(totalSections - 1, sectionIndex + 1))}
            aria-label="Next section"
            className="w-12 h-12 rounded-full bg-white/90 shadow flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-[#ea4c89]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 16l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
