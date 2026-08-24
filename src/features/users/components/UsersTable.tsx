import { BadgeCheck, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "../api/types";
import { avatarColor, roleVariant, sortRoles } from "../lib/userVisuals";

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string | undefined;
  canManageSuperAdmins: boolean;
  onEditRoles: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onToggleApproval: (userId: string, isApproved: boolean) => void;
  busyUserId: string | null;
}

export function UsersTable({
  users,
  currentUserId,
  canManageSuperAdmins,
  onEditRoles,
  onToggleStatus,
  onToggleApproval,
  busyUserId,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-border">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Account</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Roles</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Approval (Trainers)</th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isSuperAdmin = user.roles.includes("SuperAdministrator");
            const locked = isSelf || (isSuperAdmin && !canManageSuperAdmins);
            const busy = busyUserId === user.id;

            return (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user.fullName}
                      src={user.avatarUrl}
                      color={avatarColor(user.email)}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{user.fullName}</span>
                        {isSelf ? <Badge variant="outline">You</Badge> : null}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {sortRoles(user.roles).map((role) => (
                      <Badge key={role} variant={roleVariant(role)}>
                        {role === "SuperAdministrator" ? (
                          <Shield className="h-3 w-3" aria-hidden />
                        ) : null}
                        {role}
                      </Badge>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={locked || busy}
                    onClick={() => onToggleStatus(user)}
                    className={`text-xs px-2 h-7 font-semibold ${
                      user.isActive 
                        ? "text-success hover:text-success hover:bg-success/5" 
                        : "text-muted-foreground hover:bg-neutral-100"
                    }`}
                  >
                    {user.isActive ? "Active (Disable)" : "Inactive (Enable)"}
                  </Button>
                </td>

                <td className="px-4 py-3">
                  {user.roles.includes("Trainer") ? (
                    <div className="flex gap-1.5">
                      {user.isApproved ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-success text-success hover:bg-success/5 h-7 px-2"
                          onClick={() => onToggleApproval(user.id, false)}
                          disabled={busy}
                        >
                          Approved (Reject)
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-warning text-warning hover:bg-warning/5 h-7 px-2 animate-pulse"
                          onClick={() => onToggleApproval(user.id, true)}
                          disabled={busy}
                        >
                          Approve Trainer
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRoles(user)}
                      disabled={locked || busy}
                      title={locked ? "You cannot change this account" : "Manage roles"}
                    >
                      <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                      Roles
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
