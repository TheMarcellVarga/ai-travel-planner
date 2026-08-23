type RouteLoadingMarkProps = {
  className?: string;
};

export function RouteLoadingMark({ className = "" }: RouteLoadingMarkProps) {
  return (
    <svg
      className={`route-loading-mark ${className}`.trim()}
      viewBox="0 0 160 8"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="route-loading-mark__track" x="1" y="1" width="158" height="6" rx="3" />
      <rect className="route-loading-mark__fill" x="1" y="1" width="44" height="6" rx="3" />
    </svg>
  );
}
