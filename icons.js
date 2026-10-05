const P={users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.500 3-6 6-6s6 2.500 6 6M17 5a3 3 0 010 6M21 20c0-2.500-1.500-4.500-4-5.500"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
clip:'<rect x="6" y="4" width="12" height="17" rx="3"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',
ok:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',no:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/>',
unlock:'<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 017.500-2"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
tooth:'<path d="M7 4c-3 0-4 3-3 6s1 8 3 9 2-5 5-5 3 6 5 5 2-6 3-9-0-6-3-6c-3 0-3 1-5 1S10 4 7 4z"/>',
chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
user:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M7 19c1-3 3-4 5-4s4 1 5 4"/>',
book:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16"/>',phone:'<path d="M5 4h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 22 2 14 3 6c0-1 1-2 2-2z"/>',reg:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>'};
export const icon=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
