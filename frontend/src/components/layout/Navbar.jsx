import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, Info, Sliders, LogOut, Shield } from 'lucide-react';
import './navbar_menu.css';

const Navbar = ({ 
    user, 
    onLoginClick, 
    onLogoutClick, 
    onAboutClick, 
    onServicesClick, 
    onInspectorClick 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        setIsMenuOpen(false);
        onLogoutClick();
    };

    const handleMobileLinkClick = (action) => {
        setIsMenuOpen(false);
        action();
    };

    return (
        <nav className="navbar" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.88)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 3rem',
            height: '74px'
        }}>
            <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                <div className="nav-logo">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <span style={{ 
                            fontFamily: 'var(--font-heading)',
                            fontWeight: '800', 
                            fontSize: '1.45rem', 
                            letterSpacing: '-0.035em',
                            color: '#09090b'
                        }}>
                            Vidyut
                        </span>
                    </Link>
                </div>
                {/* Desktop Links */}
                <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center' }}>
                    <ul className="nav-links" style={{ display: 'flex', listStyle: 'none', gap: '2rem', margin: 0, padding: 0 }}>
                        <li>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onAboutClick(); }} style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.15s' }}>
                                About
                            </a>
                        </li>
                        <li>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onServicesClick(); }} style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', transition: 'color 0.15s' }}>
                                Services
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {/* Desktop Action Buttons */}
                <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: '600' }}>
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                            <button 
                                onClick={onLogoutClick} 
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '9999px',
                                    padding: '0.45rem 1rem',
                                    color: '#ef4444',
                                    fontSize: '0.84rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={onLoginClick} 
                                className="stitch-btn-pill stitch-btn-pill-secondary"
                                style={{ padding: '0.5rem 1.25rem', fontSize: '0.86rem', fontWeight: '600' }}
                            >
                                Admin <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '2px' }}>▼</span>
                            </button>
                            <button 
                                onClick={onInspectorClick} 
                                className="stitch-btn-pill stitch-btn-pill-primary"
                                style={{ padding: '0.5rem 1.45rem', fontSize: '0.86rem', fontWeight: '600' }}
                            >
                                Inspector
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="menu-toggle-container" ref={menuRef} style={{ display: 'none' }}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="menu-toggle-btn"
                        style={{
                            background: '#ffffff',
                            border: '1px solid #eaeaea',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            color: '#000000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    {isMenuOpen && (
                        <div className="floating-menu" style={{
                            position: 'absolute',
                            top: '60px',
                            right: '20px',
                            background: '#ffffff',
                            border: '1px solid #eaeaea',
                            borderRadius: '10px',
                            padding: '0.5rem',
                            minWidth: '180px',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }}>
                            <div className="menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <button className="menu-item-float" onClick={() => handleMobileLinkClick(onAboutClick)} style={menuItemStyle}>
                                    <Info size={14} /> About
                                </button>
                                <button className="menu-item-float" onClick={() => handleMobileLinkClick(onServicesClick)} style={menuItemStyle}>
                                    <Sliders size={14} /> Services
                                </button>
                                <div style={{ height: '1px', background: '#eaeaea', margin: '0.25rem 0' }}></div>
                                {user ? (
                                    <button className="menu-item-float" onClick={handleLogout} style={{ ...menuItemStyle, color: '#dc2626' }}>
                                        <LogOut size={14} /> Logout
                                    </button>
                                ) : (
                                    <>
                                        <button className="menu-item-float" onClick={() => handleMobileLinkClick(onLoginClick)} style={menuItemStyle}>
                                            <Shield size={14} /> Admin Login
                                        </button>
                                        <button className="menu-item-float" onClick={() => handleMobileLinkClick(onInspectorClick)} style={menuItemStyle}>
                                            <User size={14} /> Inspector Portal
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.8rem',
    background: 'none',
    border: 'none',
    color: '#4b5563',
    fontSize: '0.85rem',
    cursor: 'pointer',
    borderRadius: '6px',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s'
};

export default Navbar;
