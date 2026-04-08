export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div style={{ border: '1px solid var(--br)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '12px 16px', background: 'var(--bg2)', borderBottom: '2px solid var(--br)' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 16, background: 'var(--br)', borderRadius: 4, opacity: 0.5 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            padding: '12px 16px',
            borderBottom: '1px solid var(--br)',
            background: rowIndex % 2 ? 'var(--bg2)' : 'transparent',
            gap: 16
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              style={{
                flex: 1,
                height: 16,
                background: 'var(--br)',
                borderRadius: 4,
                opacity: 0.3,
                animation: 'skeletonPulse 1.5s ease-in-out infinite',
                animationDelay: `${rowIndex * 0.1 + colIndex * 0.05}s`
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 16,
            background: 'var(--br)',
            borderRadius: 4,
            marginBottom: i < lines - 1 ? 12 : 0,
            width: i === lines - 1 ? '60%' : '100%',
            opacity: 0.3,
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, height = 60 }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            background: 'var(--br)',
            borderRadius: 8,
            opacity: 0.3,
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}
