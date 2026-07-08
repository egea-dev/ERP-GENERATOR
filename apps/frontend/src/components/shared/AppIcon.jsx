const ICON_PATHS = {
  truck: (
    <>
      <path d="M3 7h10v8H3z" />
      <path d="M13 10h3l3 3v2h-6z" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
    </>
  ),
  island: (
    <>
      <path d="M4 17c3-2 5-2 8 0s5 2 8 0" />
      <path d="M12 17c0-5 1-8 4-11" />
      <path d="M13 8c-2-1-4-1-6 1 2-3 5-4 8-2" />
      <path d="M14 8c2-2 4-2 6-1-2-2-5-3-7-1" />
    </>
  ),
  plane: (
    <>
      <path d="M3 11l18-7-7 18-3-8z" />
      <path d="M11 14l-4 4" />
    </>
  ),
  package: (
    <>
      <path d="M4 7l8-4 8 4-8 4z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
      <path d="M16 5l-8 4" />
    </>
  ),
  ship: (
    <>
      <path d="M4 16h16l-2 4H6z" />
      <path d="M6 16V9h10v7" />
      <path d="M9 9V5h4v4" />
      <path d="M3 21c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M15 9.5c-.7-.6-1.6-1-2.8-1-1.5 0-2.7.7-2.7 1.8 0 2.7 5.8 1.2 5.8 4.1 0 1.1-1.2 1.9-2.9 1.9-1.3 0-2.4-.4-3.2-1.1" />
      <path d="M12 7v10" />
    </>
  ),
  tag: (
    <>
      <path d="M20 13l-7 7-9-9V4h7z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6l1 2h2v15H6V6h2z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  curtains: (
    <>
      <path d="M4 5h16" />
      <path d="M7 5v14" />
      <path d="M17 5v14" />
      <path d="M7 8c3 2 3 6 0 8" />
      <path d="M17 8c-3 2-3 6 0 8" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h4" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  floor: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <path d="M8 7v5" />
      <path d="M14 12v5" />
    </>
  ),
  brick: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M4 12h16" />
      <path d="M9 6v6" />
      <path d="M15 12v6" />
    </>
  ),
  ruler: (
    <>
      <path d="M4 19L19 4l1 5-11 11z" />
      <path d="M9 14l2 2" />
      <path d="M12 11l2 2" />
      <path d="M15 8l2 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.7" />
      <path d="M4 12A8 8 0 0 1 17.7 6.3" />
      <path d="M17 3v4h-4" />
      <path d="M7 21v-4h4" />
    </>
  ),
  measure: (
    <>
      <path d="M4 7h16v10H4z" />
      <path d="M8 7v4" />
      <path d="M12 7v6" />
      <path d="M16 7v4" />
    </>
  ),
  currency: (
    <>
      <path d="M7 7h6a4 4 0 0 1 0 8H7" />
      <path d="M7 4v16" />
      <path d="M15 9l3-3 3 3" />
      <path d="M18 6v12" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 15a6 6 0 1 1 6 0l-1 3h-4z" />
      <path d="M10 21h4" />
    </>
  ),
  stairs: (
    <>
      <path d="M4 19h16" />
      <path d="M5 19v-4h4v-4h4V7h4V3h3" />
    </>
  ),
  calculator: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M8.5 7h7" />
      <path d="M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01" />
    </>
  ),
};

export default function AppIcon({ name, size = 16, className = '', title }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.package;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {paths}
    </svg>
  );
}
