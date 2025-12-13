# Trace & Rescue - Project Structure Guide

## 📁 Folder Structure

### **Pages** (`src/pages/`)
Main application pages and routes:
- `Landing.tsx` - Landing page with About section and Login/Signup
- `Dashboard.tsx` - Main dashboard with statistics and quick actions
- `RegisterCase.tsx` - Form to register new missing person cases
- `LiveSearch.tsx` - Live CCTV feed analysis interface (Python integration placeholder)
- `FootageSearch.tsx` - Upload and analyze recorded CCTV footage
- `Cases.tsx` - View and manage all cases with filters
- `NotFound.tsx` - 404 error page

### **Components** (`src/components/`)
Reusable UI components:
- `DashboardLayout.tsx` - Main layout wrapper for authenticated pages
- `ProtectedRoute.tsx` - Route wrapper that requires authentication
- `NavLink.tsx` - Navigation link component with active state
- `ui/` - Shadcn UI components (buttons, cards, inputs, etc.)

### **Contexts** (`src/contexts/`)
Application-wide state management:
- `AuthContext.tsx` - Authentication state and methods (login, signup, logout)

### **Types** (`src/types/`)
TypeScript type definitions:
- `database.ts` - Database table interfaces (Profile, Case)

### **Integration** (`src/integrations/supabase/`)
Backend integration:
- `client.ts` - Supabase client configuration (auto-generated)
- `types.ts` - Database types from Supabase (auto-generated)

### **Styles** (`src/`)
- `index.css` - Global styles and design system tokens
- `tailwind.config.ts` - Tailwind CSS configuration with color palette

### **Database** (`supabase/migrations/`)
Database schema and migrations (managed automatically)

---

## 🔌 Python Integration Points

### 1. Live CCTV Search
**Endpoint**: `/api/live-cctv-analysis`
- **Location**: `src/pages/LiveSearch.tsx`
- **Method**: WebSocket or streaming connection
- **Purpose**: Real-time facial recognition on live feeds
- **Your Python Script**: Connect to this endpoint to receive live video streams and send back detection results

### 2. CCTV Footage Upload
**Endpoints**:
- Upload: `/api/analyze-footage`
- Storage: `/storage/v1/object/public/cctv-footage/[file-path]`
- **Location**: `src/pages/FootageSearch.tsx`
- **Method**: POST (upload), GET (retrieve)
- **Purpose**: Analyze uploaded video files for missing persons
- **Your Python Script**: 
  1. Retrieve uploaded videos from storage
  2. Process with your facial recognition model
  3. Return timestamps and match confidence scores

### 3. Case Photo Storage
**Storage Bucket**: `case-photos`
- **Location**: Photos uploaded via `src/pages/RegisterCase.tsx`
- **Access**: Public bucket - your Python script can access photos directly
- **Purpose**: Reference images for facial recognition matching

---

## 🎨 Theme & Design System

### Color Palette (Blue/White/Gray)
Defined in `src/index.css`:
- **Primary**: Professional blue (`--primary: 210 85% 45%`)
- **Background**: Light gray (`--background: 210 30% 98%`)
- **Dashboard**: Dark blue sidebar (`--dashboard-sidebar: 215 30% 20%`)
- **Accent**: Bright blue for highlights (`--accent: 205 80% 50%`)

All colors use HSL format and are defined as CSS variables for consistency.

### Using Design Tokens
Always use design tokens instead of hard-coded colors:
```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground">

// ❌ Wrong
<div className="bg-blue-500 text-white">
```

---

## 🔐 Authentication Flow

1. **Signup** (`Landing.tsx`):
   - Email, password, username, branch/department
   - Creates user in auth.users and profiles table
   - Auto-login after successful signup

2. **Login** (`Landing.tsx`):
   - Email and password authentication
   - Redirects to dashboard on success

3. **Protected Routes** (`ProtectedRoute.tsx`):
   - All dashboard routes require authentication
   - Automatically redirects to landing page if not logged in

---

## 📊 Database Schema

### Tables

#### `profiles`
- `id` (UUID) - Links to auth.users
- `username` (TEXT) - Unique username
- `full_name` (TEXT) - Officer's full name
- `branch_department` (TEXT) - Department/branch info

#### `cases`
- `id` (UUID) - Primary key
- `user_id` (UUID) - Creator's ID
- `full_name` (TEXT) - Missing person's name
- `age` (INTEGER) - Age
- `gender` (TEXT) - Gender
- `description` (TEXT) - Physical description
- `photo_url` (TEXT) - Photo URL from storage
- `last_seen_location` (TEXT) - Last known location
- `last_seen_date` (TIMESTAMP) - Last seen date
- `status` (TEXT) - Case status (active, resolved, closed)
- `is_public` (BOOLEAN) - Privacy setting
- `contact_info` (TEXT) - Contact information
- `additional_details` (TEXT) - Extra notes

### Storage Buckets
- `case-photos` - Public bucket for missing person photos
- `cctv-footage` - Private bucket for uploaded videos

---

## 🚀 Getting Started

### For Development:
1. Project runs on React + Vite + TypeScript
2. Backend powered by Lovable Cloud (Supabase)
3. Authentication is already configured
4. All routes are set up in `src/App.tsx`

### Adding Your Python Backend:
1. **Live Feed**: Connect WebSocket to the live search page
2. **Video Analysis**: 
   - Retrieve videos from `cctv-footage` storage bucket
   - Process with your ML model
   - Send results back to the frontend
3. **Face Matching**: Use photos from `case-photos` bucket as reference

### Environment Variables:
Located in `.env` (auto-configured):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

---

## 📝 Key Features Implemented

✅ Landing page with About section and Login/Signup  
✅ Dashboard with statistics and quick access  
✅ Register missing person with photo upload  
✅ Case privacy toggle (private/public)  
✅ Live CCTV search interface (Python integration ready)  
✅ CCTV footage upload and storage  
✅ Case management with filters (date, name, status, visibility)  
✅ Professional blue/white/gray color scheme  
✅ Mobile responsive design  
✅ Secure authentication and authorization  

---

## 🔄 Making Changes

### To add a new page:
1. Create file in `src/pages/YourPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/DashboardLayout.tsx`

### To modify styles:
1. Edit design tokens in `src/index.css`
2. Update Tailwind config in `tailwind.config.ts`
3. Use semantic color classes in components

### To update database:
Backend changes are managed through migrations (contact via Lovable Cloud interface)

---

## 📞 Support

For technical issues or questions about integrating your Python backend, refer to:
- Lovable Cloud documentation
- API integration examples in the placeholder sections
- Comments in the code files
