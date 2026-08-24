import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  setDoc
} from "firebase/firestore";
import type { PostLinkInput, UploadInput, WallFilters, WallResource, ResourceKind } from "./types";

export const wallKeys = {
  all: ["wall"] as const,
  list: (filters: WallFilters) => [...wallKeys.all, filters] as const,
};

function parseYouTube(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    const id = match[2];
    return {
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    };
  }
  return null;
}

export function useWall(filters: WallFilters) {
  return useQuery({
    queryKey: wallKeys.list(filters),
    queryFn: async () => {
      const q = query(collection(db, "wall_resources"), orderBy("postedAtUtc", "desc"));
      const snap = await getDocs(q);
      const list: WallResource[] = [];

      const currentUserId = auth.currentUser?.uid;
      let currentUserRoles: string[] = [];
      if (currentUserId) {
        const userDoc = await getDoc(doc(db, "users", currentUserId));
        if (userDoc.exists()) {
          currentUserRoles = userDoc.data().roles || [];
        }
      }

      const isAdminOrTrainer = currentUserRoles.includes("Admin") || currentUserRoles.includes("Trainer");

      snap.forEach((d) => {
        const data = d.data();
        
        // Filter by courseId
        if (filters.courseId && data.courseId !== filters.courseId) return;

        // Filter by kind
        if (filters.kind && data.kind !== filters.kind) return;

        // Filter by search
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const titleMatches = data.title?.toLowerCase().includes(searchLower);
          const descMatches = data.description?.toLowerCase().includes(searchLower);
          const nameMatches = data.postedByName?.toLowerCase().includes(searchLower);
          if (!titleMatches && !descMatches && !nameMatches) return;
        }

        const canManage = isAdminOrTrainer || data.postedById === currentUserId;

        list.push({
          id: d.id,
          title: data.title || "",
          description: data.description || null,
          kind: data.kind || "Link",
          url: data.url || null,
          fileUrl: data.fileUrl || null,
          originalFileName: data.originalFileName || null,
          sizeBytes: data.sizeBytes || null,
          thumbnailUrl: data.thumbnailUrl || null,
          embedUrl: data.embedUrl || null,
          courseId: data.courseId || null,
          courseTitle: data.courseTitle || null,
          postedById: data.postedById || "",
          postedByName: data.postedByName || "Anonymous",
          postedByAvatarUrl: data.postedByAvatarUrl || null,
          postedAtUtc: data.postedAtUtc || new Date().toISOString(),
          canManage,
        });
      });

      return list;
    },
    staleTime: 15_000,
  });
}

export function usePostLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PostLinkInput) => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error("Not authenticated");

      const userDoc = await getDoc(doc(db, "users", currentUserId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      let courseTitle = null;
      if (input.courseId) {
        const courseDoc = await getDoc(doc(db, "courses", input.courseId));
        if (courseDoc.exists()) {
          courseTitle = courseDoc.data().title;
        }
      }

      let kind: ResourceKind = "Link";
      let embedUrl = null;
      let thumbnailUrl = null;

      const yt = parseYouTube(input.url);
      if (yt) {
        kind = "YouTube";
        embedUrl = yt.embedUrl;
        thumbnailUrl = yt.thumbnailUrl;
      } else if (input.url.toLowerCase().endsWith(".pdf")) {
        kind = "Pdf";
      }

      const docRef = doc(collection(db, "wall_resources"));
      const postData = {
        title: input.title,
        description: input.description || null,
        kind,
        url: input.url,
        fileUrl: null,
        originalFileName: null,
        sizeBytes: null,
        thumbnailUrl,
        embedUrl,
        courseId: input.courseId || null,
        courseTitle,
        postedById: currentUserId,
        postedByName: userData.fullName || "Trainer",
        postedByAvatarUrl: null,
        postedAtUtc: new Date().toISOString(),
      };

      await setDoc(docRef, postData);
      return {
        id: docRef.id,
        ...postData,
        canManage: true,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wallKeys.all }),
  });
}

export function useUploadResource() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (input: UploadInput) => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error("Not authenticated");

      const userDoc = await getDoc(doc(db, "users", currentUserId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      let courseTitle = null;
      if (input.courseId) {
        const courseDoc = await getDoc(doc(db, "courses", input.courseId));
        if (courseDoc.exists()) {
          courseTitle = courseDoc.data().title;
        }
      }

      setProgress(10);

      // Cloudinary upload
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default");
      formData.append("resource_type", "auto");

      setProgress(40);

      const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "lf1qnjqx";
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Cloudinary upload failed");
      }

      setProgress(80);

      const uploadedFile = await res.json();
      const fileUrl = uploadedFile.secure_url;

      let kind: ResourceKind = "Document";
      if (input.file.type.startsWith("video/")) {
        kind = "Video";
      } else if (input.file.type.startsWith("image/")) {
        kind = "Image";
      } else if (input.file.type === "application/pdf") {
        kind = "Pdf";
      }

      const docRef = doc(collection(db, "wall_resources"));
      const postData = {
        title: input.title,
        description: input.description || null,
        kind,
        url: null,
        fileUrl,
        originalFileName: input.file.name,
        sizeBytes: input.file.size,
        thumbnailUrl: null,
        embedUrl: null,
        courseId: input.courseId || null,
        courseTitle,
        postedById: currentUserId,
        postedByName: userData.fullName || "Trainer",
        postedByAvatarUrl: null,
        postedAtUtc: new Date().toISOString(),
      };

      await setDoc(docRef, postData);
      setProgress(100);

      return {
        id: docRef.id,
        ...postData,
        canManage: true,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wallKeys.all }),
  });

  return { ...mutation, progress };
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "wall_resources", id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: wallKeys.all }),
  });
}
