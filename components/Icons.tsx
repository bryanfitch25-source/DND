// Minimal stroke-based icon set for the mobile nav/drawers -- kept as plain
// inline SVG (no icon library dependency) so they inherit currentColor and
// stay crisp at any size.

type IconProps = { className?: string };

export function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconScroll({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path
        d="M6 4h10a2 2 0 012 2v13a2 2 0 002-2M6 4a2 2 0 00-2 2v13a2 2 0 002 2h12M6 4v15M9 9h6M9 13h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFlame({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path
        d="M12 3s4 3.5 4 8a4 4 0 01-8 0c0-1.2.6-2 1-2.5-.1 1 .4 1.8 1 2 .3-2.5 2-3.5 2-5.5.7.7 2 2.3 2 4.3a2.5 2.5 0 01-5 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path
        d="M4 5.5A2.5 2.5 0 016.5 3H12v18H6.5A2.5 2.5 0 014 18.5v-13zM20 5.5A2.5 2.5 0 0017.5 3H12v18h5.5a2.5 2.5 0 002.5-2.5v-13z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMap({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  );
}

export function IconDie({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4L12 2.5z" strokeLinejoin="round" />
      <path d="M12 2.5v9m0 0L3.5 7.4M12 11.5l8.5-4.1M12 11.5v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGear({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13.5a7.6 7.6 0 000-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 00-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 00-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 000 3l-2 1.5 2 3.4 2.3-.9c.75.65 1.63 1.16 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 002.6-1.5l2.3.9 2-3.4-2-1.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
