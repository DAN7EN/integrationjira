"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, FileText, ImageIcon, FileSpreadsheet, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  content: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
}

interface FileUploadProps {
  onFilesProcessed: (files: UploadedFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function FileUpload({
  onFilesProcessed,
  maxFiles = 5,
  acceptedTypes = [".txt", ".md", ".pdf", ".docx", ".csv", ".json"],
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-4 h-4" />
    if (type.includes("text") || type.includes("markdown")) return <FileText className="w-4 h-4" />
    if (type.includes("spreadsheet") || type.includes("csv")) return <FileSpreadsheet className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const processFile = async (file: File): Promise<UploadedFile> => {
    const uploadedFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      content: "",
      status: "uploading",
      progress: 0,
    }

    // Simular progreso de subida
    for (let progress = 0; progress <= 100; progress += 20) {
      uploadedFile.progress = progress
      setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f)))
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    uploadedFile.status = "processing"
    setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "processing" } : f)))

    try {
      // Leer contenido del archivo
      const content = await readFileContent(file)
      uploadedFile.content = content
      uploadedFile.status = "completed"

      setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, content, status: "completed" } : f)))

      return uploadedFile
    } catch (error) {
      uploadedFile.status = "error"
      setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "error" } : f)))
      throw error
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }

      reader.onerror = () => reject(new Error("Error reading file"))

      if (file.type.includes("text") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        reader.readAsText(file)
      } else {
        // Para otros tipos de archivo, simular extracción de texto
        setTimeout(() => {
          resolve(
            `Contenido extraído de ${file.name}:\n\nEste es un ejemplo de contenido extraído del archivo. En una implementación real, aquí se procesaría el contenido específico del tipo de archivo.`,
          )
        }, 1000)
      }
    })
  }

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles).slice(0, maxFiles - files.length)

    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      content: "",
      status: "uploading" as const,
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadedFiles])

    try {
      const processedFiles = await Promise.all(newFiles.map((file) => processFile(file)))

      onFilesProcessed(processedFiles)
    } catch (error) {
      console.error("Error processing files:", error)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Subir Archivos de Contexto</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Soporta: {acceptedTypes.join(", ")} (máximo {maxFiles} archivos)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Archivos subidos:</h4>
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {file.status === "error" ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="h-6 w-6 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Badge
                      variant={
                        file.status === "completed" ? "default" : file.status === "error" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {file.status === "uploading"
                        ? "Subiendo..."
                        : file.status === "processing"
                          ? "Procesando..."
                          : file.status === "completed"
                            ? "Completado"
                            : "Error"}
                    </Badge>
                  </div>

                  {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-2" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {files.some((f) => f.status === "completed") && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Archivos procesados correctamente. La IA utilizará este contexto para mejorar los escenarios.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
