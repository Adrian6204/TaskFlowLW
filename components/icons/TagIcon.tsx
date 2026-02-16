import React from 'react';

export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.593l6.202-2.375c.827-.279 1.25-1.354.593-2.607L13.06 6.634a2.25 2.25 0 00-1.591-.659h-1.9z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);
