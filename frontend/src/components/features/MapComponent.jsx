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
        base: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    },
    osm: {
        name: 'Standard OSM',
        icon: '🧭',
        base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
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
            <div class="pin-head" style="background: ${color}; box-shadow: 0 0 ${isTarget ? '12px' : '6px'} ${color}80, 0 2px 6px rgba(0,0,0,0.2);">
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
    const [basemapKey, setBasemapKey] = useState('streets'); // Default to light tiles
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
                
                let color = '#d97706'; // High / Moderate amber
                let riskType = 'high';
                if (risk === 'critical' || risk.includes('crit') || (item.aggregate_risk_score ?? item.risk_score ?? 0) >= 0.8) {
                    color = '#dc2626'; // Red
                    riskType = 'critical';
                } else if (risk === 'low' || risk === 'normal' || risk.includes('safe') || risk.includes('verif')) {
                    color = '#059669'; // Green
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
                borderRadius: isFullscreen ? '0' : '12px',
                overflow: 'hidden',
                border: isFullscreen ? 'none' : '1px solid #eaeaea',
                boxShadow: isFullscreen ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                background: '#f4f4f5'
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
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
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
                    background: rgba(0, 0, 0, 0.25);
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

                /* Modern Light Glassmorphic Popup - Vercel Design */
                .leaflet-popup-close-button {
                    display: none !important;
                }
                .leaflet-popup-content-wrapper {
                    background: #ffffff !important;
                    border: 1px solid #eaeaea !important;
                    border-radius: 10px !important;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
                    padding: 0 !important;
                    color: #000000 !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    line-height: 1.4 !important;
                }
                .leaflet-popup-tip {
                    background: #ffffff !important;
                    border: 1px solid #eaeaea !important;
                }
                .leaflet-container {
                    font-family: inherit !important;
                    background: #fafafa !important;
                }
                .leaflet-tooltip {
                    background: #000000 !important;
                    border: 1px solid #000000 !important;
                    color: #ffffff !important;
                    font-weight: 500 !important;
                    font-size: 0.78rem !important;
                    border-radius: 6px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
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
                        background: '#ffffff',
                        border: '1px solid #eaeaea',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        fontSize: '0.8rem',
                        color: '#000000'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                            <Compass size={14} style={{ color: '#000000' }} />
                            {stats.total} {stats.total === 1 ? 'Location' : 'Locations'}
                        </span>
                        {stats.critical > 0 && (
                            <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                color: '#dc2626', 
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '600',
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
                        background: '#ffffff',
                        border: '1px solid #eaeaea',
                        borderRadius: '8px',
                        padding: '0.3rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                        {/* Basemap Switcher Buttons */}
                        {Object.entries(BASEMAPS).map(([key, config]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setBasemapKey(key)}
                                style={{
                                    background: basemapKey === key ? '#000000' : 'transparent',
                                    border: 'none',
                                    color: basemapKey === key ? '#ffffff' : '#666666',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
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

                        <div style={{ width: '1px', height: '18px', background: '#eaeaea', margin: '0 0.15rem' }} />

                        {/* Fit Bounds Button */}
                        <button
                            type="button"
                            onClick={() => setFitBoundsTrigger(prev => prev + 1)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #eaeaea',
                                color: '#000000',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                            }}
                            title="Recenter and fit all markers"
                        >
                            <Navigation size={13} style={{ color: '#000000' }} /> Fit All
                        </button>

                        {/* Fullscreen Button */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            style={{
                                background: 'transparent',
                                border: '1px solid #eaeaea',
                                color: '#000000',
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
                    background: '#ffffff',
                    border: '1px solid #eaeaea',
                    borderRadius: '8px',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.72rem',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                        <span style={{ fontWeight: '500' }}>Critical Theft</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                        <span style={{ fontWeight: '500' }}>High Suspicion</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
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
                                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {item.lat.toFixed(4)}&deg; N, {item.lng.toFixed(4)}&deg; E
                                </div>
                            </Tooltip>

                            <Popup className="custom-popup" closeButton={false} maxWidth={260} minWidth={190}>
                                <div style={{ 
                                    padding: '0.65rem 0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.85rem'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
                                            GPS Coordinates
                                        </span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '700', color: '#000000', letterSpacing: '-0.01em' }}>
                                            {item.lat.toFixed(6)}&deg; N, {item.lng.toFixed(6)}&deg; E
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleCopyCoords(e, item.lat, item.lng, item.consumer_id)}
                                        style={{
                                            background: '#f4f4f5',
                                            border: '1px solid #eaeaea',
                                            color: '#000000',
                                            cursor: 'pointer',
                                            padding: '0.35rem 0.45rem',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title="Copy GPS coordinates"
                                    >
                                        {copiedId === item.consumer_id ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                                    </button>
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
