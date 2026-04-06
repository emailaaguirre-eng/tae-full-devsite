"use client";

import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "superuser" | "admin";
  isOwner: boolean;
  isActive: boolean;
  mustResetPassword: boolean;
  lastLoginAt: string | null;
};

type AdminProfile = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "superuser" | "admin";
  isOwner: boolean;
  isActive: boolean;
  mustResetPassword: boolean;
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
  username?: string;
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
  const [, setProfile] = useState<AdminProfile | null>(null);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "superuser">("admin");
  const [newMustReset, setNewMustReset] = useState(true);
  const [transferTargetId, setTransferTargetId] = useState("");

  const [profileUsername, setProfileUsername] = useState("");
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");

  const canManageAdminUsers = !!session && (session.role === "superuser" || session.isOwner);
  const ownerOnly = !!session?.isOwner;

  const usersById = useMemo(() => {
    const map = new Map<string, AdminUser>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const sessionRes = await toJson(await fetch("/api/admin/session"));
      const nextSession = sessionRes.data as SessionData;
      setSession(nextSession);

      if (nextSession.role === "superuser" || nextSession.isOwner) {
        const usersRes = await toJson(await fetch("/api/admin/users"));
        setUsers((usersRes.data || []) as AdminUser[]);
        setProfile(null);

        if (nextSession.isOwner) {
          const transferRes = await toJson(await fetch("/api/admin/superuser-transfer"));
          setTransfers((transferRes.data || []) as TransferRequest[]);
        } else {
          setTransfers([]);
        }
      } else {
        const profileRes = await toJson(await fetch("/api/admin/profile"));
        const nextProfile = profileRes.data as AdminProfile;

        setProfile(nextProfile);
        setProfileUsername(nextProfile.username || "");
        setProfileFirstName(nextProfile.firstName || "");
        setProfileLastName(nextProfile.lastName || "");
        setProfileEmail(nextProfile.email || "");
        setProfilePassword("");

        setUsers([]);
        setTransfers([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load admin page");
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
            username: newUsername,
            firstName: newFirstName,
            lastName: newLastName,
            email: newEmail,
            password: newPassword,
            role: newRole,
            mustResetPassword: newMustReset,
          }),
        })
      );

      setMessage("Admin user created.");
      setNewUsername("");
      setNewFirstName("");
      setNewLastName("");
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

  async function patchUser(
    userId: string,
    body: Record<string, unknown>,
    successMessage = "Admin user updated."
  ) {
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

      setMessage(successMessage);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  }

  async function saveProfile() {
    setBusyId("profile");
    setError("");
    setMessage("");

    try {
      const body: Record<string, unknown> = {
        username: profileUsername,
        firstName: profileFirstName,
        lastName: profileLastName,
        email: profileEmail,
      };

      if (profilePassword.trim()) {
        body.password = profilePassword.trim();
      }

      await toJson(
        await fetch("/api/admin/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

      setMessage("Admin profile updated.");
      setProfilePassword("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to update admin profile");
    } finally {
      setBusyId("");
    }
  }

  async function resetPassword(userId: string) {
    const next = prompt("Enter a new temporary password for this admin:");
    if (!next) return;
    await patchUser(userId, { password: next, mustResetPassword: true }, "Password reset.");
  }

  async function changeUsername(userId: string, currentUsername: string) {
    const next = prompt("Enter a new username for this admin:", currentUsername);
    if (!next || next.trim() === currentUsername) return;
    await patchUser(userId, { username: next.trim() }, "Username updated.");
  }

  async function changeEmail(userId: string, currentEmail: string) {
    const next = prompt("Enter a new email for this admin:", currentEmail);
    if (!next || next.trim() === currentEmail) return;
    await patchUser(userId, { email: next.trim() }, "Email updated.");
  }

  async function changeFirstName(userId: string, currentFirstName: string) {
    const next = prompt("Enter a first name for this admin:", currentFirstName || "");
    if (next === null) return;
    if (next.trim() === (currentFirstName || "").trim()) return;
    await patchUser(userId, { firstName: next.trim() }, "First name updated.");
  }

  async function changeLastName(userId: string, currentLastName: string) {
    const next = prompt("Enter a last name for this admin:", currentLastName || "");
    if (next === null) return;
    if (next.trim() === (currentLastName || "").trim()) return;
    await patchUser(userId, { lastName: next.trim() }, "Last name updated.");
  }

  async function toggleRole(user: AdminUser) {
    if (user.isOwner) return;

    const nextRole = user.role === "superuser" ? "admin" : "superuser";
    await patchUser(user.id, { role: nextRole }, `Role updated to ${nextRole}.`);
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
    return <div className="text-sm text-brand-medium">Loading admin page...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-brand-dark font-playfair">
            {canManageAdminUsers ? "Admin Users" : "Admin Profile"}
          </h1>
          <p className="text-sm text-brand-medium mt-1">
            {canManageAdminUsers
              ? "Manage admin account access and credentials."
              : "Manage your admin profile and password."}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {message}
        </div>
      )}

      {canManageAdminUsers ? (
        <>
          <section className="bg-white border border-brand-light p-5 space-y-4">
            <h2 className="text-lg font-semibold text-brand-dark">Create Admin User</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username"
                className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
              <input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email"
                className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
              <input
                type="text"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="first name"
                className="border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="last name"
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

              <label className="flex items-center gap-2 text-sm text-brand-dark md:col-span-2">
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
              disabled={busyId === "create" || !newUsername || !newEmail || !newPassword}
              className="px-4 py-2 bg-brand-dark text-white text-sm disabled:opacity-50"
            >
              {busyId === "create" ? "Creating..." : "Create Admin"}
            </button>
          </section>

          <section className="bg-white border border-brand-light p-5">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Current Admin Accounts</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-brand-light">
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">First Name</th>
                    <th className="py-2 pr-4">Last Name</th>
                    <th className="py-2 pr-4">Access</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Last Login</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-brand-light/60">
                      <td className="py-2 pr-4">{user.username}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4">{user.firstName || "—"}</td>
                      <td className="py-2 pr-4">{user.lastName || "—"}</td>
                      <td className="py-2 pr-4">{user.isOwner ? "owner" : user.role}</td>
                      <td className="py-2 pr-4">{user.isActive ? "active" : "inactive"}</td>
                      <td className="py-2 pr-4">{user.lastLoginAt || "never"}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => patchUser(user.id, { isActive: !user.isActive }, "Status updated.")}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            onClick={() =>
                              patchUser(
                                user.id,
                                { mustResetPassword: !user.mustResetPassword },
                                user.mustResetPassword ? "Reset flag cleared." : "Password reset required."
                              )
                            }
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            {user.mustResetPassword ? "Clear Reset Flag" : "Force Reset"}
                          </button>

                          {!user.isOwner && (
                            <button
                              onClick={() => toggleRole(user)}
                              disabled={busyId === user.id}
                              className="px-2 py-1 border border-brand-light text-xs"
                            >
                              {user.role === "superuser" ? "Make Admin" : "Make Superuser"}
                            </button>
                          )}

                          <button
                            onClick={() => changeUsername(user.id, user.username)}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            Change Username
                          </button>

                          <button
                            onClick={() => changeEmail(user.id, user.email)}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            Change Email
                          </button>

                          <button
                            onClick={() => changeFirstName(user.id, user.firstName || "")}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            Change First Name
                          </button>

                          <button
                            onClick={() => changeLastName(user.id, user.lastName || "")}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            Change Last Name
                          </button>

                          <button
                            onClick={() => resetPassword(user.id)}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-brand-light text-xs"
                          >
                            Reset Password
                          </button>

                          <button
                            onClick={() => removeUser(user.id)}
                            disabled={busyId === user.id}
                            className="px-2 py-1 border border-red-300 text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {ownerOnly && (
            <section className="bg-white border border-brand-light p-5 space-y-4">
              <h2 className="text-lg font-semibold text-brand-dark">Access Transfer (Dual Approval)</h2>

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
                        {u.firstName || u.lastName
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim() + ` (${u.username})`
                          : u.username}
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
                          <span className="font-semibold">Target:</span>{" "}
                          {targetUser
                            ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || targetUser.username
                            : transfer.targetAdminId}
                          {targetUser ? ` (${targetUser.username})` : ""}
                        </div>
                        <div>
                          <span className="font-semibold">Initiated by:</span>{" "}
                          {initiatedBy
                            ? `${initiatedBy.firstName || ""} ${initiatedBy.lastName || ""}`.trim() || initiatedBy.username
                            : transfer.initiatedByAdminId}
                          {initiatedBy ? ` (${initiatedBy.username})` : ""}
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
        </>
      ) : (
        <section className="bg-white border border-brand-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Admin Profile</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-brand-dark">Username</label>
              <input
                type="text"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                placeholder="username"
                className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-dark">First Name</label>
              <input
                type="text"
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                placeholder="first name"
                className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-dark">Last Name</label>
              <input
                type="text"
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                placeholder="last name"
                className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-brand-dark">Email</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="email"
                className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-brand-dark">Reset Password</label>
              <input
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="enter a new password"
                className="w-full border border-brand-light px-3 py-2 text-sm bg-brand-lightest"
              />
              <p className="text-xs text-brand-medium">
                Leave blank if you do not want to change your password.
              </p>
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={busyId === "profile" || !profileUsername.trim() || !profileEmail.trim()}
            className="px-4 py-2 bg-brand-dark text-white text-sm disabled:opacity-50"
          >
            {busyId === "profile" ? "Saving..." : "Save Profile"}
          </button>
        </section>
      )}
    </div>
  );
}
