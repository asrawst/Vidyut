import React from 'react';
import { X } from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

const TransformerStatsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data || data.length === 0) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="stitch-modal-card" style={{
                background: '#ffffff', padding: '2.5rem', borderRadius: '24px',
                width: '90%', maxWidth: '980px', maxHeight: '88vh', overflowY: 'auto',
                border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1.25rem', right: '1.25rem',
                        background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
                        cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                    }}
                >
                    <X size={16} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Transformer Risk Analysis
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* PIE CHART */}
                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Anomaly Distribution</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={95}
                                        fill="#18181b"
                                        dataKey="anomalies_detected"
                                        nameKey="transformer_id"
                                    >
                                        {data.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            background: '#ffffff', 
                                            border: '1px solid var(--border-subtle)', 
                                            borderRadius: '12px', 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            padding: '0.5rem 0.75rem' 
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}
                                        labelStyle={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.2rem' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* BAR CHART */}
                    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Anomalies by Transformer</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                                    <XAxis dataKey="transformer_id" stroke="#71717a" />
                                    <YAxis stroke="#71717a" />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }} 
                                        contentStyle={{ 
                                            background: '#ffffff', 
                                            border: '1px solid var(--border-subtle)', 
                                            borderRadius: '12px', 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            padding: '0.5rem 0.75rem' 
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}
                                        labelStyle={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.2rem' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="anomalies_detected" name="Anomalies" fill="#18181b" radius={[6, 6, 0, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: '16px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Detailed Transformer Breakdown</h3>
                    <div className="table-wrapper">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f4f5f7', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>Transformer ID</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>Count of Anomalies</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)', background: '#ffffff' }}>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: '600' }}>{item.transformer_id}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{item.anomalies_detected}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2',
                                                padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700'
                                            }}>
                                                High Risk
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TransformerStatsModal;
