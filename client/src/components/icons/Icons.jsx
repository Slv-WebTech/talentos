/*
  Hand-written icon set (stroke-based, 20x20 grid) — avoids pulling in an
  icon package for the ~14 glyphs this product actually uses.
*/
function base(props) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  };
}

export function BriefcaseIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="6" width="15" height="10.5" rx="2" />
      <path d="M7 6V4.75A1.75 1.75 0 0 1 8.75 3h2.5A1.75 1.75 0 0 1 13 4.75V6" />
      <path d="M2.5 11h15" />
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="7.25" cy="7" r="2.75" />
      <path d="M2 16.5c0-2.6 2.35-4.5 5.25-4.5s5.25 1.9 5.25 4.5" />
      <path d="M12.75 4.6a2.75 2.75 0 0 1 0 5.35" />
      <path d="M14.25 12.3c2.15.35 3.75 1.95 3.75 4.2" />
    </svg>
  );
}

export function SparkleIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M10 2.5 11.4 7.6 16.5 9l-5.1 1.4L10 15.5 8.6 10.4 3.5 9l5.1-1.4L10 2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10h13" />
      <path d="M11 4.5 16.5 10 11 15.5" />
    </svg>
  );
}

export function MapPinIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M10 18s6-5.44 6-9.8A6 6 0 0 0 4 8.2C4 12.56 10 18 10 18Z" />
      <circle cx="10" cy="8.1" r="2.1" />
    </svg>
  );
}

export function BuildingIcon(props) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
      <path d="M7.25 6h1.25M11.5 6h1.25M7.25 9.25h1.25M11.5 9.25h1.25M7.25 12.5h1.25M11.5 12.5h1.25" />
      <path d="M8.25 17.5V15a1.75 1.75 0 0 1 3.5 0v2.5" />
    </svg>
  );
}

export function DollarIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.75v8.5" />
      <path d="M12.5 8a2.25 2.25 0 0 0-2.3-1.75c-1.3 0-2.2.7-2.2 1.75 0 2.2 4.5 1.05 4.5 3.25 0 1.05-.9 1.75-2.3 1.75A2.4 2.4 0 0 1 7.5 11.5" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.75V10l3 2" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function XIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function LogoutIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M8 17H5.25A1.25 1.25 0 0 1 4 15.75V4.25A1.25 1.25 0 0 1 5.25 3H8" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7.5" />
    </svg>
  );
}

export function EyeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M2 10s2.75-5.5 8-5.5S18 10 18 10s-2.75 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

export function EyeOffIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l12 12" />
      <path d="M9.1 4.7A8.6 8.6 0 0 1 10 4.5c5.25 0 8 5.5 8 5.5a13.6 13.6 0 0 1-2.9 3.6M6.5 6.1C3.9 7.6 2 10 2 10s2.75 5.5 8 5.5c1.02 0 1.94-.2 2.76-.55" />
      <path d="M8.1 8.1a2.25 2.25 0 0 0 3.15 3.2" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M10 2.5 18 16.5H2L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 8.25v3.25" />
      <circle cx="10" cy="14" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M10 13V4" />
      <path d="M6.25 7.25 10 3.5l3.75 3.75" />
      <path d="M3.5 13.5v2.25A1.25 1.25 0 0 0 4.75 17h10.5a1.25 1.25 0 0 0 1.25-1.25V13.5" />
    </svg>
  );
}

export function InboxIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 11.5 5 4.75A1.5 1.5 0 0 1 6.4 3.75h7.2a1.5 1.5 0 0 1 1.4 1L17.5 11.5" />
      <rect x="2.5" y="11.5" width="15" height="5" rx="1.5" />
      <path d="M2.5 11.5H7a1 1 0 0 1 .95.68l.3.9a1 1 0 0 0 .95.67h1.6a1 1 0 0 0 .95-.67l.3-.9a1 1 0 0 1 .95-.68h4.5" />
    </svg>
  );
}
