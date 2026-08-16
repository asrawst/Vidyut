import React from 'react';
import investigatorImg from '../../assets/vidyut_hero_investigator.jpg';

const Hero = () => {
  return (
    <section className="hero" style={{ 
      minHeight: '100vh', 
      justifyContent: 'center', 
      alignItems: 'flex-start', // Left align item block
      textAlign: 'left', // Left align text block
      padding: '2rem 10% 2rem 10%', // Indent from left
      position: 'relative'
    }}>
      <div className="bulb-container" style={{ margin: 0, top: 0, left: 0, transform: 'none', width: '100%', height: '100%' }}>
        <img
          src={investigatorImg}
          alt="Electric power grid transmission towers at sunset"
          className="bulb-image"
          style={{
            opacity: 1.0,
            filter: 'brightness(1.1) contrast(1.05)',
            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)'
          }}
        />
      </div>
      
      <div style={{ maxWidth: '620px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem', zIndex: 10 }}>
        <h1 className="hero-title" style={{ 
          fontFamily: 'var(--font-heading)',
          fontSize: '5rem',
          fontWeight: '400',
          lineHeight: '1.1',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          margin: 0
        }}>
          Grid Integrity<br />
          Made Perfect
        </h1>
        
        <p className="hero-subtitle" style={{ 
          fontFamily: 'var(--font-body)',
          fontSize: '1.15rem',
          color: 'rgba(255, 255, 255, 0.75)', // Brightened sub-text
          fontWeight: '400',
          lineHeight: '1.6',
          margin: '0 0 1rem 0'
        }}>
          Today's top DISCOM agencies and engineering teams trust Vidyut to classify grid theft anomalies and manage revenue loss recovery.
        </p>

        <button
          onClick={() => {
            document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            padding: '0.85rem 2.2rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            background: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            color: '#000000',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.target.style.opacity = '0.9';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Get Started
        </button>
      </div>
    </section>
  );
};

export default Hero;
