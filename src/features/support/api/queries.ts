import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import type {
  CreateTicketInput,
  StaffTicketCounts,
  StaffTicketFilters,
  TicketDetail,
  TicketPage,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from "./types";

export const supportKeys = {
  all: ["support"] as const,
  mine: ["support", "mine"] as const,
  ticket: (id: string) => ["support", "ticket", id] as const,
  staffTickets: (filters: StaffTicketFilters) => ["support", "staff", filters] as const,
  staffCounts: ["support", "staff", "counts"] as const,
};

/** The caller's own tickets. Shared by whoever is signed in. */
export function useMyTickets() {
  const currentUid = auth.currentUser?.uid;
  return useQuery({
    queryKey: supportKeys.mine,
    queryFn: async () => {
      if (!currentUid) return [];

      const userSnap = await getDoc(doc(db, "users", currentUid));
      const userData = userSnap.exists() ? userSnap.data() : null;
      const isAdminRole = userData?.role === "Admin" || (userData?.roles && userData.roles.includes("Admin"));

      let q;
      if (isAdminRole) {
        q = query(collection(db, "support_tickets"), orderBy("createdAtUtc", "desc"));
      } else {
        q = query(
          collection(db, "support_tickets"),
          where("submittedById", "==", currentUid)
        );
      }

      const snap = await getDocs(q);
      const list: TicketSummary[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          subject: data.subject || "",
          category: data.category || "Other",
          priority: data.priority || "Normal",
          status: data.status || "Open",
          submittedById: data.submittedById || "",
          submittedByName: data.submittedByName || "",
          assignedToId: data.assignedToId || null,
          assignedToName: data.assignedToName || null,
          messageCount: data.messageCount || 1,
          createdAtUtc: data.createdAtUtc || new Date().toISOString(),
          lastActivityAtUtc: data.lastActivityAtUtc || new Date().toISOString(),
        });
      });
      
      if (!isAdminRole) {
        list.sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
      }
      return list;
    },
    staleTime: 15_000,
  });
}

/** A single ticket with messages thread subcollection. */
export function useTicket(id: string | undefined, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: supportKeys.ticket(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Ticket ID required");
      const ticketSnap = await getDoc(doc(db, "support_tickets", id));
      if (!ticketSnap.exists()) throw new Error("Ticket not found");
      const ticketData = ticketSnap.data();

      // Fetch messages from replies subcollection
      const repliesSnap = await getDocs(
        query(collection(db, "support_tickets", id, "replies"), orderBy("createdAtUtc", "asc"))
      );
      const messagesList: any[] = [];
      repliesSnap.forEach((rd) => {
        const rdata = rd.data();
        messagesList.push({
          id: rd.id,
          authorId: rdata.authorId || "",
          authorName: rdata.authorName || "Trainee",
          authorAvatarUrl: null,
          body: rdata.body || "",
          isInternalNote: rdata.isInternalNote || false,
          createdAtUtc: rdata.createdAtUtc || new Date().toISOString(),
        });
      });

      return {
        id: ticketSnap.id,
        subject: ticketData.subject || "",
        category: ticketData.category || "Other",
        priority: ticketData.priority || "Normal",
        status: ticketData.status || "Open",
        submittedById: ticketData.submittedById || "",
        submittedByName: ticketData.submittedByName || "",
        submittedByEmail: ticketData.submittedByEmail || "",
        assignedToId: ticketData.assignedToId || null,
        assignedToName: ticketData.assignedToName || null,
        createdAtUtc: ticketData.createdAtUtc || new Date().toISOString(),
        resolvedAtUtc: ticketData.resolvedAtUtc || null,
        closedAtUtc: ticketData.closedAtUtc || null,
        messages: messagesList,
      } as TicketDetail;
    },
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) throw new Error("User must be logged in");

      const userSnap = await getDoc(doc(db, "users", currentUid));
      const userData = userSnap.exists() ? userSnap.data() : null;
      const userEmail = userData?.email || auth.currentUser?.email || "";
      const userName = userData?.fullName || auth.currentUser?.displayName || "Trainee";

      const ticketDoc = {
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        status: "Open" as const,
        submittedById: currentUid,
        submittedByName: userName,
        submittedByEmail: userEmail,
        assignedToId: null,
        assignedToName: null,
        createdAtUtc: new Date().toISOString(),
        resolvedAtUtc: null,
        closedAtUtc: null,
        lastActivityAtUtc: new Date().toISOString(),
        messageCount: 1,
      };

      const docRef = await addDoc(collection(db, "support_tickets"), ticketDoc);

      // Add the initial message to replies subcollection
      await addDoc(collection(db, "support_tickets", docRef.id, "replies"), {
        authorId: currentUid,
        authorName: userName,
        body: input.message,
        createdAtUtc: new Date().toISOString(),
        isInternalNote: false,
      });

      return {
        id: docRef.id,
        ...ticketDoc,
        messages: []
      } as TicketDetail;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.mine }),
  });
}

export function useReplyToTicket(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ body, isInternalNote = false }: { body: string; isInternalNote?: boolean }) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) throw new Error("User must be logged in");

      const userSnap = await getDoc(doc(db, "users", currentUid));
      const userData = userSnap.exists() ? userSnap.data() : null;
      const userName = userData?.fullName || auth.currentUser?.displayName || "Trainee";

      const replyData = {
        authorId: currentUid,
        authorName: userName,
        body,
        createdAtUtc: new Date().toISOString(),
        isInternalNote,
      };

      await addDoc(collection(db, "support_tickets", id, "replies"), replyData);

      // Increment ticket messageCount
      const ticketRef = doc(db, "support_tickets", id);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const currentCount = ticketSnap.data().messageCount || 1;
        await updateDoc(ticketRef, {
          lastActivityAtUtc: new Date().toISOString(),
          messageCount: currentCount + 1,
        });
      }

      return replyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(id) });
      queryClient.invalidateQueries({ queryKey: supportKeys.mine });
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
    },
  });
}

// --- Staff side ---

export function useStaffTickets(filters: StaffTicketFilters) {
  return useQuery({
    queryKey: supportKeys.staffTickets(filters),
    queryFn: async () => {
      const q = query(collection(db, "support_tickets"), orderBy("createdAtUtc", "desc"));
      const snap = await getDocs(q);
      const list: TicketSummary[] = [];

      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          subject: data.subject || "",
          category: data.category || "Other",
          priority: data.priority || "Normal",
          status: data.status || "Open",
          submittedById: data.submittedById || "",
          submittedByName: data.submittedByName || "",
          assignedToId: data.assignedToId || null,
          assignedToName: data.assignedToName || null,
          messageCount: data.messageCount || 1,
          createdAtUtc: data.createdAtUtc || new Date().toISOString(),
          lastActivityAtUtc: data.lastActivityAtUtc || new Date().toISOString(),
        });
      });

      let filtered = list;
      if (filters.status) {
        filtered = filtered.filter((t) => t.status === filters.status);
      }
      if (filters.priority) {
        filtered = filtered.filter((t) => t.priority === filters.priority);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.subject.toLowerCase().includes(s) ||
            t.submittedByName.toLowerCase().includes(s)
        );
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const paginatedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

      return {
        items: paginatedItems,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      } as TicketPage;
    },
    staleTime: 10_000,
  });
}

export function useStaffTicketCounts() {
  return useQuery({
    queryKey: supportKeys.staffCounts,
    queryFn: async () => {
      const snap = await getDocs(collection(db, "support_tickets"));
      let openCount = 0;
      let unassignedCount = 0;
      let urgentCount = 0;

      snap.forEach((d) => {
        const data = d.data();
        const status = data.status;
        const assignedTo = data.assignedToId;
        const priority = data.priority;

        if (status === "Open" || status === "InProgress") {
          openCount++;
          if (!assignedTo) {
            unassignedCount++;
          }
          if (priority === "High" || priority === "Urgent") {
            urgentCount++;
          }
        }
      });

      return {
        open: openCount,
        unassigned: unassignedCount,
        urgentOrHigh: urgentCount,
      } as StaffTicketCounts;
    },
    staleTime: 10_000,
  });
}

function invalidateEverything(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: supportKeys.ticket(id) });
  queryClient.invalidateQueries({ queryKey: supportKeys.all });
}

export function useAssignTicket(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignedToId: string | null) => {
      const ticketRef = doc(db, "support_tickets", id);
      const updateData: any = { assignedToId };
      if (assignedToId) {
        const userSnap = await getDoc(doc(db, "users", assignedToId));
        updateData.assignedToName = userSnap.exists() ? userSnap.data()?.fullName : "Staff";
      } else {
        updateData.assignedToName = null;
      }
      await updateDoc(ticketRef, updateData);
      return { id } as any;
    },
    onSuccess: () => invalidateEverything(queryClient, id),
  });
}

export function useChangeTicketStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: TicketStatus) => {
      const ticketRef = doc(db, "support_tickets", id);
      const updateData: any = { status };
      if (status === "Resolved") {
        updateData.resolvedAtUtc = new Date().toISOString();
      } else if (status === "Closed") {
        updateData.closedAtUtc = new Date().toISOString();
      }
      await updateDoc(ticketRef, updateData);
      return { id } as any;
    },
    onSuccess: () => invalidateEverything(queryClient, id),
  });
}

export function useChangeTicketPriority(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priority: TicketPriority) => {
      const ticketRef = doc(db, "support_tickets", id);
      await updateDoc(ticketRef, { priority });
      return { id } as any;
    },
    onSuccess: () => invalidateEverything(queryClient, id),
  });
}
