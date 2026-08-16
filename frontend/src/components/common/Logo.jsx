import React from 'react';

export default function VidyutLogo({ className, style }) {
    return (
        <svg
            viewBox="0 0 380 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <linearGradient id="glossyBronze" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#c8a261" />
                    <stop offset="100%" stopColor="#9c7446" />
                </linearGradient>
            </defs>

            {/* TEXT: VIDYUT */}
            <text
                x="10"
                y="58"
                fontFamily="Arial, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="60"
                fill="url(#glossyBronze)"
                letterSpacing="2"
                filter="drop-shadow(0 2px 2px rgba(200, 162, 97, 0.3))"
            >
                VIDYUT
            </text>

            {/* SHIELD ICON */}
            <g transform="translate(280, 5) scale(0.65)">
                {/* Left/Grey Segment */}
                <path
                    d="M15 25 L48 20 L35 62 L58 52 L32 110 C18 90 12 50 15 25Z"
                    fill="#9CA3AF"
                />

                {/* Right/Bronze Segment */}
                <path
                    d="M85 25 C85 50 75 90 45 105 L65 58 L42 68 L72 10 L85 25Z"
                    fill="url(#glossyBronze)"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                />
            </g>
        </svg>
    );
}
