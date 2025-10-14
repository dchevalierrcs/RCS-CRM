// components/PercentageCircle.tsx
'use client';

interface Props {
  percentage: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export default function PercentageCircle({
  percentage,
  label,
  size = 120,
  strokeWidth = 10,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb" // gray-200
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Arc de progression */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#4f46e5" // indigo-600
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        {/* Texte du pourcentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
        </div>
      </div>
      <p className="font-semibold text-gray-700">{label}</p>
    </div>
  );
}