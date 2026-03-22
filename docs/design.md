# Attendify — UI/UX Design Specification

## Design Inspiration

The UI is inspired by modern EdTech platforms like Unacademy, focusing on:

- Clean and minimal interface  
- High readability  
- Soft color palettes  
- Clear hierarchy  
- Smooth user experience  

---

# Design Principles

- Minimal and distraction-free  
- Consistent spacing and typography  
- Clear visual hierarchy  
- Fast and responsive  
- Accessible (light + dark mode)  

---

# Color System

## Light Mode

- Primary: #2563EB (Blue-600)  
- Secondary: #1E40AF (Blue-800)  
- Background: #F9FAFB (Gray-50)  
- Card: #FFFFFF  
- Text Primary: #111827 (Gray-900)  
- Text Secondary: #6B7280 (Gray-500)  
- Border: #E5E7EB  

---

## Dark Mode

- Primary: #3B82F6 (Blue-500)  
- Background: #0F172A (Slate-900)  
- Card: #1E293B (Slate-800)  
- Text Primary: #F9FAFB  
- Text Secondary: #94A3B8  
- Border: #334155  

---

# Typography

- Font: Inter / Poppins  
- Headings: Bold  
- Body: Regular  
- Sizes:
  - H1: 32px  
  - H2: 24px  
  - H3: 18px  
  - Body: 14–16px  

---

# Layout System

## Global Layout

- Sidebar (desktop)  
- Top navbar  
- Content area  

---

## Responsive Behavior

### Desktop
- Sidebar visible  
- Multi-column layout  

### Tablet
- Collapsible sidebar  
- Reduced spacing  

### Mobile
- Bottom navigation  
- Single column layout  

---

# Components

## Buttons

- Primary (blue filled)  
- Secondary (outline)  
- Ghost (text only)  

States:
- Hover → slight scale + color change  
- Active → darker shade  

---

## Cards

- Rounded corners (xl)  
- Soft shadow  
- Padding: 16–20px  

Used for:
- Classes  
- Stats  
- Attendance summaries  

---

## Inputs

- Rounded  
- Border + focus ring  
- Clear error states  

---

## Tables

- Clean rows  
- Hover highlight  
- Sticky headers  

---

# Portals

---

# Student Portal

## Dashboard

Features:

- Attendance percentage card  
- Recent attendance history  
- Upcoming classes  
- Alerts (low attendance warning)  

---

## Pages

- Dashboard  
- My Classes  
- Attendance History  
- Profile  

---

## UI Behavior

- Clean cards layout  
- Graphs for attendance trends  
- Highlight low attendance  

---

# Teacher Portal

## Dashboard

Features:

- Class overview  
- Quick attendance button  
- Recent sessions  
- Student insights  

---

## Pages

- Dashboard  
- Manage Classes  
- Take Attendance (Camera UI)  
- Reports  

---

## Special UI (Attendance)

- Camera preview screen  
- Capture button  
- Detected faces overlay  
- Absentee list panel  

---

# Admin Portal

## Dashboard

Features:

- Total users  
- Active classes  
- System analytics  
- Alerts  

---

## Pages

- User Management  
- Class Management  
- Analytics  
- System Settings  

---

# Dark Mode Support

- Toggle in navbar  
- Persist preference (localStorage)  

---

## Behavior

- Smooth transition  
- Maintain contrast ratios  
- Avoid pure black (use slate tones)  

---

# Animations

- Subtle transitions (200–300ms)  
- Hover scale (1.03–1.05)  
- Fade-in for components  

---

# Icons

- Use: Lucide / Heroicons  
- Style: outline icons  

---

# Graphs & Analytics

- Use charts for:
  - Attendance trends  
  - Predictions  
  - Clustering  

Libraries:
- Recharts / Chart.js  

---

# Accessibility

- Keyboard navigation  
- Proper contrast  
- ARIA labels  

---

# UX Enhancements

- Loading skeletons  
- Toast notifications  
- Empty states  

---

# Example Screens

## Student Dashboard

- Attendance % (big card)  
- Graph  
- Recent sessions  

---

## Teacher Attendance Screen

- Camera view  
- Capture button  
- Detected students  
- Absentees list  

---

## Admin Analytics

- Charts  
- Filters  
- Reports  

---

# Tech Stack (UI)

- React / Next.js  
- TailwindCSS  
- Zustand / Context API  
- Framer Motion (optional)  

---

# Expected Outcome

- Clean, modern UI  
- Easy navigation across portals  
- Fully responsive  
- Smooth dark/light mode  
- Professional EdTech feel  