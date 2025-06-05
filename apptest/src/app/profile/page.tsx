"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCircle, Mail, Phone, GraduationCap, Calendar } from "lucide-react"
import { decodeJWT } from '@/lib/jwt'
import Cookies from 'js-cookie'

interface UserProfile {
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  class?: string;
  phone?: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      const decoded = decodeJWT(token)
      setUserProfile(decoded)
    }
  }, [])

  const displayName = userProfile?.name || 
    userProfile?.preferred_username || 
    `${userProfile?.given_name || ''} ${userProfile?.family_name || ''}`.trim() ||
    'Usuario'

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback>
                  <UserCircle className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-muted-foreground">Estudiante</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile?.phone || 'No phone provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Información Académica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Semestre 2024-1</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>Clase: {userProfile?.class || 'No class assigned'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Email verificado</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  userProfile?.email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userProfile?.email_verified ? 'Verificado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estado de la cuenta</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Activo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 