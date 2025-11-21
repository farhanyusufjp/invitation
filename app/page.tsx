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

    // Only disable scroll on desktop (width >= 768px)
    const isMobile = window.innerWidth < 768;
    
    if (!isMobile) {
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
    }
  }, []);

  // animate section transitions when sectionIndex changes
  useEffect(() => {
    const el = sectionsRef.current;
    if (!el) return;
    
    // Only use GSAP animation on desktop
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      const y = -sectionIndex * window.innerHeight;
      gsap.to(el, { y, duration: 0.8, ease: 'power2.inOut' });
    }
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
    <div className="min-h-screen bg-linear-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center p-0 overflow-hidden relative">
      {/* sections wrapper: two full-height sections stacked vertically; movement via buttons only */}
      <div ref={sectionsRef} className="w-full relative" style={{height: `${totalSections * 100}vh`}}>
        {/* Section 1 (hero + ticket) */}
        <section className="w-full h-screen flex items-center justify-center px-4 py-8 md:p-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-center">
            {/* Left Section */}
            <div
              ref={leftTextRef}
              className="text-white text-center md:text-right space-y-2 md:space-y-4"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto md:ml-auto md:mr-0 flex items-center justify-center" aria-hidden>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                  <span style={{lineHeight:1}} className="text-xl md:text-2xl">🥰</span>
                </div>
              </div>
              <p className="text-sm md:text-lg font-light leading-relaxed px-4 md:px-0">
                ini aku iseng<br />
               pengen bikin undangan<br /> 
               iseng aja tapi ini mah 🐶🍆
              </p>
            </div>

            {/* Center Ticket */}
            <div ref={ticketRef} onClick={() => setSectionIndex(1)} className="flex justify-center cursor-pointer" style={{transform: 'rotate(-8deg) rotateX(6deg)', transformOrigin: '50% 50%'}}>
              <div style={{perspective: 1400}} className="relative">
                <div ref={ticketInnerRef} style={{transformStyle: 'preserve-3d', width: 'min(220px, 60vw)', height: 'min(520px, 75vh)'}} className="relative bg-[#f5f0e8] rounded-[20px] md:rounded-[28px] shadow-2xl p-4 md:p-6 flex items-center justify-center">
                  {/* Front face */}
                  <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 20}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="text-center space-y-3 md:space-y-6 px-2 md:px-4">
                        <h2 className="text-[#ea4c89] text-xs md:text-sm font-light tracking-widest">pacarnya aku</h2>
                        <div className="text-[#ea4c89] text-lg md:text-2xl font-script italic max-w-32 md:max-w-40 mx-auto leading-tight">nazwa celalu cayang jano uyeah</div>
                        <div className="w-8 h-8 md:w-12 md:h-12 mx-auto" aria-hidden>
                          <span style={{lineHeight:1}} className="text-xl md:text-2xl">🌹</span> 
                        </div>
                      </div>

                      {/* subtle paper texture overlay */}
                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(0,0,0,0.012) 1px, transparent 1px)', backgroundSize: '6px 6px', opacity: 1}} />

                      <div className="absolute inset-4 md:inset-6 border-2 border-[#ea4c89] rounded-2xl md:rounded-[22px] opacity-80" />
                    </div>
                  </div>

                  {/* Back face (invitation message) */}
                  <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', borderRadius: 20}}>
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="text-center space-y-3 md:space-y-6 px-2 md:px-4">
                        <h2 className="text-[#ea4c89] text-xs md:text-sm font-light tracking-widest">invitation</h2>
                        <div className="text-[#ea4c89] text-lg md:text-2xl font-script italic max-w-32 md:max-w-40 mx-auto leading-tight">"nanti kita main ke alamat dibawah ini"</div>
                        <div className="w-8 h-8 md:w-12 md:h-12 mx-auto" aria-hidden>
                          <span style={{lineHeight:1}} className="text-xl md:text-2xl">🌹</span>
                        </div>
                      </div>

                      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(0,0,0,0.012) 1px, transparent 1px)', backgroundSize: '6px 6px', opacity: 1}} />

                      <div className="absolute inset-4 md:inset-6 border-2 border-[#ea4c89] rounded-2xl md:rounded-[22px] opacity-80" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Map + Info panel (matches provided layout) */}
        <section className="w-full h-screen flex items-center justify-center px-4 py-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-stretch h-full">
            {/* Left: Map area (spans 2 columns on md) */}
            <div className="md:col-span-2 relative rounded-xl md:rounded-2xl overflow-hidden shadow-inner bg-[linear-gradient(180deg,#eef2f5,#f7f7fb)] min-h-[300px] md:min-h-0">
              {/* Embed Google Maps using provided link. If iframe blocked, clicking opens the link in a new tab. */}
              <iframe
                title="map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3588.2658922776905!2d106.83184857453311!3d-6.372961662339127!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec093dabf58d%3A0xd3365350a2ebe2f!2sMARGOCITY!5e1!3m2!1sen!2sid!4v1763710280013!5m2!1sen!2sid"
                className="absolute inset-0 w-full h-full border-0"
                style={{minHeight: '300px'}}
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
              <div className="w-full bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden relative" style={{maxWidth: 420}}>
                <div className="p-4 md:p-8">
                  <ul className="text-left pl-0 space-y-3 md:space-y-4 text-gray-700">
                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-map-marker-alt text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">Margo</span>
                    </li>

                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-city text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">belanja</span>
                    </li>

                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-utensils text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">makannya belom tau apaan</span>
                    </li>

                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-tshirt text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">seragam kerja aja kita, namanya juga pulang kerja</span>
                    </li>

                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-calendar text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">Jumat, 21 Nov 2025</span>
                    </li>

                    <li className="flex items-start gap-2 md:gap-3">
                      <div className="w-5 md:w-6 flex items-start justify-center pt-0.5">
                        <i className="fa-solid fa-briefcase text-[#ea4c89] text-sm md:text-base" aria-hidden />
                      </div>
                      <span className="leading-relaxed text-sm md:text-base">setelah pulang kantor</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 (Thank you) */}
        <section className="w-full h-screen flex items-center justify-center px-4 py-8 md:p-8">
          {/* <img src="/thankyou.png" alt="Thank you" className="w-64" /> */}
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <div ref={dinoWrapperRef} onClick={() => spawnParticles(100)} className="w-32 h-32 md:w-40 md:h-40 relative cursor-pointer">
              <img ref={dinoRef} src="/dino.gif" alt="dino" className="w-full h-full object-contain" />
            </div>

            <span ref={clickTextRef} style={{lineHeight:1, opacity: 1}} className="text-lg md:text-xl">click me!</span>
          </div>
        </section>
      </div>
      {/* navigation buttons fixed: up and down - only show on desktop */}
      <div className="hidden md:flex fixed right-3 md:right-6 top-1/2 transform -translate-y-1/2 flex-col gap-2 md:gap-3 z-50">
        {sectionIndex > 0 && (
          <button
            onClick={() => setSectionIndex(Math.max(0, sectionIndex - 1))}
            aria-label="Previous section"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#ea4c89]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 8l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {sectionIndex < totalSections - 1 && (
          <button
            onClick={() => setSectionIndex(Math.min(totalSections - 1, sectionIndex + 1))}
            aria-label="Next section"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#ea4c89]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 16l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
