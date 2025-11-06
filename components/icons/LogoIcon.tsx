
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 52 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <mask id="sg-logo-mask">
                <rect x="0" y="0" width="52" height="80" fill="white" />
                <text 
                    x="26" 
                    y="25"
                    fontFamily="Inter, sans-serif" 
                    fontWeight="bold"
                    fontSize="28"
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="black"
                >
                    S
                </text>
                <text 
                    x="26" 
                    y="55"
                    fontFamily="Inter, sans-serif" 
                    fontWeight="bold"
                    fontSize="28"
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="black"
                >
                    G
                </text>
            </mask>
        </defs>
        
        <rect 
            x="0" 
            y="0" 
            width="52" 
            height="80" 
            rx="10.4"
            mask="url(#sg-logo-mask)"
        />
    </svg>
);
