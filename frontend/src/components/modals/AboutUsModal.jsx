import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const AboutUsModal = ({ onClose }) => {
    useEffect(() => {
        console.log("About Us Modal Mounted");
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="stitch-modal-card" style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                padding: '2.5rem',
                borderRadius: '24px',
                width: '90%',
                maxWidth: '780px',
                maxHeight: '88vh',
                overflowY: 'auto',
                position: 'relative',
                color: 'var(--text-secondary)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.15s'
                    }}
                >
                    <X size={16} />
                </button>

                <h2 style={{
                    fontSize: '1.85rem',
                    marginBottom: '1.75rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    letterSpacing: '-0.03em',
                    textAlign: 'center'
                }}>About Vidyut</h2>

                <div style={{ fontSize: '0.92rem', lineHeight: '1.7', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '0.35rem', fontSize: '1.05rem' }}>Why existing systems fall short</h3>
                        <p style={{ margin: 0 }}>Most current electricity theft detection methods depend on manual inspections, fixed rules, or single indicators. These approaches struggle to scale, generate many false positives, and often miss complex or well-hidden cases of non-technical losses.</p>
                    </div>

                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '0.35rem', fontSize: '1.05rem' }}>Our approach</h3>
                        <p style={{ margin: 0 }}>This system is built using a research-driven, multi-layer anomaly detection framework. Rather than relying on one signal, it analyzes electricity usage from multiple perspectives to capture different forms of suspicious behavior and reduce blind spots.</p>
                    </div>

                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '0.35rem', fontSize: '1.05rem' }}>How the system works</h3>
                        <p style={{ margin: 0 }}>Smart-meter consumption patterns are analyzed over time to detect abnormal changes. Consumers are evaluated relative to nearby peers connected to the same transformer, providing local context. Transformer-level loss analysis captures grid-side irregularities, while voltage and power-quality signals act as physical indicators.</p>
                    </div>

                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '0.35rem', fontSize: '1.05rem' }}>The problem we solve</h3>
                        <p style={{ margin: 0 }}>The system helps utilities move from reactive checks to targeted, data-driven inspections, reducing non-technical losses and improving grid visibility while maintaining transparency and control.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsModal;
