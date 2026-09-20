import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import InspectorPortal from '../components/features/InspectorPortal';
import InspectorLoginModal from '../components/modals/InspectorLoginModal';
import { UserCheck, ArrowLeft, Lock } from 'lucide-react';

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
        background: '#fafafa',
        color: '#000000',
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
              color: '#666666',
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.5rem 0.9rem',
              background: '#ffffff',
              border: '1px solid #eaeaea',
              borderRadius: '8px'
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid #eaeaea',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#f4f4f5',
            border: '1px solid #eaeaea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            color: '#000000'
          }}>
            <UserCheck size={28} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0', color: '#000000' }}>
            Field Inspector Portal
          </h2>
          <p style={{ color: '#666666', fontSize: '0.9rem', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
            Sign in to execute assigned onsite audits, submit bypass evidence photos, and issue digital compounding challans.
          </p>

          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
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
    <div className="inspector-page-wrapper" style={{ minHeight: '100vh', background: '#fafafa' }}>
      <InspectorPortal
        inspector={inspector}
        onLogout={handleLogout}
        initialTab={tab}
      />
    </div>
  );
}
