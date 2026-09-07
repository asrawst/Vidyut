import React, { useState } from 'react';
import { X, UserCheck, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const InspectorLoginModal = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Step 1: Authenticate with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (authError) {
                setError('Invalid email or password.');
                return;
            }

            // Step 2: Verify user exists in the inspectors table
            const { data: inspectorRow, error: dbError } = await supabase
                .from('inspectors')
                .select('display_name, badge_id, email, discom')
                .eq('email', email.trim())
                .single();

            if (dbError || !inspectorRow) {
                // Not a registered inspector
                await supabase.auth.signOut();
                setError('Access denied. Your account is not registered as an active field inspector.');
                return;
            }

            // Step 3: Success
            const inspectorSession = {
                email: email.trim(),
                displayName: inspectorRow.display_name || email.split('@')[0].toUpperCase(),
                badgeId: inspectorRow.badge_id,
                discom: inspectorRow.discom
            };
            onSuccess(inspectorSession);
        } catch (err) {
            console.error('Inspector login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Please enter your inspector email address.');
            return;
        }
        setError('');
        setForgotLoading(true);
        try {
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (resetErr) {
                setError(resetErr.message);
            } else {
                setForgotMessage(`✅ Password recovery link sent to ${email}. Check your inbox!`);
            }
        } catch (err) {
            setError('Failed to send recovery email. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 7, 15, 0.78)', backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'rgba(18, 16, 14, 0.95)', backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
                padding: '2.5rem', width: '450px', maxWidth: '92vw', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                position: 'relative', animation: 'fade-in 0.3s ease-out'
            }}>
                <button 
                    onClick={onClose}
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
                <div style={{ marginBottom: '1.75rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', borderRadius: '20px', background: 'rgba(200,162,97,0.12)', border: '1px solid rgba(200,162,97,0.25)', color: '#c8a261', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.75rem', alignItems: 'center', gap: '0.35rem' }}>
                        <UserCheck size={14} /> Field Inspection Portal
                    </div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: '400', color: 'white', letterSpacing: '-0.02em' }}>
                        {forgotMode ? 'Reset Credentials' : 'Inspector Login'}
                    </h2>
                    <p style={{ margin: '0.35rem 0 0 0', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        {forgotMode 
                            ? 'Enter your registered inspector email to receive a password reset link.'
                            : 'Sign in to access your assigned field audits, GPS mapping and penalty issuance.'}
                    </p>
                </div>

                {/* Form */}
                <form 
                    onSubmit={forgotMode ? handleForgotPassword : handleLogin}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', fontWeight: '500' }}>
                            Inspector Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.3)', color: 'white',
                                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                            }}
                            placeholder="e.g. employee@vidyut.com"
                        />
                    </div>

                    {/* Password Input (Login mode only) */}
                    {!forgotMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', fontWeight: '500' }}>
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setForgotMode(true); setError(''); setForgotMessage(''); }}
                                    style={{ background: 'none', border: 'none', color: '#c8a261', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    padding: '0.75rem 1rem', borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(0, 0, 0, 0.3)', color: 'white',
                                    fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    {error && (
                        <p style={{ margin: 0, padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.82rem', lineHeight: '1.4' }}>
                            {error}
                        </p>
                    )}

                    {forgotMessage && (
                        <p style={{ margin: 0, padding: '0.6rem 0.9rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', fontSize: '0.82rem', lineHeight: '1.4' }}>
                            {forgotMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || forgotLoading}
                        style={{
                            marginTop: '0.5rem', padding: '0.85rem', borderRadius: '8px', border: 'none',
                            background: (loading || forgotLoading) ? 'rgba(255,255,255,0.3)' : '#ffffff',
                            color: '#000000', fontSize: '0.95rem', fontWeight: '600',
                            cursor: (loading || forgotLoading) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        {forgotMode ? (
                            forgotLoading ? 'Sending...' : 'Send Recovery Link'
                        ) : (
                            loading ? 'Verifying...' : <><span>Login to Inspector Portal</span> <ArrowRight size={16} /></>
                        )}
                    </button>

                    {forgotMode && (
                        <button
                            type="button"
                            onClick={() => { setForgotMode(false); setError(''); setForgotMessage(''); }}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center' }}
                        >
                            ← Back to Password Login
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default InspectorLoginModal;
