
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  ListTodo,
  Users,
  Settings,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Menu,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface SidebarNavProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarNav = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}: SidebarNavProps) => {
  const { isManager } = useAuth();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      requiresManager: false,
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: Package,
      requiresManager: false,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: ListTodo,
      requiresManager: false,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart,
      requiresManager: false,
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      requiresManager: true,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      requiresManager: false,
    },
  ];

  return (
    <>
      <div className={cn(
        "fixed top-0 z-40 h-16 w-full border-b bg-background md:hidden",
        mobileOpen ? "backdrop-blur-sm" : ""
      )}>
        <div className="flex h-16 items-center px-4">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">S</span>
            </div>
            <span className="font-semibold text-lg">SprintStride</span>
          </div>
        </div>
      </div>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        <div className="flex h-16 items-center border-b px-4">
          <div className={cn(
            "flex items-center gap-2",
            collapsed ? "justify-center w-full" : ""
          )}>
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">S</span>
            </div>
            {!collapsed && <span className="font-semibold text-lg">SprintStride</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("ml-auto", collapsed ? "hidden md:flex" : "")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            {navItems
              .filter(item => !item.requiresManager || isManager)
              .map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setMobileOpen(false);
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    collapsed ? "mx-auto" : ""
                  )} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              ))}
          </nav>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};
