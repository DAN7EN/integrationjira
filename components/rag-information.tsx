"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Database,
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  FileText,
  Code,
  Users,
  Settings,
  Brain,
  Tag,
  Calendar,
} from "lucide-react"

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: "business-rules" | "technical-specs" | "user-personas" | "templates" | "examples" | "glossary"
  tags: string[]
  createdAt: string
  updatedAt: string
  usage: number
}

interface RAGInformationProps {
  onKnowledgeUpdate: (knowledge: KnowledgeItem[]) => void
}

export function RAGInformation({ onKnowledgeUpdate }: RAGInformationProps) {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([
    {
      id: "1",
      title: "Reglas de Autenticación",
      content: `Las reglas de autenticación del sistema incluyen:
- Máximo 5 intentos de login fallidos antes del bloqueo
- Bloqueo temporal de 15 minutos
- Contraseñas deben tener mínimo 8 caracteres
- Sesiones expiran después de 2 horas de inactividad
- Soporte para autenticación de dos factores (2FA)`,
      category: "business-rules",
      tags: ["autenticación", "seguridad", "login"],
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      usage: 15,
    },
    {
      id: "2",
      title: "Persona: Usuario Administrador",
      content: `Perfil del Usuario Administrador:
- Nombre: María González
- Rol: Administradora de Sistema
- Experiencia: 5+ años en administración de sistemas
- Objetivos: Gestionar usuarios, configurar permisos, monitorear sistema
- Frustraciones: Interfaces complejas, falta de reportes claros
- Comportamiento: Prefiere atajos de teclado, usa múltiples pestañas`,
      category: "user-personas",
      tags: ["administrador", "usuario", "perfil"],
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
      usage: 8,
    },
    {
      id: "3",
      title: "Plantilla de Escenario de Error",
      content: `Plantilla estándar para escenarios de manejo de errores:

Escenario: [Descripción del error]
  Dado que [contexto inicial]
  Y que [condiciones específicas]
  Cuando [acción que causa el error]
  Entonces debo ver el mensaje "[mensaje específico]"
  Y [comportamiento esperado del sistema]
  Y [acciones de recuperación disponibles]`,
      category: "templates",
      tags: ["plantilla", "errores", "gherkin"],
      createdAt: "2024-01-12",
      updatedAt: "2024-01-19",
      usage: 22,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)

  const [newItem, setNewItem] = useState({
    title: "",
    content: "",
    category: "business-rules" as KnowledgeItem["category"],
    tags: "",
  })

  const categories = {
    "business-rules": { label: "Reglas de Negocio", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
    "technical-specs": { label: "Especificaciones Técnicas", icon: Code, color: "bg-green-100 text-green-800" },
    "user-personas": { label: "Personas de Usuario", icon: Users, color: "bg-purple-100 text-purple-800" },
    templates: { label: "Plantillas", icon: FileText, color: "bg-orange-100 text-orange-800" },
    examples: { label: "Ejemplos", icon: Settings, color: "bg-yellow-100 text-yellow-800" },
    glossary: { label: "Glosario", icon: Tag, color: "bg-pink-100 text-pink-800" },
  }

  const filteredKnowledge = knowledge.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleAddItem = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) return

    const item: KnowledgeItem = {
      id: Date.now().toString(),
      title: newItem.title,
      content: newItem.content,
      category: newItem.category,
      tags: newItem.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      usage: 0,
    }

    const updatedKnowledge = [...knowledge, item]
    setKnowledge(updatedKnowledge)
    onKnowledgeUpdate(updatedKnowledge)

    setNewItem({ title: "", content: "", category: "business-rules", tags: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item)
    setNewItem({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.join(", "),
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateItem = () => {
    if (!editingItem || !newItem.title.trim() || !newItem.content.trim()) return

    const updatedKnowledge = knowledge.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            title: newItem.title,
            content: newItem.content,
            category: newItem.category,
            tags: newItem.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            updatedAt: new Date().toISOString().split("T")[0],
          }
        : item,
    )

    setKnowledge(updatedKnowledge)
    onKnowledgeUpdate(updatedKnowledge)

    setEditingItem(null)
    setNewItem({ title: "", content: "", category: "business-rules", tags: "" })
    setIsAddDialogOpen(false)
  }

  const handleDeleteItem = (id: string) => {
    const updatedKnowledge = knowledge.filter((item) => item.id !== id)
    setKnowledge(updatedKnowledge)
    onKnowledgeUpdate(updatedKnowledge)
  }

  const getCategoryStats = () => {
    const stats = Object.keys(categories).map((category) => ({
      category,
      count: knowledge.filter((item) => item.category === category).length,
    }))
    return stats
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">RAG de Información</h2>
            <p className="text-muted-foreground">Base de conocimiento para alimentar la IA</p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Conocimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Agregar"} Conocimiento</DialogTitle>
              <DialogDescription>
                {editingItem ? "Modifica" : "Agrega"} información que la IA utilizará para generar mejores sugerencias.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ej: Reglas de validación de formularios"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value as KnowledgeItem["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  placeholder="Describe el conocimiento que quieres agregar..."
                  rows={8}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags (separados por comas)</label>
                <Input
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  placeholder="Ej: autenticación, seguridad, login"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingItem ? handleUpdateItem : handleAddItem}>
                  {editingItem ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {getCategoryStats().map(({ category, count }) => {
          const categoryInfo = categories[category as keyof typeof categories]
          const Icon = categoryInfo.icon
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{categoryInfo.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la base de conocimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categories).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Knowledge Items */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Vista de Tarjetas</TabsTrigger>
          <TabsTrigger value="list">Vista de Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledge.map((item) => {
              const categoryInfo = categories[item.category]
              const Icon = categoryInfo.icon
              return (
                <Card key={item.id} className="relative group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{item.content}</p>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.updatedAt}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Brain className="w-3 h-3" />
                          <span>{item.usage} usos</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {filteredKnowledge.map((item, index) => {
                  const categoryInfo = categories[item.category]
                  const Icon = categoryInfo.icon
                  return (
                    <div key={item.id}>
                      <div className="p-4 hover:bg-muted/50 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                              <h3 className="font-medium">{item.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.content}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Actualizado: {item.updatedAt}</span>
                              <span>{item.usage} usos</span>
                              <div className="flex space-x-1">
                                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && <span>+{item.tags.length - 3}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < filteredKnowledge.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredKnowledge.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontró conocimiento</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando información para alimentar la IA"}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Conocimiento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
