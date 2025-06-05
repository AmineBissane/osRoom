"use client"

import { useEffect, useState } from "react"
import { ModeToggle } from "./mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Menu, Search, GraduationCap, UserCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { decodeJWT } from "@/lib/jwt"

interface UserProfile {
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

interface Classroom {
  id: number;
  name: string;
  description: string;
  activitiesIds: number[];
}

export function Navbar() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const token = Cookies.get('access_token')
    console.log('Current token:', token)
    if (token) {
      const decoded = decodeJWT(token)
      console.log('Decoded token:', decoded)
      console.log('Token length:', token.length)
      console.log('Token first 20 chars:', token.substring(0, 20))
      console.log('Token type:', typeof token)
      setUserProfile(decoded)
    }
  }, [])

  const handleLogout = () => {
    // Clear all cookies
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('id_token')
    
    // Redirect to login page
    router.push('/login')
  }

  // Get display name in order of preference
  const displayName = userProfile?.name || 
    userProfile?.preferred_username || 
    `${userProfile?.given_name || ''} ${userProfile?.family_name || ''}`.trim() ||
    'Usuario'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="ml-4 md:ml-0 flex items-center gap-2">
          <div className="hidden md:block relative w-8 h-8 bg-primary/10 rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Panel de Estudiante</h1>
            <p className="text-sm text-muted-foreground hidden md:block">Semestre 2024-1</p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex relative max-w-sm w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar clases, tareas..."
                className="w-full pl-10 pr-4 bg-secondary/50"
              />
            </div>
          </div>
          
          <ModeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="flex items-center justify-between p-2 pb-1">
                <p className="font-medium px-2">Notificaciones</p>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Marcar como leídas
                </Button>
              </div>
              <div className="px-1 py-1.5">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium">Nueva tarea asignada</span>
                  </div>
                  <span className="text-sm text-muted-foreground pl-4">Matemáticas Avanzadas - Entrega mañana</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">Calificación publicada</span>
                  </div>
                  <span className="text-sm text-muted-foreground pl-4">Literatura Contemporánea - Ensayo 1</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <UserCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
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
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  console.log('Navigating to profile');
                  window.location.href = '/profile';
                }}
              >
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  console.log('Navigating to settings');
                  window.location.href = '/settings';
                }}
              >
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 