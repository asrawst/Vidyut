import React, { useState, useEffect, useRef } from 'react';
import { Menu, User, Info, Sliders, LogOut } from 'lucide-react';
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
            background: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 2rem',
            height: '70px'
        }}>
            <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div className="nav-logo">
                    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white' }}>
                        <span style={{ 
                            fontFamily: 'var(--font-heading)',
                            fontWeight: '400', 
                            fontSize: '1.45rem', 
                            letterSpacing: '-0.02em',
                            color: '#ffffff'
                        }}>
                            Vidyut
                        </span>
                    </a>
                </div>
                {/* Desktop Links */}
                <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center' }}>
                    <ul className="nav-links" style={{ display: 'flex', listStyle: 'none', gap: '2rem', margin: 0, padding: 0 }}>
                        <li>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onAboutClick(); }} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                About <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>▼</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onServicesClick(); }} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Services <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>▼</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Desktop Action Buttons */}
                <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '500' }}>
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                            <button 
                                onClick={onLogoutClick} 
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.8rem',
                                    color: '#ef4444',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={onLoginClick} 
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    borderRadius: '8px',
                                    padding: '0.55rem 1.4rem',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#ffffff'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                            >
                                Admin <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▼</span>
                            </button>
                            <button 
                                onClick={onInspectorClick} 
                                style={{
                                    background: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.55rem 1.5rem',
                                    color: '#000000',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
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
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    {isMenuOpen && (
                        <div className="floating-menu" style={{
                            position: 'absolute',
                            top: '60px',
                            right: '20px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '0.5rem',
                            minWidth: '180px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            <div className="menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <button className="menu-item-float" onClick={() => handleMobileLinkClick(onAboutClick)} style={menuItemStyle}>
                                    <Info size={14} /> About
                                </button>
                                <button className="menu-item-float" onClick={() => handleMobileLinkClick(onServicesClick)} style={menuItemStyle}>
                                    <Sliders size={14} /> Services
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }}></div>
                                {user ? (
                                    <button className="menu-item-float" onClick={handleLogout} style={{ ...menuItemStyle, color: '#ef4444' }}>
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    borderRadius: '6px',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s'
};

export default Navbar;
