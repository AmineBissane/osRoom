"use client"

import { useEffect, useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { UserCircle, Settings, LogOut } from "lucide-react"
import Cookies from 'js-cookie'
import { decodeJWT } from '@/lib/jwt'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserProfile {
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = Cookies.get('access_token')
    console.log('Token found:', !!token)
    if (token) {
      const decoded = decodeJWT(token)
      console.log('Decoded profile:', decoded)
      setUserProfile(decoded)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    console.log('Logout clicked')
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('id_token')
    window.location.href = '/login'
  }

  const handleNavigation = (path: string) => {
    console.log('Navigation requested to:', path)
    window.location.href = path
  }

  const displayName = userProfile?.name || 
    userProfile?.preferred_username || 
    `${userProfile?.given_name || ''} ${userProfile?.family_name || ''}`.trim() ||
    'Usuario'

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          console.log('Toggle menu');
          setIsOpen(!isOpen);
        }}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <UserCircle className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border">
          <div className="flex items-center gap-2 p-2 border-b">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <UserCircle className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{userProfile?.email || ''}</p>
            </div>
          </div>
          
          <div className="p-1">
            <button
              className="w-full text-left flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
              onClick={() => {
                console.log('Profile clicked');
                handleNavigation('/profile');
              }}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Mi Perfil
            </button>
            
            <button
              className="w-full text-left flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
              onClick={() => {
                console.log('Settings clicked');
                handleNavigation('/settings');
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </button>
            
            <button
              className="w-full text-left flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm text-red-600"
              onClick={() => {
                console.log('Logout clicked');
                handleLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 