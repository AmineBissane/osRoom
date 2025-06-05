"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Book, 
  GraduationCap, 
  Users, 
  Calendar, 
  FileText, 
  Bell, 
  Megaphone, 
  Award, 
  ClipboardCheck 
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { decodeJWT } from "@/lib/jwt"
import Cookies from "js-cookie"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface UserProfile {
  realm_access?: {
    roles: string[];
  };
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [napOpen, setNapOpen] = useState(false)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      const decoded = decodeJWT(token) as UserProfile
      setIsAdmin(decoded?.realm_access?.roles.includes('admin') || false)
      setIsTeacher(decoded?.realm_access?.roles.includes('teacher') || false)
    }
  }, [])

  return (
    <div className={cn("pb-12 h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Panel de Control</h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/">
                <GraduationCap className="mr-2 h-4 w-4" />
                Inicio
              </Link>
            </Button>
            <Button
              variant={pathname === "/courses" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/courses">
                <Book className="mr-2 h-4 w-4" />
                Cursos
              </Link>
            </Button>
            <Button
              variant={pathname === "/calendar" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendario
              </Link>
            </Button>
            <Button
              variant={pathname === "/assignments" ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link href="/assignments">
                <FileText className="mr-2 h-4 w-4" />
                Tareas
              </Link>
            </Button>
            
            {/* Sección de Gestión NAP */}
            {(isAdmin || isTeacher) && (
              <Collapsible
                open={napOpen}
                onOpenChange={setNapOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      <span>Gestión NAP</span>
                    </div>
                    <span className={`transform transition-transform ${napOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  <Button
                    variant={pathname === "/nap/notifications" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/nap/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notificaciones
                    </Link>
                  </Button>
                  <Button
                    variant={pathname === "/nap/announcements" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/nap/announcements">
                      <Megaphone className="mr-2 h-4 w-4" />
                      Anuncios
                    </Link>
                  </Button>
                  <Button
                    variant={pathname === "/nap/grades" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/nap/grades">
                      <Award className="mr-2 h-4 w-4" />
                      Calificaciones
                    </Link>
                  </Button>
                  <Button
                    variant={pathname === "/nap/attendance" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/nap/attendance">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Asistencia
                    </Link>
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {isAdmin && (
              <Button
                variant={pathname === "/admin/users" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Usuarios
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 