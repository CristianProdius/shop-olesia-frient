"use client"
import { useState, useEffect } from 'react';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
})

interface CurrencyProps {
    value?: string | number;
}

const Currency:React.FC<CurrencyProps> = ({ value }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, [])

    if (!isMounted) {
        return null;
    }

    return (
        // span (not div) so it's valid inside inline parents like <p> (e.g. Info)
        <span className="font-semibold">
            {formatter.format(Number(value))}
        </span>
    );
}

export default Currency;