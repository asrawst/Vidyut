import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AdminDashboard from '../components/features/AdminDashboard';
import LoginModal from '../components/modals/LoginModal';
import { Shield, ArrowLeft, Lock } from 'lucide-react';
import { warmBackend } from '../utils/backendWarmer';
import { analyzeDatasetClientSide } from '../utils/clientMlEngine';

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
    } else {
      localStorage.removeItem('vidyut_result');
    }
  }, [result]);

  const handleFileUpload = (id, file) => {
    setFiles(prev => ({
      ...prev,
      [id]: file
    }));
    // Proactively pre-warm Render instance as soon as the user selects a file
    warmBackend();
  };

  const handleFetch = async () => {
    try {
      setLoading(true);
      const sourceFile = files['source'];

      if (!sourceFile) {
        alert("Please upload the source dataset first.");
        setLoading(false);
        return;
      }

      // 1. Prepare parallel client analysis promise (< 150ms execution)
      const clientAnalysisPromise = analyzeDatasetClientSide(sourceFile).catch(err => {
        console.warn("Client analysis error:", err);
        return null;
      });

      // 2. Prepare backend request with 2.5s maximum timeout
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');
      const formData = new FormData();
      formData.append('files', sourceFile);

      const fetchBackendWithTimeout = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response && response.ok) {
            const data = await response.json();
            return data.status === 'success' ? data.data : data;
          }
          return null;
        } catch (e) {
          return null;
        }
      };

      // 3. Minimum buffer animation delay (1.2s) for premium user feedback
      const minAnimationPromise = new Promise(r => setTimeout(r, 1200));

      // 4. Concurrently run backend fetch and client-side analysis
      const [backendData, clientData] = await Promise.all([
        fetchBackendWithTimeout(),
        clientAnalysisPromise,
        minAnimationPromise
      ]);

      const finalResult = backendData || clientData;

      if (!finalResult) {
        throw new Error("Unable to parse dataset. Please check that the uploaded file is a valid CSV.");
      }

      setResult(finalResult);
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
            <Shield size={28} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0', color: '#000000' }}>
            Admin Authentication
          </h2>
          <p style={{ color: '#666666', fontSize: '0.9rem', margin: '0 0 2rem 0', lineHeight: '1.5' }}>
            Access the Vidyut Central Intelligence Dashboard to monitor transformer loads and dispatch audits.
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
    <div className="admin-page-wrapper" style={{ minHeight: '100vh', background: '#fafafa' }}>
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
