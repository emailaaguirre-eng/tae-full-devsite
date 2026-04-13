
// Shared ArtKey icon — skeleton key silhouette with a mini QR grid inside the circular bow.
// Viewbox: 0 0 100 56  (landscape key proportions)
//   • Bow:   filled outer circle r=22, hollow inner circle r=13 (shows bgColor)
//   • QR:    7×7 grid of 1.6px cells, centered inside the hollow (fits within r≈10.5)
//   • Shaft: rounded rect connecting bow to bit end
//   • Teeth: two rectangular protrusions on top of shaft

const MINI_QR = [
  [1,1,1,0,1,0,1],
  [1,0,1,0,0,1,0],
  [1,1,1,0,1,0,1],
  [0,0,1,1,0,1,0],
  [1,1,1,0,1,0,1],
  [0,1,0,0,0,1,1],
  [1,1,1,0,1,0,0],
];

const CELL = 1.6;
const GRID_SIZE = 7 * CELL;
const QR_X = 25 - GRID_SIZE / 2;
const QR_Y = 28 - GRID_SIZE / 2;

interface Props {
  size?: number;
  color?: string;
  bgColor?: string;
}

export function ArtKeyQR({ size = 100, color = '#1A1A1A', bgColor = '#FFFFFF' }: Props) {
  const h = Math.round(size * 0.56);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Bow – outer filled circle */}
      <circle cx="25" cy="28" r="22" fill={color} />
      {/* Bow – inner hollow */}
      <circle cx="25" cy="28" r="13" fill={bgColor} />
      {/* Mini QR grid inside hollow */}
      {MINI_QR.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={QR_X + c * CELL}
              y={QR_Y + r * CELL}
              width={CELL - 0.2}
              height={CELL - 0.2}
              fill={color}
            />
          ) : null
        )
      )}
      {/* Shaft */}
      <rect x="47" y="23" width="49" height="10" rx="5" fill={color} />
      {/* Tooth 1 (taller) */}
      <rect x="60" y="13" width="9" height="10" rx="1.5" fill={color} />
      {/* Tooth 2 */}
      <rect x="75" y="16" width="9" height="7" rx="1.5" fill={color} />
    </svg>
  );
}
