'use client';
import { useEffect } from 'react';

export default function ViewTracker({slug}) {
    useEffect(() => {
        navigator.sendBeacon(
            `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/track-view`,
            new Blob([JSON.stringify({slug})], {type: 'application/json'})
        );
    }, [slug]);
    return null;
}