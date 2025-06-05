import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ClassCardProps {
  id: string
  name: string
  teacher: string
  subject: string
  totalStudents: number
  coverImage?: string
}

export function ClassCard({ id, name, teacher, subject, totalStudents, coverImage }: ClassCardProps) {
  return (
    <Link href={`/class/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg h-[280px]">
        {coverImage && (
          <div 
            className="h-24 bg-cover bg-center" 
            style={{ backgroundImage: `url(${coverImage})` }}
          />
        )}
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{subject}</p>
            <p className="text-sm text-muted-foreground">Prof. {teacher}</p>
            <Badge variant="secondary" className="mt-2">
              {totalStudents} estudiantes
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
} 