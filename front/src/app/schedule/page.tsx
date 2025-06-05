"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { scheduleApi, Schedule as ScheduleType } from "@/lib/api"
import { toast } from "sonner"

// Types for our schedule data
interface ScheduleClass {
  id: string
  className: string
  teacher: string
  room: string
  dayOfWeek: number // 1-5 (Monday to Friday)
  startTime: string
  endTime: string
  color: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minutes = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minutes}`
})

// Mock data - This would come from your Spring Boot backend
const mockSchedule: ScheduleClass[] = [
  {
    id: "1",
    className: "Matemáticas Avanzadas",
    teacher: "Juan Pérez",
    room: "A-101",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:30",
    color: "bg-blue-500"
  },
  {
    id: "2",
    className: "Literatura Contemporánea",
    teacher: "María García",
    room: "B-203",
    dayOfWeek: 2,
    startTime: "10:00",
    endTime: "11:30",
    color: "bg-purple-500"
  },
  {
    id: "3",
    className: "Física Cuántica",
    teacher: "Carlos Rodríguez",
    room: "C-105",
    dayOfWeek: 3,
    startTime: "13:00",
    endTime: "14:30",
    color: "bg-amber-500"
  },
]

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleClass[]>(mockSchedule)
  const [selectedPeriod, setSelectedPeriod] = useState("2024-1")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        // Uncomment this when your backend is ready
        // const data = await scheduleApi.getSchedule(selectedPeriod)
        // setSchedule(data)
        
        // For now, just use mock data
        setSchedule(mockSchedule)
      } catch (error) {
        console.error('Error fetching schedule:', error)
        toast.error('Error al cargar el horario')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [selectedPeriod])

  const getClassForTimeSlot = (day: number, time: string) => {
    return schedule.find(cls => 
      cls.dayOfWeek === day + 1 && 
      cls.startTime <= time && 
      cls.endTime > time
    )
  }

  return (
    <div className="flex-1 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horario de Clases</h1>
          <p className="text-muted-foreground">
            Organiza tu semana académica
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-1">2024-1</SelectItem>
            <SelectItem value="2024-2">2024-2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Semana Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {/* Time column */}
            <div className="space-y-4">
              <div className="h-12"></div> {/* Header spacing */}
              {timeSlots.map((time) => (
                <div key={time} className="h-12 flex items-center justify-end pr-4 text-sm text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {daysOfWeek.map((day, dayIndex) => (
              <div key={day} className="space-y-4">
                <div className="h-12 flex items-center justify-center font-semibold">
                  {day}
                </div>
                {timeSlots.map((time, timeIndex) => {
                  const classItem = getClassForTimeSlot(dayIndex, time)
                  const isStart = classItem?.startTime === time
                  
                  if (isStart) {
                    const duration = timeSlots.indexOf(classItem.endTime) - timeSlots.indexOf(time)
                    return (
                      <div
                        key={`${day}-${time}`}
                        className={cn(
                          "h-12 rounded-lg p-2 text-white",
                          classItem.color,
                          "relative group cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 hover:ring-black/10"
                        )}
                        style={{ 
                          height: `${duration * 48}px`,
                          marginBottom: `${(duration - 1) * 16}px`
                        }}
                      >
                        <div className="flex flex-col h-full">
                          <p className="font-medium text-sm">{classItem.className}</p>
                          <div className="mt-1 text-xs space-y-1 text-white/90">
                            <p className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {classItem.teacher}
                            </p>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {classItem.room}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {classItem.startTime} - {classItem.endTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return classItem ? null : (
                    <div
                      key={`${day}-${time}`}
                      className="h-12 border border-dashed rounded-lg border-gray-200"
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resumen de Horario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4">
                  <div className={cn("w-2 h-12 rounded-full", cls.color)} />
                  <div>
                    <p className="font-medium">{cls.className}</p>
                    <p className="text-sm text-muted-foreground">
                      {daysOfWeek[cls.dayOfWeek - 1]} • {cls.startTime} - {cls.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(new Set(schedule.map(cls => cls.room))).map((room) => (
                <div key={room} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sala {room}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.filter(cls => cls.room === room).map(cls => cls.className).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 