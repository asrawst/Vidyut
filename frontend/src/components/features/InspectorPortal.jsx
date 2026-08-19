import React, { useState, useEffect } from 'react';
import { 
    MapPin, User, ClipboardCheck, AlertTriangle, 
    ShieldAlert, Lock, Settings, LogOut, Menu, 
    X, CheckCircle, Navigation, Map, Shield 
} from 'lucide-react';
import MapComponent from './MapComponent';

const InspectorPortal = ({ inspector, onLogout }) => {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('vidyut_inspector_active_tab') || 'Current Task';
    });

    useEffect(() => {
        localStorage.setItem('vidyut_inspector_active_tab', activeTab);
    }, [activeTab]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Active Inspection Task State
    const [inspectionStatus, setInspectionStatus] = useState('Initiate'); // 'Initiate', 'Inprocess', 'Completed'
    const [selectedConsumer, setSelectedConsumer] = useState('CON-98401');
    const [checkList, setCheckList] = useState({
        hookingCheck: false,
        sealIntact: false,
        bypassDetected: false,
        terminalSecure: false
    });
    const [auditNotes, setAuditNotes] = useState('');

    // Dynamic Lists (states so inspector actions update them)
    const [pastInspections, setPastInspections] = useState([
        { id: 'INS-8849', consumer: 'CON-33201', zone: 'Rohini Sector 11', date: 'Aug 15, 2026', type: 'Meter Audit', result: 'Completed' },
        { id: 'INS-8842', consumer: 'CON-45219', zone: 'Sector 5 West', date: 'Aug 12, 2026', type: 'Hooking Inspection', result: 'Completed' },
        { id: 'INS-8831', consumer: 'CON-22108', zone: 'Sector 5 West', date: 'Aug 09, 2026', type: 'Seal Inspection', result: 'Completed' }
    ]);

    const [challans, setChallans] = useState([
        { id: 'CH-2026-01', consumer: 'CON-45219', anomaly: 'Direct Line Hooking', load: '4.5 kW', penalty: '₹25,000', status: 'Issued' }
    ]);

    // Forms states
    const [challanForm, setChallanForm] = useState({ consumerId: '', anomaly: 'Bypassing meter', load: '', penalty: '', details: '' });
    const [complaintForm, setComplaintForm] = useState({ category: 'Meter Damage', severity: 'Medium', details: '' });

    // Mock active coordinates map data
    const mockMapData = {
        results: [
            { consumer_id: 'CON-98401', latitude: '28.6139', longitude: '77.2090', risk_class: 'critical', aggregate_risk_score: 0.92 },
            { consumer_id: 'CON-10938', latitude: '28.6250', longitude: '77.2200', risk_class: 'high', aggregate_risk_score: 0.78 },
            { consumer_id: 'CON-56402', latitude: '28.6050', longitude: '77.2000', risk_class: 'critical', aggregate_risk_score: 0.85 }
        ]
    };

    // Sidebar items matching the blueprint exactly
    const navItems = [
        { name: 'Current Task', icon: <MapPin size={18} /> },
        { name: 'Account Details', icon: <User size={18} /> },
        { name: 'Past Inspections', icon: <ClipboardCheck size={18} /> },
        { name: 'Create Challan', icon: <AlertTriangle size={18} /> },
        { name: 'File Complain', icon: <ShieldAlert size={18} /> },
        { name: 'Login History', icon: <Lock size={18} /> },
        { name: 'Settings', icon: <Settings size={18} /> }
    ];

    // Stepper nodes progress highlight color
    const getStepStyle = (stepName) => {
        const statuses = ['Initiate', 'Inprocess', 'Completed'];
        const currentIdx = statuses.indexOf(inspectionStatus);
        const stepIdx = statuses.indexOf(stepName);

        if (stepIdx < currentIdx) {
            return { bg: '#10b981', border: '#10b981', color: '#ffffff' }; // Done
        } else if (stepIdx === currentIdx) {
            return { bg: 'var(--accent-blue)', border: 'var(--accent-blue)', color: '#000000', pulse: true }; // Active
        } else {
            return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }; // Pending
        }
    };

    // Form Handlers
    const handleChallanSubmit = (e) => {
        e.preventDefault();
        if (!challanForm.consumerId || !challanForm.penalty) {
            alert('Please fill out all required fields');
            return;
        }
        const newChallan = {
            id: `CH-2026-0${challans.length + 1}`,
            consumer: challanForm.consumerId,
            anomaly: challanForm.anomaly,
            load: `${challanForm.load || 'N/A'} kW`,
            penalty: `₹${parseFloat(challanForm.penalty).toLocaleString('en-IN')}`,
            status: 'Issued'
        };
        setChallans([newChallan, ...challans]);
        alert(`Challan ${newChallan.id} created successfully!`);
        setChallanForm({ consumerId: '', anomaly: 'Bypassing meter', load: '', penalty: '', details: '' });
    };

    const handleComplaintSubmit = (e) => {
        e.preventDefault();
        alert(`Technical grievance filed under category: ${complaintForm.category}`);
        setComplaintForm({ category: 'Meter Damage', severity: 'Medium', details: '' });
    };

    const completeInspection = () => {
        if (!checkList.sealIntact && !checkList.hookingCheck && !checkList.bypassDetected) {
            alert('Please perform checks before completing the audit');
            return;
        }
        setInspectionStatus('Completed');
        // Add to past inspections list dynamically
        const newRecord = {
            id: `INS-${Math.floor(1000 + Math.random() * 9000)}`,
            consumer: selectedConsumer,
            zone: 'Sector 5 West',
            date: 'Today',
            type: 'Field Hooking Check',
            result: 'Completed Audit'
        };
        setPastInspections([newRecord, ...pastInspections]);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white', width: '100%', position: 'relative' }}>
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && window.innerWidth <= 768 && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0, 0, 0, 0.6)', zIndex: 999, backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)'
                    }}
                />
            )}

            {/* Sidebar component */}
            <aside className={`inspector-sidebar ${isSidebarOpen ? 'open' : 'collapsed'} ${isSidebarOpen ? 'mobile-open' : ''}`} style={{
                width: isSidebarOpen ? '280px' : '70px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                zIndex: 1000,
                position: 'relative'
            }}>
                {/* Header branding */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarOpen ? 'space-between' : 'center',
                    height: '70px'
                }}>
                    {isSidebarOpen ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                                fontFamily: 'var(--font-heading)',
                                fontWeight: '400', 
                                fontSize: '1.35rem', 
                                letterSpacing: '-0.02em',
                                color: '#ffffff'
                            }}>
                                Vidyut Portal
                            </span>
                            <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--accent-blue)',
                                border: '1px solid var(--accent-blue)',
                                borderRadius: '4px',
                                padding: '1px 4px',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}>
                                Inspector
                            </span>
                        </div>
                    ) : null}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation lists */}
                <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            title={isSidebarOpen ? undefined : item.name}
                            onClick={() => { setActiveTab(item.name); if (window.innerWidth <= 768) setIsSidebarOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                gap: '0.85rem',
                                padding: isSidebarOpen ? '0.75rem 0.9rem' : '0.75rem 0',
                                background: activeTab === item.name ? 'rgba(200, 162, 97, 0.12)' : 'none',
                                border: activeTab === item.name ? '1px solid rgba(200, 162, 97, 0.2)' : 'none',
                                color: activeTab === item.name ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.6)',
                                borderRadius: '8px',
                                width: '100%',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left'
                            }}
                        >
                            {item.icon}
                            {isSidebarOpen && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}</span>}
                        </button>
                    ))}
                </nav>

                {/* Footer credentials & logout */}
                <div style={{ padding: isSidebarOpen ? '1rem' : '0.75rem 0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    {isSidebarOpen && (
                        <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>
                                {inspector?.displayName || 'Inspector Ravi'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '2px' }}>
                                {inspector?.discom || 'Tata Power DDL'}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        title={isSidebarOpen ? undefined : 'Logout'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                            gap: '0.85rem',
                            padding: isSidebarOpen ? '0.75rem 0.9rem' : '0.75rem 0',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            width: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main workspace */}
            <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' }}>
                
                {/* Active Tab Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button 
                            className="mobile-sidebar-hamburger"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'white', fontWeight: '400' }}>
                                {activeTab}
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Field Audit Workspace / {activeTab}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CURRENT TASK VIEW */}
                {activeTab === 'Current Task' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Map Panel */}
                        <div style={{ 
                            background: 'var(--glass-bg)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '16px', 
                            padding: '1.5rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Map size={18} style={{ color: 'var(--accent-blue)' }} />
                                    Map: Assigned Route & Meter Pins
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                                    Target: {selectedConsumer} (Sector 5 West)
                                </div>
                            </div>
                            
                            {/* Leaflet Map integration */}
                            <div style={{ height: '380px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <MapComponent data={mockMapData} />
                            </div>
                        </div>

                        {/* Interactive Inspection Stepper */}
                        <div style={{ 
                            background: 'var(--glass-bg)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '16px', 
                            padding: '2rem'
                        }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'white' }}>
                                Active Audit Status Stepper
                            </h3>
                            
                            {/* Stepper progress layout */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginBottom: '2.5rem', padding: '0 3rem' }}>
                                {/* Horizontal connecting lines */}
                                <div style={{ 
                                    position: 'absolute', top: '20px', left: '10%', right: '10%', height: '3px', 
                                    background: 'rgba(255,255,255,0.08)', zIndex: 1 
                                }}>
                                    <div style={{ 
                                        width: inspectionStatus === 'Initiate' ? '0%' : inspectionStatus === 'Inprocess' ? '50%' : '100%', 
                                        height: '100%', background: 'var(--accent-blue)', transition: 'width 0.3s ease' 
                                    }} />
                                </div>

                                {/* Step: Initiate */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                    <div style={{ 
                                        width: '42px', height: '42px', borderRadius: '50%', background: getStepStyle('Initiate').bg,
                                        border: `2px solid ${getStepStyle('Initiate').border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: getStepStyle('Initiate').color, fontWeight: '700', transition: 'all 0.3s'
                                    }}>
                                        1
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.5rem', color: 'white' }}>Initiate</span>
                                </div>

                                {/* Step: In Process */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                    <div style={{ 
                                        width: '42px', height: '42px', borderRadius: '50%', background: getStepStyle('Inprocess').bg,
                                        border: `2px solid ${getStepStyle('Inprocess').border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: getStepStyle('Inprocess').color, fontWeight: '700', transition: 'all 0.3s'
                                    }}>
                                        2
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.5rem', color: 'white' }}>Inprocess</span>
                                </div>

                                {/* Step: Completed */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                    <div style={{ 
                                        width: '42px', height: '42px', borderRadius: '50%', background: getStepStyle('Completed').bg,
                                        border: `2px solid ${getStepStyle('Completed').border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: getStepStyle('Completed').color, fontWeight: '700', transition: 'all 0.3s'
                                    }}>
                                        3
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.5rem', color: 'white' }}>Completed</span>
                                </div>
                            </div>

                            {/* Dynamic Stepper Action Controls */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                {inspectionStatus === 'Initiate' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            Confirm you have arrived at the geolocated installation site for consumer <strong>{selectedConsumer}</strong>.
                                        </p>
                                        <button
                                            onClick={() => setInspectionStatus('Inprocess')}
                                            style={{
                                                background: '#ffffff', color: '#000000', padding: '0.75rem 2rem', 
                                                borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            Start On-Site Audit
                                        </button>
                                    </div>
                                )}

                                {inspectionStatus === 'Inprocess' && (
                                    <div style={{ width: '100%', maxWidth: '500px' }}>
                                        <h4 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Audit Check List & Seals</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={checkList.sealIntact}
                                                    onChange={e => setCheckList({...checkList, sealIntact: e.target.checked})}
                                                /> Meter Seals Untouched
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={checkList.hookingCheck}
                                                    onChange={e => setCheckList({...checkList, hookingCheck: e.target.checked})}
                                                /> Checked for Pole Hooking
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={checkList.bypassDetected}
                                                    onChange={e => setCheckList({...checkList, bypassDetected: e.target.checked})}
                                                /> No Shunt/Bypass Found
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={checkList.terminalSecure}
                                                    onChange={e => setCheckList({...checkList, terminalSecure: e.target.checked})}
                                                /> Terminal Box Secured
                                            </label>
                                        </div>

                                        <textarea
                                            placeholder="On-site notes (e.g. shunt resistance found, seal replaced etc.)"
                                            value={auditNotes}
                                            onChange={e => setAuditNotes(e.target.value)}
                                            style={{
                                                width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', padding: '0.75rem', fontSize: '0.85rem', outline: 'none', marginBottom: '1.25rem'
                                            }}
                                        />

                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={completeInspection}
                                                style={{
                                                    background: '#ffffff', color: '#000000', padding: '0.75rem 2rem', 
                                                    borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                                }}
                                            >
                                                Submit Inspection Details
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {inspectionStatus === 'Completed' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#10b981' }}>
                                            <CheckCircle size={32} />
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: '500' }}>
                                            Inspection Audit Filed Successfully!
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                                            Audit logs have been synced with DISCOM central server database.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setInspectionStatus('Initiate');
                                                setSelectedConsumer(selectedConsumer === 'CON-98401' ? 'CON-10938' : 'CON-98401');
                                                setCheckList({ sealIntact: false, hookingCheck: false, bypassDetected: false, terminalSecure: false });
                                                setAuditNotes('');
                                            }}
                                            style={{
                                                background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)',
                                                padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            Next Assigned Task
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ACCOUNT DETAILS VIEW */}
                {activeTab === 'Account Details' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue) 0%, #9c7446 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '600', color: 'white' }}>
                                {inspector?.displayName?.charAt(0) || 'R'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem' }}>{inspector?.displayName || 'Inspector Ravi Shankar'}</h3>
                                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: '600' }}>Senior Field Inspector</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Badge ID</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>INS-DEL-88402</span>
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Email Address</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{inspector?.email}</span>
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Active Division</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{inspector?.discom || 'Tata Power DDL'}</span>
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Current Substation Zone</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>Sector 5 West Central Feeder</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Active Timings Shift</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>09:00 AM - 06:00 PM (Day Shift)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* PAST INSPECTIONS VIEW */}
                {activeTab === 'Past Inspections' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Historical Audit Log</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>AUDIT ID</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>CONSUMER ID</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>ZONE AREA</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>DATE</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>AUDIT TYPE</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastInspections.map((ins, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>{ins.id}</td>
                                        <td style={{ padding: '1rem', color: 'white' }}>{ins.consumer}</td>
                                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.zone}</td>
                                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.date}</td>
                                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.type}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                {ins.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CREATE CHALLAN VIEW */}
                {activeTab === 'Create Challan' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                        {/* Challan creation form */}
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'white' }}>Issue Penalty / Load Bypass Challan</h3>
                            <form onSubmit={handleChallanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Consumer Account ID *</label>
                                    <input 
                                        type="text" 
                                        value={challanForm.consumerId}
                                        onChange={e => setChallanForm({...challanForm, consumerId: e.target.value})}
                                        placeholder="e.g. CON-98401"
                                        required
                                        style={{
                                            padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Theft Anomaly Class *</label>
                                    <select
                                        value={challanForm.anomaly}
                                        onChange={e => setChallanForm({...challanForm, anomaly: e.target.value})}
                                        style={{
                                            padding: '0.7rem 1rem', background: '#12100e', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <option value="Bypassing meter">Meter Bypassing</option>
                                        <option value="Direct Line Hooking">Direct Pole Hooking</option>
                                        <option value="Shunt resistance loop">Shunt Device / Loop</option>
                                        <option value="CT secondary shorting">CT Shorting</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Detected Load (kW)</label>
                                        <input 
                                            type="number" 
                                            value={challanForm.load}
                                            onChange={e => setChallanForm({...challanForm, load: e.target.value})}
                                            placeholder="e.g. 5.5"
                                            style={{
                                                padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Assess Penalty Sum (INR) *</label>
                                        <input 
                                            type="number" 
                                            value={challanForm.penalty}
                                            onChange={e => setChallanForm({...challanForm, penalty: e.target.value})}
                                            placeholder="e.g. 25000"
                                            required
                                            style={{
                                                padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Evidence / Narrative Details</label>
                                    <textarea 
                                        value={challanForm.details}
                                        onChange={e => setChallanForm({...challanForm, details: e.target.value})}
                                        placeholder="Describe findings, wire hooking details etc."
                                        style={{
                                            padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', height: '80px'
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        background: '#ffffff', color: '#000000', padding: '0.75rem 1.5rem', 
                                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem'
                                    }}
                                >
                                    Issue Challan
                                </button>
                            </form>
                        </div>

                        {/* Pinned Issued Challans List */}
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Active Challans (Current Session)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px' }}>
                                {challans.map((ch) => (
                                    <div key={ch.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{ch.id} ({ch.consumer})</span>
                                            <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>{ch.status}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span>Violation: {ch.anomaly}</span>
                                            <span>Connected load: {ch.load}</span>
                                            <span style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>Penalty: {ch.penalty}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* FILE COMPLAINT VIEW */}
                {activeTab === 'File Complain' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', maxWidth: '600px' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'white' }}>Log Grid Damage / Technical Complaint</h3>
                        <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Category of Complaint</label>
                                <select
                                    value={complaintForm.category}
                                    onChange={e => setComplaintForm({...complaintForm, category: e.target.value})}
                                    style={{
                                        padding: '0.7rem 1rem', background: '#12100e', border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="Meter Damage">Burnt / Damaged Meter Box</option>
                                    <option value="Sparks on Line">Sparks / Heat on Feeder Cable</option>
                                    <option value="Transformer Leak">Transformer Oil Leakage</option>
                                    <option value="Bypassed Substation">Substation Load Fluctuations</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Priority Severity</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                                    {['Low', 'Medium', 'Critical'].map(level => (
                                        <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input 
                                                type="radio" 
                                                name="severity" 
                                                checked={complaintForm.severity === level}
                                                onChange={() => setComplaintForm({...complaintForm, severity: level})}
                                            /> {level}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Technical Details / Comments</label>
                                <textarea 
                                    value={complaintForm.details}
                                    onChange={e => setComplaintForm({...complaintForm, details: e.target.value})}
                                    placeholder="Enter physical site conditions, transformer serials etc."
                                    required
                                    style={{
                                        padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', height: '100px'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    background: '#ffffff', color: '#000000', padding: '0.75rem 2rem', 
                                    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem'
                                }}
                            >
                                Submit Report
                            </button>
                        </form>
                    </div>
                )}

                {/* LOGIN HISTORY VIEW */}
                {activeTab === 'Login History' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Session Logs</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>TIMESTAMP</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>EVENT TYPE</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>IP ADDRESS</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>DEVICE AGENT</th>
                                    <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '1rem', color: 'white' }}>Today, 19:38</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>Active Session (Portal)</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>192.168.1.45</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>Chrome Mobile / iOS</td>
                                    <td style={{ padding: '1rem' }}><span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.8rem' }}>Connected</span></td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '1rem', color: 'white' }}>Aug 15, 2026 09:12</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>Session Closed</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>192.168.1.102</td>
                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>Safari Mobile / iOS</td>
                                    <td style={{ padding: '1rem' }}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Terminated</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SETTINGS VIEW */}
                {activeTab === 'Settings' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', maxWidth: '600px' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'white' }}>Portal Configuration</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Map Render Style</label>
                                <select style={{ padding: '0.7rem 1rem', background: '#12100e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                    <option>Dark Mode Vector tiles (CARTO)</option>
                                    <option>Satellite Orthophoto maps</option>
                                    <option>Standard Street Map (OpenStreetMap)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Offline Sync Syncing</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input type="checkbox" defaultChecked /> Auto Sync over cellular networks (3G/4G/5G)
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>GPS Tracking Precision</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                                    {['High Precision', 'Battery Saver'].map(mode => (
                                        <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input type="radio" name="gps-mode" defaultChecked={mode === 'High Precision'} /> {mode}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InspectorPortal;
