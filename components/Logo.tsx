import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
    return (
        <img
            src="/logo.png"
            alt="TaskFlow Logo"
            className={`${className} object-contain`}
        />
    );
};
