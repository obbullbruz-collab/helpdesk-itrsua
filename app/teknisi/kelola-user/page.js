"use client";

import { useEffect, useState } from "react";

export default function KelolaUserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (id, role) => {
    if (!confirm("Ubah role user ini?")) return;

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.message || "Gagal mengubah role");
      return;
    }

    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!confirm("Hapus user ini?")) return;

    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.message || "Gagal menghapus user");
      return;
    }

    fetchUsers();
  };

  if (loading) return <p className="p-6">Memuat...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Kelola User</h1>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Telegram</th>
                <th className="p-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="user">User</option>
                      <option value="teknisi">Teknisi</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {u.telegram_chat_id ? "Terhubung" : "-"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Tidak ada data user
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
