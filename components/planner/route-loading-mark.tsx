type RouteLoadingMarkProps = {
  className?: string;
};

export function RouteLoadingMark({ className = "" }: RouteLoadingMarkProps) {
  return (
    <svg
      className={`route-loading-mark ${className}`.trim()}
      viewBox="0 0 64 24"
      aria-hidden="true"
      focusable="false"
    >
      <path className="route-loading-mark__track" d="M3 17 18 6l13 10L48 5l13 10" />
      <circle className="route-loading-mark__node" cx="18" cy="6" r="2.5" />
      <circle className="route-loading-mark__node" cx="31" cy="16" r="2.5" />
      <circle className="route-loading-mark__node route-loading-mark__node--active" cx="48" cy="5" r="3" />
    </svg>
  );
}
