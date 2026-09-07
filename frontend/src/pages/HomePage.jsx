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
        <section style={{ maxWidth: '1200px', margin: '0 auto 4rem auto', width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Admin Portal Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(200, 162, 97, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(200, 162, 97, 0.25)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c8a261', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Shield size={16} /> Admin Command Center
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'rgba(255,255,255,0.6)' }}>
                    /admin
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: 'white', fontWeight: '500', fontFamily: 'var(--font-heading)' }}>
                  Grid Oversight & ML Intelligence
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  Analyze electricity theft signals, dispatch tasks to inspectors, manage penalties, tariffs, and view live geospatial GIS heatmaps.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (user) {
                      navigate('/admin');
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '0.65rem 1rem',
                    background: '#c8a261',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Launch Admin <ArrowRight size={15} />
                </button>
                <a
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.65rem 0.9rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
                  }}
                  title="Open Admin Dashboard in a separate browser tab to run simultaneously with Inspector Portal"
                >
                  <ExternalLink size={14} /> New Tab
                </a>
              </div>
            </div>

            {/* Field Inspector Portal Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <UserCheck size={16} /> Field Inspector Workspace
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'rgba(255,255,255,0.6)' }}>
                    /inspector
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: 'white', fontWeight: '500', fontFamily: 'var(--font-heading)' }}>
                  Onsite Audits & Challan Issuance
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  Execute real-time field audits, record bypass photos, capture GPS meter coordinates, and issue digital compounding challans.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (inspector) {
                      navigate('/inspector');
                    } else {
                      setIsInspectorModalOpen(true);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    padding: '0.65rem 1rem',
                    background: '#10b981',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Launch Inspector <ArrowRight size={15} />
                </button>
                <a
                  href="/inspector"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.65rem 0.9rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
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
