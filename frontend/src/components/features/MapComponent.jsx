import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    Layers, Navigation, MapPin, Maximize2, Minimize2, 
    Compass, ExternalLink, Copy, Check, Zap, AlertTriangle, 
    ShieldCheck, RefreshCw 
} from 'lucide-react';

// Basemap layer configurations for clear visibility in any lighting / audit condition
const BASEMAPS = {
    streets: {
        name: 'Street View',
        icon: '🗺️',
        base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    },
    dark: {
        name: 'Dark Matter',
        icon: '🌙',
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        reference: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin',
        maxZoom: 16
    },
    satellite: {
        name: 'Satellite',
        icon: '🛰️',
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        reference: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar',
        maxZoom: 18
    }
};

// SVG Pin Generator with high-contrast glowing design
const createPinIcon = (color, isTarget = false, riskType = 'critical') => {
    const size = isTarget ? 38 : 28;
    const pulseHtml = isTarget ? `
        <div class="map-pulse-ring" style="border-color: ${color}; background: ${color}25;"></div>
        <div class="map-pulse-ring-outer" style="border-color: ${color}80;"></div>
    ` : '';

    const iconSymbol = riskType === 'critical' ? '⚡' : (riskType === 'high' ? '!' : '✓');

    const html = `
        <div class="custom-map-pin ${isTarget ? 'is-target' : ''}" style="--pin-color: ${color};">
            ${pulseHtml}
            <div class="pin-head" style="background: ${color}; box-shadow: 0 0 ${isTarget ? '16px' : '8px'} ${color}90, 0 4px 10px rgba(0,0,0,0.5);">
                <span class="pin-symbol">${iconSymbol}</span>
            </div>
            <div class="pin-stem" style="border-top-color: ${color};"></div>
            <div class="pin-shadow"></div>
        </div>
    `;

    return new L.DivIcon({
        className: 'vidyut-pin-container',
        html: html,
        iconSize: [size, size + 14],
        iconAnchor: [size / 2, size + 10],
        popupAnchor: [0, -(size + 8)],
        tooltipAnchor: [0, -(size + 10)]
    });
};

// Map View Controller: Handles programmatic camera flyTo, fitBounds & resets
function MapController({ focusedConsumerId, markers, markerRefs, triggerFitBounds }) {
    const map = useMap();

    // Fly to focused consumer when selected
    useEffect(() => {
        if (!markers || markers.length === 0) return;

        const target = focusedConsumerId 
            ? markers.find(m => m.consumer_id === focusedConsumerId)
            : (markers.length === 1 ? markers[0] : null);

        if (target && !isNaN(target.lat) && !isNaN(target.lng)) {
            const timer = setTimeout(() => {
                map.invalidateSize();
                map.flyTo([target.lat, target.lng], 16, {
                    animate: true,
                    duration: 1.2
                });

                setTimeout(() => {
                    const markerInstance = markerRefs.current[target.consumer_id];
                    if (markerInstance) {
                        markerInstance.openPopup();
                    }
                }, 650);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [focusedConsumerId, markers, map, markerRefs]);

    // Fit all markers in viewport
    useEffect(() => {
        if (triggerFitBounds > 0 && markers.length > 0) {
            map.invalidateSize();
            if (markers.length === 1) {
                map.flyTo([markers[0].lat, markers[0].lng], 16, { animate: true, duration: 0.8 });
            } else {
                const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true, duration: 0.8 });
            }
        }
    }, [triggerFitBounds, markers, map]);

    return null;
}

const MapComponent = ({ 
    data, 
    focusedConsumerId, 
    onSelectConsumer,
    height = '100%',
    showControls = true
}) => {
    const [basemapKey, setBasemapKey] = useState('streets'); // Default to high-contrast streets for clear visibility
    const [copiedId, setCopiedId] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
    const containerRef = useRef(null);
    const markerRefs = useRef({});

    // Process and normalize marker coordinates from various API structures
    const markers = useMemo(() => {
        if (!data) return [];
        const rawList = data.results || data.anomalies || (Array.isArray(data) ? data : []);
        if (!Array.isArray(rawList) || rawList.length === 0) return [];

        const uniqueConsumers = {};
        rawList.forEach(item => {
            if (!item || !item.consumer_id) return;
            const existing = uniqueConsumers[item.consumer_id];
            const currentRisk = item.aggregate_risk_score ?? item.risk_score ?? 0;
            const existingRisk = existing ? (existing.aggregate_risk_score ?? existing.risk_score ?? 0) : -1;

            if (!existing || currentRisk > existingRisk) {
                uniqueConsumers[item.consumer_id] = item;
            }
        });

        return Object.values(uniqueConsumers)
            .filter(item => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            })
            .map(item => {
                const risk = (item.risk_class || '').toLowerCase();
                const isSelected = item.consumer_id === focusedConsumerId;
                
                let color = '#f59e0b'; // High / Moderate amber
                let riskType = 'high';
                if (risk === 'critical' || risk.includes('crit') || (item.aggregate_risk_score ?? item.risk_score ?? 0) >= 0.8) {
                    color = '#ef4444'; // Red
                    riskType = 'critical';
                } else if (risk === 'low' || risk === 'normal' || risk.includes('safe') || risk.includes('verif')) {
                    color = '#10b981'; // Green
                    riskType = 'normal';
                }

                const icon = createPinIcon(color, isSelected, riskType);

                return {
                    ...item,
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    icon,
                    color,
                    riskType,
                    isSelected
                };
            });
    }, [data, focusedConsumerId]);

    // Initial center coordinate
    const center = useMemo(() => {
        if (markers.length > 0) {
            const target = focusedConsumerId 
                ? markers.find(m => m.consumer_id === focusedConsumerId)
                : markers[0];
            if (target) return [target.lat, target.lng];
        }
        return [28.6139, 77.2090]; // New Delhi default
    }, [markers, focusedConsumerId]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = markers.length;
        const critical = markers.filter(m => m.riskType === 'critical').length;
        const high = markers.filter(m => m.riskType === 'high').length;
        const normal = markers.filter(m => m.riskType === 'normal').length;
        return { total, critical, high, normal };
    }, [markers]);

    // Copy coordinates helper
    const handleCopyCoords = useCallback((e, lat, lng, id) => {
        e.stopPropagation();
        const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Toggle full screen container
    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

    const currentBasemap = BASEMAPS[basemapKey] || BASEMAPS.streets;

    return (
        <div 
            ref={containerRef}
            className={`vidyut-map-wrapper ${isFullscreen ? 'fullscreen-map' : ''}`}
            style={{
                height: isFullscreen ? '100vh' : height,
                minHeight: isFullscreen ? '100vh' : '380px',
                width: '100%',
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                right: isFullscreen ? 0 : 'auto',
                bottom: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 99999 : 1,
                borderRadius: isFullscreen ? '0' : '14px',
                overflow: 'hidden',
                border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: isFullscreen ? 'none' : '0 12px 36px rgba(0,0,0,0.45)',
                background: '#0d1117'
            }}
        >
            <style>{`
                /* Vidyut Map Pin Styling */
                .vidyut-pin-container {
                    background: transparent;
                    border: none;
                }
                .custom-map-pin {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .custom-map-pin:hover {
                    transform: scale(1.15) translateY(-3px);
                    z-index: 999;
                }
                .custom-map-pin.is-target {
                    transform: scale(1.15);
                    z-index: 1000;
                }
                .pin-head {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 800;
                    color: #ffffff;
                    position: relative;
                    z-index: 3;
                }
                .pin-symbol {
                    line-height: 1;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
                }
                .pin-stem {
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 8px solid;
                    margin-top: -2px;
                    position: relative;
                    z-index: 2;
                }
                .pin-shadow {
                    position: absolute;
                    bottom: -6px;
                    width: 14px;
                    height: 5px;
                    background: rgba(0, 0, 0, 0.45);
                    border-radius: 50%;
                    filter: blur(1.5px);
                    z-index: 1;
                }
                /* Pulse rings for target pin */
                .map-pulse-ring {
                    position: absolute;
                    top: -6px;
                    left: -6px;
                    right: -6px;
                    bottom: 0px;
                    border: 2px solid;
                    border-radius: 50%;
                    animation: vidyutPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                    pointer-events: none;
                }
                .map-pulse-ring-outer {
                    position: absolute;
                    top: -12px;
                    left: -12px;
                    right: -12px;
                    bottom: -6px;
                    border: 1.5px solid;
                    border-radius: 50%;
                    animation: vidyutPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite 0.4s;
                    pointer-events: none;
                }
                @keyframes vidyutPulse {
                    0% { transform: scale(0.7); opacity: 1; }
                    100% { transform: scale(1.9); opacity: 0; }
                }

                /* Modern Dark Glassmorphic Popup - Matched to Vidyut Luxury Palette */
                .leaflet-popup-close-button {
                    display: none !important;
                }
                .leaflet-popup-content-wrapper {
                    background: rgba(18, 16, 14, 0.96) !important;
                    backdrop-filter: blur(14px) !important;
                    -webkit-backdrop-filter: blur(14px) !important;
                    border: 1px solid rgba(200, 162, 97, 0.35) !important;
                    border-radius: 14px !important;
                    box-shadow: 0 20px 45px rgba(0,0,0,0.85), 0 0 20px rgba(200, 162, 97, 0.12) !important;
                    padding: 0 !important;
                    color: #f1f5f9 !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    line-height: 1.4 !important;
                }
                .leaflet-popup-tip {
                    background: rgba(18, 16, 14, 0.96) !important;
                    border: 1px solid rgba(200, 162, 97, 0.35) !important;
                }
                .leaflet-container {
                    font-family: inherit !important;
                    background: #0f0e0c !important;
                }
                .leaflet-tooltip {
                    background: rgba(18, 16, 14, 0.96) !important;
                    border: 1px solid rgba(200, 162, 97, 0.4) !important;
                    color: #ffffff !important;
                    font-weight: 600 !important;
                    font-size: 0.78rem !important;
                    border-radius: 6px !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important;
                    padding: 3px 8px !important;
                }
            `}</style>

            {/* Top Control Bar HUD */}
            {showControls && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pointerEvents: 'none',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                }}>
                    {/* Left: Quick Stats Pill */}
                    <div style={{
                        pointerEvents: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        background: 'rgba(18, 16, 14, 0.92)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(200, 162, 97, 0.25)',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        fontSize: '0.8rem',
                        color: '#fff'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                            <Compass size={14} style={{ color: '#c8a261' }} />
                            {stats.total} {stats.total === 1 ? 'Location' : 'Locations'}
                        </span>
                        {stats.critical > 0 && (
                            <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                color: '#ef4444', 
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                fontSize: '0.72rem'
                            }}>
                                <Zap size={11} /> {stats.critical} Critical
                            </span>
                        )}
                    </div>

                    {/* Right: Basemap Selector & Actions */}
                    <div style={{
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(18, 16, 14, 0.92)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(200, 162, 97, 0.25)',
                        borderRadius: '8px',
                        padding: '0.3rem',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                    }}>
                        {/* Basemap Switcher Buttons */}
                        {Object.entries(BASEMAPS).map(([key, config]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setBasemapKey(key)}
                                style={{
                                    background: basemapKey === key ? 'rgba(200, 162, 97, 0.25)' : 'transparent',
                                    border: basemapKey === key ? '1px solid #c8a261' : '1px solid transparent',
                                    color: basemapKey === key ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    transition: 'all 0.15s ease'
                                }}
                                title={`Switch to ${config.name}`}
                            >
                                <span>{config.icon}</span>
                                <span>{config.name}</span>
                            </button>
                        ))}

                        <div style={{ width: '1px', height: '18px', background: 'rgba(200, 162, 97, 0.25)', margin: '0 0.15rem' }} />

                        {/* Fit Bounds Button */}
                        <button
                            type="button"
                            onClick={() => setFitBoundsTrigger(prev => prev + 1)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.85)',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            title="Recenter and fit all markers"
                        >
                            <Navigation size={13} style={{ color: '#c8a261' }} /> Fit All
                        </button>

                        {/* Fullscreen Button */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.85)',
                                padding: '0.3rem 0.45rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                            }}
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
                        >
                            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Left Legend */}
            {showControls && (
                <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    zIndex: 1000,
                    background: 'rgba(18, 16, 14, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(200, 162, 97, 0.25)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.72rem',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
                        <span style={{ fontWeight: '500' }}>Critical Theft</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px #f59e0b' }} />
                        <span style={{ fontWeight: '500' }}>High Suspicion</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontWeight: '500' }}>Verified Normal</span>
                    </div>
                </div>
            )}

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', minHeight: isFullscreen ? '100vh' : '380px' }}
            >
                {/* Active Basemap Layer */}
                <TileLayer
                    key={basemapKey}
                    url={currentBasemap.base}
                    attribution={currentBasemap.attribution}
                    maxZoom={currentBasemap.maxZoom}
                />

                {/* Optional Reference/Labels layer for Satellite mode */}
                {currentBasemap.reference && (
                    <TileLayer
                        url={currentBasemap.reference}
                        maxZoom={currentBasemap.maxZoom}
                    />
                )}

                <MapController 
                    focusedConsumerId={focusedConsumerId} 
                    markers={markers} 
                    markerRefs={markerRefs}
                    triggerFitBounds={fitBoundsTrigger}
                />

                {markers.map((item) => {
                    const riskPercent = Math.round(((item.aggregate_risk_score ?? item.risk_score ?? 0.85)) * 100);
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;

                    return (
                        <Marker
                            key={item.consumer_id}
                            position={[item.lat, item.lng]}
                            icon={item.icon}
                            ref={(el) => {
                                if (el) markerRefs.current[item.consumer_id] = el;
                            }}
                            eventHandlers={{
                                click: () => {
                                    if (onSelectConsumer) onSelectConsumer(item.consumer_id);
                                }
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                                <div>
                                    <strong>{item.consumer_id}</strong> &bull; {riskPercent}% Theft Risk
                                </div>
                            </Tooltip>

                            <Popup className="custom-popup" closeButton={false} maxWidth={310} minWidth={260}>
                                <div style={{ padding: '0.9rem 1.1rem' }}>
                                    {/* Popup Header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(200, 162, 97, 0.2)', paddingBottom: '0.55rem', marginBottom: '0.65rem' }}>
                                        <div>
                                            <span style={{ fontSize: '0.68rem', color: '#c8a261', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
                                                Consumer Identifier
                                            </span>
                                            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em', marginTop: '1px' }}>
                                                {item.consumer_id}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            padding: '0.2rem 0.55rem',
                                            borderRadius: '5px',
                                            background: `${item.color}22`,
                                            border: `1px solid ${item.color}66`,
                                            color: item.color,
                                            letterSpacing: '0.02em'
                                        }}>
                                            {item.risk_class || (item.riskType === 'critical' ? 'Critical' : 'High Risk')}
                                        </span>
                                    </div>

                                    {/* Risk Score Progress Bar */}
                                    <div style={{ marginBottom: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Theft Probability:</span>
                                            <strong style={{ color: item.color }}>{riskPercent}%</strong>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${riskPercent}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                                        </div>
                                    </div>

                                    {/* Transformer & Location Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.9rem' }}>
                                        {item.transformer_id && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Transformer:</span>
                                                <strong style={{ color: '#ffffff' }}>{item.transformer_id}</strong>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>GPS Coords:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#ffffff' }}>
                                                    {item.lat.toFixed(4)}&deg; N, {item.lng.toFixed(4)}&deg; E
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCopyCoords(e, item.lat, item.lng, item.consumer_id)}
                                                    style={{ background: 'none', border: 'none', color: '#c8a261', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                                    title="Copy GPS coordinates"
                                                >
                                                    {copiedId === item.consumer_id ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Links */}
                                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.55rem', borderTop: '1px solid rgba(200, 162, 97, 0.18)' }}>
                                        <a
                                            href={googleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.4rem',
                                                background: 'rgba(200, 162, 97, 0.12)',
                                                border: '1px solid rgba(200, 162, 97, 0.35)',
                                                color: '#c8a261',
                                                padding: '0.45rem 0.6rem',
                                                borderRadius: '7px',
                                                fontSize: '0.78rem',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(200, 162, 97, 0.22)';
                                                e.currentTarget.style.borderColor = 'rgba(200, 162, 97, 0.6)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(200, 162, 97, 0.12)';
                                                e.currentTarget.style.borderColor = 'rgba(200, 162, 97, 0.35)';
                                            }}
                                        >
                                            <ExternalLink size={13} /> Google Maps
                                        </a>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
