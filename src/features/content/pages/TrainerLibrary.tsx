import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  FileText, 
  Video, 
  File, 
  UploadCloud, 
  Download, 
  Trash2, 
  Search, 
  TriangleAlert, 
  Info 
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";

interface LibraryMaterial {
  id: string;
  title: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedById: string;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
}

export function TrainerLibrary() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [materialToDelete, setMaterialToDelete] = useState<LibraryMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTrainerOrAdmin = user?.roles.some(
    (role) => role === "Trainer" || role === "Admin"
  );

  // Sync materials from Firestore
  useEffect(() => {
    const q = query(collection(db, "trainer_library"), orderBy("uploadedAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: LibraryMaterial[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as LibraryMaterial);
        });
        setMaterials(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error reading trainer library:", err);
        setError("Could not load library materials.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Format File Size
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Get File Icon
  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) {
      return <Video className="h-6 w-6 text-purple-500" />;
    }
    if (type === "application/pdf" || type.includes("presentation") || type.includes("powerpoint")) {
      return <FileText className="h-6 w-6 text-rose-500" />;
    }
    return <File className="h-6 w-6 text-neutral-400" />;
  };

  // Handle Drag / Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!customTitle) {
        setCustomTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!customTitle) {
        setCustomTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
      }
    }
  };

  // Upload Action
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !customTitle.trim()) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const storagePath = `trainer_materials/${Date.now()}_${selectedFile.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(progress);
      },
      (err) => {
        console.error("Storage upload failed:", err);
        setError("File upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, "trainer_library"), {
            title: customTitle.trim(),
            fileUrl: downloadUrl,
            uploadedBy: user?.fullName || "Trainer",
            uploadedById: user?.id || "",
            uploadedAt: new Date().toISOString(),
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            storagePath: storagePath
          });

          // Reset upload form
          setSelectedFile(null);
          setCustomTitle("");
          setUploading(false);
        } catch (dbErr) {
          console.error("Failed to record document metadata:", dbErr);
          setError("Failed to record material information.");
          setUploading(false);
        }
      }
    );
  };

  // Delete Action
  const handleDelete = async () => {
    if (!materialToDelete) return;
    setDeleting(true);
    setError(null);

    try {
      // 1. Delete object from Storage if path exists
      if (materialToDelete.storagePath) {
        const storageRef = ref(storage, materialToDelete.storagePath);
        await deleteObject(storageRef).catch((e) => {
          console.warn("Storage object might already be deleted:", e);
        });
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, "trainer_library", materialToDelete.id));
      setMaterialToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete the library resource.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter Materials
  const filteredMaterials = materials.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Trainer Library</h1>
          <p className="mt-1 text-muted-foreground">
            Access recorded presentations, lecture video files, and study notes uploaded by academic experts.
          </p>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        {isTrainerOrAdmin && (
          <Card className="border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Materials
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div 
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer" }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                {selectedFile ? (
                  <div className="text-sm font-medium text-foreground">
                    Selected file: <span className="text-primary">{selectedFile.name}</span> ({formatBytes(selectedFile.size)})
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Drag & drop your files here, or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports PDF, MP4, PPTX, DocX, and ZIP archives</p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-medium">Display Title</label>
                    <Input 
                      value={customTitle} 
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Weather Forecasting Module 1"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    isLoading={uploading}
                    disabled={uploading}
                  >
                    Upload File
                  </Button>
                </div>
              )}

              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </Card>
        )}

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, filename, or trainer name..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Library Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-32 rounded-xl border border-border bg-card p-4 animate-pulse flex flex-col justify-between" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center bg-card">
            <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-medium">No materials available</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try refining your search terms." : "Materials uploaded by trainers will show up here."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      {getFileIcon(item.fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5" title={item.fileName}>
                        {item.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-[11px] text-muted-foreground">
                    <div>
                      <span className="block font-medium text-foreground">File Size</span>
                      {formatBytes(item.fileSize)}
                    </div>
                    <div>
                      <span className="block font-medium text-foreground">Uploaded By</span>
                      {item.uploadedBy}
                    </div>
                    <div className="col-span-2">
                      <span className="block font-medium text-foreground">Uploaded On</span>
                      {new Date(item.uploadedAt).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                  {isTrainerOrAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setMaterialToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(item.fileUrl, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={materialToDelete !== null}
        onClose={() => setMaterialToDelete(null)}
        title="Remove this library material?"
        className="max-w-md"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{materialToDelete?.title}</span>? This file will be permanently removed from storage and database.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setMaterialToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={deleting}
          >
            Delete Permanent
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}

// Ensure Card is simulated or standard styles are used
function Card({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>
      {children}
    </div>
  );
}
