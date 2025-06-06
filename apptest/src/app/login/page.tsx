"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authenticateWithKeycloak } from "@/lib/auth"
import Cookies from 'js-cookie'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  // Check if already logged in
  useEffect(() => {
    const accessToken = Cookies.get('access_token')
    if (accessToken) {
      const fromPath = searchParams.get('from')
      const redirectPath = fromPath || '/'
      window.location.href = redirectPath
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tokens = await authenticateWithKeycloak(formData.username, formData.password)
      
      // Log token details before setting cookies
      console.log('Received token length:', tokens.access_token.length)
      console.log('Token format check:', {
        hasBearer: tokens.access_token.startsWith('Bearer '),
        firstChars: tokens.access_token.substring(0, 20)
      })
      
      // Store tokens in cookies with proper settings for middleware access
      // Remove secure:true for development environment
      document.cookie = `access_token=${tokens.access_token}; path=/; sameSite=lax; max-age=3600`
      document.cookie = `refresh_token=${tokens.refresh_token}; path=/; sameSite=lax; max-age=86400`
      document.cookie = `id_token=${tokens.id_token}; path=/; sameSite=lax; max-age=3600`
      
      // Also set with js-cookie as backup
      Cookies.set('access_token', tokens.access_token, { path: '/', sameSite: 'lax' })
      Cookies.set('refresh_token', tokens.refresh_token, { path: '/', sameSite: 'lax' })
      Cookies.set('id_token', tokens.id_token, { path: '/', sameSite: 'lax' })
      
      // Add a small delay to ensure cookies are set before redirect
      setTimeout(() => {
        toast.success("Login successful")
  
        // Get the redirect destination from the URL params or default to home
        const fromPath = searchParams.get('from')
        const redirectPath = fromPath || '/'
        
        console.log('Redirecting to:', redirectPath)
        
        // Do a full page refresh to the redirect path
        window.location.href = redirectPath
      }, 500)
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Invalid username or password")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 