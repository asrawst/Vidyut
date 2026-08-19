import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
const createCustomIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
    });
};

const redIcon = createCustomIcon('#ef4444');   // Critical
const orangeIcon = createCustomIcon('#f97316'); // High
const greenIcon = createCustomIcon('#10b981');  // Normal (if needed)

const MapComponent = ({ data }) => {
    const [center, setCenter] = useState([28.6139, 77.2090]); // Default New Delhi

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
                let icon = greenIcon;
                if (risk === 'critical' || risk.includes('crit')) icon = redIcon;
                else if (risk === 'high' || risk.includes('high')) icon = orangeIcon;
                else icon = orangeIcon;

                return {
                    ...item,
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    icon: icon
                };
            })
            .filter(Boolean);
    }, [data]);

    // Update center based on first marker if available
    useEffect(() => {
        if (markers.length > 0) {
            setCenter([markers[0].lat, markers[0].lng]);
        }
    }, [markers]);

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

                {markers.map((item) => (
                    <Marker
                        key={item.consumer_id}
                        position={[item.lat, item.lng]}
                        icon={item.icon}
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
