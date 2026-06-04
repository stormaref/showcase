type UploadProgressBarProps = {
  percent: number;
  label?: string;
};

export function UploadProgressBar({ percent, label }: UploadProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        {label && <span className="text-gray-600">{label}</span>}
        <span className="tabular-nums text-gray-500">{clamped}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gray-900 transition-[width] duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
