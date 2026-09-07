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
    "Reading raw CSV headers: consumer_id, transformer_id, kwh_consumed...",
    "Validated 15,248 meter reading intervals with zero corrupt frames",
    "Computing feeder loss metrics: delta threshold set at > 18.5%",
    "Transformer T-05 detected with 14.8 kW anomalous power sink",
    "Running isolation trees [depth=16, estimators=200, contamination=0.08]",
    "Neural pattern classifier: abnormal off-peak meter bypass detected",
    "Cross-referencing consumer geographic polygons with substation grid map",
    "Generated 30 critical risk flags with confidence score >= 0.88",
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
            padding: '2.5rem',
            background: 'linear-gradient(135deg, rgba(20, 18, 15, 0.95) 0%, rgba(12, 10, 8, 0.98) 100%)',
            border: '1px solid rgba(200, 162, 97, 0.35)',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85), 0 0 30px rgba(200, 162, 97, 0.12)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Light Sweep */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '200%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(200, 162, 97, 0.03) 50%, transparent 100%)',
                animation: 'shimmerSweep 4s infinite linear',
                pointerEvents: 'none'
            }} />

            <style>{`
                @keyframes shimmerSweep {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(50%); }
                }
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
                    50% { height: 24px; }
                }
            `}</style>

            {/* Top Header: Radar + Status + Percentage */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Animated Holographic Radar Scanner */}
                    <div style={{
                        position: 'relative',
                        width: '58px',
                        height: '58px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(200, 162, 97, 0.15) 0%, rgba(0,0,0,0.6) 70%)',
                        border: '1.5px solid rgba(200, 162, 97, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(200, 162, 97, 0.25)'
                    }}>
                        {/* Outer Pulse Ring */}
                        <div style={{
                            position: 'absolute',
                            inset: '-4px',
                            borderRadius: '50%',
                            border: '1px dashed rgba(200, 162, 97, 0.5)',
                            animation: 'radarSweep 8s linear infinite'
                        }} />
                        {/* Radar Beam */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            width: '50%',
                            height: '50%',
                            background: 'linear-gradient(135deg, rgba(200, 162, 97, 0.6) 0%, transparent 80%)',
                            transformOrigin: 'bottom left',
                            animation: 'radarSweep 2.5s linear infinite',
                            borderRadius: '100% 0 0 0'
                        }} />
                        <Zap size={22} style={{ color: '#c8a261', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 0 8px #c8a261)' }} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff', fontWeight: '600', letterSpacing: '-0.01em' }}>
                                AI Power Anomaly Analysis in Progress
                            </h3>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: 'rgba(200, 162, 97, 0.12)',
                                border: '1px solid rgba(200, 162, 97, 0.3)',
                                color: '#c8a261',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                            }}>
                                <Activity size={12} className="animate-pulse" /> Live Inference
                            </span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            {filename ? `Analyzing dataset: ${filename}` : 'Evaluating multi-node consumer consumption matrix'}
                        </p>
                    </div>
                </div>

                {/* Percentage Counter */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        color: '#c8a261',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        textShadow: '0 0 20px rgba(200, 162, 97, 0.4)'
                    }}>
                        {progress}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pipeline Completion
                    </span>
                </div>
            </div>

            {/* Glowing Multi-Segment Progress Bar */}
            <div style={{ marginBottom: '2.25rem' }}>
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #c8a261 0%, #f97316 60%, #10b981 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.25s ease-out',
                        boxShadow: '0 0 16px rgba(200, 162, 97, 0.6)'
                    }} />
                </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {PIPELINE_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    const IconComponent = stage.icon;

                    let borderColor = 'rgba(255, 255, 255, 0.07)';
                    let bgColor = 'rgba(255, 255, 255, 0.02)';
                    let iconColor = 'rgba(255, 255, 255, 0.3)';

                    if (isCompleted) {
                        borderColor = 'rgba(16, 185, 129, 0.4)';
                        bgColor = 'rgba(16, 185, 129, 0.08)';
                        iconColor = '#10b981';
                    } else if (isActive) {
                        borderColor = 'rgba(200, 162, 97, 0.6)';
                        bgColor = 'rgba(200, 162, 97, 0.12)';
                        iconColor = '#c8a261';
                    }

                    return (
                        <div
                            key={stage.id}
                            style={{
                                background: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                boxShadow: isActive ? '0 0 20px rgba(200, 162, 97, 0.15)' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <IconComponent size={18} style={{ color: iconColor }} />
                                {isCompleted ? (
                                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                                ) : isActive ? (
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8a261', animation: 'pulseRadar 1.2s infinite' }} />
                                ) : (
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>0{stage.id}</span>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: isCompleted ? '#ffffff' : (isActive ? '#ffffff' : 'rgba(255,255,255,0.4)'), fontWeight: '600' }}>
                                    {stage.title}
                                </h4>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: isCompleted ? 'rgba(16, 185, 129, 0.8)' : (isActive ? 'rgba(200, 162, 97, 0.9)' : 'rgba(255,255,255,0.3)'), lineHeight: '1.3' }}>
                                    {stage.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Streaming Terminal Logs */}
            <div style={{
                background: '#090807',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#a3e635',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                minHeight: '90px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a3e635', display: 'inline-block' }} />
                        Real-time Telemetry Stream
                    </span>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {[8, 16, 24, 14, 20, 10, 18].map((h, i) => (
                            <span 
                                key={i} 
                                style={{
                                    width: '3px',
                                    height: `${h}px`,
                                    background: '#c8a261',
                                    borderRadius: '1px',
                                    animation: `eqWave 1s ease-in-out infinite ${i * 0.15}s`
                                }} 
                            />
                        ))}
                    </div>
                </div>

                {logs.map((log, index) => (
                    <div key={index} style={{ color: index === logs.length - 1 ? '#fef08a' : 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
