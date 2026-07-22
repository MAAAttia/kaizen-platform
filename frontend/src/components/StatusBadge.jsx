import { useTranslation } from 'react-i18next';

const STAGE_CONFIG = {
  SUBMITTED:    { fill: 1, color: '#8A938C' },
  UNDER_REVIEW: { fill: 2, color: '#D97B29' },
  IN_PROGRESS:  { fill: 3, color: '#2D6E8E' },
  IMPLEMENTED:  { fill: 4, color: '#1F4D3D' },
  REJECTED:     { fill: 0, color: '#B23A34', mark: 'x' },
  CLOSED:       { fill: 0, color: '#6B7570', mark: 'dash' },
};

const QUADRANTS = [
  'M12,12 L12,2 A10,10 0 0,1 22,12 Z',
  'M12,12 L22,12 A10,10 0 0,1 12,22 Z',
  'M12,12 L12,22 A10,10 0 0,1 2,12 Z',
  'M12,12 L2,12 A10,10 0 0,1 12,2 Z',
];

export default function StatusBadge({ status, size = 'md' }) {
  const { t } = useTranslation();
  const config = STAGE_CONFIG[status] || STAGE_CONFIG.SUBMITTED;
  const label = t(`status.${status}`, { defaultValue: status });
  const dim = size === 'sm' ? 18 : 24;

  return (
    <span className="inline-flex items-center gap-1.5" title={`Kaizen stage: ${label}`}>
      <svg width={dim} height={dim} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#DCE3DD" strokeWidth="1" />
        {QUADRANTS.map((d, i) => (
          <path key={i} d={d} fill={i < config.fill ? config.color : 'transparent'} />
        ))}
        {config.mark === 'x' && (
          <path d="M8,8 L16,16 M16,8 L8,16" stroke={config.color} strokeWidth="2" strokeLinecap="round" />
        )}
        {config.mark === 'dash' && (
          <path d="M8,12 L16,12" stroke={config.color} strokeWidth="2" strokeLinecap="round" />
        )}
        <circle cx="12" cy="12" r="10" fill="none" stroke="#1B2421" strokeOpacity="0.08" strokeWidth="1" />
      </svg>
      <span className="text-sm font-medium" style={{ color: config.color }}>{label}</span>
    </span>
  );
}
