"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ModeToggle } from "@/components/mode-toggle"
import { Settings, Languages, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

const languages = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
  { id: "pt", label: "Português" },
]

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] = useState("es")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
    toast.success(`Idioma cambiado a ${languages.find(lang => lang.id === value)?.label}`)
    // Here you would typically update the language in your i18n system
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Tema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Apariencia</Label>
                  <p className="text-sm text-muted-foreground">
                    Personaliza el aspecto de la aplicación
                  </p>
                </div>
                <ModeToggle />
              </div>

              <RadioGroup
                defaultValue={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Sun className="mb-2 h-6 w-6" />
                    Claro
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Moon className="mb-2 h-6 w-6" />
                    Oscuro
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Monitor className="mb-2 h-6 w-6" />
                    Sistema
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Idioma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-0.5">
                <Label>Seleccionar Idioma</Label>
                <p className="text-sm text-muted-foreground">
                  Elige el idioma de la interfaz
                </p>
              </div>
              <RadioGroup
                defaultValue={selectedLanguage}
                onValueChange={handleLanguageChange}
                className="grid gap-2"
              >
                {languages.map((language) => (
                  <div key={language.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={language.id} id={language.id} />
                    <Label htmlFor={language.id}>{language.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Las preferencias de notificaciones se pueden configurar en una futura actualización.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 