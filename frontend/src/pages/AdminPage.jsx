import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminDashboard from '../components/features/AdminDashboard';
import LoginModal from '../components/modals/LoginModal';
import { Shield, ArrowLeft, ExternalLink, Lock } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const { tab } = useParams();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vidyut_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('vidyut_result');
    return saved ? JSON.parse(saved) : null;
  });

  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(!user);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vidyut_user', JSON.stringify(user));
      setShowLoginModal(false);
    } else {
      localStorage.removeItem('vidyut_user');
      setShowLoginModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('vidyut_result', JSON.stringify(result));
    }
  }, [result]);

  const handleFileUpload = (id, file) => {
    setFiles(prev => ({
      ...prev,
      [id]: file
    }));
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      const sourceFile = files['source'];

      if (!sourceFile) {
        alert("Please upload the source dataset first.");
        setLoading(false);
        return;
      }

      formData.append('files', sourceFile);
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      const resultData = data.status === 'success' ? data.data : data;
      setResult(resultData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Error during analysis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vidyut_user');
    navigate('/');
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090807',
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
            href="/inspector"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#10b981',
              textDecoration: 'none',
              fontSize: '0.85rem',
              padding: '0.5rem 0.9rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px'
            }}
          >
            <ExternalLink size={14} /> Open Inspector Portal
          </a>
        </div>

        <div style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(18, 16, 14, 0.95)',
          border: '1px solid rgba(200, 162, 97, 0.3)',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(200, 162, 97, 0.12)',
            border: '1px solid rgba(200, 162, 97, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            color: '#c8a261'
          }}>
            <Shield size={30} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>
            Admin Authentication
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>
            Access the Vidyut Central Intelligence Dashboard to monitor transformer loads and dispatch audits.
          </p>

          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: '#c8a261',
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
            <Lock size={16} /> Sign In as Administrator
          </button>
        </div>

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
              setShowLoginModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper" style={{ minHeight: '100vh', background: '#090807' }}>
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        files={files}
        loading={loading}
        result={result}
        handleFileUpload={handleFileUpload}
        handleFetch={handleFetch}
        setResult={setResult}
        initialTab={tab}
      />
    </div>
  );
}
