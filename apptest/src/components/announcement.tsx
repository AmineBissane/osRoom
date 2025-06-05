import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface AnnouncementProps {
  author: {
    name: string
    avatar: string
  }
  content: string
  createdAt: Date
}

export function Announcement({ author, content, createdAt }: AnnouncementProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{author.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  )
} 