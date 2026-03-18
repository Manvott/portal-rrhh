"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  AlertCircle,
} from "lucide-react";
import {
  formatDate,
  formatFileSize,
  DOCUMENT_CATEGORY_LABELS,
} from "@/lib/utils";
import type { UserRole } from "@/types";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  category: string;
  description: string | null;
  created_at: string;
  is_confidential: boolean;
  employee?: { first_name: string; last_name: string; email: string } | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  documents: Document[];
  userRole: UserRole;
  currentEmployeeId: string | null;
  employees: Employee[] | null;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function DocumentsManager({
  documents: initialDocs,
  userRole,
  currentEmployeeId,
  employees,
}: Props) {
  const [documents, setDocuments] = useState<Document[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    currentEmployeeId ?? ""
  );
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload =
    userRole === "admin" ||
    (userRole === "collaborator" && !!currentEmployeeId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validaciones de seguridad
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(
        "Tipo de archivo no permitido. Solo PDF, Word, JPG, PNG y WebP."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("El archivo no puede superar los 10 MB.");
      return;
    }

    const targetEmployeeId =
      userRole === "admin" ? selectedEmployeeId : currentEmployeeId;

    if (!targetEmployeeId) {
      setUploadError("Selecciona un empleado para adjuntar el documento.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      // Subir archivo a Supabase Storage con nombre seguro
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${targetEmployeeId}/${timestamp}_${safeFileName}`;

      const { error: storageError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) throw storageError;

      // Guardar metadatos en la base de datos
      const { data: newDoc, error: dbError } = await supabase
        .from("documents")
        .insert({
          employee_id: targetEmployeeId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          category,
          description: description || null,
          is_confidential: isConfidential,
        })
        .select(`*, employee:employees(first_name, last_name, email)`)
        .single();

      if (dbError) {
        // Limpiar el archivo subido si falla el registro
        await supabase.storage.from("employee-documents").remove([filePath]);
        throw dbError;
      }

      setDocuments((prev) => [newDoc as Document, ...prev]);
      setDescription("");
      setIsConfidential(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "Documento subido",
        description: `"${file.name}" se ha adjuntado correctamente.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir el documento.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("employee-documents")
        .createSignedUrl(doc.file_path, 60); // URL válida 60 segundos

      if (error) throw error;

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = doc.file_name;
      link.click();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo descargar el documento.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`¿Eliminar "${doc.file_name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const supabase = createClient();

      // Eliminar de storage
      await supabase.storage.from("employee-documents").remove([doc.file_path]);

      // Eliminar de la base de datos
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast({ title: "Documento eliminado" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {userRole === "collaborator" ? "Mis Documentos" : "Gestión de Documentos"}
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          {documents.length} documento{documents.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Subida de documentos */}
      {canUpload && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Adjuntar Documento
          </h2>

          {uploadError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selector de empleado (solo admin) */}
            {userRole === "admin" && employees && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ava-charcoal">
                  Empleado *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                >
                  <option value="">Seleccionar empleado...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.last_name}, {emp.first_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Categoría */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ava-charcoal">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                           focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
              >
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-ava-charcoal">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Nómina enero 2025"
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                           focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
              />
            </div>
          </div>

          {/* Confidencial (solo admin) */}
          {userRole === "admin" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-ava-gray-medium"
              />
              <span className="text-sm text-ava-charcoal">
                Documento confidencial (solo visible para administradores)
              </span>
            </label>
          )}

          {/* Área de subida */}
          <div
            className="border-2 border-dashed border-ava-gray-medium rounded-lg p-8 text-center
                       hover:border-ava-yellow transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-ava-charcoal-light mx-auto mb-2" />
            <p className="text-sm font-medium text-ava-charcoal">
              Haz clic para seleccionar un archivo
            </p>
            <p className="text-xs text-ava-charcoal-light mt-1">
              PDF, Word, JPG, PNG · Máximo 10 MB
            </p>
            {uploading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-ava-charcoal-light">
                <div className="w-4 h-4 border-2 border-ava-yellow border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <File className="w-12 h-12 text-ava-gray-medium mx-auto mb-4" />
            <p className="font-medium text-ava-charcoal">Sin documentos</p>
            <p className="text-sm text-ava-charcoal-light mt-1">
              {canUpload ? "Sube el primer documento." : "No tienes documentos disponibles."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ava-gray-medium">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-ava-gray/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-ava-yellow-light rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-ava-charcoal truncate">
                        {doc.file_name}
                      </p>
                      {doc.is_confidential && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Conf.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ava-charcoal-light">
                      <span>{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</span>
                      <span>·</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>·</span>
                      <span>{formatDate(doc.created_at)}</span>
                      {doc.employee && userRole === "admin" && (
                        <>
                          <span>·</span>
                          <span>{doc.employee.first_name} {doc.employee.last_name}</span>
                        </>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-ava-charcoal-light mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 text-ava-charcoal-light hover:text-ava-charcoal
                               hover:bg-ava-gray rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {userRole === "admin" && (
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-ava-charcoal-light hover:text-red-600
                                 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota RGPD */}
      <p className="text-xs text-ava-charcoal-light">
        Los documentos están almacenados de forma segura y cifrada. Acceso
        restringido según el RGPD (Art. 5.1.f) y la LOPDGDD.
      </p>
    </div>
  );
}
