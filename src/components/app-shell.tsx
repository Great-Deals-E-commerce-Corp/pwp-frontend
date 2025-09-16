'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  FilePlus2,
  Home,
  Layers,
  List,
  LogOut,
  Rocket,
  Settings,
  User,
  Github,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['commercial', 'finance'] },
  { href: '/dashboard/new', label: 'Create Campaign', icon: FilePlus2, roles: ['commercial'] },
  { href: '/dashboard/campaign-modules', label: 'Campaign Type', icon: Layers, roles: ['commercial', 'shop-ops', 'finance'] },
  { href: '/dashboard/srp-masterlist', label: 'SRP Masterlist', icon: List, roles: ['commercial', 'shop-ops', 'finance'] },
  { href: '/shop-operations', label: 'ShopOps', icon: Rocket, roles: ['shop-ops'] },
]

function getRoleName(role: string): string {
  switch (role) {
    case 'commercial':
      return 'Commercial'
    case 'shop-ops':
      return 'ShopOps'
    case 'finance':
      return 'Finance'
    default:
      return 'User'
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasNotification, setHasNotification] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (!role) {
      router.push('/login')
    } else {
      setUserRole(role)
    }
  }, [router])

  const checkNotification = useCallback(() => {
    const newNotification = localStorage.getItem('hasNewNotification');
    setHasNotification(newNotification === 'true');
  }, []);

  useEffect(() => {
    checkNotification();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'hasNewNotification') {
        checkNotification();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkNotification]);
  
  const handleLogout = () => {
    localStorage.clear(); // Clear all local storage on logout
    router.push('/login')
  }

  const handleNotificationClick = () => {
    localStorage.removeItem('hasNewNotification');
    setHasNotification(false);
    if (userRole === 'shop-ops') {
        router.push('/shop-operations');
    }
  }

  if (!userRole) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        {/* You can add a loading spinner here */}
      </div>
    )
  }

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));
  const primaryActionPaths = ['/dashboard', '/dashboard/new'];
  
  const UserNav = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="person avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Demo User</p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleName(userRole)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-12 items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">PWP Campaign</span>
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden"/>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item, index) => {
              const isPrimary = primaryActionPaths.includes(item.href);
              const nextItem = filteredNavItems[index + 1];
              const isNextItemPrimary = nextItem && primaryActionPaths.includes(nextItem.href);
              
              const addSeparator = isPrimary && nextItem && !isNextItemPrimary;

              return (
                <React.Fragment key={item.href}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                      tooltip={item.label}
                      size="lg"
                      className="font-normal justify-start text-base py-6"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {addSeparator && (
                      <SidebarSeparator className="my-2 mx-4 h-0.5 bg-primary" />
                  )}
                </React.Fragment>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="md:hidden" />
          
          <div className="flex-1"></div>

          <Link href="https://github.com/your-username/promoplan-pro" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-full">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub Repository</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="relative rounded-full" onClick={handleNotificationClick}>
            <Bell className="h-5 w-5" />
            {hasNotification && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
