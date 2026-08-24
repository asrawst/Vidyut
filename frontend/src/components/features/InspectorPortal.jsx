import React, { useState, useEffect, useMemo } from 'react';
import { 
    MapPin, User, ClipboardCheck, AlertTriangle, 
    ShieldAlert, Lock, Settings, LogOut, Menu, 
    X, CheckCircle, Navigation, Map, Shield, Zap, Activity, Radio, ChevronRight, Sun, Moon
} from 'lucide-react';
import MapComponent from './MapComponent';
import { supabase } from '../../supabaseClient';

const InspectorPortal = ({ inspector, onLogout }) => {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('vidyut_inspector_active_tab') || 'Current Task';
    });

    useEffect(() => {
        localStorage.setItem('vidyut_inspector_active_tab', activeTab);
    }, [activeTab]);

    const [theme, setTheme] = useState(() => localStorage.getItem('vidyut_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('vidyut_theme', theme);
    }, [theme]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Assigned Tasks from Supabase Database & localStorage
    const [allAssignedTasks, setAllAssignedTasks] = useState(() => {
        const saved = localStorage.getItem('vidyut_assigned_tasks');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [];
    });

    // Fetch live tasks directly from Supabase DB on mount & sync in real-time
    useEffect(() => {
        const fetchTasksFromDB = async () => {
            try {
                const { data, error } = await supabase
                    .from('inspection_tasks')
                    .select('*')
                    .order('assigned_at', { ascending: false });
                
                if (data && !error) {
                    setAllAssignedTasks(data);
                    localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(data));
                }
            } catch (err) {
                console.error("Error fetching tasks from Supabase in InspectorPortal:", err);
            }
        };

        fetchTasksFromDB();

        // Subscribe to live task assignments & updates from Supabase Realtime
        const channel = supabase
            .channel('inspector_portal_realtime_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inspection_tasks' }, () => {
                fetchTasksFromDB();
            })
            .subscribe();

        // Storage listener for same-browser tabs
        const handleStorageChange = () => {
            const saved = localStorage.getItem('vidyut_assigned_tasks');
            if (saved) {
                try { setAllAssignedTasks(JSON.parse(saved)); } catch (e) { console.error(e); }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [inspector]);

    // Filter tasks belonging to THIS logged-in inspector
    const myTasks = useMemo(() => {
        if (!allAssignedTasks || allAssignedTasks.length === 0) return [];
        const cleanDisplayName = (inspector?.displayName || '').replace(/^Inspector\s+/i, '').trim().toLowerCase();
        const cleanEmail = (inspector?.email || '').toLowerCase();

        return allAssignedTasks.filter(t => {
            const taskInsp = (t.inspector_name || '').replace(/^Inspector\s+/i, '').trim().toLowerCase();
            const taskEmail = (t.inspector_email || '').toLowerCase();
            return (
                taskInsp === cleanDisplayName ||
                (cleanDisplayName && taskInsp.includes(cleanDisplayName)) ||
                (cleanDisplayName && cleanDisplayName.includes(taskInsp)) ||
                (cleanEmail && taskEmail === cleanEmail)
            );
        });
    }, [allAssignedTasks, inspector]);

    const [selectedConsumerId, setSelectedConsumerId] = useState(null);

    // Active Task Object
    const currentTask = useMemo(() => {
        if (myTasks.length === 0) return null;
        if (selectedConsumerId) {
            const found = myTasks.find(t => t.consumer_id === selectedConsumerId);
            if (found) return found;
        }
        return myTasks[0];
    }, [myTasks, selectedConsumerId]);

    // Active Inspection Task State
    const [inspectionStatus, setInspectionStatus] = useState('Initiate'); // 'Initiate', 'Inprocess', 'Completed'
    
    // Synchronize stepper status with active task status
    useEffect(() => {
        if (currentTask) {
            const rawStatus = (currentTask.status || '').toLowerCase();
            if (rawStatus.includes('comp')) {
                setInspectionStatus('Completed');
            } else if (rawStatus.includes('proc') || rawStatus.includes('inprocess')) {
                setInspectionStatus('Inprocess');
            } else {
                setInspectionStatus('Initiate');
            }
        }
    }, [currentTask]);

    const [checkList, setCheckList] = useState({
        hookingCheck: false,
        sealIntact: false,
        bypassDetected: false,
        terminalSecure: false
    });
    const [auditNotes, setAuditNotes] = useState('');

    // Dynamic Lists (states so inspector actions update them)
    const [pastInspections, setPastInspections] = useState(() => {
        const saved = localStorage.getItem('vidyut_inspector_past_inspections');
        if (saved) {
            try { 
                const parsed = JSON.parse(saved); 
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => !item.consumer.startsWith('CON-'));
                }
            } catch (e) { console.error(e); }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_inspector_past_inspections', JSON.stringify(pastInspections));
    }, [pastInspections]);

    const [challans, setChallans] = useState(() => {
        const saved = localStorage.getItem('vidyut_inspector_challans');
        if (saved) {
            try { 
                const parsed = JSON.parse(saved); 
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => !item.consumer.startsWith('CON-'));
                }
            } catch (e) { console.error(e); }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_inspector_challans', JSON.stringify(challans));
    }, [challans]);

    // Forms states
    const [challanForm, setChallanForm] = useState({ consumerId: '', anomaly: 'Bypassing meter', load: '', penalty: '', details: '' });
    const [complaintForm, setComplaintForm] = useState({ category: 'Meter Damage', severity: 'Medium', details: '' });

    // Dynamic map dataset built from assigned tasks
    const activeMapData = useMemo(() => {
        if (myTasks.length > 0) {
            return {
                results: myTasks.map(t => ({
                    consumer_id: t.consumer_id,
                    transformer_id: t.transformer_id,
                    latitude: t.latitude,
                    longitude: t.longitude,
                    risk_class: t.risk_class || 'critical',
                    aggregate_risk_score: t.risk_score || 0.85
                }))
            };
        }
        return {
            results: []
        };
    }, [myTasks]);

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

    // Update status in Supabase DB, local state & localStorage for admin synchronization
    const updateTaskStatus = async (newStepStatus) => {
        setInspectionStatus(newStepStatus);
        if (!currentTask) return;

        const tableStatus = newStepStatus === 'Inprocess' ? 'In Process' : newStepStatus === 'Completed' ? 'Completed' : 'Initiated';

        // 1. Sync live update to Supabase DB
        try {
            const { error: updErr } = await supabase
                .from('inspection_tasks')
                .update({ 
                    status: tableStatus, 
                    updated_at: new Date().toISOString() 
                })
                .eq('consumer_id', currentTask.consumer_id);
            if (updErr) console.error("Error updating task status in Supabase:", updErr.message);
        } catch (err) {
            console.error("Supabase update exception:", err);
        }

        // 2. Update local state & localStorage cache
        try {
            const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
            const updated = savedTasks.map(t => t.consumer_id === currentTask.consumer_id ? { ...t, status: tableStatus } : t);
            localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updated));
            setAllAssignedTasks(updated);

            // Sync with localInspectionStatus for Admin Dashboard overview
            const savedStatus = JSON.parse(localStorage.getItem('vidyut_local_inspection_status') || '{}');
            savedStatus[currentTask.consumer_id] = tableStatus;
            localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(savedStatus));

            // Sync with calendar
            const savedCal = JSON.parse(localStorage.getItem('vidyut_inspection_calendar') || '[]');
            const updatedCal = savedCal.map(c => c.consumer === currentTask.consumer_id ? { ...c, status: tableStatus } : c);
            localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(updatedCal));
        } catch (e) {
            console.error('Error updating task status locally:', e);
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
            alert('Please perform checklist verification before completing the audit');
            return;
        }
        updateTaskStatus('Completed');

        // Add to past inspections list dynamically
        const newRecord = {
            id: `INS-${Math.floor(1000 + Math.random() * 9000)}`,
            consumer: currentTask?.consumer_id || 'C0057',
            zone: currentTask?.zone || `Transformer ${currentTask?.transformer_id || 'T01'}`,
            date: 'Today',
            type: 'Field Hooking & Seal Audit',
            result: 'Completed Audit'
        };
        setPastInspections(prev => [newRecord, ...prev]);
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
                        {currentTask ? (
                            <>
                                {/* Task Overview Card */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(200, 162, 97, 0.08) 0%, rgba(20, 18, 15, 0.6) 100%)',
                                    border: '1px solid rgba(200, 162, 97, 0.25)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                                                <span style={{ 
                                                    background: 'rgba(200, 162, 97, 0.2)', color: '#c8a261', 
                                                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px' 
                                                }}>
                                                    ACTIVE ASSIGNMENT
                                                </span>
                                                <span style={{
                                                    background: (currentTask.risk_class || '').toLowerCase().includes('crit') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                                                    color: (currentTask.risk_class || '').toLowerCase().includes('crit') ? '#ef4444' : '#f97316',
                                                    padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
                                                }}>
                                                    {(((currentTask.risk_score || 0.85)) * 100).toFixed(0)}% {currentTask.risk_class || 'Critical'} Risk
                                                </span>
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                                                Consumer <span style={{ color: 'var(--accent-blue)' }}>{currentTask.consumer_id}</span>
                                            </h2>
                                            <p style={{ margin: '0.25rem 0 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                                                Mapped to <strong>Transformer {currentTask.transformer_id}</strong> &bull; {currentTask.zone || 'Distribution Zone'} &bull; {inspector?.discom || 'DISCOM Grid'}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ 
                                                padding: '0.4rem 0.85rem', 
                                                borderRadius: '6px', 
                                                background: inspectionStatus === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : inspectionStatus === 'Inprocess' ? 'rgba(200, 162, 97, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                                color: inspectionStatus === 'Completed' ? '#10b981' : inspectionStatus === 'Inprocess' ? '#c8a261' : 'rgba(255, 255, 255, 0.8)',
                                                border: `1px solid ${inspectionStatus === 'Completed' ? 'rgba(16, 185, 129, 0.3)' : inspectionStatus === 'Inprocess' ? 'rgba(200, 162, 97, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                                fontSize: '0.85rem', fontWeight: '600'
                                            }}>
                                                Status: {inspectionStatus === 'Inprocess' ? 'In Process' : inspectionStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Task Switcher if inspector has multiple assigned consumers */}
                                    {myTasks.length > 1 && (
                                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                                                Switch Assigned Audit ({myTasks.length} total):
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {myTasks.map(t => (
                                                    <button
                                                        key={t.consumer_id}
                                                        onClick={() => setSelectedConsumerId(t.consumer_id)}
                                                        style={{
                                                            padding: '0.35rem 0.75rem',
                                                            borderRadius: '6px',
                                                            background: currentTask.consumer_id === t.consumer_id ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                                                            color: currentTask.consumer_id === t.consumer_id ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem'
                                                        }}
                                                    >
                                                        <span>{t.consumer_id} (Tr: {t.transformer_id})</span>
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>&bull; {(((t.risk_score || 0.85)) * 100).toFixed(0)}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                            Map: Assigned Route & Meter Coordinates
                                        </h3>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            GPS: {currentTask.latitude}&deg; N, {currentTask.longitude}&deg; E
                                        </div>
                                    </div>
                                    
                                    {/* Leaflet Map with real coordinates & auto-zoom flyTo */}
                                    <div style={{ height: '380px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <MapComponent 
                                            data={activeMapData} 
                                            focusedConsumerId={currentTask?.consumer_id}
                                        />
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
                                        Field Audit Status Stepper
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
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.5rem', color: 'white' }}>In Process</span>
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
                                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                                    Confirm you have arrived at the geolocated installation site for consumer <strong style={{ color: 'white' }}>{currentTask.consumer_id}</strong> on <strong>Transformer {currentTask.transformer_id}</strong> ({currentTask.zone}).
                                                </p>
                                                <button
                                                    onClick={() => updateTaskStatus('Inprocess')}
                                                    style={{
                                                        background: '#ffffff', color: '#000000', padding: '0.75rem 2.2rem', 
                                                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none',
                                                        fontSize: '0.95rem'
                                                    }}
                                                >
                                                    Start On-Site Audit
                                                </button>
                                            </div>
                                        )}

                                        {inspectionStatus === 'Inprocess' && (
                                            <div style={{ width: '100%', maxWidth: '520px' }}>
                                                <h4 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>
                                                    Audit Checklist for Consumer {currentTask.consumer_id} (Transformer {currentTask.transformer_id})
                                                </h4>
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
                                                    placeholder="On-site audit findings (e.g. bypass cable discovered on Phase B, terminal seal replaced etc.)"
                                                    value={auditNotes}
                                                    onChange={e => setAuditNotes(e.target.value)}
                                                    style={{
                                                        width: '100%', height: '80px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '8px', color: 'white', padding: '0.75rem', fontSize: '0.85rem', outline: 'none', marginBottom: '1.25rem',
                                                        resize: 'vertical'
                                                    }}
                                                />

                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={completeInspection}
                                                        style={{
                                                            background: '#ffffff', color: '#000000', padding: '0.75rem 2rem', 
                                                            borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none',
                                                            fontSize: '0.95rem'
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
                                                    <CheckCircle size={36} />
                                                </div>
                                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem' }}>
                                                    Audit Completed for Consumer {currentTask.consumer_id}!
                                                </p>
                                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                                                    Audit logs and transformer verification have been synchronized with DISCOM central database.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const remainingTasks = myTasks.filter(t => t.consumer_id !== currentTask.consumer_id);
                                                        if (remainingTasks.length > 0) {
                                                            setSelectedConsumerId(remainingTasks[0].consumer_id);
                                                        } else {
                                                            updateTaskStatus('Initiate');
                                                        }
                                                        setCheckList({ sealIntact: false, hookingCheck: false, bypassDetected: false, terminalSecure: false });
                                                        setAuditNotes('');
                                                    }}
                                                    style={{
                                                        background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)',
                                                        padding: '0.65rem 1.75rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {myTasks.filter(t => (t.status || '').toLowerCase() !== 'completed').length > 1 ? 'Next Assigned Task' : 'Reset Inspection Stepper'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Standby State when no task is assigned */
                            <div style={{ 
                                background: 'var(--glass-bg)', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '16px', 
                                padding: '3.5rem 2rem',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'rgba(200, 162, 97, 0.1)', border: '1px solid rgba(200, 162, 97, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#c8a261', marginBottom: '1.25rem'
                                }}>
                                    <MapPin size={28} />
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                                    No Active Field Audits Assigned
                                </h3>
                                <p style={{ maxWidth: '500px', margin: '0 0 1.5rem 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    You are currently on standby for <strong>{inspector?.discom || 'your DISCOM'}</strong>. Once your administrator uploads consumption logs and assigns anomaly audit tasks to <strong>{inspector?.displayName || 'your account'}</strong>, the route, meter pins, and transformer mapping will automatically appear here.
                                </p>
                                <span style={{
                                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600'
                                }}>
                                    Status: Connected & Standby
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ACCOUNT DETAILS VIEW */}
                {activeTab === 'Account Details' && (
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue) 0%, #9c7446 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '600', color: 'white' }}>
                                {inspector?.displayName?.charAt(0) || 'I'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem' }}>{inspector?.displayName || 'Field Inspector'}</h3>
                                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: '600' }}>Senior Field Inspector</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Badge ID</span>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{inspector?.badgeId || 'INS-DEL-88402'}</span>
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Email</span>
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
                    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={20} style={{ color: 'var(--accent-blue)' }} />
                            Inspector Portal Configuration
                        </h3>

                        {/* Theme Toggle Section */}
                        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                                Appearance & Theme
                            </label>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Toggle between Dark Mode and Light Mode for optimal outdoor field visibility.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {/* Dark Mode Card */}
                                <div 
                                    onClick={() => setTheme('dark')}
                                    style={{
                                        background: theme === 'dark' ? 'rgba(200, 162, 97, 0.12)' : 'rgba(0, 0, 0, 0.15)',
                                        border: `2px solid ${theme === 'dark' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        borderRadius: '12px',
                                        padding: '1.1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        boxShadow: theme === 'dark' ? '0 0 15px rgba(200, 162, 97, 0.2)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        background: '#12100e',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#c8a261'
                                    }}>
                                        <Moon size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: theme === 'dark' ? 'white' : 'inherit' }}>Dark Theme</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Night & Low-Light</div>
                                    </div>
                                </div>

                                {/* Light Mode Card */}
                                <div 
                                    onClick={() => setTheme('light')}
                                    style={{
                                        background: theme === 'light' ? 'rgba(200, 162, 97, 0.12)' : 'rgba(0, 0, 0, 0.15)',
                                        border: `2px solid ${theme === 'light' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        borderRadius: '12px',
                                        padding: '1.1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        boxShadow: theme === 'light' ? '0 0 15px rgba(200, 162, 97, 0.2)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        background: '#ffffff',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#b38938'
                                    }}>
                                        <Sun size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: theme === 'light' ? '#0f172a' : 'inherit' }}>Light Theme</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Daylight & Sunlight</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Map Render Style</label>
                                <select style={{ padding: '0.7rem 1rem', background: 'var(--input-bg, #12100e)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                    <option>Standard Vector tiles (Adaptive)</option>
                                    <option>Satellite Orthophoto maps</option>
                                    <option>Standard Street Map (OpenStreetMap)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Offline Sync Syncing</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        <input type="checkbox" defaultChecked /> Auto Sync over cellular networks (3G/4G/5G)
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>GPS Tracking Precision</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                                    {['High Precision', 'Battery Saver'].map(mode => (
                                        <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
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
