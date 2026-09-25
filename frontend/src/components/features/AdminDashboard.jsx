import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    User, ListCollapse, Ban, TrendingUp, Calendar, AlertTriangle, 
    History as HistoryIcon, Settings as SettingsIcon, UploadCloud, 
    Download, RefreshCw, Layers, ShieldAlert, Sparkles, MapPin, 
    CheckCircle, UserCheck, LogOut, CheckSquare, Plus, Mail, Building2, Map, Menu, X, Edit2, Trash2, Activity, Zap, Lock, RotateCcw,
    Search, ArrowUpRight, TrendingDown, Bell, ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import MapComponent from './MapComponent';
import RealisticAnalysisLoader from './RealisticAnalysisLoader';
import { Download as DownloadPDFIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../supabaseClient';

// Mock Lists for tabs
const MOCK_INSPECTORS = ['Inspector R. Sharma', 'Inspector A. Verma', 'Inspector K. Gupta', 'Inspector S. Iyer'];

const TAB_SLUGS = {
    'Overview': 'overview',
    'Account Details': 'account',
    'Transformer List': 'transformers',
    'Blacklisted Consumer': 'blacklisted',
    'Loss Recovery': 'loss-recovery',
    'Inspection': 'inspections',
    'Inspector List': 'inspectors',
    'Priority': 'priority',
    'History': 'history',
    'Settings': 'settings'
};

const SLUG_TO_TAB = {
    'overview': 'Overview',
    'account': 'Account Details',
    'account-details': 'Account Details',
    'transformers': 'Transformer List',
    'transformer-list': 'Transformer List',
    'blacklisted': 'Blacklisted Consumer',
    'blacklisted-consumer': 'Blacklisted Consumer',
    'blacklist': 'Blacklisted Consumer',
    'loss-recovery': 'Loss Recovery',
    'recovery': 'Loss Recovery',
    'inspections': 'Inspection',
    'inspection': 'Inspection',
    'calendar': 'Inspection',
    'inspectors': 'Inspector List',
    'inspector-list': 'Inspector List',
    'priority': 'Priority',
    'history': 'History',
    'settings': 'Settings'
};

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
    const navigate = useNavigate();
    const { tab: urlTab } = useParams();

    const [chartPeriod, setChartPeriod] = useState('Month');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [bannerVisible, setBannerVisible] = useState(true);

    const [activeTab, setActiveTab] = useState(() => {
        if (urlTab && SLUG_TO_TAB[urlTab.toLowerCase()]) {
            return SLUG_TO_TAB[urlTab.toLowerCase()];
        }
        return localStorage.getItem('vidyut_admin_active_tab') || 'Overview';
    });

    useEffect(() => {
        if (urlTab && SLUG_TO_TAB[urlTab.toLowerCase()]) {
            setActiveTab(SLUG_TO_TAB[urlTab.toLowerCase()]);
        }
    }, [urlTab]);

    useEffect(() => {
        localStorage.setItem('vidyut_admin_active_tab', activeTab);
    }, [activeTab]);

    const switchTab = (tabName) => {
        setActiveTab(tabName);
        setIsSidebarOpen(false);
        const slug = TAB_SLUGS[tabName] || 'overview';
        navigate(`/admin/${slug}`, { replace: true });
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [localInspectionStatus, setLocalInspectionStatus] = useState(() => {
        const saved = localStorage.getItem('vidyut_local_inspection_status');
        const calSaved = localStorage.getItem('vidyut_inspection_calendar');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                let validConsumers = [];
                if (calSaved) {
                    try { validConsumers = JSON.parse(calSaved).map(c => c.consumer); } catch(e) {}
                }
                const clean = {};
                Object.entries(parsed).forEach(([k, v]) => {
                    if (v && (validConsumers.length === 0 || validConsumers.includes(k))) {
                        clean[k] = v;
                    }
                });
                return clean;
            } catch (e) { console.error(e); }
        }
        return {};
    });

    const [assignedInspectors, setAssignedInspectors] = useState(() => {
        const saved = localStorage.getItem('vidyut_assigned_inspectors');
        const calSaved = localStorage.getItem('vidyut_inspection_calendar');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                let validConsumers = [];
                if (calSaved) {
                    try { validConsumers = JSON.parse(calSaved).map(c => c.consumer); } catch(e) {}
                }
                const clean = {};
                Object.entries(parsed).forEach(([k, v]) => {
                    if (v && (validConsumers.length === 0 || validConsumers.includes(k))) {
                        clean[k] = v;
                    }
                });
                return clean;
            } catch (e) { console.error(e); }
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(localInspectionStatus));
    }, [localInspectionStatus]);

    useEffect(() => {
        localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(assignedInspectors));
    }, [assignedInspectors]);

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
    const [blacklistedConsumers, setBlacklistedConsumers] = useState(() => {
        const saved = localStorage.getItem('vidyut_blacklisted_consumers');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error(e);
            }
        }
        return [
            { id: 'C0133', addr: 'Transformer T03 • Sector 5', severity: 'Direct Line Hooking', fine: '₹1,00,000', status: 'Meter Removed' },
            { id: 'C112', addr: 'Transformer T01 • Central Feeder', severity: 'Direct Line Hooking', fine: '₹40,000', status: 'Suspended Connection' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_blacklisted_consumers', JSON.stringify(blacklistedConsumers));
    }, [blacklistedConsumers]);
    const [editingConsumerId, setEditingConsumerId] = useState(null);
    const [editConsumerData, setEditConsumerData] = useState({ id: '', addr: '', severity: '', fine: '', status: '' });
    const [newConsumerData, setNewConsumerData] = useState({ id: '', addr: '', severity: '', fine: '', status: 'Meter Removed' });
    const [isAddingConsumer, setIsAddingConsumer] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [inspectionCalendar, setInspectionCalendar] = useState(() => {
        const saved = localStorage.getItem('vidyut_inspection_calendar');
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
        localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(inspectionCalendar));
    }, [inspectionCalendar]);

    const [editingCalendarId, setEditingCalendarId] = useState(null);
    const [editCalendarData, setEditCalendarData] = useState({ consumer: '', zone: '', inspector: '', status: '' });
    
    const [uploadHistory, setUploadHistory] = useState(() => {
        const saved = localStorage.getItem('vidyut_upload_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => item.name && !item.name.startsWith('consumer_dataset_'));
                }
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_upload_history', JSON.stringify(uploadHistory));
    }, [uploadHistory]);

    // Real-time Field Challans issued by Inspectors
    const [challans, setChallans] = useState(() => {
        const saved = localStorage.getItem('vidyut_admin_challans') || localStorage.getItem('vidyut_inspector_challans');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.filter(item => !item.consumer?.startsWith('CON-'));
                }
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('vidyut_admin_challans', JSON.stringify(challans));
    }, [challans]);

    useEffect(() => {
        localStorage.removeItem('vidyut_theme');
        document.documentElement.removeAttribute('data-theme');
    }, []);

    // Fetch inspectors directory from Supabase
    useEffect(() => {
        const fetchInspectors = async () => {
            const { data, error } = await supabase
                .from('inspectors')
                .select('*')
                .order('display_name', { ascending: true });

            if (error) {
                console.error("Error loading inspectors from Supabase:", error.message);
            } else if (data) {
                const emailToName = {};
                const formatted = data.map(ins => {
                    if (ins.email && ins.display_name) {
                        emailToName[ins.email.toLowerCase()] = ins.display_name;
                    }
                    return {
                        name: ins.display_name,
                        badgeId: ins.badge_id || 'INS-GEN-01',
                        email: ins.email,
                        discom: ins.discom || user?.discom || 'DISCOM',
                        created: ins.created_at ? new Date(ins.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 10, 2026'
                    };
                });
                setInspectorsDetails(formatted);
                localStorage.setItem('vidyut_inspectors_details', JSON.stringify(formatted));

                // Reconcile any tasks or calendar entries whose inspector got renamed
                setInspectionCalendar(prev => {
                    const next = prev.map(c => {
                        const insObj = formatted.find(i => 
                            i.name === c.inspector || 
                            (c.inspector && i.name.toLowerCase() === c.inspector.toLowerCase()) ||
                            (c.inspector && (i.name.replace(/^Inspector\s+/i, '').toLowerCase() === c.inspector.replace(/^Inspector\s+/i, '').toLowerCase())) ||
                            (i.email && i.email.toLowerCase() === (c.inspector || '').toLowerCase())
                        );
                        return insObj ? { ...c, inspector: insObj.name } : c;
                    });
                    localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                    return next;
                });
            }
        };

        fetchInspectors();

        // Also listen for future auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchInspectors();
        });

        // Load all active inspection tasks from Supabase DB for instant sync
        const fetchTasksFromSupabase = async () => {
            try {
                const { data: tasksData, error: tasksErr } = await supabase
                    .from('inspection_tasks')
                    .select('*');

                const { data: insData } = await supabase
                    .from('inspectors')
                    .select('*');

                const emailToName = {};
                if (insData) {
                    insData.forEach(i => {
                        if (i.email && i.display_name) emailToName[i.email.toLowerCase()] = i.display_name;
                    });
                }

                if (tasksData && !tasksErr) {
                    const assignedMap = {};
                    const statusMap = {};
                    tasksData.forEach(t => {
                        let resolvedName = t.inspector_name;
                        if (t.inspector_email && emailToName[t.inspector_email.toLowerCase()]) {
                            resolvedName = emailToName[t.inspector_email.toLowerCase()];
                        }
                        if (resolvedName) {
                            assignedMap[t.consumer_id] = resolvedName;
                        }
                        statusMap[t.consumer_id] = t.status || 'Initiated';
                    });
                    setAssignedInspectors(assignedMap);
                    setLocalInspectionStatus(statusMap);
                    localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(assignedMap));
                    localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(statusMap));
                    localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(tasksData));

                    // Sync Inspection Tab (Field Inspection Calendar) strictly with real DB tasks
                    const realCalendar = tasksData.map(task => {
                        let resolvedName = task.inspector_name;
                        if (task.inspector_email && emailToName[task.inspector_email.toLowerCase()]) {
                            resolvedName = emailToName[task.inspector_email.toLowerCase()];
                        }
                        return {
                            consumer: task.consumer_id,
                            zone: task.zone || (task.transformer_id ? `Transformer ${task.transformer_id}` : 'Delhi Grid Area'),
                            inspector: resolvedName,
                            status: task.status || 'Initiated'
                        };
                    });
                    setInspectionCalendar(realCalendar);
                    localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(realCalendar));
                }
            } catch (err) {
                console.error("Error loading tasks from Supabase:", err);
            }
        };

        fetchTasksFromSupabase();

        // Subscribe to real-time status updates pushed from Inspector Portal
        const tasksChannel = supabase
            .channel('admin_tasks_realtime_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inspection_tasks' }, (payload) => {
                if (payload.new) {
                    const updated = payload.new;
                    setLocalInspectionStatus(prev => {
                        const next = { ...prev, [updated.consumer_id]: updated.status };
                        localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                        return next;
                    });
                    if (updated.inspector_name) {
                        setAssignedInspectors(prev => {
                            const next = { ...prev, [updated.consumer_id]: updated.inspector_name };
                            localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                            return next;
                        });
                    }

                    // Realtime sync to Inspection Tab Calendar
                    setInspectionCalendar(prev => {
                        const idx = prev.findIndex(c => c.consumer === updated.consumer_id);
                        const item = {
                            consumer: updated.consumer_id,
                            zone: updated.zone || (updated.transformer_id ? `Transformer ${updated.transformer_id}` : 'Sector 5 West'),
                            inspector: updated.inspector_name,
                            status: updated.status
                        };
                        const nextList = idx >= 0 ? prev.map((c, i) => i === idx ? item : c) : [...prev, item];
                        localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(nextList));
                        return nextList;
                    });
                } else if (payload.eventType === 'DELETE' || (payload.old && payload.old.consumer_id)) {
                    const delId = payload.old?.consumer_id;
                    if (delId) {
                        setInspectionCalendar(prev => {
                            const nextList = prev.filter(c => c.consumer !== delId);
                            localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(nextList));
                            return nextList;
                        });
                        setLocalInspectionStatus(prev => {
                            const next = { ...prev };
                            delete next[delId];
                            localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                            return next;
                        });
                        setAssignedInspectors(prev => {
                            const next = { ...prev };
                            delete next[delId];
                            localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                            return next;
                        });
                    }
                }
            })
            .on('broadcast', { event: 'task_deleted' }, (event) => {
                if (event.payload && event.payload.consumer_id) {
                    const delId = event.payload.consumer_id;
                    setInspectionCalendar(prev => {
                        const nextList = prev.filter(c => c.consumer !== delId);
                        localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(nextList));
                        return nextList;
                    });
                    setLocalInspectionStatus(prev => {
                        const next = { ...prev };
                        delete next[delId];
                        localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                        return next;
                    });
                    setAssignedInspectors(prev => {
                        const next = { ...prev };
                        delete next[delId];
                        localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                        return next;
                    });
                }
            })
            .subscribe();

        // Load upload history from Supabase DB
        const fetchUploadHistory = async () => {
            try {
                const { data: histData, error: histErr } = await supabase
                    .from('upload_history')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (histData && !histErr) {
                    const formatted = histData
                        .filter(h => h.filename && !h.filename.startsWith('consumer_dataset_'))
                        .map(h => ({
                            id: h.id,
                            name: h.filename,
                            date: new Date(h.uploaded_on || h.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                            }),
                            count: h.consumers_count || 0,
                            critical: h.critical_count || 0,
                            anomalies: h.anomalies_count || 0,
                            loss: h.loss_calculated || '₹0',
                            data: h.analysis_data
                        }));
                    setUploadHistory(formatted);
                    localStorage.setItem('vidyut_upload_history', JSON.stringify(formatted));
                }
            } catch (err) {
                console.error("Error loading upload history:", err);
            }
        };

        fetchUploadHistory();

        // Subscribe to real-time upload history changes
        const histChannel = supabase
            .channel('admin_upload_history_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_history' }, () => {
                fetchUploadHistory();
            })
            .subscribe();

        // Fetch and sync Challans from Supabase Cloud DB
        const fetchChallansFromDB = async () => {
            try {
                const { data, error } = await supabase
                    .from('inspection_challans')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && Array.isArray(data)) {
                    setChallans(data);
                    localStorage.setItem('vidyut_admin_challans', JSON.stringify(data));
                }
            } catch (err) {
                console.warn("Challans DB notice:", err);
            }
        };
        fetchChallansFromDB();

        // Fetch and sync Blacklisted Consumers from Supabase Cloud DB
        const fetchBlacklistedFromDB = async () => {
            try {
                const { data, error } = await supabase
                    .from('blacklisted_consumers')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && Array.isArray(data)) {
                    setBlacklistedConsumers(data);
                    localStorage.setItem('vidyut_blacklisted_consumers', JSON.stringify(data));
                }
            } catch (err) {
                console.warn("Blacklisted DB notice:", err);
            }
        };
        fetchBlacklistedFromDB();

        // Subscribe to real-time Challans issued by Field Inspectors
        const challanChannel = supabase
            .channel('vidyut_global_challans_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inspection_challans' }, () => {
                fetchChallansFromDB();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blacklisted_consumers' }, () => {
                fetchBlacklistedFromDB();
            })
            .on('broadcast', { event: 'new_challan' }, (event) => {
                if (event.payload) {
                    setChallans(prev => {
                        if (prev.some(c => c.id === event.payload.id)) return prev;
                        const next = [event.payload, ...prev];
                        localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                        return next;
                    });
                }
            })
            .on('broadcast', { event: 'update_challan_status' }, (event) => {
                if (event.payload && event.payload.id) {
                    setChallans(prev => {
                        const next = prev.map(c => c.id === event.payload.id ? { ...c, status: event.payload.status } : c);
                        localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                        return next;
                    });
                }
            })
            .on('broadcast', { event: 'challan_deleted' }, (event) => {
                if (event.payload && event.payload.consumer) {
                    const targetC = event.payload.consumer;
                    setChallans(prev => {
                        const next = prev.filter(c => c.consumer !== targetC);
                        localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                        return next;
                    });
                }
            })
            .subscribe();

        // Local window event listener for instant multi-tab sync
        const handleLocalChallan = (e) => {
            if (e.detail) {
                setChallans(prev => {
                    if (prev.some(c => c.id === e.detail.id)) return prev;
                    const next = [e.detail, ...prev];
                    localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                    return next;
                });
            }
        };

        const handleLocalChallanDeleted = (e) => {
            if (e.detail && e.detail.consumer) {
                const targetC = e.detail.consumer;
                setChallans(prev => {
                    const next = prev.filter(c => c.consumer !== targetC);
                    localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                    return next;
                });
            }
        };

        const handleStorageSync = (e) => {
            if (e.key === 'vidyut_admin_challans' || e.key === 'vidyut_inspector_challans') {
                try {
                    const parsed = JSON.parse(e.newValue || '[]');
                    if (Array.isArray(parsed)) setChallans(parsed);
                } catch (err) {}
            }
            if (e.key === 'vidyut_blacklisted_consumers') {
                try {
                    const parsed = JSON.parse(e.newValue || '[]');
                    if (Array.isArray(parsed)) setBlacklistedConsumers(parsed);
                } catch (err) {}
            }
        };

        const handleLocalTaskDeleted = (e) => {
            if (e.detail && e.detail.consumer_id) {
                const delId = e.detail.consumer_id;
                setInspectionCalendar(prev => {
                    const next = prev.filter(c => c.consumer !== delId);
                    localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                    return next;
                });
                setLocalInspectionStatus(prev => {
                    const next = { ...prev };
                    delete next[delId];
                    localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                    return next;
                });
                setAssignedInspectors(prev => {
                    const next = { ...prev };
                    delete next[delId];
                    localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                    return next;
                });
                // Also remove any challan associated with the deleted consumer
                setChallans(prev => {
                    const next = prev.filter(c => c.consumer !== delId);
                    localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                    return next;
                });
            }
        };

        window.addEventListener('vidyut_challan_created', handleLocalChallan);
        window.addEventListener('vidyut_challan_deleted', handleLocalChallanDeleted);
        window.addEventListener('vidyut_task_deleted', handleLocalTaskDeleted);
        window.addEventListener('storage', handleStorageSync);

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(histChannel);
            supabase.removeChannel(challanChannel);
            window.removeEventListener('vidyut_challan_created', handleLocalChallan);
            window.removeEventListener('vidyut_challan_deleted', handleLocalChallanDeleted);
            window.removeEventListener('vidyut_task_deleted', handleLocalTaskDeleted);
            window.removeEventListener('storage', handleStorageSync);
        };
    }, []);

    const reportRef = useRef(null);
    const fileInputRef = useRef(null);
    const mapRef = useRef(null);
    const [focusedConsumerId, setFocusedConsumerId] = useState(null);
    const lastSavedSignatureRef = useRef(null);

    const handleFocusConsumerOnMap = (consumerId) => {
        setFocusedConsumerId(consumerId);
        if (mapRef.current) {
            mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Auto scroll to report when result is populated
    useEffect(() => {
        if (result && reportRef.current) {
            const timer = setTimeout(() => {
                reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [result]);

    // Save ONLY the original uploaded dataset to Supabase DB & history state
    useEffect(() => {
        const actualFile = selectedFile || files?.source;
        // Only save when an actual uploaded file was analyzed
        if (!result || !actualFile || !actualFile.name) return;

        const signature = `${actualFile.name}_${actualFile.size || 0}_${result.summary?.total_loss_calculated || result.anomalies?.length || 0}`;
        if (lastSavedSignatureRef.current === signature) return;
        lastSavedSignatureRef.current = signature;

        const criticalCount = result.summary?.critical_cases ?? 
                              (result.anomalies || []).filter(a => (a.risk_class || '').toLowerCase().includes('crit')).length ?? 0;
        const totalConsumers = result.summary?.total_consumers || (result.results?.length) || (result.anomalies?.length) || 0;
        const anomaliesCount = result.summary?.anomalies_detected || result.anomalies?.length || 0;
        const lossText = result.summary?.total_loss_calculated ? `₹${result.summary.total_loss_calculated.toString().replace(/,/g, '')}` : '₹0';
        const fileName = actualFile.name;

        const newHist = {
            name: fileName,
            date: new Date().toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            }),
            count: totalConsumers,
            critical: criticalCount,
            anomalies: anomaliesCount,
            loss: lossText,
            size: actualFile.size ? `${(actualFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
            data: result
        };

        // 1. Sync history log directly into Supabase database (replace older entry with same name if any)
        const saveHistoryToDB = async () => {
            try {
                await supabase.from('upload_history').delete().eq('filename', fileName);
                await supabase.from('upload_history').insert([{
                    filename: fileName,
                    uploaded_on: new Date().toISOString(),
                    consumers_count: totalConsumers,
                    critical_count: criticalCount,
                    anomalies_count: anomaliesCount,
                    loss_calculated: lossText,
                    grid_health: result.summary?.grid_health_score || 80,
                    discom: user?.discom || 'BSES Rajdhani Power',
                    analysis_data: result
                }]);
            } catch (err) {
                console.error("Error writing upload history to Supabase:", err);
            }
        };

        saveHistoryToDB();

        setUploadHistory(prev => {
            const filtered = prev.filter(h => h.name !== fileName && !h.name.startsWith('consumer_dataset_'));
            const nextList = [newHist, ...filtered];
            localStorage.setItem('vidyut_upload_history', JSON.stringify(nextList));
            return nextList;
        });
    }, [result, selectedFile, files]);

    // Save inspector to Supabase DB & state (no auth.signUp — FK constraint must be removed in Supabase)
    const handleSaveInspector = async (formattedName, badgeId, email, _password = '', discom = user?.discom || 'DISCOM') => {
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

    // Update inspector details in Supabase DB & state with full cascading to tasks & calendar
    const handleUpdateInspector = async (oldEmail, updatedIns) => {
        const oldInspectorObj = inspectorsDetails.find(item => item.email === oldEmail);
        const oldName = oldInspectorObj?.name;
        const newName = updatedIns.name;
        const newEmail = updatedIns.email;

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

        // 1. Update inspectors directory state & localStorage
        const updatedList = inspectorsDetails.map(item => item.email === oldEmail ? updatedIns : item);
        setInspectorsDetails(updatedList);
        localStorage.setItem('vidyut_inspectors_details', JSON.stringify(updatedList));

        // 2. Cascade inspector name change across active tasks, calendar, and assignedInspectors
        if (oldName && newName && oldName !== newName) {
            // Update assignedInspectors
            setAssignedInspectors(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(cid => {
                    if (next[cid] === oldName) {
                        next[cid] = newName;
                    }
                });
                localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                return next;
            });

            // Update Field Inspection Calendar
            setInspectionCalendar(prev => {
                const next = prev.map(cal => cal.inspector === oldName ? { ...cal, inspector: newName } : cal);
                localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                return next;
            });

            // Update Supabase inspection_tasks table by email
            try {
                await supabase
                    .from('inspection_tasks')
                    .update({
                        inspector_name: newName,
                        inspector_email: newEmail,
                        updated_at: new Date().toISOString()
                    })
                    .eq('inspector_email', oldEmail);
            } catch (err) {
                console.error("Error updating tasks with new inspector name:", err);
            }

            // Also update Supabase inspection_tasks by old inspector_name
            try {
                await supabase
                    .from('inspection_tasks')
                    .update({
                        inspector_name: newName,
                        inspector_email: newEmail,
                        updated_at: new Date().toISOString()
                    })
                    .eq('inspector_name', oldName);
            } catch (err) {
                console.error("Error updating tasks by old inspector name:", err);
            }

            // Update local assigned tasks cache
            try {
                const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
                const updatedTasks = savedTasks.map(t => (t.inspector_name === oldName || t.inspector_email === oldEmail) ? { ...t, inspector_name: newName, inspector_email: newEmail } : t);
                localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updatedTasks));
            } catch (e) {}

            // Broadcast inspector rename event over Supabase Realtime channel
            try {
                const channel = supabase.channel('admin_tasks_realtime_channel');
                channel.send({
                    type: 'broadcast',
                    event: 'inspector_renamed',
                    payload: { oldName, newName, oldEmail, newEmail }
                }).catch(e => console.warn(e));
            } catch (e) {}
        }
        setEditingInspectorName(null);
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

    // Handle CSV download from history item with real full dataset
    const handleDownloadCSV = (hist) => {
        const dataset = hist.data || hist.analysis_data;
        const allRecords = dataset?.results || dataset?.anomalies || [];
        
        if (!allRecords || allRecords.length === 0) {
            alert('No anomaly records available to download for this dataset.');
            return;
        }

        const headers = ['Consumer ID', 'Transformer ID', 'Risk Score', 'Risk Class', 'Latitude', 'Longitude', 'Energy Consumed (kWh)', 'Field Status'];
        const rows = allRecords.map(item => [
            `"${item.consumer_id || ''}"`,
            `"${item.transformer_id || ''}"`,
            `"${(((item.aggregate_risk_score ?? item.risk_score ?? 0.85)) * 100).toFixed(0)}%"`,
            `"${item.risk_class || 'anomaly'}"`,
            `"${item.latitude || ''}"`,
            `"${item.longitude || ''}"`,
            `"${item.energy_consumed || item.metrics?.energy_consumed || ''}"`,
            `"${localInspectionStatus[item.consumer_id] || 'Initiated'}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", hist.name || hist.filename || `vidyut_analysis_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Synchronize coordinates of assigned tasks whenever result dataset is loaded
    useEffect(() => {
        if (!result) return;
        const allItems = [...(result.results || []), ...(result.anomalies || [])];
        if (allItems.length === 0) return;

        const syncTaskCoordinates = async () => {
            try {
                const { data: dbTasks } = await supabase.from('inspection_tasks').select('*');
                if (dbTasks && dbTasks.length > 0) {
                    for (const task of dbTasks) {
                        const match = allItems.find(item => item.consumer_id === task.consumer_id);
                        if (match && match.latitude && match.longitude) {
                            const exactLat = parseFloat(match.latitude).toFixed(4);
                            const exactLng = parseFloat(match.longitude).toFixed(4);
                            if (task.latitude !== exactLat || task.longitude !== exactLng) {
                                await supabase
                                    .from('inspection_tasks')
                                    .update({
                                        latitude: exactLat,
                                        longitude: exactLng,
                                        transformer_id: match.transformer_id || task.transformer_id,
                                        risk_score: match.aggregate_risk_score ?? match.risk_score ?? task.risk_score,
                                        risk_class: match.risk_class || task.risk_class,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('consumer_id', task.consumer_id);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error auto-syncing coordinates from result:", err);
            }
        };

        syncTaskCoordinates();
    }, [result]);

    // Handle status change in table
    const handleStatusChange = (consumerId, newStatus) => {
        setLocalInspectionStatus(prev => ({
            ...prev,
            [consumerId]: newStatus
        }));

        // Sync with assigned tasks storage
        try {
            const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
            const updatedTasks = savedTasks.map(t => t.consumer_id === consumerId ? { ...t, status: newStatus } : t);
            localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updatedTasks));
        } catch (e) {
            console.error('Error updating task status:', e);
        }

        // Also sync calendar status
        setInspectionCalendar(prev => prev.map(item => item.consumer === consumerId ? { ...item, status: newStatus } : item));
    };

    // Handle inspector assignment & sync with calendar, localStorage and Supabase DB
    const handleInspectorChange = async (consumerId, inspector) => {
        const currentInspector = assignedInspectors[consumerId];
        const currentStatus = (localInspectionStatus[consumerId] || '').toLowerCase();
        const isCancelled = currentStatus === 'cancelled' || currentStatus === 'canceled' || currentStatus === 'declined';

        // Check if consumer is actively assigned to another inspector and has not been cancelled
        if (currentInspector && inspector && currentInspector !== inspector && !isCancelled) {
            alert(
                `🔒 Audit Locked to ${currentInspector}\n\n` +
                `Consumer "${consumerId}" is currently assigned to ${currentInspector} (Status: ${localInspectionStatus[consumerId] || 'Initiated'}).\n\n` +
                `This audit cannot be reassigned to another inspector until ${currentInspector} cancels or releases the audit.`
            );
            return;
        }

        setAssignedInspectors(prev => {
            const next = { ...prev };
            if (inspector) {
                next[consumerId] = inspector;
            } else {
                delete next[consumerId];
            }
            localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
            return next;
        });

        // Find consumer details in result to get zone, transformer, exact coordinates & risk
        const consumerObj = result?.results?.find(a => a.consumer_id === consumerId) ||
                            result?.anomalies?.find(a => a.consumer_id === consumerId);
        const zoneArea = consumerObj?.transformer_id ? `Transformer ${consumerObj.transformer_id}` : 'Sector 5 West';

        // Extract exact coordinates from dataset or derive cleanly if absent
        let exactLat = consumerObj?.latitude;
        let exactLng = consumerObj?.longitude;

        if (!exactLat || !exactLng || isNaN(parseFloat(exactLat)) || isNaN(parseFloat(exactLng))) {
            const charSum = consumerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            exactLat = (28.6139 + (((charSum * 17) % 100) - 50) * 0.0012).toFixed(4);
            exactLng = (77.2090 + (((charSum * 31) % 100) - 50) * 0.0012).toFixed(4);
        } else {
            exactLat = parseFloat(exactLat).toFixed(4);
            exactLng = parseFloat(exactLng).toFixed(4);
        }

        const inspectorInfo = inspectorsDetails.find(ins => ins.name === inspector);
        const inspectorEmail = inspectorInfo?.email || '';

        if (inspector) {
            const taskPayload = {
                consumer_id: consumerId,
                transformer_id: consumerObj?.transformer_id || 'T01',
                inspector_name: inspector,
                inspector_email: inspectorEmail,
                risk_score: consumerObj?.aggregate_risk_score ?? consumerObj?.risk_score ?? 0.85,
                risk_class: consumerObj?.risk_class || 'critical',
                status: localInspectionStatus[consumerId] || 'Initiated',
                latitude: exactLat,
                longitude: exactLng,
                zone: zoneArea,
                discom: user?.discom || 'BSES Rajdhani Power',
                assigned_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 1. Sync to Supabase DB (guarantees cross-device/portal availability)
            try {
                const { error: dbErr } = await supabase
                    .from('inspection_tasks')
                    .upsert(taskPayload, { onConflict: 'consumer_id' });
                if (dbErr) console.error("Supabase task save error:", dbErr.message);
            } catch (err) {
                console.error("Error saving task to Supabase:", err);
            }

            // 2. Local storage cache update
            try {
                const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
                const existingIdx = savedTasks.findIndex(t => t.consumer_id === consumerId);
                let updatedTasks;
                if (existingIdx >= 0) {
                    savedTasks[existingIdx] = { ...savedTasks[existingIdx], ...taskPayload };
                    updatedTasks = [...savedTasks];
                } else {
                    updatedTasks = [taskPayload, ...savedTasks];
                }
                localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updatedTasks));
            } catch (e) {
                console.error('Error saving assigned tasks locally:', e);
            }

            // 3. Update Calendar view
            setInspectionCalendar(prev => {
                const exists = prev.some(item => item.consumer === consumerId);
                const updated = exists
                    ? prev.map(item => item.consumer === consumerId ? { ...item, inspector: inspector } : item)
                    : [...prev, { consumer: consumerId, zone: zoneArea, inspector: inspector, status: localInspectionStatus[consumerId] || 'Scheduled' }];
                localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(updated));
                return updated;
            });
        } else {
            // Unassigned: Remove from Supabase and local cache
            try {
                await supabase
                    .from('inspection_tasks')
                    .delete()
                    .eq('consumer_id', consumerId);
            } catch (err) {
                console.error("Error deleting task from Supabase:", err);
            }

            try {
                const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
                const updatedTasks = savedTasks.filter(t => t.consumer_id !== consumerId);
                localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updatedTasks));
            } catch (e) {
                console.error(e);
            }
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

    const [sampleLoading, setSampleLoading] = useState(false);

    const handleLoadSampleDataset = async () => {
        try {
            setSampleLoading(true);
            const response = await fetch('/sample_dataset.csv');
            if (!response.ok) {
                throw new Error('Failed to fetch sample dataset');
            }
            const blob = await response.blob();
            const file = new File([blob], 'sample_dataset.csv', { type: 'text/csv' });
            setSelectedFile(file);
            handleFileUpload('source', file);
        } catch (err) {
            console.error('Failed to load sample dataset', err);
        } finally {
            setSampleLoading(false);
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

    // Handle Reset Overview (resets all graphs, charts, and loaded data back to default)
    const handleResetOverview = () => {
        if (setResult) {
            setResult(null);
        }
        setFocusedConsumerId(null);
        localStorage.removeItem('vidyut_result');
    };

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
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stitch Sidebar Search Bar */}
                <div className="stitch-sidebar-search">
                    <Search size={14} />
                    <input 
                        type="text" 
                        placeholder="Search menu..." 
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                </div>

                <nav className="sidebar-nav">
                    {/* CORE CATEGORY */}
                    {(!sidebarSearch || 'overview'.includes(sidebarSearch.toLowerCase()) || 'account details'.includes(sidebarSearch.toLowerCase())) && (
                        <div className="sidebar-category-header">Core Management</div>
                    )}
                    {(!sidebarSearch || 'overview'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`}
                            onClick={() => switchTab('Overview')}
                        >
                            <Layers size={18} /> Overview
                        </button>
                    )}
                    {(!sidebarSearch || 'account details'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Account Details' ? 'active' : ''}`}
                            onClick={() => switchTab('Account Details')}
                        >
                            <User size={18} /> Account Details
                        </button>
                    )}

                    {/* GRID INTELLIGENCE CATEGORY */}
                    {(!sidebarSearch || 'transformer list'.includes(sidebarSearch.toLowerCase()) || 'priority'.includes(sidebarSearch.toLowerCase()) || 'loss recovery'.includes(sidebarSearch.toLowerCase())) && (
                        <div className="sidebar-category-header">Grid Intelligence</div>
                    )}
                    {(!sidebarSearch || 'transformer list'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Transformer List' ? 'active' : ''}`}
                            onClick={() => switchTab('Transformer List')}
                        >
                            <ListCollapse size={18} /> Transformer List
                        </button>
                    )}
                    {(!sidebarSearch || 'priority'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Priority' ? 'active' : ''}`}
                            onClick={() => switchTab('Priority')}
                        >
                            <ShieldAlert size={18} /> Priority
                        </button>
                    )}
                    {(!sidebarSearch || 'loss recovery'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Loss Recovery' ? 'active' : ''}`}
                            onClick={() => switchTab('Loss Recovery')}
                        >
                            <TrendingUp size={18} /> Loss Recovery
                        </button>
                    )}

                    {/* FIELD AUDITS CATEGORY */}
                    {(!sidebarSearch || 'inspection'.includes(sidebarSearch.toLowerCase()) || 'inspector list'.includes(sidebarSearch.toLowerCase()) || 'blacklisted consumer'.includes(sidebarSearch.toLowerCase())) && (
                        <div className="sidebar-category-header">Field Operations</div>
                    )}
                    {(!sidebarSearch || 'inspection'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Inspection' ? 'active' : ''}`}
                            onClick={() => switchTab('Inspection')}
                        >
                            <Calendar size={18} /> Inspection
                        </button>
                    )}
                    {(!sidebarSearch || 'inspector list'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Inspector List' ? 'active' : ''}`}
                            onClick={() => switchTab('Inspector List')}
                        >
                            <UserCheck size={18} /> Inspector List
                        </button>
                    )}
                    {(!sidebarSearch || 'blacklisted consumer'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Blacklisted Consumer' ? 'active' : ''}`}
                            onClick={() => switchTab('Blacklisted Consumer')}
                        >
                            <Ban size={18} /> Blacklisted Consumer
                        </button>
                    )}

                    {/* SYSTEM CATEGORY */}
                    {(!sidebarSearch || 'history'.includes(sidebarSearch.toLowerCase()) || 'settings'.includes(sidebarSearch.toLowerCase())) && (
                        <div className="sidebar-category-header">System</div>
                    )}
                    {(!sidebarSearch || 'history'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'History' ? 'active' : ''}`}
                            onClick={() => switchTab('History')}
                        >
                            <HistoryIcon size={18} /> History
                        </button>
                    )}
                    {(!sidebarSearch || 'settings'.includes(sidebarSearch.toLowerCase())) && (
                        <button 
                            className={`nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
                            onClick={() => switchTab('Settings')}
                        >
                            <SettingsIcon size={18} /> Settings
                        </button>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-profile-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: '#18181b', color: '#ffffff', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem'
                            }}>
                                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontSize: '0.825rem', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                    {user?.email?.split('@')[0] || 'Administrator'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>DISCOM Admin</span>
                            </div>
                        </div>
                        <button 
                            onClick={onLogout}
                            title="Sign Out"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button 
                            className="mobile-sidebar-hamburger"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ background: 'none', border: 'none', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Hello, {user?.discom ? user.discom.split(' ')[0] : 'Admin'}!
                            </h1>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.825rem', color: '#6b7280' }}>
                                Real-time grid intelligence and theft mitigation telemetry.
                            </p>
                        </div>
                    </div>
                    <div className="header-meta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="stitch-btn-pill" 
                            style={{ width: 'auto', padding: '0.55rem 1.15rem', fontSize: '0.825rem', display: 'inline-flex', gap: '0.4rem' }}
                            onClick={() => switchTab('Priority')}
                        >
                            <Zap size={14} /> Central Intelligence
                        </button>
                        <span className="header-role-badge">
                            {user?.state || 'Admin Node'}
                        </span>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Render panels dynamically based on active tab */}
                    {activeTab === 'Overview' && (
                        <div className="dashboard-panel">
                            {/* Stitch Notice Callout Banner */}
                            {bannerVisible && (
                                <div className="stitch-notice-banner">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '12px',
                                            background: '#f4f5f7', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: '#18181b', flexShrink: 0
                                        }}>
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>
                                                Upgrade telemetry pipelines to auto-sync with edge smart transformers
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                                                Automated theft loss calculation and rapid field auditor dispatching are currently active.
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <button 
                                            onClick={() => {
                                                const uploadEl = document.querySelector('.dashboard-upload');
                                                if (uploadEl) {
                                                    uploadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }
                                            }}
                                            style={{
                                                background: '#18181b', color: '#ffffff', border: 'none',
                                                borderRadius: '9999px', padding: '0.5rem 1.15rem',
                                                fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Explore Dataset
                                        </button>
                                        <button 
                                            onClick={() => setBannerVisible(false)}
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Stitch 4-Card Overview Performance Grid */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                                        Overview performance
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={handleResetOverview}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            background: '#fef2f2',
                                            border: '1px solid #fee2e2',
                                            color: '#ef4444',
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.78rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title="Reset all graphs, charts, and loaded telemetry to default"
                                    >
                                        <RotateCcw size={13} /> Reset Graphs & Charts
                                    </button>
                                </div>

                                <div className="overview-performance-grid">
                                    {/* 1. Total Consumers */}
                                    <div className="performance-card">
                                        <div className="performance-card-top">
                                            <span className="performance-card-title">Total Consumers</span>
                                            <span className={`stat-chip ${result ? 'positive' : ''}`} style={{ background: result ? '#ecfdf5' : '#f4f4f5', color: result ? '#10b981' : '#71717a' }}>
                                                {result ? (
                                                    <><ArrowUpRight size={12} /> +{(result.summary?.total_consumers || result.results?.length || result.anomalies?.length || 0).toLocaleString()}</>
                                                ) : (
                                                    '0 Ingested'
                                                )}
                                            </span>
                                        </div>
                                        <div className="performance-card-value">
                                            {result 
                                                ? (result.summary?.total_consumers || result.results?.length || result.anomalies?.length || 0).toLocaleString()
                                                : '0'
                                            }
                                        </div>
                                        <div className="performance-card-sub">
                                            {result ? (selectedFile?.name ? `Dataset: ${selectedFile.name}` : 'Live telemetry processed') : 'Awaiting dataset upload'}
                                        </div>
                                    </div>

                                    {/* 2. Active Feeders */}
                                    <div className="performance-card">
                                        <div className="performance-card-top">
                                            <span className="performance-card-title">Active Feeders</span>
                                            <span className={`stat-chip ${result ? 'positive' : ''}`} style={{ background: result ? '#ecfdf5' : '#f4f4f5', color: result ? '#10b981' : '#71717a' }}>
                                                {result ? (
                                                    <><ArrowUpRight size={12} /> {((result.transformers_at_risk?.length) || (new Set((result.results || result.anomalies || []).map(r => r.transformer_id).filter(Boolean)).size) || (result.summary?.total_transformers || 0))} Nodes</>
                                                ) : (
                                                    '0 Active'
                                                )}
                                            </span>
                                        </div>
                                        <div className="performance-card-value">
                                            {result ? (
                                                ((result.transformers_at_risk?.length) || (new Set((result.results || result.anomalies || []).map(r => r.transformer_id).filter(Boolean)).size) || (result.summary?.total_transformers || 0)).toLocaleString()
                                            ) : (
                                                '0'
                                            )}
                                        </div>
                                        <div className="performance-card-sub">
                                            {result ? 'Monitored feeder units' : 'Awaiting dataset upload'}
                                        </div>
                                    </div>

                                    {/* 3. Critical Anomalies */}
                                    <div className="performance-card">
                                        <div className="performance-card-top">
                                            <span className="performance-card-title">Critical Anomalies</span>
                                            {result ? (
                                                <span className={`stat-chip ${(result.summary?.critical_cases || (result.anomalies || []).filter(a => (a.risk_class || '').toLowerCase().includes('crit')).length) > 0 ? 'negative' : 'positive'}`}>
                                                    {(result.summary?.critical_cases || (result.anomalies || []).filter(a => (a.risk_class || '').toLowerCase().includes('crit')).length) > 0 ? (
                                                        <><TrendingDown size={12} /> Alert</>
                                                    ) : (
                                                        <><ArrowUpRight size={12} /> Nominal</>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="stat-chip" style={{ background: '#f4f4f5', color: '#71717a' }}>
                                                    0 Flagged
                                                </span>
                                            )}
                                        </div>
                                        <div className="performance-card-value">
                                            {result ? (
                                                (result.summary?.critical_cases ?? (result.anomalies || []).filter(a => (a.risk_class || '').toLowerCase().includes('crit')).length ?? 0).toLocaleString()
                                            ) : (
                                                '0'
                                            )}
                                        </div>
                                        <div className="performance-card-sub">
                                            {result ? 'Immediate field action' : 'Awaiting dataset upload'}
                                        </div>
                                    </div>

                                    {/* 4. Grid Efficiency */}
                                    <div className="performance-card">
                                        <div className="performance-card-top">
                                            <span className="performance-card-title">Grid Efficiency</span>
                                            <span className={`stat-chip ${result ? 'positive' : ''}`} style={{ background: result ? '#ecfdf5' : '#f4f4f5', color: result ? '#10b981' : '#71717a' }}>
                                                {result ? (
                                                    <><ArrowUpRight size={12} /> Index</>
                                                ) : (
                                                    '0% Index'
                                                )}
                                            </span>
                                        </div>
                                        <div className="performance-card-value">
                                            {result?.summary?.grid_health_score !== undefined 
                                                ? `${result.summary.grid_health_score}%` 
                                                : (result ? '80%' : '0%')
                                            }
                                        </div>
                                        <div className="performance-card-sub">
                                            {result ? 'Overall system integrity' : 'Awaiting dataset upload'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visualizations & Segmented Period Control */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.01em' }}>
                                            Telemetry & Load Analytics
                                        </h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                            Comparative risk class distribution and transformer load telemetry.
                                        </p>
                                    </div>

                                    {/* Stitch Segmented Period Switcher */}
                                    <div className="stitch-segmented-control">
                                        {['Day', 'Week', 'Month', 'Year'].map((period) => (
                                            <button
                                                key={period}
                                                className={`stitch-segment-btn ${chartPeriod === period ? 'active' : ''}`}
                                                onClick={() => setChartPeriod(period)}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
                                                            contentStyle={{ 
                                                                background: '#ffffff', 
                                                                border: '1px solid rgba(0,0,0,0.06)', 
                                                                borderRadius: '12px', 
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                                padding: '0.6rem 0.85rem' 
                                                            }}
                                                            itemStyle={{ color: '#111827', fontWeight: '600', fontSize: '0.85rem' }}
                                                            labelStyle={{ color: '#6b7280', fontWeight: '600', marginBottom: '0.2rem' }}
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
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                                        <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                                                        <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                                                        <Tooltip 
                                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                            contentStyle={{ 
                                                                background: '#ffffff', 
                                                                border: '1px solid rgba(0,0,0,0.06)', 
                                                                borderRadius: '12px', 
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                                padding: '0.6rem 0.85rem' 
                                                            }}
                                                            itemStyle={{ color: '#111827', fontWeight: '600', fontSize: '0.85rem' }}
                                                            labelStyle={{ color: '#6b7280', fontWeight: '600', marginBottom: '0.2rem' }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                        <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="high" name="High Risk" fill="#f97316" stackId="a" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="charts-grid">
                                        <div className="chart-card">
                                            <h3>Risk Distribution</h3>
                                            <div className="chart-container-inner" style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.85rem', color: '#9ca3af', pointerEvents: 'none', textAlign: 'center' }}>
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
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                background: '#ffffff', 
                                                                border: '1px solid rgba(0,0,0,0.06)', 
                                                                borderRadius: '12px', 
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                                padding: '0.6rem 0.85rem' 
                                                            }}
                                                            itemStyle={{ color: '#111827', fontWeight: '600', fontSize: '0.85rem' }}
                                                            labelStyle={{ color: '#6b7280', fontWeight: '600', marginBottom: '0.2rem' }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="chart-card">
                                            <h3>Transformer Loading & Risk</h3>
                                            <div className="chart-container-inner" style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.85rem', color: '#9ca3af', pointerEvents: 'none', textAlign: 'center' }}>
                                                    No Data Loaded
                                                </div>
                                                <ResponsiveContainer width="100%" height={260}>
                                                    <BarChart data={[
                                                        { name: 'TR-101', critical: 0, high: 0 },
                                                        { name: 'TR-102', critical: 0, high: 0 },
                                                        { name: 'TR-103', critical: 0, high: 0 },
                                                        { name: 'TR-104', critical: 0, high: 0 }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                                        <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                                                        <YAxis stroke="#9ca3af" style={{ fontSize: '0.75rem' }} />
                                                        <Tooltip 
                                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                            contentStyle={{ 
                                                                background: '#ffffff', 
                                                                border: '1px solid rgba(0,0,0,0.06)', 
                                                                borderRadius: '12px', 
                                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                                padding: '0.6rem 0.85rem' 
                                                            }}
                                                            itemStyle={{ color: '#111827', fontWeight: '600', fontSize: '0.85rem' }}
                                                            labelStyle={{ color: '#6b7280', fontWeight: '600', marginBottom: '0.2rem' }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                                        <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="high" name="High Risk" fill="#f97316" stackId="a" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                            border: '2px dashed #e5e7eb',
                                            borderRadius: '16px',
                                            padding: '1.75rem',
                                            cursor: 'pointer',
                                            background: dragActive ? '#f8fafc' : '#ffffff',
                                            borderColor: dragActive ? '#18181b' : '#e5e7eb',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <UploadCloud size={34} style={{ color: '#18181b' }} />
                                        <span style={{ fontSize: '0.925rem', color: '#111827', fontWeight: '600' }}>
                                            {selectedFile ? selectedFile.name : 'Choose File or Drop Here'}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
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
                                                padding: '0.9rem 2.5rem',
                                                borderRadius: '9999px',
                                                border: 'none',
                                                background: selectedFile ? '#18181b' : '#f3f4f6',
                                                color: selectedFile ? '#ffffff' : '#9ca3af',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: (loading || !selectedFile) ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: selectedFile ? '0 4px 14px rgba(0,0,0,0.12)' : 'none'
                                            }}
                                        >
                                            {loading ? <RefreshCw className="animate-spin" size={18} /> : null}
                                            {loading ? 'Analyzing Dataset...' : 'Fetch & Analyse'}
                                        </button>
                                    </div>
                                </div>

                                {/* Download Sample Dataset & Quick Load */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                    marginTop: '1.25rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px dashed #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                                        <span>Need a test dataset?</span>
                                        <a
                                            href="/sample_dataset.csv"
                                            download="sample_dataset.csv"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                color: '#2563eb',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                background: '#eff6ff',
                                                border: '1px solid #dbeafe',
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '8px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                                        >
                                            <Download size={13} />
                                            Download Sample Dataset (.csv)
                                        </a>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLoadSampleDataset}
                                        disabled={sampleLoading}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: '#18181b',
                                            background: '#f4f4f5',
                                            border: '1px solid #e4e4e7',
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.82rem',
                                            fontWeight: '600',
                                            cursor: sampleLoading ? 'wait' : 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#e4e4e7'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#f4f4f5'; }}
                                    >
                                        {sampleLoading ? 'Loading Sample...' : 'Quick Load Sample Dataset'}
                                    </button>
                                </div>
                            </section>

                            {/* Realistic Live Multi-Stage Buffering state while data is fetching from backend */}
                            {loading && (
                                <RealisticAnalysisLoader filename={selectedFile?.name} />
                            )}

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
                                    <div className="map-card" ref={mapRef}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                                                <MapPin size={20} style={{ color: '#ef4444' }} /> Geographic Anomaly Mapping
                                            </h3>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                Click any consumer row in table below to fly and zoom to its pin on map
                                            </span>
                                        </div>
                                        <div style={{ height: '480px', width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <MapComponent 
                                                data={result} 
                                                focusedConsumerId={focusedConsumerId}
                                                onSelectConsumer={setFocusedConsumerId}
                                            />
                                        </div>
                                    </div>

                                    {/* Detected Anomalies Table */}
                                    <div className="anomalies-card">
                                        <h3>Detected Anomalies</h3>
                                        <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                            <table className="anomalies-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Consumer ID</th>
                                                        <th>Transformer ID</th>
                                                        <th>Risk Score</th>
                                                        <th>Risk Class</th>
                                                        <th>Inspection Status</th>
                                                        <th>Assign Inspector</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.anomalies.map((item, idx) => (
                                                        <tr key={idx} style={{ background: item.consumer_id === focusedConsumerId ? '#f0f9ff' : 'transparent' }}>
                                                            <td style={{ fontWeight: '600' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleFocusConsumerOnMap(item.consumer_id)}
                                                                    title="Click to find and zoom to this pin on map"
                                                                    style={{
                                                                        background: item.consumer_id === focusedConsumerId ? '#e0f2fe' : '#f4f5f7',
                                                                        border: item.consumer_id === focusedConsumerId ? '1px solid #0284c7' : '1px solid #e5e7eb',
                                                                        color: item.consumer_id === focusedConsumerId ? '#0369a1' : '#111827',
                                                                        padding: '0.35rem 0.75rem',
                                                                        borderRadius: '9999px',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.45rem',
                                                                        fontWeight: '600',
                                                                        fontSize: '0.85rem',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <MapPin size={13} style={{ color: item.consumer_id === focusedConsumerId ? '#0284c7' : '#9ca3af' }} />
                                                                    {item.consumer_id}
                                                                </button>
                                                            </td>
                                                            <td style={{ color: '#4b5563', fontSize: '0.9rem' }}>{item.transformer_id}</td>
                                                            <td style={{ fontWeight: '700', color: item.risk_class === 'critical' ? '#ef4444' : '#f97316', fontSize: '0.9rem' }}>
                                                                {((item.aggregate_risk_score || 0) * 100).toFixed(0)}%
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${item.risk_class}`} style={{ textTransform: 'capitalize' }}>
                                                                    {item.risk_class}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const activeInspector = assignedInspectors[item.consumer_id];
                                                                    const hasValidAssignment = !!activeInspector && inspectorsList.includes(activeInspector);
                                                                    const inCalendar = inspectionCalendar.some(c => c.consumer === item.consumer_id);
                                                                    const hasActiveTask = hasValidAssignment || inCalendar;
                                                                    
                                                                    const currentStatus = hasActiveTask ? (localInspectionStatus[item.consumer_id] || 'Initiated') : 'Initiated';
                                                                    const isCompleted = (currentStatus || '').toLowerCase() === 'completed';
                                                                    const isInProcess = (currentStatus || '').toLowerCase().includes('process');
                                                                    
                                                                    return (
                                                                        <span 
                                                                            title={hasActiveTask ? "Status is updated directly by field inspector from portal" : "No active inspection assigned"}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.45rem',
                                                                                fontSize: '0.78rem',
                                                                                fontWeight: '600',
                                                                                padding: '0.35rem 0.75rem',
                                                                                borderRadius: '9999px',
                                                                                background: isCompleted ? '#e8f8ee' : isInProcess ? '#fef3c7' : '#f3f4f6',
                                                                                color: isCompleted ? '#16a34a' : isInProcess ? '#d97706' : '#6b7280',
                                                                                border: `1px solid ${isCompleted ? '#dcfce7' : isInProcess ? '#fde68a' : '#e5e7eb'}`
                                                                            }}
                                                                        >
                                                                            <span style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: isCompleted ? '#16a34a' : isInProcess ? '#d97706' : '#9ca3af'
                                                                            }} />
                                                                            {currentStatus}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const activeInspector = assignedInspectors[item.consumer_id];
                                                                    const isAssigned = !!activeInspector && inspectorsList.includes(activeInspector);
                                                                    const inCalendar = inspectionCalendar.some(c => c.consumer === item.consumer_id);
                                                                    const isActivelyAssigned = isAssigned && inCalendar;

                                                                    return (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <select
                                                                                value={isAssigned ? activeInspector : ''}
                                                                                onChange={(e) => handleInspectorChange(item.consumer_id, e.target.value)}
                                                                                className="table-select"
                                                                                style={{ 
                                                                                    borderColor: isActivelyAssigned ? '#10b981' : '#e5e7eb',
                                                                                    color: isActivelyAssigned ? '#059669' : '#111827',
                                                                                    background: isActivelyAssigned ? '#f0fdf4' : '#ffffff'
                                                                                }}
                                                                                title={isActivelyAssigned ? `Assigned to ${activeInspector}. Locked until audit is cancelled.` : 'Assign an inspector'}
                                                                            >
                                                                                <option value="">-- Assign Inspector --</option>
                                                                                {inspectorsList.map(insp => (
                                                                                    <option key={insp} value={insp}>{insp}</option>
                                                                                ))}
                                                                            </select>
                                                                            {isActivelyAssigned && (
                                                                                <span 
                                                                                    title={`Locked to ${activeInspector}. Must be cancelled before reassigning.`}
                                                                                    style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
                                                                                >
                                                                                    <Lock size={14} />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    <div className="dashboard-form-group">
                                        <label>Email Address</label>
                                        <div className="dashboard-form-input">{user?.email}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Role</label>
                                        <div className="dashboard-form-input">DISCOM Administrator</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Selected DISCOM</label>
                                        <div className="dashboard-form-input">{user?.discom || 'Tata Power'}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>State Jurisdiction</label>
                                        <div className="dashboard-form-input">{user?.state || 'Delhi'}</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Associated System Node ID</label>
                                        <div className="dashboard-form-input">NODE-DISCOM-{getInitials(user?.discom)}-09</div>
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Authentication Token Uid</label>
                                        <div className="dashboard-form-input" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{user?.uid}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Transformer List' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">Active Transformers Mapping</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Transformer ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Location Zone</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Grid Load</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Health Index</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Anomalies Flagged</th>
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
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{tr.id}</td>
                                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{tr.loc}</td>
                                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{tr.load}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ 
                                                            color: tr.health.includes('Excellent') || tr.health.includes('Good') ? '#059669' : '#dc2626', 
                                                            background: tr.health.includes('Excellent') || tr.health.includes('Good') ? '#ecfdf5' : '#fef2f2', 
                                                            border: `1px solid ${tr.health.includes('Excellent') || tr.health.includes('Good') ? '#a7f3d0' : '#fecaca'}`,
                                                            padding: '0.25rem 0.6rem', 
                                                            borderRadius: '9999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {tr.health}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: '700', color: tr.count > 0 ? '#ea580c' : '#111827' }}>{tr.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form 
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (newConsumerData.id && newConsumerData.addr) {
                                                const updated = [newConsumerData, ...blacklistedConsumers.filter(item => item.id !== newConsumerData.id)];
                                                setBlacklistedConsumers(updated);
                                                localStorage.setItem('vidyut_blacklisted_consumers', JSON.stringify(updated));
                                                
                                                // Persist to Supabase Cloud Server Database
                                                try {
                                                    await supabase
                                                        .from('blacklisted_consumers')
                                                        .upsert([newConsumerData]);
                                                } catch (err) {
                                                    console.warn("Supabase blacklist save notice:", err);
                                                }

                                                setNewConsumerData({ id: '', addr: '', severity: '', fine: '', status: 'Meter Removed' });
                                                setIsAddingConsumer(false);
                                            } else {
                                                alert("Consumer ID and Address Block are required.");
                                            }
                                        }}
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: challans.length > 0 ? 'span 2' : 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>Consumer ID *</label>
                                                {challans.length > 0 && (
                                                    <span style={{ fontSize: '0.72rem', color: '#18181b', background: '#f4f5f7', padding: '0.15rem 0.45rem', borderRadius: '9999px', border: '1px solid #e5e7eb', fontWeight: '600' }}>
                                                        {challans.length} Challan Record{challans.length === 1 ? '' : 's'} Available
                                                    </span>
                                                )}
                                            </div>

                                            {/* Choose Consumer from Field Penalties & Bypass Challans */}
                                            {challans.length > 0 && (
                                                <select 
                                                    value={challans.some(ch => ch.consumer === newConsumerData.id) ? newConsumerData.id : ''}
                                                    onChange={(e) => {
                                                        const selectedConsumer = e.target.value;
                                                        if (selectedConsumer) {
                                                            const matchedChallan = challans.find(ch => ch.consumer === selectedConsumer);
                                                            if (matchedChallan) {
                                                                setNewConsumerData({
                                                                    id: matchedChallan.consumer,
                                                                    addr: matchedChallan.zone || 'Delhi Grid Area',
                                                                    severity: `${matchedChallan.anomaly} (${matchedChallan.load})`,
                                                                    fine: matchedChallan.penalty,
                                                                    status: 'Meter Removed'
                                                                });
                                                            } else {
                                                                setNewConsumerData(prev => ({ ...prev, id: selectedConsumer }));
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.65rem 0.8rem',
                                                        background: '#f9fafb',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        color: '#111827',
                                                        fontSize: '0.85rem',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        marginBottom: '0.25rem'
                                                    }}
                                                >
                                                    <option value="" style={{ color: '#9ca3af' }}>
                                                        -- Choose Consumer from Field Penalties & Challans --
                                                    </option>
                                                    {challans.map((ch, idx) => (
                                                        <option key={idx} value={ch.consumer}>
                                                            {ch.consumer} • {ch.id} ({ch.anomaly} - {ch.penalty})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <input 
                                                type="text"
                                                value={newConsumerData.id}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, id: e.target.value })}
                                                placeholder="Or type Consumer ID manually (e.g. C0133)"
                                                required
                                                style={{ padding: '0.6rem 0.8rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>Address Block *</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.addr}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, addr: e.target.value })}
                                                placeholder="e.g. B-4, Rohini Sector 11"
                                                required
                                                style={{ padding: '0.6rem 0.8rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>Offense Severity</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.severity}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, severity: e.target.value })}
                                                placeholder="e.g. 3rd Repeated Bypass"
                                                style={{ padding: '0.6rem 0.8rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>Fine Imposed</label>
                                            <input 
                                                type="text"
                                                value={newConsumerData.fine}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, fine: e.target.value })}
                                                placeholder="e.g. ₹45,000"
                                                style={{ padding: '0.6rem 0.8rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: '500' }}>Enforcement Status</label>
                                            <select 
                                                value={newConsumerData.status}
                                                onChange={e => setNewConsumerData({ ...newConsumerData, status: e.target.value })}
                                                style={{ padding: '0.6rem 0.8rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827', outline: 'none' }}
                                            >
                                                <option value="Meter Removed">Meter Removed</option>
                                                <option value="Suspended Connection">Suspended Connection</option>
                                                <option value="Criminal Legal Action">Criminal Legal Action</option>
                                                <option value="Under Probation">Under Probation</option>
                                            </select>
                                        </div>
                                        <button 
                                            type="submit"
                                            className="stitch-btn-pill"
                                            style={{ width: 'auto', padding: '0.65rem 1.25rem', fontSize: '0.825rem' }}
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
                                                background: '#18181b', border: 'none',
                                                color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '9999px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.825rem', transition: 'all 0.2s'
                                            }}
                                        >
                                            <Plus size={16} /> Add Consumer
                                        </button>
                                    )}
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Consumer ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Address Block</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Offense Severity</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Fine Imposed</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Status</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {blacklistedConsumers.map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    {editingConsumerId === c.id ? (
                                                        <>
                                                            {/* Inline Editing Mode */}
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{c.id}</td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.addr}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, addr: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.severity}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, severity: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editConsumerData.fine}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, fine: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <select 
                                                                    value={editConsumerData.status}
                                                                    onChange={e => setEditConsumerData({ ...editConsumerData, status: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem' }}
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
                                                                        onClick={async () => {
                                                                            const updated = blacklistedConsumers.map(item => item.id === c.id ? editConsumerData : item);
                                                                            setBlacklistedConsumers(updated);
                                                                            localStorage.setItem('vidyut_blacklisted_consumers', JSON.stringify(updated));
                                                                            try {
                                                                                await supabase
                                                                                    .from('blacklisted_consumers')
                                                                                    .upsert([editConsumerData]);
                                                                            } catch (err) {
                                                                                console.warn("Supabase blacklist update notice:", err);
                                                                            }
                                                                            setEditingConsumerId(null);
                                                                        }}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingConsumerId(null)}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Normal Static Mode */}
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{c.id}</td>
                                                            <td style={{ padding: '1rem', color: '#4b5563' }}>{c.addr}</td>
                                                            <td style={{ padding: '1rem', color: '#ea580c', fontWeight: '500' }}>{c.severity}</td>
                                                            <td style={{ padding: '1rem', fontWeight: '700', color: '#111827' }}>{c.fine}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
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
                                                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={async () => {
                                                                            if (confirm(`Are you sure you want to delete blacklisted consumer ${c.id}?`)) {
                                                                                const updated = blacklistedConsumers.filter(item => item.id !== c.id);
                                                                                setBlacklistedConsumers(updated);
                                                                                localStorage.setItem('vidyut_blacklisted_consumers', JSON.stringify(updated));
                                                                                try {
                                                                                    await supabase
                                                                                        .from('blacklisted_consumers')
                                                                                        .delete()
                                                                                        .eq('id', c.id);
                                                                                } catch (err) {
                                                                                    console.warn("Supabase blacklist delete notice:", err);
                                                                                }
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

                    {activeTab === 'Loss Recovery' && (() => {
                        const totalPenaltyAssessed = challans.reduce((sum, ch) => {
                            const raw = ch.penalty_raw || parseFloat(String(ch.penalty || '').replace(/[^\d.]/g, '')) || 0;
                            return sum + raw;
                        }, 0);

                        const paidChallans = challans.filter(ch => (ch.status || '').toLowerCase() === 'paid');
                        const realizedPenalty = paidChallans.reduce((sum, ch) => {
                            const raw = ch.penalty_raw || parseFloat(String(ch.penalty || '').replace(/[^\d.]/g, '')) || 0;
                            return sum + raw;
                        }, 0);

                        const parsedLoss = result?.summary?.total_loss_calculated 
                            ? parseFloat(String(result.summary.total_loss_calculated).replace(/[^\d.]/g, '')) 
                            : 1240000;
                        const targetRecovery = Math.max(parsedLoss, totalPenaltyAssessed > 0 ? totalPenaltyAssessed * 1.25 : 1240000);
                        const recoveryRate = targetRecovery > 0 ? ((totalPenaltyAssessed / targetRecovery) * 100).toFixed(1) : '0';

                        // Calculate penalty breakdown by anomaly class
                        const categoryBreakdown = {};
                        challans.forEach(ch => {
                            const cat = ch.anomaly || 'Meter Bypassing';
                            const raw = ch.penalty_raw || parseFloat(String(ch.penalty || '').replace(/[^\d.]/g, '')) || 0;
                            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + raw;
                        });

                        const categoryChartData = Object.entries(categoryBreakdown).map(([name, amount]) => ({
                            name: name.length > 18 ? name.slice(0, 16) + '...' : name,
                            amount: amount / 1000, // in Thousands for chart
                            fullAmount: amount
                        }));

                        const handleUpdateChallanStatus = async (challanId, newStatus) => {
                            const updated = challans.map(ch => ch.id === challanId ? { ...ch, status: newStatus } : ch);
                            setChallans(updated);
                            localStorage.setItem('vidyut_admin_challans', JSON.stringify(updated));
                            localStorage.setItem('vidyut_inspector_challans', JSON.stringify(updated));
                            window.dispatchEvent(new CustomEvent('vidyut_challan_created', { detail: { id: challanId, status: newStatus } }));
                            
                            // Persist to Supabase Cloud Server Database
                            try {
                                await supabase
                                    .from('inspection_challans')
                                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                                    .eq('id', challanId);
                            } catch (err) {
                                console.warn("Supabase challan status update notice:", err);
                            }

                            try {
                                const channel = supabase.channel('vidyut_challans_realtime_channel');
                                channel.send({
                                    type: 'broadcast',
                                    event: 'update_challan_status',
                                    payload: { id: challanId, status: newStatus }
                                }).catch(e => console.warn(e));
                            } catch (e) {}
                        };

                        return (
                            <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Top KPI Metric Cards (Synced with Challans) */}
                                <div className="overview-performance-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                    <div className="performance-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="card-top-title">Total Assessed Penalties</span>
                                            <span className="stat-chip negative">
                                                {challans.length} Challan{challans.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <div className="card-big-value" style={{ color: '#dc2626' }}>
                                            ₹{totalPenaltyAssessed.toLocaleString('en-IN')}
                                        </div>
                                        <div className="card-sub-info">
                                            From field inspection bypass & hooking audits
                                        </div>
                                    </div>

                                    <div className="performance-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="card-top-title">Realized / Collected</span>
                                            <span className="stat-chip positive">+12%</span>
                                        </div>
                                        <div className="card-big-value" style={{ color: '#059669' }}>
                                            ₹{(realizedPenalty > 0 ? realizedPenalty : totalPenaltyAssessed).toLocaleString('en-IN')}
                                        </div>
                                        <div className="card-sub-info">
                                            {paidChallans.length > 0 ? `${paidChallans.length} Paid Cases` : 'Enforcement active across DISCOM'}
                                        </div>
                                    </div>

                                    <div className="performance-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="card-top-title">Target Recovery Scope</span>
                                            <span className="stat-chip neutral">Scope</span>
                                        </div>
                                        <div className="card-big-value">
                                            ₹{(targetRecovery >= 100000 ? (targetRecovery / 100000).toFixed(2) + ' Lakhs' : targetRecovery.toLocaleString('en-IN'))}
                                        </div>
                                        <div className="card-sub-info">
                                            Calculated from feeder & transformer grid loss
                                        </div>
                                    </div>

                                    <div className="performance-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="card-top-title">Recovery Progress</span>
                                            <span className="stat-chip positive">{recoveryRate}%</span>
                                        </div>
                                        <div className="card-big-value">
                                            {recoveryRate}%
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden', marginTop: '0.4rem' }}>
                                            <div style={{ width: `${Math.min(100, parseFloat(recoveryRate))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Charts Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                    {/* Penalty Revenue by Theft Category */}
                                    <div className="panel-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0, color: '#111827', fontSize: '0.95rem', fontWeight: '700' }}>
                                                Penalty Revenue by Violation Class
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#059669', background: '#ecfdf5', border: '1px solid #d1fae5', padding: '2px 8px', borderRadius: '6px' }}>
                                                ₹ in Thousands
                                            </span>
                                        </div>
                                        <div style={{ minHeight: '230px', width: '100%' }}>
                                            {categoryChartData.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                                                    Issue challans from Inspector Portal to populate breakdown.
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={230}>
                                                    <BarChart data={categoryChartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                                                        <defs>
                                                            <linearGradient id="emeraldBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                                <stop offset="100%" stopColor="#059669" stopOpacity={0.88} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                        <XAxis 
                                                            dataKey="name" 
                                                            stroke="#94a3b8" 
                                                            fontSize={11} 
                                                            tickLine={false}
                                                            axisLine={{ stroke: '#e2e8f0' }}
                                                        />
                                                        <YAxis 
                                                            stroke="#94a3b8" 
                                                            fontSize={11} 
                                                            tickLine={false}
                                                            axisLine={{ stroke: '#e2e8f0' }}
                                                            tickFormatter={(val) => `₹${val}k`}
                                                        />
                                                        <Tooltip 
                                                            cursor={{ fill: 'rgba(16, 185, 129, 0.06)', radius: 8 }}
                                                            contentStyle={{ 
                                                                background: '#ffffff', 
                                                                border: '1px solid #e2e8f0', 
                                                                borderRadius: '12px', 
                                                                boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.15)',
                                                                padding: '0.6rem 0.85rem' 
                                                            }}
                                                            itemStyle={{ color: '#047857', fontWeight: '700', fontSize: '0.88rem' }}
                                                            labelStyle={{ color: '#475569', fontWeight: '600', marginBottom: '0.2rem' }}
                                                            formatter={(val) => [`₹${(val * 1000).toLocaleString('en-IN')}`, 'Penalty Assessed']}
                                                        />
                                                        <Bar 
                                                            dataKey="amount" 
                                                            fill="url(#emeraldBarGradient)" 
                                                            radius={[8, 8, 0, 0]} 
                                                            maxBarSize={56}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {/* Monthly Recovery Trend */}
                                    <div className="panel-card">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0, color: '#111827', fontSize: '0.95rem', fontWeight: '700' }}>
                                                Recovery Realization Trajectory
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#059669', background: '#ecfdf5', border: '1px solid #d1fae5', padding: '2px 8px', borderRadius: '6px' }}>
                                                ₹ in Lakhs
                                            </span>
                                        </div>
                                        <div style={{ minHeight: '230px', width: '100%' }}>
                                            <ResponsiveContainer width="100%" height={230}>
                                                <LineChart data={[
                                                    { month: 'May', Target: 1.5, Recovered: 0.9 },
                                                    { month: 'Jun', Target: 2.0, Recovered: 1.4 },
                                                    { month: 'Jul', Target: 2.5, Recovered: 2.1 },
                                                    { month: 'Aug', Target: 3.0, Recovered: (totalPenaltyAssessed / 100000 > 0 ? (totalPenaltyAssessed / 100000).toFixed(2) : 1.4) }
                                                ]} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `₹${v}L`} />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            background: '#ffffff', 
                                                            border: '1px solid #e2e8f0', 
                                                            borderRadius: '12px', 
                                                            boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.15)',
                                                            padding: '0.6rem 0.85rem' 
                                                        }}
                                                        itemStyle={{ fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#475569', fontWeight: '600', marginBottom: '0.2rem' }}
                                                        formatter={(v, name) => [`₹${v} Lakhs`, name]}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.82rem' }} />
                                                    <Line type="monotone" dataKey="Target" stroke="#94a3b8" strokeDasharray="4 4" dot={{ r: 4, fill: '#94a3b8' }} activeDot={{ r: 6 }} strokeWidth={2} />
                                                    <Line type="monotone" dataKey="Recovered" stroke="#10b981" dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 7, fill: '#059669' }} strokeWidth={3} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'Inspection' && (
                        <div className="dashboard-panel" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                            {/* Calendar List (Editable) */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Field Inspection Calendar</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Consumer ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Zone Area</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Assigned Inspector</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Status</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inspectionCalendar.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
                                                        <Calendar size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35, display: 'block' }} />
                                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>No Field Inspections Scheduled</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: '#9ca3af' }}>Assign an inspector to any detected anomaly in the Overview tab to schedule an inspection.</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                inspectionCalendar.map((ins, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                        {editingCalendarId === ins.consumer ? (
                                                        <>
                                                            {/* Inline Calendar Edit */}
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{ins.consumer}</td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text"
                                                                    value={editCalendarData.zone}
                                                                    onChange={e => setEditCalendarData({ ...editCalendarData, zone: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <select 
                                                                    value={editCalendarData.inspector}
                                                                    onChange={e => setEditCalendarData({ ...editCalendarData, inspector: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem' }}
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
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem' }}
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
                                                                        onClick={async () => {
                                                                            const targetConsumer = ins.consumer;
                                                                            const newInspector = editCalendarData.inspector;
                                                                            const matchedIns = inspectorsDetails.find(i => i.name === newInspector || (newInspector && i.name.toLowerCase() === newInspector.toLowerCase()));
                                                                            const newEmail = matchedIns?.email || '';

                                                                            setInspectionCalendar(prev => {
                                                                                const next = prev.map(item => item.consumer === targetConsumer ? editCalendarData : item);
                                                                                localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                                                                                return next;
                                                                            });

                                                                            if (editCalendarData.status) {
                                                                                setLocalInspectionStatus(prev => {
                                                                                    const next = { ...prev, [targetConsumer]: editCalendarData.status };
                                                                                    localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                                                                                    return next;
                                                                                });
                                                                            }

                                                                            if (editCalendarData.inspector) {
                                                                                setAssignedInspectors(prev => {
                                                                                    const next = { ...prev, [targetConsumer]: editCalendarData.inspector };
                                                                                    localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                                                                                    return next;
                                                                                });
                                                                            }

                                                                            setEditingCalendarId(null);
                                                                            try {
                                                                                const updatePayload = {
                                                                                    zone: editCalendarData.zone,
                                                                                    inspector_name: editCalendarData.inspector,
                                                                                    status: editCalendarData.status,
                                                                                    updated_at: new Date().toISOString()
                                                                                };
                                                                                if (newEmail) {
                                                                                    updatePayload.inspector_email = newEmail;
                                                                                }
                                                                                await supabase
                                                                                    .from('inspection_tasks')
                                                                                    .update(updatePayload)
                                                                                    .eq('consumer_id', targetConsumer);
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                            }
                                                                        }}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingCalendarId(null)}
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Normal Static Calendar View */}
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{ins.consumer}</td>
                                                            <td style={{ padding: '1rem', color: '#4b5563' }}>{ins.zone}</td>
                                                            <td style={{ padding: '1rem', color: '#4b5563' }}>{ins.inspector || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {(() => {
                                                                    const currentStatus = ins.status || 'Initiated';
                                                                    const isCompleted = (currentStatus || '').toLowerCase() === 'completed';
                                                                    const isInProcess = (currentStatus || '').toLowerCase().includes('process');

                                                                    return (
                                                                        <span style={{ 
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.45rem',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: '600',
                                                                            padding: '0.25rem 0.6rem',
                                                                            borderRadius: '9999px',
                                                                            color: isCompleted ? '#059669' : isInProcess ? '#d97706' : '#ea580c',
                                                                            background: isCompleted ? '#ecfdf5' : isInProcess ? '#fef3c7' : '#fff7ed',
                                                                            border: `1px solid ${isCompleted ? '#a7f3d0' : isInProcess ? '#fde68a' : '#ffedd5'}`
                                                                        }}>
                                                                            <span style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: isCompleted ? '#059669' : isInProcess ? '#d97706' : '#ea580c'
                                                                            }} />
                                                                            {currentStatus}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingCalendarId(ins.consumer);
                                                                            setEditCalendarData(ins);
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={async () => {
                                                                            if (confirm(`Remove consumer ${ins.consumer} from inspection calendar?`)) {
                                                                                const targetConsumer = ins.consumer;
                                                                                
                                                                                // 1. Remove from Inspection Calendar state & cache
                                                                                setInspectionCalendar(prev => {
                                                                                    const next = prev.filter(item => item.consumer !== targetConsumer);
                                                                                    localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                                                                                    return next;
                                                                                });

                                                                                // 2. Immediately reset Detected Anomalies Inspection Status & Inspector Assignment
                                                                                setLocalInspectionStatus(prev => {
                                                                                    const next = { ...prev };
                                                                                    delete next[targetConsumer];
                                                                                    localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(next));
                                                                                    return next;
                                                                                });

                                                                                setAssignedInspectors(prev => {
                                                                                    const next = { ...prev };
                                                                                    delete next[targetConsumer];
                                                                                    localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(next));
                                                                                    return next;
                                                                                });

                                                                                // 3. Automatically remove Challans for this consumer from state & cache
                                                                                setChallans(prev => {
                                                                                    const next = prev.filter(c => c.consumer !== targetConsumer);
                                                                                    localStorage.setItem('vidyut_admin_challans', JSON.stringify(next));
                                                                                    localStorage.setItem('vidyut_inspector_challans', JSON.stringify(next));
                                                                                    return next;
                                                                                });

                                                                                // 4. Also clean up Inspector Portal's Past Inspections storage
                                                                                try {
                                                                                    const savedPast = localStorage.getItem('vidyut_inspector_past_inspections');
                                                                                    if (savedPast) {
                                                                                        const parsed = JSON.parse(savedPast);
                                                                                        if (Array.isArray(parsed)) {
                                                                                            const nextPast = parsed.filter(p => {
                                                                                                const pCid = p.consumer || p.consumer_id;
                                                                                                const pId = p.id || '';
                                                                                                return pCid !== targetConsumer && pId !== targetConsumer && !String(pId).toUpperCase().includes(targetConsumer.toUpperCase());
                                                                                            });
                                                                                            localStorage.setItem('vidyut_inspector_past_inspections', JSON.stringify(nextPast));
                                                                                        }
                                                                                    }
                                                                                } catch (e) {
                                                                                    console.error("Error cleaning inspector past inspections:", e);
                                                                                }

                                                                                // 5. Dispatch local window events for multi-tab sync
                                                                                window.dispatchEvent(new CustomEvent('vidyut_task_deleted', { detail: { consumer_id: targetConsumer } }));
                                                                                window.dispatchEvent(new CustomEvent('vidyut_inspection_deleted', { detail: { consumer_id: targetConsumer } }));
                                                                                window.dispatchEvent(new CustomEvent('vidyut_past_inspection_deleted', { detail: { consumer_id: targetConsumer } }));
                                                                                window.dispatchEvent(new CustomEvent('vidyut_challan_deleted', { detail: { consumer: targetConsumer } }));

                                                                                // 6. Delete task and challans from Supabase Cloud Server Database
                                                                                try {
                                                                                    await supabase
                                                                                        .from('inspection_tasks')
                                                                                        .delete()
                                                                                        .eq('consumer_id', targetConsumer);
                                                                                } catch (e) {
                                                                                    console.error("Error deleting task from Supabase:", e);
                                                                                }

                                                                                try {
                                                                                    await supabase
                                                                                        .from('inspection_challans')
                                                                                        .delete()
                                                                                        .eq('consumer', targetConsumer);
                                                                                } catch (e) {
                                                                                    console.error("Error deleting challan from Supabase:", e);
                                                                                }

                                                                                // 7. Broadcast task and challan deletion over Supabase Realtime channels
                                                                                try {
                                                                                    const channel = supabase.channel('admin_tasks_realtime_channel');
                                                                                    channel.send({
                                                                                        type: 'broadcast',
                                                                                        event: 'task_deleted',
                                                                                        payload: { consumer_id: targetConsumer }
                                                                                    }).catch(e => console.warn(e));

                                                                                    channel.send({
                                                                                        type: 'broadcast',
                                                                                        event: 'inspection_deleted',
                                                                                        payload: { consumer_id: targetConsumer }
                                                                                    }).catch(e => console.warn(e));
                                                                                } catch (e) {}

                                                                                try {
                                                                                    const challanCh = supabase.channel('vidyut_global_challans_channel');
                                                                                    challanCh.send({
                                                                                        type: 'broadcast',
                                                                                        event: 'challan_deleted',
                                                                                        payload: { consumer: targetConsumer }
                                                                                    }).catch(e => console.warn(e));
                                                                                } catch (e) {}
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
                                            )))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Field Penalties & Bypass Challans (Realtime Synced with Inspector Portal) */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <h3 className="panel-title" style={{ margin: 0 }}>Field Penalties & Bypass Challans</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                            Real-time stream of audit challans issued by field inspectors
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className="stat-chip neutral" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                                            Total Issued: {challans.length}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Challan ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Consumer ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Theft Anomaly Class</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Connected Load</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Assessed Penalty</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Auditing Inspector</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {challans.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                                                        <AlertTriangle size={30} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35, display: 'block' }} />
                                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>No Challans Issued Yet</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: '#9ca3af' }}>
                                                            Challans created by field inspectors during on-site audits will appear here in real-time.
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                challans.map((ch, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                        <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{ch.id}</td>
                                                        <td style={{ padding: '1rem', color: '#18181b', fontWeight: '600' }}>{ch.consumer}</td>
                                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{ch.anomaly}</td>
                                                        <td style={{ padding: '1rem', color: '#6b7280' }}>{ch.load}</td>
                                                        <td style={{ padding: '1rem', color: '#dc2626', fontWeight: '700' }}>{ch.penalty}</td>
                                                        <td style={{ padding: '1rem', color: '#4b5563' }}>{ch.inspector || 'Field Inspector'}</td>
                                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: '0.75rem', fontWeight: '600',
                                                                background: '#fef2f2', color: '#dc2626',
                                                                border: '1px solid #fecaca',
                                                                padding: '0.25rem 0.65rem', borderRadius: '9999px'
                                                            }}>
                                                                {ch.status || 'Issued'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Inspector List' && (
                        <div className="dashboard-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {/* Inspectors directory */}
                            <div className="panel-card" style={{ height: 'fit-content' }}>
                                <h3 className="panel-title">Field Inspectors Directory</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Inspector Name</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Badge ID</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Email</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Credentials</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'center', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inspectorsDetails.map((ins, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    {editingInspectorName === ins.name ? (
                                                        <>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editInspectorData.name}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, name: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="text" 
                                                                    value={editInspectorData.badgeId}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, badgeId: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                                <input 
                                                                    type="email" 
                                                                    value={editInspectorData.email}
                                                                    onChange={e => setEditInspectorData({ ...editInspectorData, email: e.target.value })}
                                                                    style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', fontSize: '0.85rem', width: '90%' }}
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
                                                                        style={{ padding: '0.3rem 0.6rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{ins.name}</td>
                                                            <td style={{ padding: '1rem', color: '#4b5563' }}>{ins.badgeId}</td>
                                                            <td style={{ padding: '1rem', color: '#4b5563' }}>{ins.email}</td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleSendCredentials(ins)}
                                                                    disabled={sendingCredentials[ins.email]}
                                                                    style={{
                                                                        padding: '0.35rem 0.75rem',
                                                                        background: sendingCredentials[ins.email] ? '#f3f4f6' : '#18181b',
                                                                        color: sendingCredentials[ins.email] ? '#9ca3af' : '#ffffff',
                                                                        border: 'none',
                                                                        borderRadius: '9999px',
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
                                                                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
                                            const success = await handleSaveInspector(formattedName, newInspector.badgeId, newInspector.email, '', user?.discom);
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
                                        <label style={{ color: '#374151', fontSize: '0.85rem', fontWeight: '500' }}>Full Name *</label>
                                        <input 
                                            type="text"
                                            value={newInspector.name}
                                            onChange={e => setNewInspector({ ...newInspector, name: e.target.value })}
                                            placeholder="e.g. S. Iyer"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: '#f9fafb', border: '1px solid #d1d5db',
                                                borderRadius: '8px', color: '#111827', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: '#374151', fontSize: '0.85rem', fontWeight: '500' }}>Badge Identification ID</label>
                                        <input 
                                            type="text"
                                            value={newInspector.badgeId}
                                            onChange={e => setNewInspector({ ...newInspector, badgeId: e.target.value })}
                                            placeholder="e.g. INS-DEL-55104"
                                            style={{
                                                padding: '0.7rem 0.9rem', background: '#f9fafb', border: '1px solid #d1d5db',
                                                borderRadius: '8px', color: '#111827', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ color: '#374151', fontSize: '0.85rem', fontWeight: '500' }}>Email Address *</label>
                                        <input 
                                            type="email"
                                            value={newInspector.email}
                                            onChange={e => setNewInspector({ ...newInspector, email: e.target.value })}
                                            placeholder="e.g. iyer@vidyut.com"
                                            required
                                            style={{
                                                padding: '0.7rem 0.9rem', background: '#f9fafb', border: '1px solid #d1d5db',
                                                borderRadius: '8px', color: '#111827', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="stitch-btn-pill"
                                        style={{ width: 'auto', padding: '0.75rem 1.5rem', alignSelf: 'flex-start', marginTop: '0.5rem' }}
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
                                        <div key={i} style={{ padding: '1.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4 style={{ margin: 0, color: '#111827', fontSize: '1rem', fontWeight: '700' }}>{pri.title}</h4>
                                                <span style={{ 
                                                    background: pri.risk === 'CRITICAL' ? '#fef2f2' : '#fff7ed',
                                                    color: pri.risk === 'CRITICAL' ? '#dc2626' : '#ea580c',
                                                    border: `1px solid ${pri.risk === 'CRITICAL' ? '#fecaca' : '#ffedd5'}`,
                                                    padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700'
                                                }}>{pri.risk}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                Flagged Score: <strong style={{ color: '#111827' }}>{pri.score}</strong> | Target: <strong style={{ color: '#111827' }}>{pri.consumers}</strong>
                                            </div>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', lineHeight: '1.5' }}>
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
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to clear all history records?")) {
                                                    setUploadHistory([]);
                                                    localStorage.removeItem('vidyut_upload_history');
                                                    try {
                                                        await supabase.from('upload_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }
                                            }}
                                            style={{
                                                background: '#fef2f2', border: '1px solid #fee2e2',
                                                color: '#ef4444', padding: '0.4rem 0.85rem', borderRadius: '9999px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.8rem'
                                            }}
                                        >
                                            Clear All History
                                        </button>
                                    )}
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Filename</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Uploaded On</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Consumers Analyzed</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Critical Flags</th>
                                                <th style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.825rem', color: '#4b5563', fontWeight: '600' }}>Load Results</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                                        <Activity size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35, display: 'block' }} />
                                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>No Analysis History Logs Found</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: '#9ca3af' }}>Upload a CSV dataset on the Overview tab and click Fetch & Analyse to record dynamic logs.</div>
                                                    </td>
                                                </tr>
                                            ) : uploadHistory.map((hist, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '600', color: '#111827' }}>{hist.name}</td>
                                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{hist.date}</td>
                                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{hist.count} consumers</td>
                                                    <td style={{ padding: '1rem', color: (hist.critical > 0) ? '#dc2626' : '#059669', fontWeight: '600' }}>
                                                        {hist.critical} {hist.critical === 1 ? 'critical' : 'critical'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button 
                                                                style={{ 
                                                                    background: '#18181b', 
                                                                    border: 'none', 
                                                                    color: '#ffffff', 
                                                                    padding: '0.3rem 0.8rem', 
                                                                    borderRadius: '9999px', 
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
                                                                    background: '#f3f4f6', 
                                                                    border: '1px solid #d1d5db', 
                                                                    color: '#374151', 
                                                                    padding: '0.3rem 0.8rem', 
                                                                    borderRadius: '9999px', 
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
                        </div>
                    )}

                    {activeTab === 'Settings' && (
                        <div className="dashboard-panel">
                            <div className="panel-card">
                                <h3 className="panel-title">Threshold Configurator</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="dashboard-form-group">
                                        <label>Critical Anomaly Risk Level Threshold ({'>'}= 85%)</label>
                                        <input type="range" min="50" max="100" defaultValue="85" style={{ cursor: 'pointer', width: '100%', accentColor: '#18181b' }} />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>High Anomaly Risk Level Threshold (60% - 85%)</label>
                                        <input type="range" min="30" max="80" defaultValue="60" style={{ cursor: 'pointer', width: '100%', accentColor: '#18181b' }} />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Technical Loss Estimation Rate (INR per kWh)</label>
                                        <input type="number" defaultValue="7.50" className="dashboard-form-input" />
                                    </div>
                                    <div className="dashboard-form-group">
                                        <label>Auto-Dispatch Priority Inspections</label>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#111827', fontSize: '0.85rem' }}>
                                                <input type="radio" name="auto-dispatch" defaultChecked /> Enable
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#111827', fontSize: '0.85rem' }}>
                                                <input type="radio" name="auto-dispatch" /> Disable
                                            </label>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => alert("Settings saved successfully!")}
                                        className="stitch-btn-pill"
                                        style={{ width: 'auto', padding: '0.75rem 1.5rem', alignSelf: 'flex-start', marginTop: '0.5rem' }}
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
