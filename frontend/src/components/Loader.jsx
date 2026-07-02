import React, { useEffect, useRef, useState } from 'react';
import loaderVideo from '../assets/loader-bg.mp4';
import './Loader.css';

const PHASES = {
    COUNTER: 2000,  // 2 seconds for counter animation
    ZOOM: 1200,     // Smooth zoom transition
    WIPE: 650       // Matches App.jsx delay
};

export default function Loader({ onDone }) {
    const [counter, setCounter] = useState(0);
    const [stage, setStage] = useState('loading');
    const rafRef = useRef(null);
    const loaderRef = useRef(null);

    useEffect(() => {
        const t0 = performance.now();
        const counterStart = t0;
        const counterDuration = PHASES.COUNTER;

        function tick(now) {
            const elapsed = now - counterStart;
            const t = Math.min(1, elapsed / counterDuration);

            // Linear easing for fast counter
            const value = Math.floor(t * 99);
            setCounter(value);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        }

        rafRef.current = requestAnimationFrame(tick);

        const timers = [];

        // Transition to zoom stage after counter completes
        timers.push(
            setTimeout(() => {
                setStage('zoom');
            }, PHASES.COUNTER)
        );

        // Transition to wipe stage
        timers.push(
            setTimeout(() => {
                setStage('wipe');
            }, PHASES.COUNTER + PHASES.ZOOM)
        );

        // Complete animation and trigger callback
        timers.push(
            setTimeout(() => {
                if (onDone) onDone();
            }, PHASES.COUNTER + PHASES.ZOOM + PHASES.WIPE)
        );

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            timers.forEach(clearTimeout);
        };
    }, [onDone]);

    return (
        <div ref={loaderRef} className={`loader stage-${stage}`}>
            {/* Combined TEILEZ Word Container */}
            <div className="loader-text-wrapper">
                {/* Left Part - TEI */}
                <div className="loader-word loader-word--left">
                    TEI
                    <span className="loader-counter loader-counter--left">
                        {String(counter).padStart(2, '0')}
                    </span>
                </div>

                {/* Center Video Frame */}
                <div className="loader-video-container">
                    <div className="loader-frame">
                        <video
                            className="loader-video"
                            src={loaderVideo}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    </div>
                </div>

                {/* Right Part - LEZ */}
                <div className="loader-word loader-word--right">
                    LEZ
                    <span className="loader-counter loader-counter--right">
                        {String(counter).padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Wipe Transition */}
            <div className="loader-wipe" />
        </div>
    );
}
