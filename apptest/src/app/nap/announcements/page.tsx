"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Megaphone, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-client"

interface Announcement {
  id: number;
  titulo: string;
  contenido: string;
  fechaPublicacion: string;
  fechaExpiracion?: string;
  autorId: string;
  autorNombre: string;
  importante: boolean;
  categoria: string;
  clasesDestinatarias?: number[];
  usuariosDestinatarios?: string[];
}

interface Classroom {
  id: number;
  name: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    titulo: "",
    contenido: "",
    importante: false,
    categoria: "general",
    clasesDestinatarias: [] as number[],
    fechaExpiracion: ""
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchClassrooms();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.get<Announcement[]>('http://82.29.168.17:8226/api/v1/anuncios/vigentes');
      setAnnouncements(data);
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const data = await api.get<Classroom[]>('http://82.29.168.17:8226/api/v1/classrooms');
      setClassrooms(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      // Create a copy of the announcement data to modify
      const announcementData = {...newAnnouncement};
      
      // Append time to the expiration date if it exists
      if (announcementData.fechaExpiracion) {
        // Add T23:59:59 to make it end of day
        announcementData.fechaExpiracion = `${announcementData.fechaExpiracion}T23:59:59`;
      }
      
      await api.post('http://82.29.168.17:8226/api/v1/anuncios', announcementData);
      toast.success('Anuncio creado correctamente');
      setDialogOpen(false);
      setNewAnnouncement({
        titulo: "",
        contenido: "",
        importante: false,
        categoria: "general",
        clasesDestinatarias: [],
        fechaExpiracion: ""
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await api.delete(`http://82.29.168.17:8226/api/v1/anuncios/${id}`);
      toast.success('Anuncio eliminado correctamente');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const handleClassroomChange = (classId: string) => {
    const id = parseInt(classId);
    setNewAnnouncement(prev => {
      const exists = prev.clasesDestinatarias.includes(id);
      
      if (exists) {
        return {
          ...prev,
          clasesDestinatarias: prev.clasesDestinatarias.filter(c => c !== id)
        };
      } else {
        return {
          ...prev,
          clasesDestinatarias: [...prev.clasesDestinatarias, id]
        };
      }
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Anuncios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Anuncio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Anuncio</DialogTitle>
              <DialogDescription>
                Crea un nuevo anuncio para informar a los estudiantes y profesores.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newAnnouncement.titulo}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, titulo: e.target.value})}
                  placeholder="Título del anuncio"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={newAnnouncement.contenido}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, contenido: e.target.value})}
                  placeholder="Contenido del anuncio"
                  rows={5}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select 
                  value={newAnnouncement.categoria}
                  onValueChange={(value) => setNewAnnouncement({...newAnnouncement, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="importante">Importante</SelectItem>
                    <SelectItem value="academico">Académico</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiration">Fecha de Expiración (opcional)</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={newAnnouncement.fechaExpiracion}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, fechaExpiracion: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="important" 
                  checked={newAnnouncement.importante}
                  onCheckedChange={(checked: boolean) => 
                    setNewAnnouncement({...newAnnouncement, importante: checked})
                  }
                />
                <Label htmlFor="important">Marcar como importante</Label>
              </div>
              <div className="grid gap-2">
                <Label>Clases destinatarias (opcional)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {classrooms.map((classroom) => (
                    <div key={classroom.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`class-${classroom.id}`} 
                        checked={newAnnouncement.clasesDestinatarias.includes(classroom.id)}
                        onCheckedChange={() => handleClassroomChange(classroom.id.toString())}
                      />
                      <Label htmlFor={`class-${classroom.id}`}>{classroom.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateAnnouncement}>Publicar Anuncio</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.importante ? "border-red-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      {announcement.titulo}
                    </CardTitle>
                    <CardDescription>
                      Por {announcement.autorNombre} • {formatDate(announcement.fechaPublicacion)}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline">{announcement.categoria}</Badge>
                  {announcement.importante && (
                    <Badge variant="destructive">Importante</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{announcement.contenido}</p>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {announcement.fechaExpiracion && (
                  <p>Expira: {formatDate(announcement.fechaExpiracion)}</p>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No hay anuncios disponibles</h3>
          <p className="text-muted-foreground mt-2">
            No hay anuncios activos en este momento.
          </p>
        </div>
      )}
    </div>
  );
} 