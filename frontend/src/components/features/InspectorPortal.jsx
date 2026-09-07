import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    MapPin, User, ClipboardCheck, AlertTriangle, 
    ShieldAlert, Lock, Settings, LogOut, Menu, 
    X, CheckCircle, Navigation, Map, Shield, Zap, Activity, Radio, ChevronRight, Sun, Moon, ExternalLink,
    Eye, FileText, Check
} from 'lucide-react';
import MapComponent from './MapComponent';
import { supabase } from '../../supabaseClient';

const INSPECTOR_TAB_SLUGS = {
    'Current Task': 'tasks',
    'Account Details': 'account',
    'Past Inspections': 'past-inspections',
    'Create Challan': 'create-challan',
    'File Complain': 'file-complain',
    'Login History': 'login-history',
    'Settings': 'settings'
};

const INSPECTOR_SLUG_TO_TAB = {
    'tasks': 'Current Task',
    'current-task': 'Current Task',
    'audit': 'Current Task',
    'account': 'Account Details',
    'account-details': 'Account Details',
    'past-inspections': 'Past Inspections',
    'history': 'Past Inspections',
    'create-challan': 'Create Challan',
    'challans': 'Create Challan',
    'challan': 'Create Challan',
    'file-complain': 'File Complain',
    'complain': 'File Complain',
    'complaints': 'File Complain',
    'login-history': 'Login History',
    'settings': 'Settings'
};

const InspectorPortal = ({ inspector, onLogout }) => {
    const navigate = useNavigate();
    const { tab: urlTab } = useParams();

    const [activeTab, setActiveTab] = useState(() => {
        if (urlTab && INSPECTOR_SLUG_TO_TAB[urlTab.toLowerCase()]) {
            return INSPECTOR_SLUG_TO_TAB[urlTab.toLowerCase()];
        }
        return localStorage.getItem('vidyut_inspector_active_tab') || 'Current Task';
    });

    useEffect(() => {
        if (urlTab && INSPECTOR_SLUG_TO_TAB[urlTab.toLowerCase()]) {
            setActiveTab(INSPECTOR_SLUG_TO_TAB[urlTab.toLowerCase()]);
        }
    }, [urlTab]);

    useEffect(() => {
        localStorage.setItem('vidyut_inspector_active_tab', activeTab);
    }, [activeTab]);

    const switchTab = (tabName) => {
        setActiveTab(tabName);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
        const slug = INSPECTOR_TAB_SLUGS[tabName] || 'tasks';
        navigate(`/inspector/${slug}`, { replace: true });
    };

    useEffect(() => {
        localStorage.removeItem('vidyut_theme');
        document.documentElement.removeAttribute('data-theme');
    }, []);

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
    const [selectedPastAudit, setSelectedPastAudit] = useState(null);

    // Active pending/in-process tasks (completed tasks are removed from the active queue)
    const activeTasks = useMemo(() => {
        if (!myTasks || myTasks.length === 0) return [];
        return myTasks.filter(t => {
            const s = (t.status || '').toLowerCase();
            return !s.includes('comp');
        });
    }, [myTasks]);

    // Active Task Object (selected from pending tasks queue)
    const currentTask = useMemo(() => {
        if (activeTasks.length === 0) return null;
        if (selectedConsumerId) {
            const found = activeTasks.find(t => t.consumer_id === selectedConsumerId);
            if (found) return found;
        }
        return activeTasks[0];
    }, [activeTasks, selectedConsumerId]);

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

    // Worldwide Global Past Inspections merged from Supabase Database & local session records
    const pastInspectionsList = useMemo(() => {
        const list = [];
        const seen = new Set();

        // 1. From global Supabase inspection_tasks table where status is Completed
        const completedFromDB = (allAssignedTasks || []).filter(t => {
            const s = (t.status || '').toLowerCase();
            return s.includes('comp');
        });

        completedFromDB.forEach(t => {
            if (!seen.has(t.consumer_id)) {
                seen.add(t.consumer_id);
                list.push({
                    id: t.id ? `AUD-${String(t.id).substring(0, 6).toUpperCase()}` : `INS-${t.consumer_id}`,
                    consumer: t.consumer_id,
                    transformer_id: t.transformer_id || 'T01',
                    zone: t.zone || (t.transformer_id ? `Transformer ${t.transformer_id}` : 'Delhi Central Grid'),
                    date: t.updated_at ? new Date(t.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently Completed',
                    type: 'Field Hooking & Seal Audit',
                    result: 'Completed Audit',
                    risk_class: t.risk_class || 'High Anomaly',
                    risk_score: t.risk_score || 0.85,
                    latitude: Number(t.latitude) || 28.6139,
                    longitude: Number(t.longitude) || 77.2090,
                    inspector_name: t.inspector_name || inspector?.displayName || 'Field Inspector',
                    inspector_email: t.inspector_email || inspector?.email || '',
                    discom: t.discom || inspector?.discom || 'Tata Power DDL',
                    status: 'Completed',
                    checkList: { sealIntact: true, hookingCheck: true, bypassDetected: false, terminalSecure: true },
                    notes: t.notes || 'Field audit completed on-site. Meter seal and hook bypass verified.'
                });
            }
        });

        // 2. Merge local records from pastInspections state
        if (Array.isArray(pastInspections)) {
            pastInspections.forEach(item => {
                const cId = item.consumer || item.consumer_id;
                if (cId && !seen.has(cId)) {
                    seen.add(cId);
                    list.push({
                        id: item.id || `INS-${cId}`,
                        consumer: cId,
                        transformer_id: item.transformer_id || 'T01',
                        zone: item.zone || 'Delhi Central Grid',
                        date: item.date || 'Earlier Audit',
                        type: item.type || 'Field Hooking & Seal Audit',
                        result: item.result || 'Completed Audit',
                        risk_class: item.risk_class || 'Anomaly Audit',
                        risk_score: item.risk_score || 0.80,
                        latitude: Number(item.latitude) || 28.6139,
                        longitude: Number(item.longitude) || 77.2090,
                        inspector_name: item.inspector_name || inspector?.displayName || 'Field Inspector',
                        inspector_email: item.inspector_email || inspector?.email || '',
                        discom: item.discom || inspector?.discom || 'Tata Power DDL',
                        status: 'Completed',
                        checkList: item.checkList || { sealIntact: true, hookingCheck: true, bypassDetected: false, terminalSecure: true },
                        notes: item.notes || 'Inspection details verified and filed.'
                    });
                }
            });
        }

        return list;
    }, [allAssignedTasks, pastInspections, inspector]);

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

    // Fetch and sync challans from Supabase Cloud Server DB
    useEffect(() => {
        const fetchChallansFromDB = async () => {
            try {
                const { data, error } = await supabase
                    .from('inspection_challans')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (data && !error && data.length > 0) {
                    setChallans(data);
                    localStorage.setItem('vidyut_inspector_challans', JSON.stringify(data));
                }
            } catch (err) {
                console.warn("Challans DB notice:", err);
            }
        };

        fetchChallansFromDB();

        // Subscribe to server-side Postgres changes
        const challanDbChannel = supabase
            .channel('inspector_challans_db_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inspection_challans' }, () => {
                fetchChallansFromDB();
            })
            .on('broadcast', { event: 'new_challan' }, (e) => {
                if (e.payload) {
                    setChallans(prev => {
                        if (prev.some(c => c.id === e.payload.id)) return prev;
                        return [e.payload, ...prev];
                    });
                }
            })
            .on('broadcast', { event: 'update_challan_status' }, (e) => {
                if (e.payload && e.payload.id) {
                    setChallans(prev => prev.map(c => c.id === e.payload.id ? { ...c, status: e.payload.status } : c));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(challanDbChannel);
        };
    }, []);

    // Aggregated list of consumers from past audits & assigned inspection tasks for quick selection
    const pastInspectionOptions = useMemo(() => {
        const list = [];
        const seen = new Set();

        // 1. Consumers from past inspections log
        if (Array.isArray(pastInspectionsList)) {
            pastInspectionsList.forEach(item => {
                if (item.consumer && !seen.has(item.consumer)) {
                    seen.add(item.consumer);
                    list.push({
                        consumer: item.consumer,
                        zone: item.zone || 'Delhi Grid Area',
                        source: 'Past Completed Audit',
                        status: item.result || 'Completed'
                    });
                }
            });
        }

        // 2. Consumers from active assigned tasks
        const combinedTasks = [...(activeTasks || []), ...(allAssignedTasks || [])];
        combinedTasks.forEach(task => {
            if (task.consumer_id && !seen.has(task.consumer_id)) {
                seen.add(task.consumer_id);
                list.push({
                    consumer: task.consumer_id,
                    zone: task.zone || (task.transformer_id ? `Transformer ${task.transformer_id}` : 'Assigned Grid Task'),
                    source: 'Assigned Task',
                    status: task.status || 'Active'
                });
            }
        });

        return list;
    }, [pastInspectionsList, activeTasks, allAssignedTasks]);

    // Forms states
    const [challanForm, setChallanForm] = useState({ consumerId: '', anomaly: 'Bypassing meter', load: '', penalty: '', details: '' });
    const [complaintForm, setComplaintForm] = useState({ category: 'Meter Damage', severity: 'Medium', details: '' });

    // Dynamic map dataset built from active assigned tasks
    const activeMapData = useMemo(() => {
        const tasksToMap = activeTasks.length > 0 ? activeTasks : (currentTask ? [currentTask] : []);
        if (tasksToMap.length > 0) {
            return {
                results: tasksToMap.map(t => ({
                    consumer_id: t.consumer_id,
                    transformer_id: t.transformer_id,
                    latitude: Number(t.latitude) || 28.6139,
                    longitude: Number(t.longitude) || 77.2090,
                    risk_class: t.risk_class || 'critical',
                    aggregate_risk_score: Number(t.risk_score) || 0.85
                }))
            };
        }
        return {
            results: []
        };
    }, [activeTasks, currentTask]);

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

    // Cancel / Release current audit task so it can be reassigned (Only before audit starts)
    const cancelAudit = async () => {
        if (!currentTask) return;
        const rawStatus = (currentTask.status || inspectionStatus || '').toLowerCase();
        if (rawStatus.includes('proc') || rawStatus.includes('comp') || inspectionStatus === 'Inprocess' || inspectionStatus === 'Completed') {
            alert("🔒 Audit In Progress / Completed:\n\nOnce a field audit has been started, it cannot be cancelled. Please complete the inspection checklist and submit the audit findings.");
            return;
        }

        const cid = currentTask.consumer_id;
        if (confirm(`Cancel and release audit for Consumer ${cid}?\n\nThis will unassign you from this task and release it back to DISCOM admin for reassignment.`)) {
            try {
                // Delete from Supabase tasks table
                await supabase
                    .from('inspection_tasks')
                    .delete()
                    .eq('consumer_id', cid);

                // Update local state
                setAllAssignedTasks(prev => prev.filter(t => t.consumer_id !== cid));
                
                // Remove from local storage
                const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
                localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(savedTasks.filter(t => t.consumer_id !== cid)));

                const savedStatus = JSON.parse(localStorage.getItem('vidyut_local_inspection_status') || '{}');
                delete savedStatus[cid];
                localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(savedStatus));

                const savedAssign = JSON.parse(localStorage.getItem('vidyut_assigned_inspectors') || '{}');
                delete savedAssign[cid];
                localStorage.setItem('vidyut_assigned_inspectors', JSON.stringify(savedAssign));

                const savedCal = JSON.parse(localStorage.getItem('vidyut_inspection_calendar') || '[]');
                localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(savedCal.filter(c => c.consumer !== cid)));

                // Dispatch local window event & broadcast
                window.dispatchEvent(new CustomEvent('vidyut_task_deleted', { detail: { consumer_id: cid } }));
                try {
                    const channel = supabase.channel('admin_tasks_realtime_channel');
                    channel.send({
                        type: 'broadcast',
                        event: 'task_deleted',
                        payload: { consumer_id: cid }
                    }).catch(e => console.warn(e));
                } catch (e) {}

                alert(`Audit for Consumer ${cid} has been cancelled and released.`);
                setSelectedConsumerId(null);
            } catch (err) {
                console.error("Error cancelling audit:", err);
                alert("Error cancelling audit. Please try again.");
            }
        }
    };

    // Form Handlers
    const handleChallanSubmit = async (e) => {
        e.preventDefault();
        if (!challanForm.consumerId || !challanForm.penalty) {
            alert('Please fill out all required fields');
            return;
        }

        const newChallan = {
            id: `CH-2026-${String(challans.length + 1).padStart(3, '0')}`,
            consumer: challanForm.consumerId.trim(),
            anomaly: challanForm.anomaly,
            load: `${challanForm.load || 'N/A'} kW`,
            penalty: `₹${parseFloat(challanForm.penalty).toLocaleString('en-IN')}`,
            penalty_raw: parseFloat(challanForm.penalty) || 0,
            inspector: inspector?.displayName || inspector?.name || inspector?.email || 'Field Inspector',
            zone: currentTask?.zone || (currentTask?.transformer_id ? `Transformer ${currentTask?.transformer_id}` : 'Delhi Grid Area'),
            details: challanForm.details || 'Detected during field audit',
            status: 'Issued',
            created_at: new Date().toISOString()
        };

        const updatedChallans = [newChallan, ...challans];
        setChallans(updatedChallans);
        localStorage.setItem('vidyut_inspector_challans', JSON.stringify(updatedChallans));
        localStorage.setItem('vidyut_admin_challans', JSON.stringify(updatedChallans));

        // 1. Save directly to Supabase Cloud Server Database
        try {
            await supabase
                .from('inspection_challans')
                .upsert([newChallan]);
        } catch (err) {
            console.warn("Supabase cloud database save notice:", err);
        }

        // 2. Realtime window dispatch for instant local tab sync
        window.dispatchEvent(new CustomEvent('vidyut_challan_created', { detail: newChallan }));

        // 3. Realtime broadcast via Supabase Realtime channel
        try {
            const channel = supabase.channel('vidyut_challans_realtime_channel');
            channel.send({
                type: 'broadcast',
                event: 'new_challan',
                payload: newChallan
            }).catch(e => console.warn("Realtime broadcast notice:", e));
        } catch (err) {
            console.warn("Supabase real-time notice:", err);
        }

        alert(`Challan ${newChallan.id} for Consumer ${newChallan.consumer} created & saved to global cloud server!`);
        setChallanForm({ consumerId: '', anomaly: 'Bypassing meter', load: '', penalty: '', details: '' });
    };

    const handleComplaintSubmit = (e) => {
        e.preventDefault();
        alert(`Technical grievance filed under category: ${complaintForm.category}`);
        setComplaintForm({ category: 'Meter Damage', severity: 'Medium', details: '' });
    };

    const completeInspection = async () => {
        if (!checkList.sealIntact && !checkList.hookingCheck && !checkList.bypassDetected && !checkList.terminalSecure) {
            alert('Please perform checklist verification before completing the audit');
            return;
        }
        if (!currentTask) return;

        const cid = currentTask.consumer_id;
        const nowIso = new Date().toISOString();

        // 1. Sync live update to Supabase DB globally
        try {
            const { error: updErr } = await supabase
                .from('inspection_tasks')
                .update({ 
                    status: 'Completed', 
                    updated_at: nowIso 
                })
                .eq('consumer_id', cid);
            if (updErr) console.error("Error updating task status in Supabase:", updErr.message);
        } catch (err) {
            console.error("Supabase update exception:", err);
        }

        // 2. Update local state & localStorage cache
        try {
            const savedTasks = JSON.parse(localStorage.getItem('vidyut_assigned_tasks') || '[]');
            const updated = savedTasks.map(t => t.consumer_id === cid ? { ...t, status: 'Completed', updated_at: nowIso } : t);
            localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(updated));
            setAllAssignedTasks(updated);

            // Sync with localInspectionStatus for Admin Dashboard overview
            const savedStatus = JSON.parse(localStorage.getItem('vidyut_local_inspection_status') || '{}');
            savedStatus[cid] = 'Completed';
            localStorage.setItem('vidyut_local_inspection_status', JSON.stringify(savedStatus));

            // Sync with calendar
            const savedCal = JSON.parse(localStorage.getItem('vidyut_inspection_calendar') || '[]');
            const updatedCal = savedCal.map(c => c.consumer === cid ? { ...c, status: 'Completed' } : c);
            localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(updatedCal));
        } catch (e) {
            console.error('Error updating task status locally:', e);
        }

        // 3. Add to past inspections list
        const newRecord = {
            id: currentTask.id ? `AUD-${String(currentTask.id).substring(0, 6).toUpperCase()}` : `INS-${cid}`,
            consumer: cid,
            transformer_id: currentTask.transformer_id || 'T01',
            zone: currentTask.zone || (currentTask.transformer_id ? `Transformer ${currentTask.transformer_id}` : 'Delhi Central Grid'),
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            type: 'Field Hooking & Seal Audit',
            result: 'Completed Audit',
            risk_class: currentTask.risk_class || 'High Anomaly',
            risk_score: currentTask.risk_score || 0.85,
            latitude: Number(currentTask.latitude) || 28.6139,
            longitude: Number(currentTask.longitude) || 77.2090,
            inspector_name: inspector?.displayName || 'Field Inspector',
            inspector_email: inspector?.email || '',
            discom: currentTask.discom || inspector?.discom || 'Tata Power DDL',
            status: 'Completed',
            checkList: { ...checkList },
            notes: auditNotes || 'Field inspection successfully completed on site. Physical seal and hooking checks verified.'
        };
        setPastInspections(prev => [newRecord, ...prev.filter(p => p.consumer !== cid)]);

        // 4. Reset checklist & field notes
        setCheckList({ sealIntact: false, hookingCheck: false, bypassDetected: false, terminalSecure: false });
        setAuditNotes('');
        setInspectionStatus('Initiate');

        // 5. Switch to next remaining active task or clear selected consumer
        const remainingActive = activeTasks.filter(t => t.consumer_id !== cid);
        if (remainingActive.length > 0) {
            setSelectedConsumerId(remainingActive[0].consumer_id);
        } else {
            setSelectedConsumerId(null);
        }

        alert(`✅ Field audit for Consumer ${cid} completed and saved globally!\n\nSynchronized worldwide with DISCOM central database.`);
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
                            onClick={() => switchTab(item.name)}
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
                    <a
                        href="/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'rgba(200, 162, 97, 0.1)',
                            border: '1px solid rgba(200, 162, 97, 0.3)',
                            color: '#c8a261',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                        }}
                        title="Open Admin Dashboard in a separate tab to operate both simultaneously"
                    >
                        <ExternalLink size={13} /> Open Admin Portal
                    </a>
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
                                            
                                            {inspectionStatus === 'Initiate' ? (
                                                <button
                                                    onClick={cancelAudit}
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    title="Decline or cancel this audit before starting"
                                                >
                                                    <X size={14} /> Cancel / Decline Audit
                                                </button>
                                            ) : (
                                                <span
                                                    style={{
                                                        padding: '0.4rem 0.65rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        color: 'rgba(255, 255, 255, 0.4)',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        fontSize: '0.78rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}
                                                    title="Audit has already been started on site and cannot be cancelled."
                                                >
                                                    <Lock size={12} /> Audit Locked
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Task Switcher if inspector has multiple active assigned consumers */}
                                    {activeTasks.length > 1 && (
                                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                                                Switch Active Assigned Audit ({activeTasks.length} pending):
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {activeTasks.map(t => (
                                                    <button
                                                        key={t.consumer_id}
                                                        onClick={() => setSelectedConsumerId(t.consumer_id)}
                                                        style={{
                                                            padding: '0.35rem 0.75rem',
                                                            borderRadius: '6px',
                                                            background: currentTask?.consumer_id === t.consumer_id ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                                                            color: currentTask?.consumer_id === t.consumer_id ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            transition: 'all 0.2s'
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
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Standby State when no active task remains in queue */
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
                                {pastInspectionsList.length > 0 ? (
                                    <>
                                        <div style={{
                                            width: '68px', height: '68px', borderRadius: '50%',
                                            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#10b981', marginBottom: '1.25rem'
                                        }}>
                                            <CheckCircle size={34} />
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                                            All Assigned Audits Completed
                                        </h3>
                                        <p style={{ maxWidth: '520px', margin: '0 0 1.5rem 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            All field inspection tasks assigned to <strong>{inspector?.displayName || 'your account'}</strong> for <strong>{inspector?.discom || 'your DISCOM'}</strong> have been successfully verified, resolved, and synchronized globally with the central database.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => switchTab('Past Inspections')}
                                                style={{
                                                    background: '#c8a261', color: '#000000', padding: '0.65rem 1.5rem',
                                                    borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none',
                                                    fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <ClipboardCheck size={16} /> View Past Inspections ({pastInspectionsList.length})
                                            </button>
                                            <span style={{
                                                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                                padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600'
                                            }}>
                                                Status: All Audits Completed & Synced Globally
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>Historical Audit Log</h3>
                                    <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                        Click any inspection record to view its on-site GPS coordinates, map telemetry, checklist, and audit findings.
                                    </p>
                                </div>
                                <span style={{ background: 'rgba(200, 162, 97, 0.12)', color: '#c8a261', border: '1px solid rgba(200, 162, 97, 0.25)', padding: '0.35rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                                    {pastInspectionsList.length} Completed Record{pastInspectionsList.length !== 1 ? 's' : ''} (Global Sync)
                                </span>
                            </div>

                            {pastInspectionsList.length === 0 ? (
                                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                    <ClipboardCheck size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>No past inspections completed yet.</p>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>When you complete active assigned field audits, they will appear here automatically.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>AUDIT ID</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>CONSUMER ID</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>ZONE / TRANSFORMER</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>INSPECTOR</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>DATE & TIME</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600' }}>STATUS</th>
                                                <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center' }}>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pastInspectionsList.map((ins, i) => (
                                                <tr 
                                                    key={ins.id || i} 
                                                    onClick={() => setSelectedPastAudit(ins)}
                                                    style={{ 
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(200, 162, 97, 0.06)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td style={{ padding: '1rem', fontWeight: '600', color: '#c8a261' }}>{ins.id}</td>
                                                    <td style={{ padding: '1rem', color: 'white', fontWeight: '600' }}>{ins.consumer}</td>
                                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                                                        {ins.zone} {ins.transformer_id ? `(Tr: ${ins.transformer_id})` : ''}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{ins.inspector_name}</td>
                                                    <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{ins.date}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                            {ins.result || 'Completed'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPastAudit(ins);
                                                            }}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                background: 'rgba(200, 162, 97, 0.15)',
                                                                border: '1px solid rgba(200, 162, 97, 0.3)',
                                                                color: '#c8a261',
                                                                padding: '0.35rem 0.75rem',
                                                                borderRadius: '6px',
                                                                fontSize: '0.78rem',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <Eye size={13} /> View Audit & Map
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Interactive Past Audit Detail Modal with Map */}
                        {selectedPastAudit && (
                            <div 
                                onClick={() => setSelectedPastAudit(null)}
                                style={{
                                    position: 'fixed',
                                    top: 0, left: 0, width: '100vw', height: '100vh',
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    backdropFilter: 'blur(6px)',
                                    WebkitBackdropFilter: 'blur(6px)',
                                    zIndex: 2000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1.5rem'
                                }}
                            >
                                <div 
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        background: '#12110e',
                                        border: '1px solid rgba(200, 162, 97, 0.35)',
                                        borderRadius: '18px',
                                        maxWidth: '850px',
                                        width: '100%',
                                        maxHeight: '90vh',
                                        overflowY: 'auto',
                                        padding: '2rem',
                                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Modal Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                                <span style={{ background: 'rgba(200, 162, 97, 0.2)', color: '#c8a261', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                                                    {selectedPastAudit.id}
                                                </span>
                                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                                                    VERIFIED AUDIT
                                                </span>
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white', fontFamily: 'var(--font-heading)' }}>
                                                Inspection Details: Consumer <span style={{ color: 'var(--accent-blue)' }}>{selectedPastAudit.consumer}</span>
                                            </h2>
                                            <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                Transformer {selectedPastAudit.transformer_id} &bull; {selectedPastAudit.zone} &bull; Audited on {selectedPastAudit.date}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPastAudit(null)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '50%',
                                                width: '32px', height: '32px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', cursor: 'pointer'
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Modal Content Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
                                        {/* Left: Map */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <MapPin size={14} style={{ color: '#c8a261' }} /> Geolocated Meter Pin
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    {selectedPastAudit.latitude}&deg; N, {selectedPastAudit.longitude}&deg; E
                                                </span>
                                            </div>
                                            <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <MapComponent
                                                    data={{
                                                        results: [{
                                                            consumer_id: selectedPastAudit.consumer,
                                                            transformer_id: selectedPastAudit.transformer_id,
                                                            latitude: selectedPastAudit.latitude,
                                                            longitude: selectedPastAudit.longitude,
                                                            risk_class: selectedPastAudit.risk_class || 'critical',
                                                            aggregate_risk_score: selectedPastAudit.risk_score || 0.85
                                                        }]
                                                    }}
                                                    focusedConsumerId={selectedPastAudit.consumer}
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Telemetry & Checklist */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                                    Audit Metadata
                                                </span>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <div>
                                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Inspector:</span>
                                                        <div style={{ color: 'white', fontWeight: '500' }}>{selectedPastAudit.inspector_name}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>DISCOM:</span>
                                                        <div style={{ color: 'white', fontWeight: '500' }}>{selectedPastAudit.discom}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Risk Class:</span>
                                                        <div style={{ color: '#ef4444', fontWeight: '600' }}>{selectedPastAudit.risk_class}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Risk Score:</span>
                                                        <div style={{ color: '#c8a261', fontWeight: '600' }}>{((selectedPastAudit.risk_score || 0.85) * 100).toFixed(0)}%</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checklist summary */}
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                                    Field Checklist Verified
                                                </span>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                                                        <Check size={14} /> Physical Seal Intact
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                                                        <Check size={14} /> Pole Hooking Checked
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                                                        <Check size={14} /> Bypass Line Verified
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
                                                        <Check size={14} /> Terminal Sealed
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                                    Inspector Notes
                                                </span>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>
                                                    {selectedPastAudit.notes || 'On-site audit completed and synchronized with DISCOM server.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                                        <button
                                            onClick={() => {
                                                setChallanForm(prev => ({ ...prev, consumerId: selectedPastAudit.consumer }));
                                                setSelectedPastAudit(null);
                                                switchTab('Create Challan');
                                            }}
                                            style={{
                                                background: '#c8a261',
                                                color: '#000000',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '0.65rem 1.4rem',
                                                fontWeight: '600',
                                                fontSize: '0.88rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <AlertTriangle size={15} /> Issue Challan for {selectedPastAudit.consumer}
                                        </button>
                                        <button
                                            onClick={() => setSelectedPastAudit(null)}
                                            style={{
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                padding: '0.65rem 1.25rem',
                                                fontWeight: '600',
                                                fontSize: '0.88rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Consumer Account ID *</label>
                                        {pastInspectionOptions.length > 0 && (
                                            <span style={{ fontSize: '0.72rem', color: '#c8a261', background: 'rgba(200,162,97,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(200,162,97,0.25)' }}>
                                                {pastInspectionOptions.length} Past Audited Record{pastInspectionOptions.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Option to select directly from past inspections & audited tasks */}
                                    {pastInspectionOptions.length > 0 && (
                                        <select
                                            value={pastInspectionOptions.some(opt => opt.consumer === challanForm.consumerId) ? challanForm.consumerId : ''}
                                            onChange={e => {
                                                if (e.target.value) {
                                                    setChallanForm({ ...challanForm, consumerId: e.target.value });
                                                }
                                            }}
                                            style={{
                                                padding: '0.7rem 1rem',
                                                background: '#181512',
                                                border: '1px solid rgba(200,162,97,0.3)',
                                                borderRadius: '8px',
                                                color: '#ffffff',
                                                fontSize: '0.88rem',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                marginBottom: '0.35rem'
                                            }}
                                        >
                                            <option value="" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                -- Select Consumer from Past Inspections --
                                            </option>
                                            {pastInspectionOptions.map((opt, idx) => (
                                                <option key={idx} value={opt.consumer}>
                                                    {opt.consumer} • {opt.zone} ({opt.status})
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Manual ID Input */}
                                    <input 
                                        type="text" 
                                        value={challanForm.consumerId}
                                        onChange={e => setChallanForm({...challanForm, consumerId: e.target.value})}
                                        placeholder="Or enter Consumer ID manually (e.g. C0133)"
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
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'white' }}>
                                        <input type="checkbox" defaultChecked /> Auto Sync over cellular networks (3G/4G/5G)
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>GPS Tracking Precision</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                                    {['High Precision', 'Battery Saver'].map(mode => (
                                        <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'white' }}>
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
