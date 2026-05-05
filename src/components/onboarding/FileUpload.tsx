import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Upload, X } from "lucide-react";

const BUCKET = "therapist-files";

interface FileUploadProps {
  therapistId: string;
  documentType: string;
  title: string;
  folder: string;
  accept?: string;
  maxSizeMB?: number;
  onChanged?: (uploaded: boolean) => void;
}

interface ExistingDoc {
  id: string;
  file_url: string;
  title: string;
}

const FileUpload = ({
  therapistId,
  documentType,
  title,
  folder,
  accept = "application/pdf,image/*",
  maxSizeMB = 10,
  onChanged,
}: FileUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState<ExistingDoc | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("therapist_documents")
        .select("id, file_url, title")
        .eq("therapist_id", therapistId)
        .eq("document_type", documentType)
        .maybeSingle();

      if (error) {
        toast({ title: "Error al consultar archivo", description: error.message, variant: "destructive" });
      } else {
        setExisting(data);
      }
      setLoading(false);
    };
    load();
  }, [therapistId, documentType, toast]);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: `El máximo es ${maxSizeMB} MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const filename = `${documentType}-${Date.now()}.${ext}`;
      const path = `${therapistId}/${folder}/${filename}`;

      // If a previous file exists at a different path, remove it first to avoid orphans.
      if (existing?.file_url && existing.file_url !== path) {
        await supabase.storage.from(BUCKET).remove([existing.file_url]);
      }

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      if (existing) {
        const { error: updateErr } = await supabase
          .from("therapist_documents")
          .update({ file_url: path, title })
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
        setExisting({ ...existing, file_url: path });
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("therapist_documents")
          .insert({
            therapist_id: therapistId,
            document_type: documentType,
            title,
            file_url: path,
          })
          .select("id, file_url, title")
          .single();
        if (insertErr) throw insertErr;
        setExisting(inserted);
      }

      onChanged?.(true);
      toast({ title: "Archivo subido" });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!existing) return;
    setUploading(true);
    try {
      await supabase.storage.from(BUCKET).remove([existing.file_url]);
      const { error } = await supabase
        .from("therapist_documents")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      setExisting(null);
      onChanged?.(false);
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {existing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm">
              {existing.file_url.split("/").pop()}
            </span>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reemplazar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Eliminar archivo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Subir archivo
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
