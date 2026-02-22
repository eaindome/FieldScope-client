// Simple SVG icon components for the sidebar
export const icons = {
	Dashboard: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="7" height="7"></rect>
			<rect x="14" y="3" width="7" height="7"></rect>
			<rect x="14" y="14" width="7" height="7"></rect>
			<rect x="3" y="14" width="7" height="7"></rect>
		</svg>
	`,
	Building: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
			<path d="M9 22v-4h6v4"></path>
			<path d="M8 6h.01"></path>
			<path d="M16 6h.01"></path>
			<path d="M12 6h.01"></path>
			<path d="M12 10h.01"></path>
			<path d="M12 14h.01"></path>
			<path d="M16 10h.01"></path>
			<path d="M16 14h.01"></path>
			<path d="M8 10h.01"></path>
			<path d="M8 14h.01"></path>
		</svg>
	`,
	Mail: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="2" y="4" width="20" height="16" rx="2"></rect>
			<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
		</svg>
	`,
	Settings: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
			<circle cx="12" cy="12" r="3"></circle>
		</svg>
	`,
	Activity: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
		</svg>
	`,
	Heart: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
			<path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path>
		</svg>
	`,
	ChevronDown: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m6 9 6 6 6-6"></path>
		</svg>
	`,
	ChevronRight: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m9 18 6-6-6-6"></path>
		</svg>
	`,
	User: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
			<circle cx="12" cy="7" r="4"></circle>
		</svg>
	`,
	LogOut: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
			<polyline points="16 17 21 12 16 7"></polyline>
			<line x1="21" y1="12" x2="9" y2="12"></line>
		</svg>
	`,
	Folder: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
		</svg>
	`,
	ClipboardList: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
			<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
			<path d="M12 11h4"></path>
			<path d="M12 16h4"></path>
			<path d="M8 11h.01"></path>
			<path d="M8 16h.01"></path>
		</svg>
	`,
	Users: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
			<circle cx="9" cy="7" r="4"></circle>
			<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
			<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
		</svg>
	`,
	Check: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="20 6 9 17 4 12"></polyline>
		</svg>
	`,
	Clock: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<polyline points="12 6 12 12 16 14"></polyline>
		</svg>
	`,
	X: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="18" y1="6" x2="6" y2="18"></line>
			<line x1="6" y1="6" x2="18" y2="18"></line>
		</svg>
	`,
	Menu: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="4" y1="12" x2="20" y2="12"></line>
			<line x1="4" y1="6" x2="20" y2="6"></line>
			<line x1="4" y1="18" x2="20" y2="18"></line>
		</svg>
	`,
	Shield: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
		</svg>
	`,
	MapPin: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
			<circle cx="12" cy="10" r="3"></circle>
		</svg>
	`,
	Phone: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
		</svg>
	`,
	Globe: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="2" y1="12" x2="22" y2="12"></line>
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
		</svg>
	`,
	RefreshCw: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 2v6h-6"></path>
			<path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
			<path d="M3 22v-6h6"></path>
			<path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
		</svg>
	`,
	Eye: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
			<circle cx="12" cy="12" r="3"></circle>
		</svg>
	`,
	Edit: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
			<path d="m15 5 4 4"></path>
		</svg>
	`,
	Trash: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 6h18"></path>
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
		</svg>
	`,
	MoreVertical: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="1"></circle>
			<circle cx="12" cy="5" r="1"></circle>
			<circle cx="12" cy="19" r="1"></circle>
		</svg>
	`,
	ChevronLeft: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m15 18-6-6 6-6"></path>
		</svg>
	`,
	Search: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<path d="m21 21-4.35-4.35"></path>
		</svg>
	`,
	Calendar: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
			<line x1="16" y1="2" x2="16" y2="6"></line>
			<line x1="8" y1="2" x2="8" y2="6"></line>
			<line x1="3" y1="10" x2="21" y2="10"></line>
		</svg>
	`,
	Plus: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	`,
	List: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="8" y1="6" x2="21" y2="6"></line>
			<line x1="8" y1="12" x2="21" y2="12"></line>
			<line x1="8" y1="18" x2="21" y2="18"></line>
			<line x1="3" y1="6" x2="3.01" y2="6"></line>
			<line x1="3" y1="12" x2="3.01" y2="12"></line>
			<line x1="3" y1="18" x2="3.01" y2="18"></line>
		</svg>
	`,
	Grid: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="7" height="7"></rect>
			<rect x="14" y="3" width="7" height="7"></rect>
			<rect x="14" y="14" width="7" height="7"></rect>
			<rect x="3" y="14" width="7" height="7"></rect>
		</svg>
	`,
	// Form field type icons
	Type: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="4 7 4 4 20 4 20 7"></polyline>
			<line x1="9" y1="20" x2="15" y2="20"></line>
			<line x1="12" y1="4" x2="12" y2="20"></line>
		</svg>
	`,
	AlignLeft: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="17" y1="10" x2="3" y2="10"></line>
			<line x1="21" y1="6" x2="3" y2="6"></line>
			<line x1="21" y1="14" x2="3" y2="14"></line>
			<line x1="17" y1="18" x2="3" y2="18"></line>
		</svg>
	`,
	Hash: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="4" y1="9" x2="20" y2="9"></line>
			<line x1="4" y1="15" x2="20" y2="15"></line>
			<line x1="10" y1="3" x2="8" y2="21"></line>
			<line x1="16" y1="3" x2="14" y2="21"></line>
		</svg>
	`,
	CheckSquare: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="9 11 12 14 22 4"></polyline>
			<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
		</svg>
	`,
	Circle: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
		</svg>
	`,
	FileText: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
			<polyline points="14 2 14 8 20 8"></polyline>
			<line x1="16" y1="13" x2="8" y2="13"></line>
			<line x1="16" y1="17" x2="8" y2="17"></line>
			<polyline points="10 9 9 9 8 9"></polyline>
		</svg>
	`,
	Link: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
		</svg>
	`,
	Upload: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
			<polyline points="17 8 12 3 7 8"></polyline>
			<line x1="12" y1="3" x2="12" y2="15"></line>
		</svg>
	`,
	Copy: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
		</svg>
	`,
	GripVertical: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="9" cy="12" r="1"></circle>
			<circle cx="9" cy="5" r="1"></circle>
			<circle cx="9" cy="19" r="1"></circle>
			<circle cx="15" cy="12" r="1"></circle>
			<circle cx="15" cy="5" r="1"></circle>
			<circle cx="15" cy="19" r="1"></circle>
		</svg>
	`,
	Scissors: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="6" cy="6" r="3"></circle>
			<circle cx="6" cy="18" r="3"></circle>
			<line x1="20" y1="4" x2="8.12" y2="15.88"></line>
			<line x1="14.47" y1="14.48" x2="20" y2="20"></line>
			<line x1="8.12" y1="8.12" x2="12" y2="12"></line>
		</svg>
	`,
	Layers: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
			<polyline points="2 17 12 22 22 17"></polyline>
			<polyline points="2 12 12 17 22 12"></polyline>
		</svg>
	`,
	ArrowRight: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="5" y1="12" x2="19" y2="12"></line>
			<polyline points="12 5 19 12 12 19"></polyline>
		</svg>
	`,
	ArrowLeft: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="19" y1="12" x2="5" y2="12"></line>
			<polyline points="12 19 5 12 12 5"></polyline>
		</svg>
	`,
	Info: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="12" y1="16" x2="12" y2="12"></line>
			<line x1="12" y1="8" x2="12.01" y2="8"></line>
		</svg>
	`,
	AlertCircle: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="12" y1="8" x2="12" y2="12"></line>
			<line x1="12" y1="16" x2="12.01" y2="16"></line>
		</svg>
	`,
	Filter: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
		</svg>
	`,
	TrendingUp: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
			<polyline points="17 6 23 6 23 12"></polyline>
		</svg>
	`,
	BarChart: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="20" x2="12" y2="10"></line>
			<line x1="18" y1="20" x2="18" y2="4"></line>
			<line x1="6" y1="20" x2="6" y2="16"></line>
		</svg>
	`,
	CheckCircle: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
			<polyline points="22 4 12 14.01 9 11.01"></polyline>
		</svg>
	`,
	XCircle: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="15" y1="9" x2="9" y2="15"></line>
			<line x1="9" y1="9" x2="15" y2="15"></line>
		</svg>
	`,
	Download: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
			<polyline points="7 10 12 15 17 10"></polyline>
			<line x1="12" y1="15" x2="12" y2="3"></line>
		</svg>
	`,
	Briefcase: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
			<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
		</svg>
	`,
	Lock: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
			<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
		</svg>
	`,
	Send: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="22" y1="2" x2="11" y2="13"></line>
			<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
		</svg>
	`,
	RotateCcw: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="1 4 1 10 7 10"></polyline>
			<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
		</svg>
	`,
	PieChart: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
			<path d="M22 12A10 10 0 0 0 12 2v10z"></path>
		</svg>
	`,
	BarChart2: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="18" y1="20" x2="18" y2="10"></line>
			<line x1="12" y1="20" x2="12" y2="4"></line>
			<line x1="6" y1="20" x2="6" y2="14"></line>
		</svg>
	`,
	Eye: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
			<circle cx="12" cy="12" r="3"></circle>
		</svg>
	`,
	BarChartH: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="4" y1="8" x2="4" y2="20"></line>
			<line x1="4" y1="8" x2="14" y2="8"></line>
			<line x1="4" y1="14" x2="20" y2="14"></line>
			<line x1="4" y1="20" x2="10" y2="20"></line>
		</svg>
	`,
	AreaChart: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 20 L3 10 L8 14 L13 8 L18 12 L21 6 L21 20 Z" fill="currentColor" fill-opacity="0.15" stroke="currentColor"></path>
			<polyline points="3 10 8 14 13 8 18 12 21 6"></polyline>
		</svg>
	`,
	Scatter: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="7" cy="17" r="2" fill="currentColor"></circle>
			<circle cx="5" cy="10" r="2" fill="currentColor"></circle>
			<circle cx="12" cy="14" r="2" fill="currentColor"></circle>
			<circle cx="15" cy="7" r="2" fill="currentColor"></circle>
			<circle cx="19" cy="11" r="2" fill="currentColor"></circle>
			<circle cx="18" cy="18" r="2" fill="currentColor"></circle>
		</svg>
	`,
	Radar: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polygon points="12 2 20 8 17 18 7 18 4 8" fill="none"></polygon>
			<polygon points="12 7 16 10 15 15 9 15 8 10" fill="currentColor" fill-opacity="0.2"></polygon>
			<line x1="12" y1="2" x2="12" y2="7"></line>
			<line x1="20" y1="8" x2="16" y2="10"></line>
			<line x1="17" y1="18" x2="15" y2="15"></line>
			<line x1="7" y1="18" x2="9" y2="15"></line>
			<line x1="4" y1="8" x2="8" y2="10"></line>
		</svg>
	`,
	Award: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="8" r="6"></circle>
			<path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
		</svg>
	`,
	AlertTriangle: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
			<path d="M12 9v4"></path>
			<path d="M12 17h.01"></path>
		</svg>
	`,
	// Chart type icons
	Bubble: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="7" cy="17" r="3" fill="currentColor" fill-opacity="0.2"></circle>
			<circle cx="5" cy="9" r="2" fill="currentColor" fill-opacity="0.3"></circle>
			<circle cx="13" cy="13" r="4" fill="currentColor" fill-opacity="0.2"></circle>
			<circle cx="17" cy="7" r="2.5" fill="currentColor" fill-opacity="0.3"></circle>
			<circle cx="19" cy="16" r="2" fill="currentColor" fill-opacity="0.3"></circle>
		</svg>
	`,
	Histogram: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="14" width="3" height="7" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="7" y="10" width="3" height="11" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="11" y="6" width="3" height="15" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="15" y="9" width="3" height="12" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="19" y="13" width="3" height="8" fill="currentColor" fill-opacity="0.3"></rect>
			<line x1="2" y1="21" x2="23" y2="21"></line>
		</svg>
	`,
	BoxPlot: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="8" y="9" width="8" height="7" fill="currentColor" fill-opacity="0.2"></rect>
			<line x1="8" y1="12.5" x2="16" y2="12.5" stroke-width="2.5"></line>
			<line x1="12" y1="9" x2="12" y2="4"></line>
			<line x1="12" y1="16" x2="12" y2="21"></line>
			<line x1="10" y1="4" x2="14" y2="4"></line>
			<line x1="10" y1="21" x2="14" y2="21"></line>
		</svg>
	`,
	Heatmap: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="4" height="4" fill="currentColor" fill-opacity="0.2"></rect>
			<rect x="8" y="3" width="4" height="4" fill="currentColor" fill-opacity="0.5"></rect>
			<rect x="13" y="3" width="4" height="4" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="18" y="3" width="4" height="4" fill="currentColor" fill-opacity="0.7"></rect>
			<rect x="3" y="8" width="4" height="4" fill="currentColor" fill-opacity="0.6"></rect>
			<rect x="8" y="8" width="4" height="4" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="13" y="8" width="4" height="4" fill="currentColor" fill-opacity="0.8"></rect>
			<rect x="18" y="8" width="4" height="4" fill="currentColor" fill-opacity="0.4"></rect>
			<rect x="3" y="13" width="4" height="4" fill="currentColor" fill-opacity="0.4"></rect>
			<rect x="8" y="13" width="4" height="4" fill="currentColor" fill-opacity="0.7"></rect>
			<rect x="13" y="13" width="4" height="4" fill="currentColor" fill-opacity="0.5"></rect>
			<rect x="18" y="13" width="4" height="4" fill="currentColor" fill-opacity="0.6"></rect>
		</svg>
	`,
	TreeMap: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="8" height="10" fill="currentColor" fill-opacity="0.2"></rect>
			<rect x="12" y="3" width="9" height="6" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="3" y="14" width="5" height="7" fill="currentColor" fill-opacity="0.25"></rect>
			<rect x="9" y="14" width="5" height="7" fill="currentColor" fill-opacity="0.35"></rect>
			<rect x="15" y="10" width="6" height="11" fill="currentColor" fill-opacity="0.28"></rect>
		</svg>
	`,
	Funnel: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 3 L20 3 L17 9 L7 9 Z" fill="currentColor" fill-opacity="0.2"></path>
			<path d="M7 9 L17 9 L15 14 L9 14 Z" fill="currentColor" fill-opacity="0.3"></path>
			<path d="M9 14 L15 14 L14 18 L10 18 Z" fill="currentColor" fill-opacity="0.4"></path>
			<path d="M10 18 L14 18 L13 21 L11 21 Z" fill="currentColor" fill-opacity="0.5"></path>
		</svg>
	`,
	Waterfall: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="15" width="3" height="6" fill="currentColor" fill-opacity="0.3"></rect>
			<rect x="7" y="12" width="3" height="3" fill="currentColor" fill-opacity="0.4"></rect>
			<rect x="11" y="8" width="3" height="4" fill="currentColor" fill-opacity="0.4"></rect>
			<rect x="15" y="6" width="3" height="2" fill="currentColor" fill-opacity="0.4"></rect>
			<rect x="19" y="3" width="3" height="18" fill="currentColor" fill-opacity="0.3"></rect>
			<line x1="6" y1="15" x2="7" y2="15" stroke-dasharray="2,2"></line>
			<line x1="10" y1="12" x2="11" y2="12" stroke-dasharray="2,2"></line>
			<line x1="14" y1="8" x2="15" y2="8" stroke-dasharray="2,2"></line>
			<line x1="18" y1="6" x2="19" y2="6" stroke-dasharray="2,2"></line>
		</svg>
	`,
	Gauge: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 21 A10 10 0 0 1 2 11 A10 10 0 0 1 12 1 A10 10 0 0 1 22 11" fill="none"></path>
			<path d="M12 11 L17 8" stroke-width="2.5"></path>
			<circle cx="12" cy="11" r="2" fill="currentColor"></circle>
			<line x1="12" y1="2" x2="12" y2="4"></line>
			<line x1="4.9" y1="4.9" x2="6.3" y2="6.3"></line>
			<line x1="2" y1="11" x2="4" y2="11"></line>
			<line x1="20" y1="11" x2="22" y2="11"></line>
			<line x1="17.7" y1="6.3" x2="19.1" y2="4.9"></line>
		</svg>
	`,
	Sankey: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 6 L10 10" stroke-width="4" stroke-opacity="0.3"></path>
			<path d="M3 12 L10 10" stroke-width="3" stroke-opacity="0.3"></path>
			<path d="M3 18 L10 16" stroke-width="3" stroke-opacity="0.3"></path>
			<path d="M10 10 L21 8" stroke-width="5" stroke-opacity="0.3"></path>
			<path d="M10 16 L21 14" stroke-width="4" stroke-opacity="0.3"></path>
			<circle cx="3" cy="6" r="1.5" fill="currentColor"></circle>
			<circle cx="3" cy="12" r="1.5" fill="currentColor"></circle>
			<circle cx="3" cy="18" r="1.5" fill="currentColor"></circle>
			<circle cx="10" cy="10" r="1.5" fill="currentColor"></circle>
			<circle cx="10" cy="16" r="1.5" fill="currentColor"></circle>
			<circle cx="21" cy="8" r="1.5" fill="currentColor"></circle>
			<circle cx="21" cy="14" r="1.5" fill="currentColor"></circle>
		</svg>
	`,
	Choropleth: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 6 L7 3 L12 5 L15 3 L21 6 L21 18 L17 21 L12 19 L8 21 L3 18 Z" fill="none"></path>
			<path d="M3 6 L7 3 L7 9 L3 12 Z" fill="currentColor" fill-opacity="0.2"></path>
			<path d="M7 3 L12 5 L12 11 L7 9 Z" fill="currentColor" fill-opacity="0.4"></path>
			<path d="M12 5 L15 3 L15 10 L12 11 Z" fill="currentColor" fill-opacity="0.3"></path>
			<path d="M15 3 L21 6 L21 12 L15 10 Z" fill="currentColor" fill-opacity="0.5"></path>
			<path d="M3 12 L7 9 L7 15 L3 18 Z" fill="currentColor" fill-opacity="0.35"></path>
			<path d="M7 9 L12 11 L12 19 L8 21 L7 15 Z" fill="currentColor" fill-opacity="0.45"></path>
			<path d="M12 11 L15 10 L15 17 L12 19 Z" fill="currentColor" fill-opacity="0.3"></path>
			<path d="M15 10 L21 12 L21 18 L17 21 L15 17 Z" fill="currentColor" fill-opacity="0.4"></path>
		</svg>
	`,
	Image: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
			<circle cx="8.5" cy="8.5" r="1.5"></circle>
			<polyline points="21 15 16 10 5 21"></polyline>
		</svg>
	`,
	Droplet: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
		</svg>
	`,
	Play: (size: number = 20) => `
		<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polygon points="5 3 19 12 5 21 5 3"></polygon>
		</svg>
	`
};
