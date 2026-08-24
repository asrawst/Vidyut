import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';
import Footer from './components/layout/Footer';
import UploadBlock from './components/features/UploadBlock';
import FetchButton from './components/common/FetchButton';
import LoginModal from './components/modals/LoginModal';
import AboutUsModal from './components/modals/AboutUsModal';
import ResetPasswordModal from './components/modals/ResetPasswordModal';
import AdminDashboard from './components/features/AdminDashboard';
import InspectorPortal from './components/features/InspectorPortal';
import { createClient } from '@supabase/supabase-js';
import { Sliders, CheckCircle, Smartphone, AlertCircle, X, ShieldAlert, Award } from 'lucide-react';
import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const dataset = {
  id: 'source',
  title: 'Upload Source Dataset',
  description: 'File format: .csv',
  icon: 'meter',
  details: {
    text: 'Upload the complete dataset containing consumer consumption, transformer mapping, and other required signals.',
    columns: ['consumer_id', 'energy_consumed', 'transformer_id']
  }
};

function App() {
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem('vidyut_result');
    return saved ? JSON.parse(saved) : null;
  });
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [insEmail, setInsEmail] = useState('');
  const [insPassword, setInsPassword] = useState('');
  const [insLoginLoading, setInsLoginLoading] = useState(false);
  const [insLoginError, setInsLoginError] = useState('');

  // Clean up any stale theme tokens
  useEffect(() => {
    localStorage.removeItem('vidyut_theme');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Handle Supabase password reset / recovery redirects
  useEffect(() => {
    // 1. Check URL hash / search params on initial load
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setIsResetPasswordModalOpen(true);
    }

    // 2. Listen to Supabase PASSWORD_RECOVERY auth state change event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordModalOpen(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Persist authentication and results in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('vidyut_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vidyut_user');
    }
  }, [user]);

  useEffect(() => {
    if (inspector) {
      localStorage.setItem('vidyut_inspector', JSON.stringify(inspector));
    } else {
      localStorage.removeItem('vidyut_inspector');
    }
  }, [inspector]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('vidyut_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('vidyut_result');
    }
  }, [result]);

  /**
   * Handles file uploads.
   */
  const handleFileUpload = (id, file) => {
    setFiles(prev => ({
      ...prev,
      [id]: file
    }));
    setResult(null); // Clear previous results on new upload
  };

  /**
   * Sends the uploaded files to the backend for analysis.
   */
  const handleFetch = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      setResult(null);
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
      console.log('Analysis Result:', data);

      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setResult(data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Error during analysis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFiles({});
    setResult(null);
  };

  return (
    <div className="container" style={{ maxWidth: '100%', padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Conditionally Render Navbar only for logged out view. Logged-in views use their respective sidebars */}
      {!user && !inspector && (
        <Navbar
          user={user}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogoutClick={handleLogout}
          onAboutClick={() => setIsAboutModalOpen(true)}
          onServicesClick={() => setIsServicesModalOpen(true)}
          onInspectorClick={() => setIsInspectorModalOpen(true)}
        />
      )}

      {/* Main Layout Toggling */}
      {inspector ? (
        <InspectorPortal
          inspector={inspector}
          onLogout={() => setInspector(null)}
        />
      ) : user ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          files={files}
          loading={loading}
          result={result}
          handleFileUpload={handleFileUpload}
          handleFetch={handleFetch}
          setResult={setResult}
        />
      ) : (
        // Landing Page View
        <>
          <main className="main-content" style={{ padding: '0 2rem' }}>
            <Hero />

            <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              <h2 id="upload-section" className="section-title">Upload Dataset</h2>
              
              <div className="upload-grid" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                {/* Click capture to intercept clicks and prompt login if not authorized */}
                <div 
                  onClickCapture={(e) => {
                    if (!user) {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsLoginModalOpen(true);
                    }
                  }}
                  style={{ width: '100%', maxWidth: '350px' }}
                >
                  <UploadBlock
                    title={dataset.title}
                    description={dataset.description}
                    icon={dataset.icon}
                    details={dataset.details}
                    onFileUpload={(file) => handleFileUpload(dataset.id, file)}
                    sampleData={{
                      url: '/sample_data/sample_dataset.csv',
                      name: 'Sample_Dataset.csv'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
                <FetchButton 
                  onClick={handleFetch} 
                  disabled={loading} 
                  isAnalyzed={!!result} 
                />
              </div>
            </section>
          </main>
          
          <Footer onAboutClick={() => setIsAboutModalOpen(true)} />
        </>
      )}

      {/* Services Modal Placeholder */}
      {isServicesModalOpen && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 7, 15, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'rgba(18, 16, 14, 0.85)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)', borderRadius: '16px',
                padding: '2.5rem', width: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative', animation: 'fade-in 0.3s ease-out'
            }}>
                <button 
                    onClick={() => setIsServicesModalOpen(false)}
                    style={{ 
                        position: 'absolute', top: '1.5rem', right: '1.5rem', 
                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; }}
                >
                    <X size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Sliders style={{ color: 'var(--accent-blue)' }} size={22} />
                    <h3 style={{ margin: 0, fontSize: '1.6rem', color: 'white', fontWeight: '400', fontFamily: 'var(--font-heading)' }}>Vidyut Services</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                        <CheckCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: 'white', fontSize: '0.95rem' }}>ML Anomaly Classifier</strong>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Processes transformer-consumer consumption logs and detects grid bypass anomalies.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                        <CheckCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: 'white', fontSize: '0.95rem' }}>GPS Location Mapping</strong>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Pins transformer locations and matches geocoded load fluctuations dynamically.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                        <CheckCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: 'white', fontSize: '0.95rem' }}>Loss Recovery Audit Logs</strong>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Calculates Estimated T&D losses and schedules onsite inspections to recover revenue.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Inspector Login Modal */}
      {isInspectorModalOpen && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 7, 15, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)', borderRadius: '16px',
                padding: '2.5rem', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative', animation: 'fade-in 0.3s ease-out'
            }}>
                <button 
                    onClick={() => {
                      setIsInspectorModalOpen(false);
                      setInsEmail('');
                      setInsPassword('');
                    }}
                    style={{ 
                        position: 'absolute', top: '1.5rem', right: '1.5rem', 
                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; }}
                >
                    <X size={18} />
                </button>
                
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: '400', color: 'white', letterSpacing: '-0.02em' }}>
                        Inspector Login
                    </h2>
                    <p style={{ margin: '0.35rem 0 0 0', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Sign in to access your assigned field inspections
                    </p>
                </div>

                {/* Form */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setInsLoginError('');
                    setInsLoginLoading(true);
                    try {
                      // Step 1: Authenticate with Supabase
                      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email: insEmail,
                        password: insPassword
                      });

                      if (authError) {
                        setInsLoginError('Invalid email or password.');
                        return;
                      }

                      // Step 2: Verify this user exists in the inspectors table
                      const { data: inspectorRow, error: dbError } = await supabase
                        .from('inspectors')
                        .select('display_name, badge_id, email, discom')
                        .eq('email', insEmail)
                        .single();

                      if (dbError || !inspectorRow) {
                        // Valid auth user but NOT a registered inspector — sign out and reject
                        await supabase.auth.signOut();
                        setInsLoginError('Access denied. Your account is not registered as a field inspector.');
                        return;
                      }

                      // Step 3: Login successful — set inspector session
                      setInspector({
                        email: insEmail,
                        displayName: inspectorRow.display_name || insEmail.split('@')[0].toUpperCase(),
                        badgeId: inspectorRow.badge_id,
                        discom: inspectorRow.discom
                      });
                      setIsInspectorModalOpen(false);
                      setInsEmail('');
                      setInsPassword('');
                      setInsLoginError('');
                    } catch (err) {
                      setInsLoginError('An unexpected error occurred. Please try again.');
                    } finally {
                      setInsLoginLoading(false);
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', fontWeight: '500' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={insEmail}
                            onChange={(e) => setInsEmail(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(0, 0, 0, 0.25)', color: 'white',
                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                            }}
                            placeholder="e.g. inspector@vidyut.com"
                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', fontWeight: '500' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={insPassword}
                            onChange={(e) => setInsPassword(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(0, 0, 0, 0.25)', color: 'white',
                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                            }}
                            placeholder="••••••••"
                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                    </div>

                    {insLoginError && (
                        <p style={{ margin: 0, padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.82rem', lineHeight: '1.4' }}>
                            {insLoginError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={insLoginLoading}
                        style={{
                            marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', border: 'none',
                            background: insLoginLoading ? 'rgba(255,255,255,0.4)' : '#ffffff',
                            color: '#000000', fontSize: '0.95rem', fontWeight: '600',
                            cursor: insLoginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { if (!insLoginLoading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {insLoginLoading ? 'Verifying...' : 'Login to Inspector Portal'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* AboutUsModal */}
      {isAboutModalOpen && (
        <AboutUsModal onClose={() => setIsAboutModalOpen(false)} />
      )}

      {/* LoginModal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(mockUser) => {
            setUser(mockUser);
            setIsLoginModalOpen(false);
          }}
        />
      )}

      {/* ResetPasswordModal */}
      {isResetPasswordModalOpen && (
        <ResetPasswordModal
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            window.history.replaceState(null, '', window.location.pathname);
          }}
          onSuccess={async (authUser) => {
            setIsResetPasswordModalOpen(false);
            window.history.replaceState(null, '', window.location.pathname);
            
            // Re-authenticate and load admin session
            if (authUser) {
              const { data: adminRow } = await supabase
                .from('admin_users')
                .select('discom, state')
                .eq('email', authUser.email)
                .single();

              setUser({
                email: authUser.email,
                discom: adminRow?.discom || 'BSES Rajdhani Power Limited',
                state: adminRow?.state || 'Delhi'
              });
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
