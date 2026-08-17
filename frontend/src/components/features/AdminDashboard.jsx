import React, { useState, useEffect, useRef } from 'react';
import { 
    User, ListCollapse, Ban, TrendingUp, Calendar, AlertTriangle, 
    History as HistoryIcon, Settings as SettingsIcon, UploadCloud, 
    Download, RefreshCw, Layers, ShieldAlert, Sparkles, MapPin, 
    CheckCircle, UserCheck, LogOut, CheckSquare, Plus, Mail, Building2, Map, Menu, X, Edit2, Trash2 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import MapComponent from './MapComponent';
import { Download as DownloadPDFIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../supabaseClient';

// Mock Lists for tabs
const MOCK_INSPECTORS = ['Inspector R. Sharma', 'Inspector A. Verma', 'Inspector K. Gupta', 'Inspector S. Iyer'];

const AdminDashboard = ({ 
    user, 
    onLogout, 
    files, 
    loading, 
    result, 
    handleFileUpload, 
    handleFetch,
    setResult
}) => {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('vidyut_admin_active_tab') || 'Overview';
    });

    useEffect(() => {
        localStorage.setItem('vidyut_admin_active_tab', activeTab);
    }, [activeTab]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [localInspectionStatus, setLocalInspectionStatus] = useState({});
    const [assignedInspectors, setAssignedInspectors] = useState({});
    const [inspectorsDetails, setInspectorsDetails] = useState(() => {
        const saved = localStorage.getItem('vidyut_inspectors_details');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        return [
            { name: 'Inspector R. Sharma', badgeId: 'INS-DEL-88402', email: 'sharma@vidyut.com', discom: 'Tata Power DDL', created: 'Aug 10, 2026' },
            { name: 'Inspector A. Verma', badgeId: 'INS-DEL-77301', email: 'verma@vidyut.com', discom: 'BSES Yamuna', created: 'Aug 12, 2026' },
            { name: 'Inspector K. Gupta', badgeId: 'INS-DEL-99203', email: 'gupta@vidyut.com', discom: 'BSES Rajdhani', created: 'Aug 14, 2026' },
            { name: 'Inspector S. Iyer', badgeId: 'INS-DEL-55104', email: 'iyer@vidyut.com', discom: 'Tata Power DDL', created: 'Aug 15, 2026' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_inspectors_details', JSON.stringify(inspectorsDetails));
    }, [inspectorsDetails]);
    const inspectorsList = inspectorsDetails.map(ins => ins.name);
    const [editingInspectorName, setEditingInspectorName] = useState(null);
    const [editInspectorData, setEditInspectorData] = useState({ name: '', badgeId: '', email: '', discom: '', created: '' });
    const [newInspector, setNewInspector] = useState({ name: '', badgeId: '', email: '', password: '' });
    const [blacklistedConsumers, setBlacklistedConsumers] = useState([
        { id: 'CON-88301', addr: 'B-4, Rohini Sector 11', severity: '3rd Repeated Bypass', fine: '₹45,000', status: 'Meter Removed' },
        { id: 'CON-12499', addr: 'C-72, Shalimar Bagh', severity: 'Tampered Terminal Cover', fine: '₹12,500', status: 'Suspended Connection' },
        { id: 'CON-77402', addr: 'G-12, Karol Bagh Main', severity: 'Direct Tap Hooking', fine: '₹60,000', status: 'Criminal Legal Action' },
    ]);
    const [editingConsumerId, setEditingConsumerId] = useState(null);
    const [editConsumerData, setEditConsumerData] = useState({ id: '', addr: '', severity: '', fine: '', status: '' });
    const [newConsumerData, setNewConsumerData] = useState({ id: '', addr: '', severity: '', fine: '', status: 'Meter Removed' });
    const [isAddingConsumer, setIsAddingConsumer] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [inspectionCalendar, setInspectionCalendar] = useState([
        { consumer: 'CON-98401', zone: 'Sector 5 West', inspector: 'Inspector R. Sharma', status: 'Scheduled' },
        { consumer: 'CON-10938', zone: 'Punjabi Bagh North', inspector: 'Inspector A. Verma', status: 'Pending Review' },
        { consumer: 'CON-56402', zone: 'Karol Bagh St 2', inspector: 'Inspector K. Gupta', status: 'In Process' },
        { consumer: 'CON-33201', zone: 'Rohini Sector 11', inspector: 'Inspector S. Iyer', status: 'Completed' },
    ]);
    const [editingCalendarId, setEditingCalendarId] = useState(null);
    const [editCalendarData, setEditCalendarData] = useState({ consumer: '', zone: '', inspector: '', status: '' });
    
    const [uploadHistory, setUploadHistory] = useState(() => {
        const saved = localStorage.getItem('vidyut_upload_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_upload_history', JSON.stringify(uploadHistory));
    }, [uploadHistory]);

    // Fetch inspectors directory from Supabase — fires only once auth session is confirmed
    useEffect(() => {
        const fetchInspectors = async (session) => {
            if (!session) return; // Don't query if not authenticated

            const { data, error } = await supabase
                .from('inspectors')
                .select('*')
                .order('display_name', { ascending: true });

            if (error) {
                console.error("Error loading inspectors from Supabase:", error.message);
            } else if (data) {
                const formatted = data.map(ins => ({
                    name: ins.display_name,
                    badgeId: ins.badge_id || 'INS-GEN-01',
                    email: ins.email,
                    discom: ins.discom || 'Tata Power DDL',
                    created: ins.created_at ? new Date(ins.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 10, 2026'
                }));
                setInspectorsDetails(formatted);
            }
        };

        // Get the current session immediately (handles page refresh on Vercel)
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchInspectors(session);
        });

        // Also listen for future auth state changes (login events)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchInspectors(session);
        });

        return () => subscription.unsubscribe(); // Cleanup listener on unmount
    }, []);

    const reportRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto scroll to report when result is populated
    useEffect(() => {
        if (result && reportRef.current) {
            const timer = setTimeout(() => {
                reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [result]);

    // Save uploaded dataset permanently in history when result changes
    useEffect(() => {
        if (result) {
            const newHist = {
                name: selectedFile ? selectedFile.name : 'consumer_dataset.csv',
                date: new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: false 
                }),
                count: result.anomalies?.length || 0,
                critical: result.anomalies?.filter(a => a.risk_score >= 0.85).length || 0,
                size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
                data: result
            };
            setUploadHistory(prev => {
                if (prev.some(h => h.name === newHist.name && h.date.split(' ')[0] === newHist.date.split(' ')[0])) {
                    // Update result data if re-uploaded
                    return prev.map(h => h.name === newHist.name ? { ...h, data: result } : h);
                }
                return [newHist, ...prev];
            });
        }
    }, [result, selectedFile]);

    // Save inspector to Supabase DB & state (no auth.signUp — FK constraint must be removed in Supabase)
    const handleSaveInspector = async (formattedName, badgeId, email, _password = '', discom = 'Tata Power DDL') => {
        const generatedBadgeId = badgeId || `INS-DEL-${Math.floor(10000 + Math.random() * 90000)}`;

        // Generate a UUID for the id column (works once FK constraint to auth.users is dropped)
        const generatedUuid = crypto.randomUUID ? crypto.randomUUID() :
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

        const { error } = await supabase
            .from('inspectors')
            .insert([{
                id: generatedUuid,
                display_name: formattedName,
                badge_id: generatedBadgeId,
                email: email,
                discom: discom
            }])
            .select();

        if (error) {
            console.error("Database insert error:", error.message);
            alert(`Failed to add inspector: ${error.message}`);
            return false;
        }

        setInspectorsDetails(prev => [
            ...prev,
            {
                name: formattedName,
                badgeId: generatedBadgeId,
                email: email,
                discom: discom,
                created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
        ]);
        return true;
    };

    // Delete inspector from Supabase DB & state
    const handleDeleteInspector = async (insToDelete) => {
        const { error } = await supabase
            .from('inspectors')
            .delete()
            .eq('email', insToDelete.email);

        if (error) {
            console.error("Database delete error:", error.message);
            alert(`Database delete warning: ${error.message}`);
        }
        
        setInspectorsDetails(prev => prev.filter(item => item.email !== insToDelete.email));
    };

    // Update inspector details in Supabase DB & state
    const handleUpdateInspector = async (oldEmail, updatedIns) => {
        const { error } = await supabase
            .from('inspectors')
            .update({
                display_name: updatedIns.name,
                badge_id: updatedIns.badgeId,
                email: updatedIns.email,
                discom: updatedIns.discom
            })
            .eq('email', oldEmail);

        if (error) {
            console.error("Database update error:", error.message);
            alert(`Database update warning: ${error.message}`);
        }

        setInspectorsDetails(prev => prev.map(item => item.email === oldEmail ? updatedIns : item));
    };

    // Send login credential reset email to inspector via Supabase
    const [sendingCredentials, setSendingCredentials] = useState({});
    const handleSendCredentials = async (ins) => {
        if (!confirm(`Send login credentials email to ${ins.name} at ${ins.email}?`)) return;
        setSendingCredentials(prev => ({ ...prev, [ins.email]: true }));
        try {
            // Call Edge Function which uses admin API — creates auth account + sends invite email
            const { data, error } = await supabase.functions.invoke('send-credentials-email', {
                body: {
                    inspectorEmail: ins.email,
                    inspectorName: ins.name,
                    redirectTo: `${window.location.origin}/inspector-portal`
                }
            });

            if (error || data?.error) {
                const msg = data?.error || error?.message;
                console.error('Credential email error:', msg);
                alert(`Failed to send credentials: ${msg}`);
            } else {
                alert(`✅ Invite email sent to ${ins.email}!\n\n${ins.name} will receive a link to set their password and log in to the Inspector Portal.`);
            }
        } catch (err) {
            console.error('Unexpected error sending credentials:', err);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setSendingCredentials(prev => ({ ...prev, [ins.email]: false }));
        }
    };

    // Handle CSV download from history item
    const handleDownloadCSV = (hist) => {
        let anomalies = hist.data?.anomalies;
        if (!anomalies) {
            // Generate mock anomalies if no payload data exists
            anomalies = Array.from({ length: hist.count || 20 }, (_, i) => ({
                consumer_id: `CON-${90000 + i}`,
                risk_score: (0.95 - (i * 0.02)).toFixed(2),
                transformer_id: `TR-${100 + (i % 5)}`,
                metrics: { energy_consumed: (250 + (i * 12)) },
                anomaly_type: i % 2 === 0 ? 'Direct Tap Bypass' : 'Suspicious Load Drop'
            }));
        }
        
        const headers = ['Consumer ID', 'Risk Score', 'Transformer ID', 'Total Energy (kWh)', 'Anomaly Flag'];
        const rows = anomalies.map(a => [
            a.consumer_id,
            a.risk_score,
            a.transformer_id || '',
            a.metrics?.energy_consumed || '',
            a.anomaly_type || 'Suspicious Load Shift'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", hist.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle status change in table
    const handleStatusChange = (consumerId, newStatus) => {
        setLocalInspectionStatus(prev => ({
            ...prev,
            [consumerId]: newStatus
        }));
    };

    // Handle inspector assignment & sync with calendar
    const handleInspectorChange = (consumerId, inspector) => {
        setAssignedInspectors(prev => ({
            ...prev,
            [consumerId]: inspector
        }));

        if (inspector) {
            // Find consumer details in result to get zone
            const consumerObj = result?.anomalies?.find(a => a.consumer_id === consumerId);
            const zoneArea = consumerObj?.transformer_id ? `Transformer ${consumerObj.transformer_id}` : 'Sector 5 West';

            setInspectionCalendar(prev => {
                const exists = prev.some(item => item.consumer === consumerId);
                if (exists) {
                    return prev.map(item => item.consumer === consumerId ? { ...item, inspector: inspector } : item);
                } else {
                    return [...prev, { consumer: consumerId, zone: zoneArea, inspector: inspector, status: 'Scheduled' }];
                }
            });
        }
    };

    // Drag-and-drop handlers for dashboard upload
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            handleFileUpload('source', file);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            handleFileUpload('source', file);
        }
    };

    // Helper for Discom Logo initials
    const getInitials = (name) => {
        if (!name) return 'DS';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Calculate dynamic data for charts
    const chartData = React.useMemo(() => {
        if (!result) return { pie: [], bar: [] };

        const { anomalies, results } = result;

        // Pie chart calculations (Risk Distribution)
        const criticalCount = anomalies?.filter(a => a.risk_class === 'critical')?.length || 0;
        const highCount = anomalies?.filter(a => a.risk_class === 'high')?.length || 0;
        const totalProcessed = results?.length || 100;
        const normalCount = Math.max(0, totalProcessed - criticalCount - highCount);

        const pie = [
            { name: 'Critical Risk', value: criticalCount, color: '#ef4444' },
            { name: 'High Risk', value: highCount, color: '#f97316' },
            { name: 'Normal', value: normalCount, color: '#10b981' }
        ].filter(item => item.value > 0);

        // Bar/Line chart calculations (Transformer-wise anomalies)
        const transformerMap = {};
        results?.forEach(item => {
            const tId = item.transformer_id || 'T-Unknown';
            if (!transformerMap[tId]) {
                transformerMap[tId] = { name: tId, total: 0, critical: 0, high: 0 };
            }
            transformerMap[tId].total += 1;
            if (item.risk_class === 'critical') transformerMap[tId].critical += 1;
            if (item.risk_class === 'high') transformerMap[tId].high += 1;
        });

        const bar = Object.values(transformerMap).slice(0, 8); // top 8 transformers for visual clarity

        return { pie, bar };
    }, [result]);

    // Handle PDF report download
    const handleDownloadPDF = () => {
        if (!result) return;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text(`${user?.discom || 'Vidyut'} Theft Detection Report`, 14, 22);

        // Subtitle
        doc.setFontSize(10);
        doc.text(`State: ${user?.state || 'N/A'} | Generated: ${new Date().toLocaleString()}`, 14, 30);

        // Summary statistics
        const { summary, anomalies } = result;
        const summaryRows = [
            ['Grid Health Score', `${summary.grid_health_score}%`],
            ['Critical Cases Detected', summary.critical_cases],
            ['Anomalies Detected', summary.anomalies_detected],
            ['Estimated Technical Loss', `₹${summary.total_loss_calculated || 0}`]
        ];

        autoTable(doc, {
            startY: 40,
            head: [['Metric', 'Value']],
            body: summaryRows,
            theme: 'grid',
            headStyles: { fillColor: [200, 162, 97] }
        });

        // Anomalies Details Table
        if (anomalies && anomalies.length > 0) {
            doc.text("Detailed Detected Anomalies", 14, doc.lastAutoTable.finalY + 15);
            const anomalyRows = anomalies.map(item => [
                item.consumer_id,
                item.transformer_id,
                `${((item.aggregate_risk_score || 0) * 100).toFixed(0)}%`,
                item.risk_class.toUpperCase(),
                localInspectionStatus[item.consumer_id] || 'Initiated',
                assignedInspectors[item.consumer_id] || 'Unassigned'
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Consumer ID', 'Transformer ID', 'Risk Score', 'Risk Class', 'Inspection Status', 'Assigned Inspector']],
                body: anomalyRows,
                theme: 'striped',
                headStyles: { fillColor: [239, 68, 68] }
            });
        }

        doc.save(`${user?.discom?.replace(/\s+/g, '_')}_Theft_Report.pdf`);
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
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

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div className="discom-logo-badge">
                            {getInitials(user?.discom)}
                        </div>
                        <div className="discom-info">
                            <span className="discom-name" title={user?.discom}>
                                {user?.discom || 'Discom Panel'}
                            </span>
                            <span className="discom-sub">
                                {user?.state || 'Admin Portal'}
                            </span>
                        </div>
                    </div>
                    <button 
                        className="mobile-sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Overview'); setIsSidebarOpen(false); }}
                    >
                        <Layers size={18} /> Overview
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Account Details' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Account Details'); setIsSidebarOpen(false); }}
                    >
                        <User size={18} /> Account Details
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Transformer List' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Transformer List'); setIsSidebarOpen(false); }}
                    >
                        <ListCollapse size={18} /> Transformer List
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Blacklisted Consumer' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Blacklisted Consumer'); setIsSidebarOpen(false); }}
                    >
                        <Ban size={18} /> Blacklisted Consumer
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Loss Recovery' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Loss Recovery'); setIsSidebarOpen(false); }}
                    >
                        <TrendingUp size={18} /> Loss Recovery
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Inspection' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Inspection'); setIsSidebarOpen(false); }}
                    >
                        <Calendar size={18} /> Inspection
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Inspector List' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Inspector List'); setIsSidebarOpen(false); }}
                    >
                        <UserCheck size={18} /> Inspector List
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Priority' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Priority'); setIsSidebarOpen(false); }}
                    >
                        <ShieldAlert size={18} /> Priority
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'History' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('History'); setIsSidebarOpen(false); }}
                    >
                        <HistoryIcon size={18} /> History
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('Settings'); setIsSidebarOpen(false); }}
                    >
                        <SettingsIcon size={18} /> Settings
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="mobile-sidebar-hamburger"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        >
                            <Menu size={22} />
                        </button>
                        <h1 className="header-title">{activeTab}</h1>
                    </div>
                    <div className="header-meta">
                        <span className="header-role-badge">Admin Workspace</span>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            Logged in as: <strong style={{ color: 'white' }}>{user?.email}</strong>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Render panels dynamically based on active tab */}
                    {activeTab === 'Overview' && (
                        <div className="dashboard-panel">
                            {/* Visualizations: Pie Chart and Bar Graphs */}
                            {result ? (
                                <div className="charts-grid">
                                    <div className="chart-card">
                                        <h3>Risk Distribution</h3>
                                        <div className="chart-container-inner">
                                            <ResponsiveContainer width="100%" height={260}>
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.pie}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {chartData.pie.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '0.8rem', marginTop: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="chart-card">
                                        <h3>Anomalies by Transformer</h3>
                                        <div className="chart-container-inner">
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart data={chartData.bar}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.75rem' }} />
                                                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.75rem' }} />
                                                    <Tooltip 
                                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                    <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
                                                    <Bar dataKey="high" name="High Risk" fill="#f97316" stackId="a" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="charts-grid">
                                    {/* Pre-upload Mock Visualizations - Defaulting to 0 */}
                                    <div className="chart-card">
                                        <h3>Risk Distribution</h3>
                                        <div className="chart-container-inner" style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', textAlign: 'center' }}>
                                                No Data Loaded
                                            </div>
                                            <ResponsiveContainer width="100%" height={260}>
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Critical Risk', value: 0, color: '#ef4444' },
                                                            { name: 'High Risk', value: 0, color: '#f97316' },
                                                            { name: 'Normal', value: 0, color: '#10b981' }
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {[
                                                            { color: '#ef4444' },
                                                            { color: '#f97316' },
                                                            { color: '#10b981' }
                                                        ].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="chart-card">
                                        <h3>Transformer Loading & Risk</h3>
                                        <div className="chart-container-inner" style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', textAlign: 'center' }}>
                                                No Data Loaded
                                            </div>
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart data={[
                                                    { name: 'TR-101', critical: 0, high: 0 },
                                                    { name: 'TR-102', critical: 0, high: 0 },
                                                    { name: 'TR-103', critical: 0, high: 0 },
                                                    { name: 'TR-104', critical: 0, high: 0 }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.75rem' }} />
                                                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.75rem' }} />
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                    <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
                                                    <Bar dataKey="high" name="High Risk" fill="#f97316" stackId="a" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dashboard Upload Dataset Section */}
                            <section className="dashboard-upload"
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                            >
                                <h2 className="dashboard-upload-title">Analyze New Consumer Dataset</h2>
                                <p className="dashboard-upload-desc">
                                    Drag and drop your electricity consumption dataset (.csv) here, or select it manually to run advanced anomaly theft detection algorithms.
                                </p>
                                <div className="upload-row">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: '2px dashed rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            background: dragActive ? 'rgba(200, 162, 97, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                                            borderColor: dragActive ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <UploadCloud size={32} style={{ color: 'var(--accent-blue)' }} />
                                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>
                                            {selectedFile ? selectedFile.name : 'Choose File or Drop Here'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                            CSV file format required
                                        </span>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileSelect} 
                                            style={{ display: 'none' }} 
                                            accept=".csv"
                                        />
                                    </div>
                                    <div className="dashboard-fetch-container">
                                        <button
                                            onClick={handleFetch}
                                            disabled={loading || !selectedFile}
                                            style={{
                                                padding: '0.85rem 2.2rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: selectedFile ? '#ffffff' : 'rgba(255,255,255,0.05)',
                                                color: selectedFile ? '#000000' : 'rgba(255,255,255,0.3)',
                                                fontWeight: '600',
                                                cursor: (loading || !selectedFile) ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
                                            {loading ? 'Processing ML Pipeline...' : 'Fetch & Analyse'}
                                        </button>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.75rem' }}>
                                            Click to start high voltage classification analysis
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Analysis Report Anchor */}
                            {result && (
                                <div id="analysis-report" ref={reportRef} className="dashboard-panel" style={{ scrollMarginTop: '90px' }}>
                                    
                                    {/* Metric summary row with Download PDF */}
                                    <div className="summary-row">
                                        <div className="summary-btn-card health">
                                            <h4>Grid Health</h4>
                                            <div className="value">{result.summary.grid_health_score}%</div>
                                            <p>Overall System Status</p>
                                        </div>
                                        <div className="summary-btn-card critical">
                                            <h4>Critical Cases</h4>
                                            <div className="value">{result.summary.critical_cases}</div>
                                            <p>Immediate Action Required</p>
                                        </div>
                                        <div className="summary-btn-card anomalies">
                                            <h4>Anomalies</h4>
                                            <div className="value">{result.summary.anomalies_detected}</div>
                                            <p>Total Suspicious Consumers</p>
                                        </div>
                                        <div className="summary-btn-card loss">
                                            <h4>T&D Loss</h4>
                                            <div className="value">₹{result.summary.total_loss_calculated.toString().replace(/,/g, '')}</div>
                                            <p>Potential Revenue Loss</p>
                                        </div>
                                        <button className="download-btn" onClick={handleDownloadPDF}>
                                            <Download size={18} /> Download PDF
                                        </button>
                                    </div>

                                    {/* Map Component */}
                                    <div className="map-card">
                                        <h3><MapPin size={20} style={{ color: '#ef4444' }} /> Geographic Anomaly Mapping</h3>
                                        <div style={{ height: '420px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                                            <MapComponent data={result} />
                                        </div>
                                    </div>

                                    {/* Detected Anomalies Table */}
                                    <div className="anomalies-card">
                                        <h3>Detected Anomalies</h3>
                                        <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                            <table className="anomalies-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Consumer ID</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Transformer ID</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Risk Score</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Risk Class</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Inspection Status</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Assign Inspector</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.anomalies.map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                                                            <td style={{ padding: '1rem', fontWeight: '500', fontSize: '0.9rem' }}>{item.consumer_id}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{item.transformer_id}</td>
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: item.risk_class === 'critical' ? '#ef4444' : '#f97316', fontSize: '0.9rem' }}>
                                                                {((item.aggregate_risk_score || 0) * 100).toFixed(0)}%
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span className={`badge ${item.risk_class}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                                                                    {item.risk_class}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <select
                                                                    value={localInspectionStatus[item.consumer_id] || 'Initiated'}
                                                                    onChange={(e) => handleStatusChange(item.consumer_id, e.target.value)}
                                                                    className="table-select"
                                                                >
                                                                    <option value="Initiated">Initiated</option>
                                                                    <option value="In Process">In Process</option>
                                                                    <option value="Completed">Completed</option>
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <select
                                                                    value={assignedInspectors[item.consumer_id] || ''}
                                                                    onChange={(e) => handleInspectorChange(item.consumer_id, e.target.value)}
                                                                    className="table-select"
                                                                    style={{ 
                                                                        borderColor: assignedInspectors[item.consumer_id] ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)',
                                                                        color: assignedInspectors[item.consumer_id] ? '#10b981' : 'white'
                                                                    }}
                                                                >
                                                                    <option value="">-- Assign Inspector --</option>
                                                                    {inspectorsList.map(insp => (
                                                                        <option key={insp} value={insp}>{insp}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Account Details' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">Administrator Profile</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="dashboard-form-group">
                                        <label>Email Address</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{user?.email}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Role</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>DISCOM Administrator</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Selected DISCOM</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{user?.discom || 'Tata Power'}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>State Jurisdiction</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{user?.state || 'Delhi'}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Associated System Node ID</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>NODE-DISCOM-{getInitials(user?.discom)}-09</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Authentication Token Uid</label>
                                        <div className="dashboard-form-input" style={{ background: 'rgba(255,255,255,0.02)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{user?.uid}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Transformer List' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">Active Transformers Mapping</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Transformer ID</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Location Zone</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Grid Load</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Health Index</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Anomalies Flagged</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { id: 'TR-101', loc: 'Delhi North Central', load: '84 kW / 100 kW', health: 'Excellent', count: 0 },
                                            { id: 'TR-102', loc: 'Rani Bagh St. 4', load: '95 kW / 100 kW', health: 'Critical Overload', count: 3 },
                                            { id: 'TR-103', loc: 'Punjabi Bagh Ring Road', load: '62 kW / 100 kW', health: 'Good', count: 1 },
                                            { id: 'TR-104', loc: 'Rohini Sector 7', load: '108 kW / 100 kW', health: 'Severe Surge Risk', count: 4 },
                                            { id: 'TR-105', loc: 'Pitampura Enclave', load: '45 kW / 100 kW', health: 'Excellent', count: 0 },
                                        ].map((tr, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '600' }}>{tr.id}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{tr.loc}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{tr.load}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ 
                                                        color: tr.health.includes('Excellent') || tr.health.includes('Good') ? '#10b981' : '#ef4444', 
                                                        background: tr.health.includes('Excellent') || tr.health.includes('Good') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {tr.health}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: '700', color: tr.count > 0 ? '#f97316' : '#fff' }}>{tr.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Blacklisted Consumer' && (
                        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Add Consumer Form (Toggleable) */}
                            {isAddingConsumer && (
                                <div className="panel-card" style={{ animation: 'fade-in 0.3s ease-out' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 className="panel-title" style={{ margin: 0 }}>Add Suspended / Blacklisted Consumer</h3>
                                        <button 
                                            onClick={() => setIsAddingConsumer(false)}
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (newConsumerData.id && newConsumerData.addr) {
                                                setBlacklistedConsumers([...blacklistedConsumers, newConsumerData]);
                                                setNewConsumerData({ id: '', addr: '', severity: '', fine: '', status: 'Meter Removed' });
                                                setIsAddingConsumer(false);
                                            } else {
                                                alert("Consumer ID and Address Block are required.");
                                            }
                                        }}
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Consumer ID *</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.id}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, id: e.target.value })}
                                                placeholder="e.g. CON-88301"
                                                required
                                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Address Block *</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.addr}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, addr: e.target.value })}
                                                placeholder="e.g. B-4, Rohini Sector 11"
                                                required
                                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Offense Severity</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.severity}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, severity: e.target.value })}
                                                placeholder="e.g. 3rd Repeated Bypass"
                                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Fine Imposed</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.fine}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, fine: e.target.value })}
                                                placeholder="e.g. ₹45,000"
                                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Enforcement Status</label>
                                            <select 
                                                value={newConsumerData.status}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, status: e.target.value })}
                                                style={{ padding: '0.6rem 0.8rem', background: 'rgba(18,16,14,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                                            >
                                                <option value="Meter Removed">Meter Removed</option>
                                                <option value="Suspended Connection">Suspended Connection</option>
                                                <option value="Criminal Legal Action">Criminal Legal Action</option>
                                                <option value="Under Probation">Under Probation</option>
                                            </select>
                                        </div>
                                        <button 
                                            type="submit"
                                            style={{ padding: '0.65rem 1.25rem', background: 'white', color: 'black', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                        >
                                            Save Consumer
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Blacklist Table */}
                            <div className="panel-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 className="panel-title" style={{ margin: 0 }}>Suspended & Blacklisted Consumers</h3>
                                    {!isAddingConsumer && (
                                        <button 
                                            onClick={() => setIsAddingConsumer(true)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                background: 'rgba(200, 162, 97, 0.15)', border: '1px solid rgba(200, 162, 97, 0.3)',
                                                color: 'var(--accent-blue)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(200, 162, 97, 0.25)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(200, 162, 97, 0.15)'}
                                        >
                                            <Plus size={16} /> Add Consumer
                                        </button>
                                    )}
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Consumer ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Address Block</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Offense Severity</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Fine Imposed</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Status</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {blacklistedConsumers.map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {editingConsumerId === c.id ? (
                                                        <>
                                                            {/* Inline Editing Mode */}
                                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{c.id}</td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.addr}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, addr: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.severity}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, severity: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.fine}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, fine: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <select 
                                                                    value={editConsumerData.status}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, status: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(18,16,14,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem' }}
                                                                >
                                                                    <option value="Meter Removed">Meter Removed</option>
                                                                    <option value="Suspended Connection">Suspended Connection</option>
                                                                    <option value="Criminal Legal Action">Criminal Legal Action</option>
                                                                    <option value="Under Probation">Under Probation</option>
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setBlacklistedConsumers(blacklistedConsumers.map(item => item.id === c.id ? editConsumerData : item));
                                                                            setEditingConsumerId(null);
                                                                        }}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingConsumerId(null)}
                                                                        style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Normal Static Mode */}
                                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{c.id}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{c.addr}</td>
                                                            <td style={{ padding: '1rem', color: '#f97316', fontWeight: '500' }}>{c.severity}</td>
                                                            <td style={{ padding: '1rem', fontWeight: '700' }}>{c.fine}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingConsumerId(c.id);
                                                                            setEditConsumerData(c);
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (confirm(`Are you sure you want to delete blacklisted consumer ${c.id}?`)) {
                                                                                setBlacklistedConsumers(blacklistedConsumers.filter(item => item.id !== c.id));
                                                                            }
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Loss Recovery' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">T&D Loss Recovery Dashboard</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Target Recovery (Q3)</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginTop: '0.25rem' }}>₹12.4 Lakhs</div>
                                        </div>
                                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Realized Recovery</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>₹5.8 Lakhs</div>
                                        </div>
                                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Recovery Progress Rate</span>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent-blue)', marginTop: '0.25rem' }}>46.7%</div>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(18,16,14,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '0.95rem' }}>Monthly Recovery Trend</h4>
                                        <div style={{ flex: 1, minHeight: '200px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={[
                                                    { month: 'May', Target: 1.5, Recovered: 0.9 },
                                                    { month: 'Jun', Target: 2.0, Recovered: 1.4 },
                                                    { month: 'Jul', Target: 2.5, Recovered: 2.1 },
                                                    { month: 'Aug', Target: 3.0, Recovered: 1.4 }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                                                    <YAxis stroke="rgba(255,255,255,0.5)" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="Target" stroke="#c8a261" activeDot={{ r: 8 }} />
                                                    <Line type="monotone" dataKey="Recovered" stroke="#10b981" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Inspection' && (
                        <div className="dashboard-panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                            {/* Calendar List (Editable) */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Field Inspection Calendar</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Consumer ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Zone Area</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Assigned Inspector</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Status</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inspectionCalendar.map((ins, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {editingCalendarId === ins.consumer ? (
                                                        <>
                                                            {/* Inline Calendar Edit */}
                                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{ins.consumer}</td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={editCalendarData.zone}
                                                                    onChange={e => setEditCalendarData({ ...editCalendarData, zone: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <select 
                                                                    value={editCalendarData.inspector}
                                                                    onChange={e => setEditCalendarData({ ...editCalendarData, inspector: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(18,16,14,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem' }}
                                                                >
                                                                    <option value="">-- Unassigned --</option>
                                                                    {inspectorsList.map(insp => (
                                                                        <option key={insp} value={insp}>{insp}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <select 
                                                                    value={editCalendarData.status}
                                                                    onChange={e => setEditCalendarData({ ...editCalendarData, status: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(18,16,14,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem' }}
                                                                >
                                                                    <option value="Scheduled">Scheduled</option>
                                                                    <option value="Pending Review">Pending Review</option>
                                                                    <option value="In Process">In Process</option>
                                                                    <option value="Completed">Completed</option>
                                                                </select>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setInspectionCalendar(inspectionCalendar.map(item => item.consumer === ins.consumer ? editCalendarData : item));
                                                                            setEditingCalendarId(null);
                                                                        }}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingCalendarId(null)}
                                                                        style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Normal Static Calendar View */}
                                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{ins.consumer}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.zone}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.inspector || <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{ 
                                                                    color: ins.status === 'Completed' ? '#10b981' : ins.status === 'In Process' ? '#c8a261' : '#f59e0b',
                                                                    background: ins.status === 'Completed' ? 'rgba(16,185,129,0.1)' : ins.status === 'In Process' ? 'rgba(200,162,97,0.15)' : 'rgba(245,158,11,0.1)',
                                                                    padding: '0.2rem 0.5rem', 
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    {ins.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingCalendarId(ins.consumer);
                                                                            setEditCalendarData(ins);
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (confirm(`Remove consumer ${ins.consumer} from inspection calendar?`)) {
                                                                                setInspectionCalendar(inspectionCalendar.filter(item => item.consumer !== ins.consumer));
                                                                            }
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Generate Inspector Credential Form */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Generate Inspector Credential</h3>
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (newInspector.name && newInspector.email && newInspector.password) {
                                            const formattedName = `Inspector ${newInspector.name}`;
                                            if (inspectorsList.includes(formattedName)) {
                                                alert("Inspector name already exists!");
                                                return;
                                            }
                                            const success = await handleSaveInspector(formattedName, newInspector.badgeId, newInspector.email, newInspector.password, 'Tata Power DDL');
                                            if (success) {
                                                alert(`Account credentials generated successfully for ${formattedName} (Badge ID: ${newInspector.badgeId || 'INS-GEN-01'}). Credentials synced to Supabase database.`);
                                                setNewInspector({ name: '', badgeId: '', email: '', password: '' });
                                            }
                                        } else {
                                            alert("Please fill in name, email and password.");
                                        }
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Inspector Full Name *</label>
                                        <input 
                                            type="text"
                                            value={newInspector.name}
                                            onChange={e => setNewInspector({ ...newInspector, name: e.target.value })}
                                            placeholder="e.g. R. Sharma"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Badge Identification ID</label>
                                        <input 
                                            type="text"
                                            value={newInspector.badgeId}
                                            onChange={e => setNewInspector({ ...newInspector, badgeId: e.target.value })}
                                            placeholder="e.g. INS-DEL-88402"
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Email Address *</label>
                                        <input 
                                            type="email"
                                            value={newInspector.email}
                                            onChange={e => setNewInspector({ ...newInspector, email: e.target.value })}
                                            placeholder="e.g. inspector@vidyut.com"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Temporary Access Password *</label>
                                        <input 
                                            type="password"
                                            value={newInspector.password}
                                            onChange={e => setNewInspector({ ...newInspector, password: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        style={{
                                            background: 'white', color: 'black', padding: '0.75rem 1.5rem', 
                                            borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem'
                                        }}
                                    >
                                        Generate Inspector Credential
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Inspector List' && (
                        <div className="dashboard-panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                            {/* Inspectors directory */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Field Inspectors Directory</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Inspector Name</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Badge ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Email</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Credentials</th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inspectorsDetails.map((ins, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    {editingInspectorName === ins.name ? (
                                                        <>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={editInspectorData.name}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, name: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={editInspectorData.badgeId}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, badgeId: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="email"
                                                                    value={editInspectorData.email}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, email: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>{/* Credentials column placeholder in edit mode */}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            handleUpdateInspector(ins.email, editInspectorData);
                                                                            setEditingInspectorName(null);
                                                                        }}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingInspectorName(null)}
                                                                        style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{ins.name}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.badgeId}</td>
                                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{ins.email}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleSendCredentials(ins)}
                                                                    disabled={sendingCredentials[ins.email]}
                                                                    style={{
                                                                        padding: '0.35rem 0.75rem',
                                                                        background: sendingCredentials[ins.email] ? 'rgba(200,162,97,0.2)' : 'rgba(200,162,97,0.15)',
                                                                        color: sendingCredentials[ins.email] ? 'rgba(200,162,97,0.5)' : '#c8a261',
                                                                        border: '1px solid rgba(200,162,97,0.3)',
                                                                        borderRadius: '6px',
                                                                        cursor: sendingCredentials[ins.email] ? 'not-allowed' : 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '600',
                                                                        whiteSpace: 'nowrap',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem',
                                                                        margin: '0 auto'
                                                                    }}
                                                                    title={`Send login credentials to ${ins.email}`}
                                                                >
                                                                    <Mail size={13} />
                                                                    {sendingCredentials[ins.email] ? 'Sending...' : 'Send Credentials'}
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingInspectorName(ins.name);
                                                                            setEditInspectorData(ins);
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (confirm(`Are you sure you want to remove ${ins.name} from the inspectors directory?`)) {
                                                                                handleDeleteInspector(ins);
                                                                            }
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Add Inspector Card */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Add Field Inspector Record</h3>
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (newInspector.name && newInspector.email) {
                                            const formattedName = newInspector.name.startsWith('Inspector ') ? newInspector.name : `Inspector ${newInspector.name}`;
                                            if (inspectorsList.includes(formattedName)) {
                                                alert("Inspector name already exists!");
                                                return;
                                            }
                                            const success = await handleSaveInspector(formattedName, newInspector.badgeId, newInspector.email, '', 'Tata Power DDL');
                                            if (success) {
                                                alert(`Inspector ${formattedName} added successfully to portal records.`);
                                                setNewInspector({ name: '', badgeId: '', email: '', password: '' });
                                            }
                                        } else {
                                            alert("Please enter Name and Email Address.");
                                        }
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Full Name *</label>
                                        <input 
                                            type="text"
                                            value={newInspector.name}
                                            onChange={e => setNewInspector({ ...newInspector, name: e.target.value })}
                                            placeholder="e.g. S. Iyer"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Badge Identification ID</label>
                                        <input 
                                            type="text"
                                            value={newInspector.badgeId}
                                            onChange={e => setNewInspector({ ...newInspector, badgeId: e.target.value })}
                                            placeholder="e.g. INS-DEL-55104"
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Email Address *</label>
                                        <input 
                                            type="email"
                                            value={newInspector.email}
                                            onChange={e => setNewInspector({ ...newInspector, email: e.target.value })}
                                            placeholder="e.g. iyer@vidyut.com"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(200, 162, 97, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        style={{
                                            background: 'white', color: 'black', padding: '0.75rem 1.5rem', 
                                            borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.5rem'
                                        }}
                                    >
                                        Add Inspector Record
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Priority' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">High Risk Priority Pipeline</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { title: 'TR-102 Overload Bypass', risk: 'CRITICAL', score: '98%', consumers: 'CON-12499', action: 'Direct dispatch of Inspector A. Verma for site auditing.' },
                                        { title: 'Carbonized Terminals Probe', risk: 'HIGH', score: '89%', consumers: 'CON-33201, CON-90234', action: 'Verify customer meter box health. Install seal guards.' },
                                        { title: 'Karol Bagh Tap Bypass', risk: 'CRITICAL', score: '96%', consumers: 'CON-77402', action: 'Police-assisted site raid due to hostile commercial bypass.' },
                                    ].map((pri, i) => (
                                        <div key={i} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>{pri.title}</h4>
                                                <span style={{ 
                                                    background: pri.risk === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                                                    color: pri.risk === 'CRITICAL' ? '#ef4444' : '#f97316',
                                                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700'
                                                }}>{pri.risk}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                                Flagged Score: <strong style={{ color: 'white' }}>{pri.score}</strong> | Target: <strong style={{ color: 'white' }}>{pri.consumers}</strong>
                                            </div>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
                                                {pri.action}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'History' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 className="panel-title" style={{ margin: 0 }}>Analysis Files History</h3>
                                    {uploadHistory.length > 0 && (
                                        <button 
                                            onClick={() => {
                                                if (confirm("Are you sure you want to clear all history records?")) {
                                                    setUploadHistory([]);
                                                }
                                            }}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.8rem'
                                            }}
                                        >
                                            Clear All History
                                        </button>
                                    )}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(18,16,14,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Filename</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Uploaded On</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Consumers Analyzed</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Critical Flags</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Load Results</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                                    No analysis history logs found. Upload a CSV dataset on the Overview tab to initiate an analysis.
                                                </td>
                                            </tr>
                                        ) : uploadHistory.map((hist, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '500' }}>{hist.name}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{hist.date}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{hist.count} consumers</td>
                                                <td style={{ padding: '1rem', color: '#ef4444', fontWeight: '600' }}>{hist.critical}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button 
                                                            style={{ 
                                                                background: 'rgba(200, 162, 97, 0.15)', 
                                                                border: 'none', 
                                                                color: 'var(--accent-blue)', 
                                                                padding: '0.25rem 0.75rem', 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                            onClick={() => {
                                                                if (hist.data) {
                                                                    setResult(hist.data);
                                                                    setActiveTab('Overview');
                                                                } else {
                                                                    alert("No dynamic payload saved for this older record. Loading default visualizers instead.");
                                                                    setActiveTab('Overview');
                                                                }
                                                            }}
                                                        >
                                                            Review
                                                        </button>
                                                        <button 
                                                            style={{ 
                                                                background: 'rgba(255, 255, 255, 0.08)', 
                                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                                color: 'white', 
                                                                padding: '0.25rem 0.75rem', 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                            onClick={() => handleDownloadCSV(hist)}
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Settings' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">Threshold Configurator</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="dashboard-form-group">
                                        <label>Critical Anomaly Risk Level Threshold ({'>'}= 85%)</label>
                                        <input type="range" min="50" max="100" defaultValue="85" style={{ cursor: 'pointer', width: '100%', accentColor: '#ef4444' }} />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>High Anomaly Risk Level Threshold (60% - 85%)</label>
                                        <input type="range" min="30" max="80" defaultValue="60" style={{ cursor: 'pointer', width: '100%', accentColor: '#f97316' }} />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Technical Loss Estimation Rate (INR per kWh)</label>
                                        <input type="number" defaultValue="7.50" className="dashboard-form-input" />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Auto-Dispatch Priority Inspections</label>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="radio" name="auto-dispatch" defaultChecked /> Enable
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="radio" name="auto-dispatch" /> Disable
                                            </label>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => alert("Settings saved successfully!")}
                                        style={{ 
                                            padding: '0.75rem 1.5rem', 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            background: '#ffffff', 
                                            color: '#000000', 
                                            fontWeight: '600', 
                                            cursor: 'pointer',
                                            alignSelf: 'flex-start',
                                            marginTop: '1rem',
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
