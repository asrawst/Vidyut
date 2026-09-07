import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import InspectorPortal from '../components/features/InspectorPortal';
import InspectorLoginModal from '../components/modals/InspectorLoginModal';
import { UserCheck, ArrowLeft, ExternalLink, Lock } from 'lucide-react';

export default function InspectorPage() {
  const navigate = useNavigate();
  const { tab } = useParams();

  const [inspector, setInspector] = useState(() => {
    const saved = localStorage.getItem('vidyut_inspector');
    return saved ? JSON.parse(saved) : null;
  });

  const [showLoginModal, setShowLoginModal] = useState(!inspector);

  useEffect(() => {
    if (inspector) {
      localStorage.setItem('vidyut_inspector', JSON.stringify(inspector));
      setShowLoginModal(false);
    } else {
      localStorage.removeItem('vidyut_inspector');
      setShowLoginModal(true);
    }
  }, [inspector]);

  const handleLogout = () => {
    setInspector(null);
    localStorage.removeItem('vidyut_inspector');
    navigate('/');
  };

  if (!inspector) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0d14',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.5rem 0.9rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#c8a261',
              textDecoration: 'none',
              fontSize: '0.85rem',
              padding: '0.5rem 0.9rem',
              background: 'rgba(200, 162, 97, 0.08)',
              border: '1px solid rgba(200, 162, 97, 0.2)',
              borderRadius: '8px'
            }}
          >
            <ExternalLink size={14} /> Open Admin Portal
          </a>
        </div>

        <div style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            color: '#10b981'
          }}>
            <UserCheck size={30} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
            Field Inspector Portal
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>
            Sign in to execute assigned onsite audits, submit bypass evidence photos, and issue digital compounding challans.
          </p>

          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Lock size={16} /> Sign In as Field Inspector
          </button>
        </div>

        {showLoginModal && (
          <InspectorLoginModal
            onClose={() => setShowLoginModal(false)}
            onSuccess={(insData) => {
              setInspector(insData);
              setShowLoginModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="inspector-page-wrapper" style={{ minHeight: '100vh', background: '#0a0d14' }}>
      <InspectorPortal
        inspector={inspector}
        onLogout={handleLogout}
        initialTab={tab}
      />
    </div>
  );
}
