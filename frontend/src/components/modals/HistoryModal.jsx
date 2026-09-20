import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
// import { db, auth } from '../../firebaseConfig';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const HistoryModal = ({ user, onClose, onLoadHistory }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            console.log("Fetching history for user:", user.uid);

            try {
                // Simplified query to rule out index issues
                const q = query(
                    collection(db, "history"),
                    where("userId", "==", user.uid),
                    limit(20)
                );

                const querySnapshot = await getDocs(q);
                console.log("Docs found:", querySnapshot.size);

                // Client-side sorting as fallback
                const historyData = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .sort((a, b) => {
                        // Handle potential null timestamps
                        const timeA = a.timestamp?.seconds || 0;
                        const timeB = b.timestamp?.seconds || 0;
                        return timeB - timeA;
                    });

                setHistory(historyData);
            } catch (err) {
                console.error("Error fetching history:", err);
                setError("Failed to load history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const handleSelect = async (item) => {
        // 1. If storageUrl exists, fetch from there (Newest method)
        if (item.storageUrl) {
            try {
                const response = await fetch(item.storageUrl);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                onLoadHistory(data);
                onClose();
            } catch (err) {
                console.error("Error fetching from storage:", err);
                alert("Failed to load history data.");
            }
            return;
        }

        // 2. Fallback: If legacy item has resultData directly
        if (item.resultData) {
            onLoadHistory(item.resultData);
            onClose();
            return;
        }

        // 3. Fallback: Fetch from subcollection (Old method)
        try {
            const detailDoc = await getDoc(doc(db, "history", item.id, "details", "data"));
            if (detailDoc.exists()) {
                onLoadHistory(detailDoc.data().resultData);
                onClose();
            } else {
                console.error("Details not found");
                alert("Failed to load details for this scan.");
            }
        } catch (err) {
            console.error("Error loading details:", err);
            alert("Error loading details.");
        }
    };

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
                maxWidth: '640px',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
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
                        borderRadius: '50%',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={16} />
                </button>

                <h2 style={{
                    fontSize: '1.5rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    letterSpacing: '-0.03em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <Calendar size={22} color="#2563eb" />
                    Scan History
                </h2>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                    {loading ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading history...</p>
                    ) : error ? (
                        <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>
                    ) : history.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No scan history found.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    style={{
                                        background: 'var(--bg-canvas)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '14px',
                                        padding: '1rem 1.25rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#18181b'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.92rem' }}>
                                            <FileText size={16} color="#2563eb" />
                                            {item.fileName || 'Unknown File'}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {formatDate(item.timestamp)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <ChevronRight size={18} color="var(--text-muted)" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default HistoryModal;
