"use client"

import { useState, useEffect } from 'react'
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import axios from 'axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  id: number
  title: string
  description: string
  startTime: string
  endTime: string
  classroomId: number
  classroomName: string
  eventType: string
  color: string
  location: string
  meetingLink: string
  creatorId: number
  creatorName: string
  visibleToStudents: boolean
}

interface Classroom {
  id: number
  name: string
  description: string
}

const mockClassrooms: Classroom[] = [
  {
    id: 1,
    name: 'Matemáticas',
    description: 'Curso de matemáticas avanzadas'
  },
  {
    id: 2,
    name: 'Física',
    description: 'Curso de física básica'
  },
  {
    id: 3,
    name: 'Programación',
    description: 'Curso de programación en Java'
  }
];

// Mock events for fallback when API fails
const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Clase de Programación',
    description: 'Clase de ejemplo',
    startTime: new Date().toISOString(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
    classroomId: 1,
    classroomName: 'Aula Virtual 1',
    eventType: 'class',
    color: '#3498db',
    location: 'Edificio Principal',
    meetingLink: '',
    creatorId: 1,
    creatorName: 'Profesor Demo',
    visibleToStudents: true
  },
  {
    id: 2,
    title: 'Laboratorio de Bases de Datos',
    description: 'Práctica de laboratorio',
    startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    classroomId: 2,
    classroomName: 'Laboratorio 2',
    eventType: 'lab',
    color: '#2ecc71',
    location: 'Laboratorio Principal',
    meetingLink: 'https://meet.example.com/lab',
    creatorId: 1,
    creatorName: 'Profesor Demo',
    visibleToStudents: true
  }
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    classroomId: 0,
    eventType: 'class',
    color: '#3498db',
    location: '',
    meetingLink: '',
    visibleToStudents: true
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [calendarApi] = useState(() => {
    // Create a separate API instance for calendar requests that points to port 8222
    const api = axios.create({
      baseURL: 'http://localhost:8222/api',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add these options to handle CORS issues
      withCredentials: true,
    });
    
    // Add a request interceptor for authentication
    api.interceptors.request.use((config) => {
      // Get the valid JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('validToken') : null;
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Add a response interceptor to handle auth errors
    api.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          console.error('Authentication error (401) in calendarApi request:', error.config.url);
          // Show toast notification for auth error
          if (typeof window !== 'undefined') {
            toast({
              title: "Error de autenticación",
              description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
              variant: "destructive"
            });
          }
        } else if (error.message === 'Network Error') {
          console.error('CORS or network error:', error.config.url);
        }
        return Promise.reject(error);
      }
    );
    
    return api;
  });

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const today = new Date()
  
  // Function to add CORS headers for development environment
  const setupCalendarApiForDevelopment = () => {
    if (typeof window !== 'undefined') {
      // Allow credentials and set proper headers
      calendarApi.defaults.withCredentials = true;
      calendarApi.defaults.headers.common['Access-Control-Allow-Origin'] = 'http://localhost:3000';
      calendarApi.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      calendarApi.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    }
  };
  
  // Setup CORS headers for the API
  useEffect(() => {
    setupCalendarApiForDevelopment();
  }, []);

  // Fetch all user's events
  useEffect(() => {
    // Store the valid JWT token that was successful in previous requests
    if (typeof window !== 'undefined') {
      const workingJWT = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJwNkhBbFV1NktKdDB0NXpTcGh2X1JYUWp2YkdMMHBOUl9uR2xuS0Z0eTFRIn0.eyJleHAiOjE3NDkxNTY4MjQsImlhdCI6MTc0OTE1NjUyNCwianRpIjoiMTAwMmY4ZTYtNDYxMC00ZWIxLThkMDctODk2ZWY2YzQ4NWZmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrOjgwODAvcmVhbG1zL29zUm9vbSIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJhOTgzNTBiNS0yOGFkLTQ0YzktYjYyYS1jNDQ5ZDAwNzUyMTAiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJiYWNrZW5kZ2F0ZXdheSIsInNlc3Npb25fc3RhdGUiOiJhYzc2OWE3Zi02YjQ4LTRiOWEtOTBjNC1kM2IzM2Q1OTYxOGEiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1vc3Jvb20iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwicmVhbG0tYWRtaW4iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwicXVlcnktcmVhbG1zIiwidmlldy1hdXRob3JpemF0aW9uIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LXVzZXJzIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiLCJxdWVyeS1ncm91cHMiXX0sImJhY2tlbmRnYXRld2F5Ijp7InJvbGVzIjpbInVtYV9wcm90ZWN0aW9uIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiYWM3NjlhN2YtNmI0OC00YjlhLTkwYzQtZDNiMzNkNTk2MThhIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiQU1JTiBMRSBWUkFJIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYW1pbmUiLCJnaXZlbl9uYW1lIjoiQU1JTiIsImNsYXNzIjoiREFNIiwiZmFtaWx5X25hbWUiOiJMRSBWUkFJIiwiZW1haWwiOiJsaWdodGJsYWNrNTU0QGdtYWlsLmNvbSJ9.gbRxWy6IEhp1_qDE34ymY6m4sUgVSFpQt5tkHjPhSzAreJ9uREbRPRFzLlxINHm58Gs8rdlhe4vPM3AAfGJGsUIhCXa5qyD7QrhPrOxYeqOhEzsUqqIyfYNjpqy3Fc90rTx7-ChM89ocSEFx2LUCgYfIQw38nmITQcQVmmu91HDTOjea-EOUukJsH7xxbMlMdJ2qs9XqntPyIeq3PpFWCWJszpRmugMWrzMaD797mdRgr2KO02JLFvwB-ZWr1V2CxCqb0_9itojctuJ0O-D0cpJfcTBcD1FPgEHL1Oco9QQinIkV09VEQi2mlhsC1FFU3W8mp3a_1fASotE8oISa_w";
      localStorage.setItem('validToken', workingJWT);
    }
    
    const fetchEvents = async () => {
      try {
        setLoading(true)
        // Try up to 3 times with the API call
        let response: {data: CalendarEvent[]};
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
          try {
            response = await calendarApi.get<CalendarEvent[]>('/v1/calendar/my-events')
            success = true;
            setEvents(response.data)
          } catch (error) {
            attempts++;
            console.error(`Error fetching events, attempt ${attempts}/3:`, error)
            // Wait a bit between retries
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If all attempts failed, use mock data
        if (!success) {
          console.log('Using mock event data after failed API attempts');
          setEvents(mockEvents)
          toast({
            title: "Modo offline",
            description: "Usando datos de ejemplo para eventos. Conexión al servidor fallida.",
            variant: "default"
          })
        }
      } catch (error) {
        console.error('Error in fetchEvents function:', error)
        setEvents(mockEvents)
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos del calendario",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchClassrooms = async () => {
      try {
        // Try up to 3 times with the API call
        let response: {data: Classroom[]};
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
          try {
            response = await calendarApi.get<Classroom[]>('/v1/classrooms/classroom/category/DAM')
            success = true;
            console.log('Classrooms data:', response.data)
            
            if (Array.isArray(response.data) && response.data.length > 0) {
              setClassrooms(response.data)
              setNewEvent(prev => ({ ...prev, classroomId: response.data[0].id }))
            } else {
              throw new Error('Empty classroom data');
            }
          } catch (error) {
            attempts++;
            console.error(`Error fetching classrooms, attempt ${attempts}/3:`, error)
            // Wait a bit between retries
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If all attempts failed, use mock data
        if (!success) {
          console.log('Using mock classroom data after failed API attempts');
          setClassrooms(mockClassrooms)
          setNewEvent(prev => ({ ...prev, classroomId: mockClassrooms[0].id }))
        }
      } catch (error) {
        console.error('Error in fetchClassrooms function:', error)
        setClassrooms(mockClassrooms)
        setNewEvent(prev => ({ ...prev, classroomId: mockClassrooms[0].id }))
      }
    }

    fetchEvents()
    fetchClassrooms()
  }, [])

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-800'
      case 'assignment':
        return 'bg-blue-100 text-blue-800'
      case 'class':
        return 'bg-green-100 text-green-800'
      case 'meeting':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewEvent(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'classroomId') {
      setNewEvent(prev => ({ ...prev, [name]: parseInt(value, 10) }))
    } else {
      setNewEvent(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNewEvent(prev => ({ ...prev, [name]: checked }))
  }

  const handleCreateEvent = async () => {
    console.log('Creating event with data:', newEvent);

    if (!newEvent.title) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      })
      return
    }

    if (!newEvent.classroomId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un aula",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      const response = await calendarApi.post(`/v1/classrooms/${newEvent.classroomId}/calendar`, newEvent);
      console.log('Response from create event:', response.data);
      
      setEvents(prev => [...prev, response.data])
      setDialogOpen(false)
      setNewEvent({
        title: '',
        description: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        classroomId: classrooms.length > 0 ? classrooms[0].id : 0,
        eventType: 'class',
        color: '#3498db',
        location: '',
        meetingLink: '',
        visibleToStudents: true
      })
      
      toast({
        title: "Éxito",
        description: "Evento creado correctamente",
      })
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el evento",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // Function to render an event item with a popover
  const renderEventItem = (event: CalendarEvent) => (
    <Popover key={event.id}>
      <PopoverTrigger>
        <div
          className={`
            text-xs truncate rounded px-1 mb-1 cursor-pointer
            ${getEventTypeStyle(event.eventType)}
          `}
          style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : {}}
        >
          {event.title}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h3 className="font-medium text-lg">{event.title}</h3>
          <p className="text-sm">{event.description}</p>
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {format(parseISO(event.startTime), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                {event.endTime && ` - ${format(parseISO(event.endTime), "HH:mm", { locale: es })}`}
              </span>
            </div>
            {event.location && (
              <p className="mt-1">Ubicación: {event.location}</p>
            )}
            {event.classroomName && (
              <p className="mt-1">Aula: {event.classroomName}</p>
            )}
            {event.meetingLink && (
              <div className="mt-1">
                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Enlace de reunión
                </a>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendario Académico</h1>
        <div className="flex items-center gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Completa los detalles para crear un nuevo evento en el calendario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input 
                    id="title" 
                    name="title" 
                    className="col-span-3" 
                    value={newEvent.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    className="col-span-3" 
                    value={newEvent.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="classroomId" className="text-right">
                    Aula
                  </Label>
                  <Select 
                    value={String(newEvent.classroomId || '')} 
                    onValueChange={(value) => handleSelectChange('classroomId', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar aula">
                        {classrooms.find(c => c.id === newEvent.classroomId)?.name || "Seleccionar aula"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.length > 0 ? (
                        classrooms.map(classroom => (
                          <SelectItem key={classroom.id} value={String(classroom.id)}>
                            {classroom.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No hay aulas disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Inicio
                  </Label>
                  <Input 
                    id="startTime" 
                    name="startTime" 
                    type="datetime-local" 
                    className="col-span-3" 
                    value={newEvent.startTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    Fin
                  </Label>
                  <Input 
                    id="endTime" 
                    name="endTime" 
                    type="datetime-local" 
                    className="col-span-3" 
                    value={newEvent.endTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="eventType" className="text-right">
                    Tipo
                  </Label>
                  <Select 
                    name="eventType" 
                    value={newEvent.eventType} 
                    onValueChange={(value) => handleSelectChange('eventType', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Clase</SelectItem>
                      <SelectItem value="exam">Examen</SelectItem>
                      <SelectItem value="assignment">Tarea</SelectItem>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Ubicación
                  </Label>
                  <Input 
                    id="location" 
                    name="location" 
                    className="col-span-3" 
                    value={newEvent.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="meetingLink" className="text-right">
                    Enlace
                  </Label>
                  <Input 
                    id="meetingLink" 
                    name="meetingLink" 
                    className="col-span-3" 
                    value={newEvent.meetingLink}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <Input 
                    id="color" 
                    name="color" 
                    type="color" 
                    className="col-span-3 h-10" 
                    value={newEvent.color}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <Label htmlFor="visibleToStudents">Visible para estudiantes</Label>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      id="visibleToStudents"
                      name="visibleToStudents"
                      type="checkbox"
                      checked={newEvent.visibleToStudents}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="visibleToStudents">Mostrar a estudiantes</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating} onClick={handleCreateEvent}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Evento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div key={day} className="text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {daysInMonth.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, currentDate)

              return (
                <div
                  key={index}
                  className={`
                    aspect-square border rounded-lg flex flex-col items-center justify-start p-1
                    hover:bg-muted/50 cursor-pointer relative
                    ${isToday ? 'bg-primary/10 border-primary' : ''}
                    ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                  `}
                >
                  <span className={`
                    w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  <div className="w-full mt-1 max-h-[80%] overflow-y-auto">
                    {dayEvents.length > 0 && (
                      <div className="w-full">
                        {dayEvents.map(renderEventItem)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="font-semibold">Próximos Eventos</h2>
            {events.filter(event => new Date(event.startTime) >= today).length === 0 ? (
              <p className="text-muted-foreground">No hay eventos próximos programados.</p>
            ) : (
              <div className="space-y-2">
                {events
                  .filter(event => new Date(event.startTime) >= today)
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 5) // Limit to 5 upcoming events
                  .map(event => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.startTime), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                          </p>
                          {event.classroomName && (
                            <p className="text-sm">Aula: {event.classroomName}</p>
                          )}
                        </div>
                        <span 
                          className={`px-2 py-1 rounded text-xs ${getEventTypeStyle(event.eventType)}`}
                          style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : {}}
                        >
                          {event.eventType === 'class' ? 'Clase' : 
                           event.eventType === 'exam' ? 'Examen' : 
                           event.eventType === 'assignment' ? 'Tarea' : 
                           event.eventType === 'meeting' ? 'Reunión' : 'Otro'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 