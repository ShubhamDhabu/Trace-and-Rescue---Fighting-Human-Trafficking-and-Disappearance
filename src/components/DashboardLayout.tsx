import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, FileText, Video, Upload, Home } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Top Navigation */}
      <header className="bg-dashboard-sidebar border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
           <img
              src="/logo.png"
              alt="Trace & Rescue Logo"
              className="h-8 w-8 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-dashboard-sidebar-foreground">
                Trace & Rescue
              </h1>
              <p className="text-xs text-dashboard-sidebar-foreground/70">
                Command Center
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="border-dashboard-sidebar-foreground/20 text-dashboard-sidebar-foreground hover:bg-dashboard-sidebar-foreground/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            <NavLink 
              to="/dashboard"
              end
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              activeClassName="text-primary border-primary"
            >
              <Home className="h-4 w-4" />
              Overview
            </NavLink>
            
            <NavLink 
              to="/dashboard/register"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              activeClassName="text-primary border-primary"
            >
              <FileText className="h-4 w-4" />
              Register Case
            </NavLink>
            
            <NavLink 
              to="/dashboard/live-search"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              activeClassName="text-primary border-primary"
            >
              <Video className="h-4 w-4" />
              Live CCTV
            </NavLink>
            
            <NavLink 
              to="/dashboard/footage-search"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              activeClassName="text-primary border-primary"
            >
              <Upload className="h-4 w-4" />
              Upload Footage
            </NavLink>
            
            <NavLink 
              to="/dashboard/cases"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
              activeClassName="text-primary border-primary"
            >
              <FileText className="h-4 w-4" />
              All Cases
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-8">
        {children}
      </main>
    </div>
  );
}
