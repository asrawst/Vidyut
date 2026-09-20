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
            background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="stitch-modal-card" style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '24px',
                padding: '2.5rem',
                width: '460px',
                maxWidth: '92vw',
                position: 'relative',
                animation: 'fade-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <button 
                    onClick={onClose}
                    style={{ 
                        position: 'absolute', top: '1.25rem', right: '1.25rem', 
                        background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', 
                        borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' 
                    }}
                >
                    <X size={16} />
                </button>
                
                {/* Header */}
                <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                    <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: '#eff6ff', border: '1px solid #dbeafe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.85rem auto', color: '#2563eb'
                    }}>
                        <UserCheck size={22} />
                    </div>
                    <div style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontSize: '0.72rem', fontWeight: '700', marginBottom: '0.6rem', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                        Field Inspection Portal
                    </div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                        {forgotMode ? 'Reset Credentials' : 'Inspector Login'}
                    </h2>
                    <p style={{ margin: '0.35rem 0 0 0', fontFamily: 'var(--font-body)', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {forgotMode 
                            ? 'Enter your registered inspector email to receive a password reset link.'
                            : 'Sign in to access your assigned field audits, GPS mapping and penalty issuance.'}
                    </p>
                </div>

                {/* Form */}
                <form 
                    onSubmit={forgotMode ? handleForgotPassword : handleLogin}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}
                >
                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                            Inspector Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                padding: '0.75rem 1rem', borderRadius: '12px',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-canvas)', color: 'var(--text-primary)',
                                fontSize: '0.9rem', outline: 'none'
                            }}
                            placeholder="e.g. employee@vidyut.com"
                        />
                    </div>

                    {/* Password Input (Login mode only) */}
                    {!forgotMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setForgotMode(true); setError(''); setForgotMessage(''); }}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: '600' }}
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
                                    padding: '0.75rem 1rem', borderRadius: '12px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-canvas)', color: 'var(--text-primary)',
                                    fontSize: '0.9rem', outline: 'none'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    {error && (
                        <p style={{ margin: 0, padding: '0.65rem 0.9rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '0.82rem', lineHeight: '1.4' }}>
                            {error}
                        </p>
                    )}

                    {forgotMessage && (
                        <p style={{ margin: 0, padding: '0.65rem 0.9rem', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px', color: '#059669', fontSize: '0.82rem', lineHeight: '1.4' }}>
                            {forgotMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || forgotLoading}
                        className="stitch-btn-pill stitch-btn-pill-primary"
                        style={{
                            marginTop: '0.5rem', padding: '0.85rem', width: '100%',
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
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center', fontWeight: '600' }}
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
