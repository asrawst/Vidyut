import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for different risk levels
const createCustomIcon = (color, isTarget = false) => {
    if (isTarget) {
        return new L.DivIcon({
            className: 'custom-marker-target',
            html: `
                <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
                    <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: ${color}40; border: 2px solid ${color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; z-index: 10;"></div>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    }

    return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
    });
};

const redIcon = createCustomIcon('#ef4444');
const orangeIcon = createCustomIcon('#f97316');
const greenIcon = createCustomIcon('#10b981');

// Controller component to zoom and pan the map when a consumer is selected
function MapController({ focusedConsumerId, markers, markerRefs }) {
    const map = useMap();

    useEffect(() => {
        if (!focusedConsumerId || !markers || markers.length === 0) return;
        const target = markers.find(m => m.consumer_id === focusedConsumerId);
        if (target && !isNaN(target.lat) && !isNaN(target.lng)) {
            map.flyTo([target.lat, target.lng], 16, {
                animate: true,
                duration: 1.2
            });

            // Automatically open the popup for the selected pin
            const markerInstance = markerRefs.current[target.consumer_id];
            if (markerInstance) {
                setTimeout(() => {
                    markerInstance.openPopup();
                }, 600);
            }
        }
    }, [focusedConsumerId, markers, map, markerRefs]);

    return null;
}

const MapComponent = ({ data, focusedConsumerId, onSelectConsumer }) => {
    const [center, setCenter] = useState([28.6139, 77.2090]); // Default New Delhi
    const markerRefs = useRef({});

    // Filter and process data
    const markers = useMemo(() => {
        if (!data || !data.results) return [];

        const uniqueConsumers = {};
        data.results.forEach(item => {
            // Keep the detection with highest risk for each consumer
            if (!uniqueConsumers[item.consumer_id]) {
                uniqueConsumers[item.consumer_id] = item;
            } else {
                if ((item.aggregate_risk_score || 0) > (uniqueConsumers[item.consumer_id].aggregate_risk_score || 0)) {
                    uniqueConsumers[item.consumer_id] = item;
                }
            }
        });

        // Convert to array and filter valid coordinates
        return Object.values(uniqueConsumers)
            .filter(item => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                // Basic validation for lat/long range
                return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            })
            .map(item => {
                const risk = (item.risk_class || '').toLowerCase();
                const isSelected = item.consumer_id === focusedConsumerId;
                let color = '#f97316';
                if (risk === 'critical' || risk.includes('crit')) color = '#ef4444';
                else if (risk === 'high' || risk.includes('high')) color = '#f97316';
                else color = '#10b981';

                const icon = isSelected 
                    ? createCustomIcon(color, true)
                    : (color === '#ef4444' ? redIcon : color === '#10b981' ? greenIcon : orangeIcon);

                return {
                    ...item,
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    icon: icon,
                    isSelected
                };
            })
            .filter(Boolean);
    }, [data, focusedConsumerId]);

    // Update center based on first marker if available and no focused consumer
    useEffect(() => {
        if (!focusedConsumerId && markers.length > 0) {
            setCenter([markers[0].lat, markers[0].lng]);
        }
    }, [markers, focusedConsumerId]);

    return (
        <div style={{
            height: '100%',
            minHeight: '380px',
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 0
        }}>
            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', minHeight: '380px', background: '#242f3e' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController 
                    focusedConsumerId={focusedConsumerId} 
                    markers={markers} 
                    markerRefs={markerRefs} 
                />

                {markers.map((item) => (
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
                        <Popup className="custom-popup">
                            <div style={{ color: '#1e293b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Consumer: {item.consumer_id}</strong><br />
                                {item.transformer_id && (
                                    <>
                                        <span style={{ color: '#475569' }}>Transformer: <strong>{item.transformer_id}</strong></span><br />
                                    </>
                                )}
                                <span style={{ color: '#334155' }}>
                                    Coordinates: <strong>{parseFloat(item.lat).toFixed(4)}&deg; N, {parseFloat(item.lng).toFixed(4)}&deg; E</strong>
                                </span><br />
                                <span>Theft Risk: <strong>{(((item.aggregate_risk_score ?? item.risk_score ?? 0.85)) * 100).toFixed(0)}%</strong></span><br />
                                <span style={{ 
                                    textTransform: 'capitalize', 
                                    fontWeight: 'bold', 
                                    color: (item.risk_class || '').toLowerCase().includes('crit') ? '#ef4444' : '#f97316' 
                                }}>
                                    {item.risk_class || 'Critical Anomaly'}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
