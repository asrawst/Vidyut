import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/layout/Hero';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/modals/LoginModal';
import InspectorLoginModal from '../components/modals/InspectorLoginModal';
import AboutUsModal from '../components/modals/AboutUsModal';
import ResetPasswordModal from '../components/modals/ResetPasswordModal';
import { ExternalLink, Shield, UserCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vidyut_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [inspector, setInspector] = useState(() => {
    const saved = localStorage.getItem('vidyut_inspector');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // Sync state with storage
  useEffect(() => {
    const handleStorage = () => {
      const savedUser = localStorage.getItem('vidyut_user');
      const savedIns = localStorage.getItem('vidyut_inspector');
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setInspector(savedIns ? JSON.parse(savedIns) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleAdminLogout = () => {
    setUser(null);
    localStorage.removeItem('vidyut_user');
  };

  const cardContainerStyle = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    color: '#c8a261',
    fontSize: '0.78rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    background: 'rgba(200, 162, 97, 0.12)',
    border: '1px solid rgba(200, 162, 97, 0.25)'
  };

  const primaryBtnStyle = {
    flex: 1,
    minWidth: '140px',
    padding: '0.7rem 1.4rem',
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.88rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
  };

  const secondaryBtnStyle = {
    padding: '0.7rem 1.1rem',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: '500',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease'
  };

  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleAdminLogout}
        onAboutClick={() => setIsAboutModalOpen(true)}
        onServicesClick={() => setIsServicesModalOpen(true)}
        onInspectorClick={() => setIsInspectorModalOpen(true)}
      />

      <main className="main-content" style={{ padding: '0 2rem' }}>
        <Hero />

        {/* Multi-Portal Command Panels */}
        <section id="portal-section" style={{ maxWidth: '1200px', margin: '0 auto 4.5rem auto', width: '100%', scrollMarginTop: '100px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2rem'
          }}>
            {/* Admin Portal Card */}
            <div 
              style={cardContainerStyle}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(200, 162, 97, 0.4)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(200, 162, 97, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.6)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={badgeStyle}>
                    <Shield size={15} /> Admin Command Center
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                    /admin
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.5rem', color: 'white', fontWeight: '400', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  Grid Oversight & ML Intelligence
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'var(--font-body)' }}>
                  Analyze electricity theft signals, dispatch tasks to inspectors, manage penalties, tariffs, and view live geospatial GIS heatmaps.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (user) {
                      navigate('/admin');
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  style={primaryBtnStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Launch Admin <ArrowRight size={15} />
                </button>
                <a
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={secondaryBtnStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                  title="Open Admin Dashboard in a separate browser tab to run simultaneously with Inspector Portal"
                >
                  <ExternalLink size={14} /> New Tab
                </a>
              </div>
            </div>

            {/* Field Inspector Portal Card */}
            <div 
              style={cardContainerStyle}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(200, 162, 97, 0.4)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(200, 162, 97, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.6)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={badgeStyle}>
                    <UserCheck size={15} /> Field Inspector Workspace
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                    /inspector
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.5rem', color: 'white', fontWeight: '400', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  Onsite Audits & Challan Issuance
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'var(--font-body)' }}>
                  Execute real-time field audits, record bypass photos, capture GPS meter coordinates, and issue digital compounding challans.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (inspector) {
                      navigate('/inspector');
                    } else {
                      setIsInspectorModalOpen(true);
                    }
                  }}
                  style={primaryBtnStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Launch Inspector <ArrowRight size={15} />
                </button>
                <a
                  href="/inspector"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={secondaryBtnStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                  title="Open Field Inspector Portal in a separate browser tab to run simultaneously with Admin"
                >
                  <ExternalLink size={14} /> New Tab
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals */}
      {isAboutModalOpen && (
        <AboutUsModal onClose={() => setIsAboutModalOpen(false)} />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(mockUser) => {
            setUser(mockUser);
            localStorage.setItem('vidyut_user', JSON.stringify(mockUser));
            setIsLoginModalOpen(false);
            navigate('/admin');
          }}
        />
      )}

      {isInspectorModalOpen && (
        <InspectorLoginModal
          onClose={() => setIsInspectorModalOpen(false)}
          onSuccess={(insSession) => {
            setInspector(insSession);
            localStorage.setItem('vidyut_inspector', JSON.stringify(insSession));
            setIsInspectorModalOpen(false);
            navigate('/inspector');
          }}
        />
      )}

      {isResetPasswordModalOpen && (
        <ResetPasswordModal
          onClose={() => setIsResetPasswordModalOpen(false)}
          onSuccess={() => {
            setIsResetPasswordModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
