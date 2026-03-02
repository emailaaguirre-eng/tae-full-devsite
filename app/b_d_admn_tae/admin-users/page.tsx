"use client";

import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  role: "superuser" | "admin";
  isOwner: boolean;
  isActive: boolean;
  mustResetPassword: boolean;
  lastLoginAt: string | null;
};

type TransferRequest = {
  id: string;
  targetAdminId: string;
  initiatedByAdminId: string;
  approvedByAdminId: string | null;
  status: string;
  expiresAt: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type SessionData = {
  userId: string;
  email: string;
  role: "superuser" | "admin";
  isOwner: boolean;
};

async function toJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export default function AdminUsersPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "superuser">("admin");
  const [newMustReset, setNewMustReset] = useState(true);
  const [transferTargetId, setTransferTargetId] = useState("");

  const ownerOnly = session?.isOwner;

  const usersById = useMemo(() => {
    const map = new Map<string, AdminUser>();
    for (const user of users) map.set(user.id, user);
    return map;
  }, [users]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const sessionRes = await toJson(await fetch("/api/admin/session"));
      setSession(sessionRes.data as SessionData);

      const usersRes = await toJson(await fetch("/api/admin/users"));
      setUsers((usersRes.data || []) as AdminUser[]);

      if (sessionRes.data?.isOwner) {
        const transferRes = await toJson(await fetch("/api/admin/superuser-transfer"));
        setTransfers((transferRes.data || []) as TransferRequest[]);
      } else {
        setTransfers([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createUser() {
    setBusyId("create");
    setError("");
    setMessage("");
    try {
      await toJson(
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            role: newRole,
            mustResetPassword: newMustReset,
          }),
        })
      );
      setMessage("Admin user created.");
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      setNewMustReset(true);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to create admin user");
    } finally {
      setBusyId("");
    }
  }

  async function patchUser(userId: string, body: Record<string, unknown>) {
    setBusyId(userId);
    setError("");
    setMessage("");
    try {
      await toJson(
        await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      setMessage("Admin user updated.");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  }

  async function resetPassword(userId: string) {
    const next = prompt("Enter a new temporary password for this admin:");
    if (!next) return;
    await patchUser(userId, { password: next, mustResetPassword: true });
  }

  async function changeUsername(userId: string, currentEmail: string) {
    const next = prompt("Enter a new username/email for this admin:", currentEmail);
    if (!next || next.trim() === currentEmail) return;
    await patchUser(userId, { email: next.trim() });
  }

  async function removeUser(userId: string) {
    if (!confirm("Delete this admin account? This action cannot be undone.")) return;
    setBusyId(userId);
    setError("");
    setMessage("");
    try {
      await toJson(
        await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        })
      );
      setMessage("Admin user deleted.");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    } finally {
      setBusyId("");
    }
  }

  async function initiateTransfer() {
    if (!transferTargetId) return;
    setBusyId("transfer");
    setError("");
    setMessage("");
    try {
      await toJson(
        await fetch("/api/admin/superuser-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetAdminId: transferTargetId }),
        })
      );
      setTransferTargetId("");
      setMessage("Transfer request created. A second owner must approve it.");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to initiate transfer");
    } finally {
      setBusyId("");
    }
  }

  async function approveTransfer(transferId: string) {
    setBusyId(transferId);
    setError("");
    setMessage("");
    try {
      await toJson(
        await fetch(`/api/admin/superuser-transfer/${transferId}/approve`, {
          method: "POST",
        })
      );
      setMessage("Transfer approved. Target user is now a superuser.");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to approve transfer");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return <div className="text-sm text-brand-medium">Loading admin users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Admin Users</h1>
          <p className="text-sm text-brand-medium mt-1">
            Superusers can create, reset, deactivate, and delete admin access.
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">{message}</div>
      )}

      {!session?.isOwner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3">
          Owner superuser access is required for admin account management.
        </div>
      )}

      {ownerOnly && (
        <section className="bg-white border border-brand-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Create Admin User</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="username or email"
              className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="temporary password"
              className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "superuser")}
              className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
            >
              <option value="admin">admin</option>
              <option value="superuser">superuser</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-brand-dark">
              <input
                type="checkbox"
                checked={newMustReset}
                onChange={(e) => setNewMustReset(e.target.checked)}
              />
              Require password reset on first login
            </label>
          </div>
          <button
            onClick={createUser}
            disabled={busyId === "create" || !newEmail || !newPassword}
            className="px-4 py-2 bg-brand-dark text-white text-sm disabled:opacity-50"
          >
            {busyId === "create" ? "Creating..." : "Create Admin"}
          </button>
        </section>
      )}

      <section className="bg-white border border-brand-light p-5">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">Current Admin Accounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-brand-light">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Last Login</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-brand-light/60">
                  <td className="py-2 pr-4">{user.email}</td>
                  <td className="py-2 pr-4">{user.role}</td>
                  <td className="py-2 pr-4">{user.isActive ? "active" : "inactive"}</td>
                  <td className="py-2 pr-4">{user.isOwner ? "yes" : "no"}</td>
                  <td className="py-2 pr-4">{user.lastLoginAt || "never"}</td>
                  <td className="py-2 flex flex-wrap gap-2">
                    {ownerOnly && (
                      <>
                        <button
                          onClick={() =>
                            patchUser(user.id, { isActive: !user.isActive })
                          }
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-brand-light text-xs"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() =>
                            patchUser(user.id, { mustResetPassword: !user.mustResetPassword })
                          }
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-brand-light text-xs"
                        >
                          {user.mustResetPassword ? "Clear reset flag" : "Force reset"}
                        </button>
                        <button
                          onClick={() => changeUsername(user.id, user.email)}
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-brand-light text-xs"
                        >
                          Change Username
                        </button>
                        <button
                          onClick={() => resetPassword(user.id)}
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-brand-light text-xs"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() =>
                            patchUser(user.id, {
                              role: user.role === "superuser" ? "admin" : "superuser",
                            })
                          }
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-brand-light text-xs"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => removeUser(user.id)}
                          disabled={busyId === user.id}
                          className="px-2 py-1 border border-red-300 text-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {ownerOnly && (
        <section className="bg-white border border-brand-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Superuser Transfer (Dual Approval)</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest min-w-[260px]"
            >
              <option value="">Select target admin</option>
              {users
                .filter((u) => u.id !== session?.userId && u.isActive)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
            </select>
            <button
              onClick={initiateTransfer}
              disabled={!transferTargetId || busyId === "transfer"}
              className="px-4 py-2 bg-brand-dark text-white text-sm disabled:opacity-50"
            >
              {busyId === "transfer" ? "Creating..." : "Initiate Transfer Request"}
            </button>
          </div>

          <div className="space-y-2">
            {transfers.length === 0 && (
              <div className="text-sm text-brand-medium">No pending transfer requests.</div>
            )}
            {transfers.map((transfer) => {
              const targetUser = usersById.get(transfer.targetAdminId);
              const initiatedBy = usersById.get(transfer.initiatedByAdminId);
              const canApprove =
                session?.userId &&
                initiatedBy?.id !== session.userId &&
                transfer.status === "pending";
              return (
                <div
                  key={transfer.id}
                  className="border border-brand-light rounded p-3 flex flex-wrap items-center gap-3 justify-between"
                >
                  <div className="text-sm">
                    <div>
                      <span className="font-semibold">Target:</span> {targetUser?.email || transfer.targetAdminId}
                    </div>
                    <div>
                      <span className="font-semibold">Initiated by:</span> {initiatedBy?.email || transfer.initiatedByAdminId}
                    </div>
                    <div>
                      <span className="font-semibold">Expires:</span> {transfer.expiresAt}
                    </div>
                  </div>
                  <button
                    onClick={() => approveTransfer(transfer.id)}
                    disabled={!canApprove || busyId === transfer.id}
                    className="px-3 py-1.5 bg-brand-medium text-white text-xs disabled:opacity-50"
                  >
                    {busyId === transfer.id ? "Approving..." : "Approve Transfer"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
