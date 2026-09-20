import React from 'react';
import { TrendingUp, AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import heroExactBg from '../../assets/hero_exact_bg.jpg';

const Hero = () => {
  return (
    <section 
      className="hero-section"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '6.5rem 5% 3.5rem 6%',
        background: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes radarRipple {
          0% {
            transform: scale(0.6);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.65);
            opacity: 0.35;
          }
          100% {
            transform: scale(2.7);
            opacity: 0;
          }
        }
        @keyframes corePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.85);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 22px rgba(239, 68, 68, 1);
          }
        }
        @keyframes subtleBeaconGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .hero-floating-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-floating-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 22px 40px -6px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03) !important;
        }
        .glass-map-3d {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-map-3d:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 56px -10px rgba(0, 0, 0, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.95) !important;
        }
        @media (max-width: 1200px) {
          .hero-visual-middle {
            right: 22% !important;
          }
        }
        @media (max-width: 1024px) {
          .hero-section {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 5.5rem 5% 3rem 5% !important;
            gap: 3rem;
          }
          .hero-visual-middle {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            transform: none !important;
            width: 100% !important;
            max-width: 440px;
            margin: 0 auto;
          }
          .hero-safer-badge {
            position: relative !important;
            right: auto !important;
            bottom: auto !important;
            margin-top: 1rem;
          }
        }
      `}</style>

      {/* User's Exact High-Fidelity Hero Background Image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}
      >
        <img
          src={heroExactBg}
          alt="Smart grid electricity meter and power transmission lines"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'right center'
          }}
        />
      </div>

      {/* LEFT COLUMN: Hero Typography, Tag & CTA Button */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1.4rem',
          flexShrink: 0
        }}
      >
        {/* Pill Tag */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            background: '#f4f5f7',
            border: '1px solid #e4e4e7',
            fontSize: '0.82rem',
            fontWeight: '600',
            color: '#18181b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
        >
          <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>⚡</span>
          Smart Grid Anti-Theft AI Platform
        </div>

        {/* Hero Headline */}
        <h1 
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3.1rem, 4.6vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: '1.04',
            color: '#09090b',
            letterSpacing: '-0.04em',
            margin: 0
          }}
        >
          Grid Integrity<br />
          Made Perfect
        </h1>

        {/* Subtitle */}
        <p 
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: '#52525b',
            fontWeight: '400',
            lineHeight: '1.6',
            margin: 0,
            maxWidth: '430px'
          }}
        >
          Leading DISCOM utilities and field engineering teams trust Vidyut to classify grid theft anomalies, enforce compliance, and optimize revenue recovery.
        </p>

        {/* CTA Button */}
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={() => {
              document.getElementById('portal-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '0.85rem 2.2rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              background: '#09090b',
              border: '1px solid #09090b',
              borderRadius: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.14)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#27272a';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#09090b';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* CENTER FLOATING CARDS LAYER: Straight, perfectly aligned, no overlap on meter */}
      <div 
        className="hero-visual-middle"
        style={{
          position: 'absolute',
          top: '50%',
          right: '27.5%',
          transform: 'translateY(-48%)',
          zIndex: 10,
          width: '430px',
          height: '480px',
          pointerEvents: 'auto'
        }}
      >
        {/* 1 & 2. TOP ROW METRIC CARDS WITH AMPLE ROOM */}
        <div 
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 12
          }}
        >
          {/* Card 1: Recovered Revenue */}
          <div 
            className="hero-floating-card"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.02)',
              minWidth: '190px',
              boxSizing: 'border-box'
            }}
          >
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0
              }}
            >
              <TrendingUp size={19} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: '500', whiteSpace: 'nowrap' }}>
                Recovered Revenue
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#09090b', letterSpacing: '-0.025em', lineHeight: 1.15, marginTop: '2px' }}>
                ₹ 12.4 Cr
              </div>
              <div style={{ fontSize: '0.70rem', color: '#10b981', fontWeight: '600', marginTop: '3px', whiteSpace: 'nowrap' }}>
                + 28% this quarter
              </div>
            </div>
          </div>

          {/* Card 2: Theft Risk Detected */}
          <div 
            className="hero-floating-card"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.02)',
              minWidth: '195px',
              boxSizing: 'border-box'
            }}
          >
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: '500', whiteSpace: 'nowrap' }}>
                Theft Risk Detected
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#09090b', letterSpacing: '-0.025em', lineHeight: 1.15, marginTop: '2px' }}>
                117
              </div>
              <div style={{ fontSize: '0.70rem', color: '#71717a', fontWeight: '400', marginTop: '3px', whiteSpace: 'nowrap' }}>
                High priority locations
              </div>
            </div>
          </div>
        </div>

        {/* 3. CENTER: STRAIGHT GLASSMORPHIC GIS MAP WITH RICH 3D LAYERED DEPTH */}
        <div 
          className="glass-map-3d"
          style={{
            position: 'absolute',
            top: '95px',
            left: '-15px',
            width: '370px',
            height: '205px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.38) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1.5px solid rgba(255, 255, 255, 0.85)',
            borderRadius: '20px',
            boxShadow: '0 24px 48px -8px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            zIndex: 11
          }}
        >
          {/* Detailed Street Vector Map Grid with 3D Depth Shadows */}
          <svg width="100%" height="100%" viewBox="0 0 370 205" fill="none" style={{ position: 'absolute', inset: 0 }}>
            {/* Road Shadow Layer (Gives 3D Elevation to roads) */}
            <path d="M-20 42 L390 77" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="4" />
            <path d="M-10 147 L390 122" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="3.5" />
            <path d="M72 -20 L127 225" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="3.5" />
            <path d="M207 -10 L187 225" stroke="rgba(0, 0, 0, 0.04)" strokeWidth="4" />

            {/* Primary & Secondary Road Network Lines (Clean Elevated White) */}
            <path d="M-20 40 L390 75" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="2.8" />
            <path d="M-10 145 L390 120" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2.4" />
            <path d="M70 -20 L125 225" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2.4" />
            <path d="M205 -10 L185 225" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="2.8" />
            <path d="M295 -10 L315 225" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="2" />
            
            {/* Fine Sub-Vein Street Filaments */}
            <path d="M0 95 L220 48" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="1.6" />
            <path d="M155 195 L360 152" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="1.6" />
            <path d="M40 180 L180 80" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.4" />
            <path d="M190 20 L270 180" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.4" />
            <path d="M100 60 L160 170" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" />

            {/* 3D Elevated Pin Drop Shadows */}
            <ellipse cx="60" cy="67" rx="5" ry="2.5" fill="rgba(0, 0, 0, 0.18)" />
            <ellipse cx="272" cy="43" rx="5.5" ry="2.8" fill="rgba(0, 0, 0, 0.22)" />
            <ellipse cx="54" cy="160" rx="5" ry="2.5" fill="rgba(0, 0, 0, 0.18)" />
            <ellipse cx="207" cy="155" rx="5" ry="2.5" fill="rgba(0, 0, 0, 0.18)" />
            <ellipse cx="247" cy="100" rx="4.5" ry="2.2" fill="rgba(0, 0, 0, 0.15)" />

            {/* 3D Gradient Nodes with Soft High-Contrast Glow */}
            <circle cx="60" cy="62" r="5" fill="#f97316" filter="drop-shadow(0 2px 4px rgba(249, 115, 22, 0.6))" />
            <circle cx="272" cy="38" r="5.5" fill="#ef4444" filter="drop-shadow(0 2px 5px rgba(239, 68, 68, 0.6))" />
            <circle cx="54" cy="155" r="5" fill="#f97316" filter="drop-shadow(0 2px 4px rgba(249, 115, 22, 0.6))" />
            <circle cx="207" cy="150" r="5" fill="#f97316" filter="drop-shadow(0 2px 4px rgba(249, 115, 22, 0.6))" />
            <circle cx="247" cy="95" r="4.5" fill="#f97316" opacity="0.85" />
          </svg>

          {/* ACTIVE ANIMATING 3D RED POINT WITH MULTI-DEPTH CONCENTRIC RADAR RIPPLES */}
          <div 
            style={{
              position: 'absolute',
              top: '105px',
              left: '150px',
              transform: 'translate(-50%, -50%)',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            {/* Outer Expanding 3D Wave 1 */}
            <div 
              style={{
                position: 'absolute',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.22)',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.3)',
                animation: 'radarRipple 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite'
              }}
            />
            {/* Outer Expanding 3D Wave 2 */}
            <div 
              style={{
                position: 'absolute',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.22)',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.3)',
                animation: 'radarRipple 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite 0.9s'
              }}
            />
            {/* Soft Ambient Beacon Halo */}
            <div 
              style={{
                position: 'absolute',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.3)'
              }}
            />
            {/* Glowing Pulsing 3D Solid Core */}
            <div 
              style={{
                position: 'relative',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #ef4444 60%, #b91c1c 100%)',
                animation: 'corePulse 2s ease-in-out infinite'
              }}
            />
          </div>

          {/* 3D Elevated Floating Tag: High Risk Transformer TR-1123 */}
          <div 
            style={{
              position: 'absolute',
              top: '78px',
              left: '170px',
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              padding: '0.5rem 0.9rem',
              boxShadow: '0 12px 24px -2px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              zIndex: 15
            }}
          >
            <div>
              <div style={{ fontSize: '0.80rem', fontWeight: '800', color: '#09090b', lineHeight: 1.1 }}>
                High Risk
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: '500', marginTop: '1px' }}>
                Transformer TR-1123
              </div>
            </div>
            <ChevronRight size={14} color="#71717a" />
          </div>
        </div>

        {/* 4. BOTTOM-LEFT: Consumption Pattern Graph Card */}
        <div 
          className="hero-floating-card"
          style={{
            position: 'absolute',
            bottom: '0px',
            left: '10px',
            width: '315px',
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: '0 14px 32px -4px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)',
            zIndex: 13
          }}
        >
          {/* Card Header & Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#09090b' }}>
              Consumption Pattern
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.66rem', color: '#71717a' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '9px', height: '1.5px', borderTop: '1.5px dashed #94a3b8', display: 'inline-block' }} />
                Expected
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: '600' }}>
                <span style={{ width: '9px', height: '2px', background: '#ef4444', display: 'inline-block' }} />
                Actual
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div style={{ width: '100%', height: '50px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 270 50" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="theftSpikeGradientV5" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.35)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
                </linearGradient>
              </defs>

              {/* Spike Area Fill */}
              <polygon 
                points="95,36 135,8 150,8 185,36" 
                fill="url(#theftSpikeGradientV5)" 
              />

              {/* Expected Baseline (Dashed Grey Line) */}
              <path 
                d="M 10,33 L 55,32 L 95,33 L 140,32 L 180,33 L 225,32 L 260,33" 
                stroke="#94a3b8" 
                strokeWidth="1.5" 
                strokeDasharray="3 3" 
              />

              {/* Actual Line with Dramatic Spike on Thursday */}
              <path 
                d="M 10,35 C 35,35 50,33 65,34 C 80,35 95,36 112,28 C 122,20 133,8 142,8 C 151,8 160,23 172,32 C 188,35 225,34 260,34" 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
            </svg>
          </div>

          {/* X-Axis Days */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '0.64rem', color: '#94a3b8', fontWeight: '500' }}>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span style={{ color: '#ef4444', fontWeight: '700' }}>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* 5. RIGHT ANCHOR: Safer Grids / Stronger Communities Badge */}
      <div 
        className="hero-safer-badge hero-floating-card"
        style={{
          position: 'absolute',
          bottom: '50px',
          right: '5.5%',
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '14px',
          padding: '0.7rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.09), 0 2px 6px rgba(0, 0, 0, 0.02)',
          zIndex: 14
        }}
      >
        <div 
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}
        >
          <ShieldCheck size={19} strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#09090b', lineHeight: 1.2 }}>
            Safer Grids
          </div>
          <div style={{ fontSize: '0.72rem', color: '#52525b', fontWeight: '500' }}>
            Stronger Communities
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
