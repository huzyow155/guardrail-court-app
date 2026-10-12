import React from 'react';

export type SignalVerdict = 'ALLOW' | 'ESCALATE' | 'DENY' | 'PAUSED' | 'PENDING';

interface SemaphoreSignalProps {
  verdict: SignalVerdict | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SemaphoreSignal: React.FC<SemaphoreSignalProps> = ({
  verdict,
  size = 'md',
  showLabel = true,
}) => {
  const norm = verdict.toUpperCase();

  let signalClass = 'signal-deny';
  let armRotation = '90deg'; // Vertical stop
  let color = '#D6001C';
  let displayLabel = 'DENY';

  if (norm === 'ALLOW' || norm === 'CLEARED') {
    signalClass = 'signal-allow';
    armRotation = '0deg'; // Horizontal clear
    color = '#00A347';
    displayLabel = 'ALLOW';
  } else if (norm === 'ESCALATE' || norm === 'PENDING' || norm === 'PENDING_OWNER') {
    signalClass = 'signal-escalate';
    armRotation = '45deg'; // Diagonal attention
    color = '#FF8C00';
    displayLabel = 'ESCALATE';
  } else if (norm === 'PAUSED') {
    signalClass = 'signal-paused';
    armRotation = '90deg';
    color = '#64748B';
    displayLabel = 'PAUSED';
  }

  const armLength = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const mastHeight = size === 'sm' ? 20 : size === 'lg' ? 36 : 28;

  return (
    <div className={`semaphore-container semaphore-${size} ${signalClass}`} title={`Signal: ${displayLabel}`}>
      <svg
        className="semaphore-svg"
        viewBox="0 0 40 40"
        width={mastHeight}
        height={mastHeight}
        aria-hidden="true"
      >
        {/* Signal Mast */}
        <line x1="20" y1="36" x2="20" y2="14" stroke="#001FEB" strokeWidth="2.5" />
        <circle cx="20" cy="14" r="3.5" fill="#001FEB" />

        {/* Semaphore Arm */}
        <g
          transform={`rotate(${armRotation}, 20, 14)`}
          style={{
            transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
            transformOrigin: '20px 14px',
          }}
        >
          <line
            x1="20"
            y1="14"
            x2={20 + armLength}
            y2="14"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx={20 + armLength} cy="14" r="2.5" fill={color} />
        </g>
      </svg>
      {showLabel && (
        <span className="semaphore-label" style={{ color: color, fontWeight: 700 }}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};
