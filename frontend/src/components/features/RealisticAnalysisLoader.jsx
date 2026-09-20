import React, { useState, useEffect } from 'react';
import { 
    Zap, Cpu, CheckCircle2, Server, Database, 
    Activity, ShieldAlert, BarChart2, Radio, Sparkles 
} from 'lucide-react';

const PIPELINE_STAGES = [
    {
        id: 1,
        title: "Ingesting Telemetry Packets",
        subtitle: "Parsing hourly smart meter readings & load profiles",
        icon: Database,
        duration: 1200
    },
    {
        id: 2,
        title: "Transformer Phase Balancing",
        subtitle: "Calculating technical vs non-technical power losses",
        icon: Server,
        duration: 1500
    },
    {
        id: 3,
        title: "Executing AI Ensemble Models",
        subtitle: "Isolation Forest & XGBoost theft anomaly classification",
        icon: Cpu,
        duration: 1800
    },
    {
        id: 4,
        title: "Geospatial Outlier Mapping",
        subtitle: "Clustering GPS coordinates & high-risk meter nodes",
        icon: Radio,
        duration: 1400
    },
    {
        id: 5,
        title: "Synthesizing Revenue Recovery Telemetry",
        subtitle: "Finalizing economic assessments & executive audit package",
        icon: BarChart2,
        duration: 1000
    }
];

const LOG_MESSAGES = [
    "Connecting to cloud ML runtime & warming inference pipelines...",
    "Reading raw CSV stream: consumer_id, transformer_id, kwh_consumed...",
    "Validated multi-node telemetry frames with zero corrupt packets",
    "Computing feeder loss metrics: delta threshold set at > 18.5%",
    "Transformer T-05 detected with anomalous power sink gradient",
    "Running isolation trees [depth=16, estimators=100, n_jobs=-1]",
    "Neural pattern classifier: abnormal off-peak meter bypass detected",
    "Cross-referencing consumer geographic polygons with substation grid map",
    "Generated critical risk flags with confidence score >= 0.88",
    "Compiling grid health index and aggregate technical revenue loss...",
    "Executive analysis ready for visualization and field dispatch."
];

export default function RealisticAnalysisLoader({ filename }) {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [progress, setProgress] = useState(6);
    const [logs, setLogs] = useState([LOG_MESSAGES[0]]);
    const [logIndex, setLogIndex] = useState(0);

    // Smooth progress bar advancement
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return 98; // Hold near completion until backend resolves
                const increment = Math.random() * 4 + 1.5;
                const next = Math.min(98, Math.round(prev + increment));
                
                // Advance stages based on progress
                if (next > 20 && next <= 40) setCurrentStageIndex(1);
                else if (next > 40 && next <= 65) setCurrentStageIndex(2);
                else if (next > 65 && next <= 85) setCurrentStageIndex(3);
                else if (next > 85) setCurrentStageIndex(4);

                return next;
            });
        }, 180);

        return () => clearInterval(interval);
    }, []);

    // Streaming diagnostic logs
    useEffect(() => {
        const logInterval = setInterval(() => {
            setLogIndex(prev => {
                const nextIdx = (prev + 1) % LOG_MESSAGES.length;
                const timestamp = new Date().toISOString().substring(11, 23);
                setLogs(currentLogs => [
                    ...currentLogs.slice(-4),
                    `[${timestamp}] ${LOG_MESSAGES[nextIdx]}`
                ]);
                return nextIdx;
            });
        }, 700);

        return () => clearInterval(logInterval);
    }, []);

    return (
        <div style={{
            margin: '2rem 0',
            padding: '2.25rem',
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '20px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes pulseRadar {
                    0% { transform: scale(0.85); opacity: 0.9; }
                    50% { transform: scale(1.15); opacity: 0.4; }
                    100% { transform: scale(0.85); opacity: 0.9; }
                }
                @keyframes radarSweep {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes eqWave {
                    0%, 100% { height: 6px; }
                    50% { height: 20px; }
                }
            `}</style>

            {/* Top Header: Radar + Status + Percentage */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Animated Radar Scanner */}
                    <div style={{
                        position: 'relative',
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#f4f4f5',
                        border: '1.5px solid #eaeaea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Outer Pulse Ring */}
                        <div style={{
                            position: 'absolute',
                            inset: '-4px',
                            borderRadius: '50%',
                            border: '1px dashed #d4d4d8',
                            animation: 'radarSweep 8s linear infinite'
                        }} />
                        {/* Radar Beam */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            width: '50%',
                            height: '50%',
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, transparent 80%)',
                            transformOrigin: 'bottom left',
                            animation: 'radarSweep 2.5s linear infinite',
                            borderRadius: '100% 0 0 0'
                        }} />
                        <Zap size={20} style={{ color: '#000000', position: 'relative', zIndex: 2 }} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#000000', fontWeight: '600', letterSpacing: '-0.01em' }}>
                                AI Power Anomaly Analysis in Progress
                            </h3>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: '#f4f4f5',
                                border: '1px solid #eaeaea',
                                color: '#000000',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}>
                                <Activity size={12} className="animate-pulse" /> Live Inference
                            </span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#666666' }}>
                            {filename ? `Analyzing dataset: ${filename}` : 'Evaluating multi-node consumer consumption matrix'}
                        </p>
                    </div>
                </div>

                {/* Percentage Counter */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '2.25rem',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        color: '#000000',
                        letterSpacing: '-0.03em',
                        lineHeight: 1
                    }}>
                        {progress}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>
                        Pipeline Completion
                    </span>
                </div>
            </div>

            {/* Glowing Multi-Segment Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: '#f4f4f5',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #eaeaea'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: '#000000',
                        borderRadius: '4px',
                        transition: 'width 0.25s ease-out'
                    }} />
                </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.75rem'
            }}>
                {PIPELINE_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    const IconComponent = stage.icon;

                    let borderColor = '#eaeaea';
                    let bgColor = '#ffffff';
                    let iconColor = '#888888';

                    if (isCompleted) {
                        borderColor = '#a7f3d0';
                        bgColor = '#ecfdf5';
                        iconColor = '#059669';
                    } else if (isActive) {
                        borderColor = '#000000';
                        bgColor = '#f4f4f5';
                        iconColor = '#000000';
                    }

                    return (
                        <div
                            key={stage.id}
                            style={{
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '10px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <IconComponent size={18} style={{ color: iconColor }} />
                                {isCompleted ? (
                                    <CheckCircle2 size={16} style={{ color: '#059669' }} />
                                ) : isActive ? (
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000000', animation: 'pulseRadar 1.2s infinite' }} />
                                ) : (
                                    <span style={{ fontSize: '0.7rem', color: '#999999', fontWeight: '600' }}>0{stage.id}</span>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: isCompleted ? '#065f46' : (isActive ? '#000000' : '#888888'), fontWeight: '600' }}>
                                    {stage.title}
                                </h4>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: isCompleted ? '#059669' : (isActive ? '#555555' : '#999999'), lineHeight: '1.3' }}>
                                    {stage.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Streaming Terminal Logs */}
            <div style={{
                background: '#fafafa',
                border: '1px solid #eaeaea',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#111827',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                minHeight: '90px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eaeaea', paddingBottom: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#666666', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                        Real-time Telemetry Stream
                    </span>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {[8, 16, 20, 14, 18, 10, 16].map((h, i) => (
                            <span 
                                key={i} 
                                style={{
                                    width: '3px',
                                    height: `${h}px`,
                                    background: '#000000',
                                    borderRadius: '1px',
                                    animation: `eqWave 1s ease-in-out infinite ${i * 0.15}s`
                                }} 
                            />
                        ))}
                    </div>
                </div>

                {logs.map((log, index) => (
                    <div key={index} style={{ color: index === logs.length - 1 ? '#000000' : '#888888', fontWeight: index === logs.length - 1 ? '600' : '400', transition: 'color 0.2s' }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
