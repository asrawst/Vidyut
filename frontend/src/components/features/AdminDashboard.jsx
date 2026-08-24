import React, { useState, useEffect, useRef } from 'react';
import { 
    User, ListCollapse, Ban, TrendingUp, Calendar, AlertTriangle, 
    History as HistoryIcon, Settings as SettingsIcon, UploadCloud, 
    Download, RefreshCw, Layers, ShieldAlert, Sparkles, MapPin, 
    CheckCircle, UserCheck, LogOut, CheckSquare, Plus, Mail, Building2, Map, Menu, X, Edit2, Trash2, Activity, Zap 
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
    const [localInspectionStatus, setLocalInspectionStatus] = useState(() => {
        const saved = localStorage.getItem('vidyut_local_inspection_status');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return {};
    });

    const [assignedInspectors, setAssignedInspectors] = useState(() => {
        const saved = localStorage.getItem('vidyut_assigned_inspectors');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
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

    useEffect(() => {
        localStorage.removeItem('vidyut_theme');
        document.documentElement.removeAttribute('data-theme');
    }, []);

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
                    discom: ins.discom || user?.discom || 'DISCOM',
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

        // Load all active inspection tasks from Supabase DB for instant sync
        const fetchTasksFromSupabase = async () => {
            try {
                const { data: tasksData, error: tasksErr } = await supabase
                    .from('inspection_tasks')
                    .select('*');
                if (tasksData && !tasksErr) {
                    const assignedMap = {};
                    const statusMap = {};
                    tasksData.forEach(t => {
                        assignedMap[t.consumer_id] = t.inspector_name;
                        statusMap[t.consumer_id] = t.status;
                    });
                    setAssignedInspectors(prev => ({ ...prev, ...assignedMap }));
                    setLocalInspectionStatus(prev => ({ ...prev, ...statusMap }));
                    localStorage.setItem('vidyut_assigned_tasks', JSON.stringify(tasksData));

                    // Sync Inspection Tab (Field Inspection Calendar) strictly with real DB tasks
                    const realCalendar = tasksData.map(task => ({
                        consumer: task.consumer_id,
                        zone: task.zone || (task.transformer_id ? `Transformer ${task.transformer_id}` : 'Delhi Grid Area'),
                        inspector: task.inspector_name,
                        status: task.status || 'Initiated'
                    }));
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
                    setLocalInspectionStatus(prev => ({
                        ...prev,
                        [updated.consumer_id]: updated.status
                    }));
                    if (updated.inspector_name) {
                        setAssignedInspectors(prev => ({
                            ...prev,
                            [updated.consumer_id]: updated.inspector_name
                        }));
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
                } else if (payload.old && payload.eventType === 'DELETE') {
                    setInspectionCalendar(prev => {
                        const nextList = prev.filter(c => c.consumer !== payload.old.consumer_id);
                        localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(nextList));
                        return nextList;
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

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(histChannel);
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
        setAssignedInspectors(prev => ({
            ...prev,
            [consumerId]: inspector
        }));

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
                                                        contentStyle={{ 
                                                            background: 'rgba(18, 16, 14, 0.95)', 
                                                            border: '1px solid rgba(200, 162, 97, 0.35)', 
                                                            borderRadius: '8px', 
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                            padding: '0.5rem 0.75rem' 
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#c8a261', fontWeight: '600', marginBottom: '0.2rem' }}
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
                                                        contentStyle={{ 
                                                            background: 'rgba(18, 16, 14, 0.95)', 
                                                            border: '1px solid rgba(200, 162, 97, 0.35)', 
                                                            borderRadius: '8px', 
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                            padding: '0.5rem 0.75rem' 
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#c8a261', fontWeight: '600', marginBottom: '0.2rem' }}
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
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            background: 'rgba(18, 16, 14, 0.95)', 
                                                            border: '1px solid rgba(200, 162, 97, 0.35)', 
                                                            borderRadius: '8px', 
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                            padding: '0.5rem 0.75rem' 
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#c8a261', fontWeight: '600', marginBottom: '0.2rem' }}
                                                    />
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
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            background: 'rgba(18, 16, 14, 0.95)', 
                                                            border: '1px solid rgba(200, 162, 97, 0.35)', 
                                                            borderRadius: '8px', 
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                            padding: '0.5rem 0.75rem' 
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#c8a261', fontWeight: '600', marginBottom: '0.2rem' }}
                                                    />
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
                                            {loading ? 'Analyzing Dataset...' : 'Fetch & Analyse'}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Buffering state while data is fetching from backend */}
                            {loading && (
                                <div style={{
                                    margin: '2rem 0',
                                    padding: '3rem 2rem',
                                    background: 'linear-gradient(135deg, rgba(22, 20, 18, 0.9) 0%, rgba(14, 12, 10, 0.95) 100%)',
                                    border: '1px solid rgba(200, 162, 97, 0.25)',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8), 0 0 25px rgba(200, 162, 97, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    gap: '1.25rem'
                                }}>
                                    <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '50%',
                                            border: '3px solid rgba(200, 162, 97, 0.15)',
                                            borderTopColor: '#c8a261',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            inset: '6px',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(255, 255, 255, 0.08)',
                                            borderBottomColor: '#f97316',
                                            animation: 'spin 1.5s linear infinite reverse'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#c8a261'
                                        }}>
                                            <Zap size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white', fontWeight: '600' }}>
                                            Analyzing Power Consumption Data...
                                        </h3>
                                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Processing consumer load profiles, transformer reconciliations, and theft anomaly models.
                                        </p>
                                    </div>
                                </div>
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
                                        <h3><MapPin size={20} style={{ color: '#ef4444' }} /> Geographic Anomaly Mapping</h3>
                                        <div style={{ height: '420px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
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
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: item.consumer_id === focusedConsumerId ? 'rgba(200, 162, 97, 0.08)' : (idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent') }}>
                                                            <td style={{ padding: '1rem', fontWeight: '500', fontSize: '0.9rem' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleFocusConsumerOnMap(item.consumer_id)}
                                                                    title="Click to find and zoom to this pin on map"
                                                                    style={{
                                                                        background: item.consumer_id === focusedConsumerId ? 'rgba(200, 162, 97, 0.25)' : 'rgba(255,255,255,0.04)',
                                                                        border: item.consumer_id === focusedConsumerId ? '1px solid #c8a261' : '1px solid rgba(255,255,255,0.1)',
                                                                        color: item.consumer_id === focusedConsumerId ? '#c8a261' : '#ffffff',
                                                                        padding: '0.3rem 0.65rem',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.45rem',
                                                                        fontWeight: '600',
                                                                        fontSize: '0.85rem',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <MapPin size={13} style={{ color: item.consumer_id === focusedConsumerId ? '#c8a261' : 'rgba(255,255,255,0.5)' }} />
                                                                    {item.consumer_id}
                                                                </button>
                                                            </td>
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
                                                                {(() => {
                                                                    const currentStatus = localInspectionStatus[item.consumer_id] || 'Initiated';
                                                                    const isCompleted = (currentStatus || '').toLowerCase() === 'completed';
                                                                    const isInProcess = (currentStatus || '').toLowerCase().includes('process');
                                                                    
                                                                    return (
                                                                        <span 
                                                                            title="Status is updated directly by field inspector from portal"
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.45rem',
                                                                                fontSize: '0.78rem',
                                                                                fontWeight: '600',
                                                                                padding: '0.35rem 0.75rem',
                                                                                borderRadius: '6px',
                                                                                background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : isInProcess ? 'rgba(200, 162, 97, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                                                color: isCompleted ? '#10b981' : isInProcess ? '#c8a261' : 'rgba(255, 255, 255, 0.65)',
                                                                                border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : isInProcess ? 'rgba(200, 162, 97, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`
                                                                            }}
                                                                        >
                                                                            <span style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: isCompleted ? '#10b981' : isInProcess ? '#c8a261' : 'rgba(255, 255, 255, 0.4)'
                                                                            }} />
                                                                            {currentStatus}
                                                                        </span>
                                                                    );
                                                                })()}
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
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            background: 'rgba(18, 16, 14, 0.95)', 
                                                            border: '1px solid rgba(200, 162, 97, 0.35)', 
                                                            borderRadius: '8px', 
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                                                            padding: '0.5rem 0.75rem' 
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        labelStyle={{ color: '#c8a261', fontWeight: '600', marginBottom: '0.2rem' }}
                                                    />
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
                        <div className="dashboard-panel" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
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
                                            {inspectionCalendar.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'rgba(255,255,255,0.4)' }}>
                                                        <Calendar size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35, display: 'block' }} />
                                                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>No Field Inspections Scheduled</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'rgba(255,255,255,0.35)' }}>Assign an inspector to any detected anomaly in the Overview tab to schedule an inspection.</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                inspectionCalendar.map((ins, idx) => (
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
                                                                        onClick={async () => {
                                                                            setInspectionCalendar(prev => {
                                                                                const next = prev.map(item => item.consumer === ins.consumer ? editCalendarData : item);
                                                                                localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                                                                                return next;
                                                                            });
                                                                            setEditingCalendarId(null);
                                                                            try {
                                                                                await supabase
                                                                                    .from('inspection_tasks')
                                                                                    .update({
                                                                                        zone: editCalendarData.zone,
                                                                                        inspector_name: editCalendarData.inspector,
                                                                                        status: editCalendarData.status,
                                                                                        updated_at: new Date().toISOString()
                                                                                    })
                                                                                    .eq('consumer_id', ins.consumer);
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
                                                                {(() => {
                                                                    const currentStatus = ins.status || 'Initiated';
                                                                    const isCompleted = (currentStatus || '').toLowerCase() === 'completed';
                                                                    const isInProcess = (currentStatus || '').toLowerCase().includes('process');

                                                                    return (
                                                                        <span style={{ 
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.45rem',
                                                                            fontSize: '0.8rem',
                                                                            fontWeight: '600',
                                                                            padding: '0.3rem 0.65rem',
                                                                            borderRadius: '6px',
                                                                            color: isCompleted ? '#10b981' : isInProcess ? '#c8a261' : '#f59e0b',
                                                                            background: isCompleted ? 'rgba(16,185,129,0.15)' : isInProcess ? 'rgba(200,162,97,0.15)' : 'rgba(245,158,11,0.12)',
                                                                            border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : isInProcess ? 'rgba(200,162,97,0.3)' : 'rgba(245,158,11,0.25)'}`
                                                                        }}>
                                                                            <span style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: isCompleted ? '#10b981' : isInProcess ? '#c8a261' : '#f59e0b'
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
                                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={async () => {
                                                                            if (confirm(`Remove consumer ${ins.consumer} from inspection calendar?`)) {
                                                                                setInspectionCalendar(prev => {
                                                                                    const next = prev.filter(item => item.consumer !== ins.consumer);
                                                                                    localStorage.setItem('vidyut_inspection_calendar', JSON.stringify(next));
                                                                                    return next;
                                                                                });
                                                                                try {
                                                                                    await supabase
                                                                                        .from('inspection_tasks')
                                                                                        .delete()
                                                                                        .eq('consumer_id', ins.consumer);
                                                                                } catch (e) {
                                                                                    console.error(e);
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
                                            )))}
                                        </tbody>
                                    </table>
                                </div>
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
                                                <td colSpan="5" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                                    <Activity size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35, display: 'block' }} />
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>No Analysis History Logs Found</div>
                                                    <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'rgba(255,255,255,0.35)' }}>Upload a CSV dataset on the Overview tab and click Fetch & Analyse to record dynamic logs.</div>
                                                </td>
                                            </tr>
                                        ) : uploadHistory.map((hist, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '500' }}>{hist.name}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{hist.date}</td>
                                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.8)' }}>{hist.count} consumers</td>
                                                <td style={{ padding: '1rem', color: (hist.critical > 0) ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                                                    {hist.critical} {hist.critical === 1 ? 'critical' : 'critical'}
                                                </td>
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
