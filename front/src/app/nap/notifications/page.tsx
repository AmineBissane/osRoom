"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Bell, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
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

interface Notification {
  id: number;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  autorId: string;
  autorNombre: string;
  leida: boolean;
  destinatarioId: string;
  destinatarioNombre?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newNotification, setNewNotification] = useState({
    titulo: "",
    contenido: "",
    destinatarioId: ""
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get<Notification[]>('http://localhost:8226/api/v1/notificaciones');
      setNotifications(data);
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>('http://localhost:8226/api/v1/users');
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      await api.post('http://localhost:8226/api/v1/notificaciones', newNotification);
      toast.success('Notificación enviada correctamente');
      setDialogOpen(false);
      setNewNotification({
        titulo: "",
        contenido: "",
        destinatarioId: ""
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.delete(`http://localhost:8226/api/v1/notificaciones/${id}`);
      toast.success('Notificación eliminada correctamente');
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`http://localhost:8226/api/v1/notificaciones/${id}/leer`, {});
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, leida: true } : notification
      ));
      toast.success('Notificación marcada como leída');
    } catch (error) {
      console.error('Error:', error);
      // El mensaje de error ya es manejado por el cliente API
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Notificación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Enviar Nueva Notificación</DialogTitle>
              <DialogDescription>
                Envía una notificación personalizada a un usuario específico.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient">Destinatario</Label>
                <Select 
                  value={newNotification.destinatarioId}
                  onValueChange={(value) => setNewNotification({...newNotification, destinatarioId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un destinatario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newNotification.titulo}
                  onChange={(e) => setNewNotification({...newNotification, titulo: e.target.value})}
                  placeholder="Título de la notificación"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={newNotification.contenido}
                  onChange={(e) => setNewNotification({...newNotification, contenido: e.target.value})}
                  placeholder="Contenido de la notificación"
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateNotification}>Enviar Notificación</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.leida ? "border-blue-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      {notification.titulo}
                    </CardTitle>
                    <CardDescription>
                      De {notification.autorNombre} • {formatDate(notification.fechaCreacion)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!notification.leida && (
                      <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)}>
                        Marcar como leída
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(notification.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {notification.leida ? (
                    <Badge variant="outline">Leída</Badge>
                  ) : (
                    <Badge>No leída</Badge>
                  )}
                  {notification.destinatarioNombre && (
                    <Badge variant="secondary">Para: {notification.destinatarioNombre}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{notification.contenido}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No hay notificaciones</h3>
          <p className="text-muted-foreground mt-2">
            No tienes notificaciones en este momento.
          </p>
        </div>
      )}
    </div>
  );
} 