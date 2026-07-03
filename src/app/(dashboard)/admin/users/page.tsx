'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  plan: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const ROLES = ['all', 'host', 'vendor', 'super_admin', 'guest'] as const;

const ROLE_STYLES: Record<string, string> = {
  host:        'bg-[rgba(201,147,58,0.12)] text-[var(--pichwai-gold-deep)]',
  vendor:      'bg-blue-50 text-blue-700',
  super_admin: 'bg-purple-50 text-purple-700',
  guest:       'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [role, setRole]             = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');

  const fetchUsers = useCallback(async (page = 1, r = role, q = search) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (r !== 'all') p.set('role', r);
      if (q)           p.set('search', q);
      const res  = await fetch(`/api/admin/users?${p}`);
      const data = await res.json() as { users: AdminUser[]; pagination: Pagination };
      setUsers(data.users ?? []);
      setPagination(data.pagination ?? { page, limit: 20, total: 0, totalPages: 1 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => { fetchUsers(1, role, search); }, [role, search, fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-[var(--pichwai-gold-deep)]">Users</h1>
          <p className="text-sm text-[var(--muted-fg)] mt-1">{pagination.total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-fg)]" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-fg)] focus:outline-none focus:border-[var(--pichwai-gold)] transition"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C9933A] to-[#E8C06B] rounded-lg hover:opacity-90 transition">
            Search
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition',
                role === r
                  ? 'bg-gradient-to-r from-[#C9933A] to-[#E8C06B] text-white shadow-sm'
                  : 'bg-[var(--muted)] text-[var(--muted-fg)] hover:text-[var(--foreground)]'
              )}
            >
              {r === 'super_admin' ? 'Admin' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-gold)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[var(--muted-fg)] text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="h-10 w-10 text-[var(--pichwai-gold)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--muted-fg)]">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[rgba(201,147,58,0.04)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--pichwai-gold-deep)] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[rgba(201,147,58,0.03)] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9933A] to-[#E8C06B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.fullName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{u.fullName}</p>
                          <p className="text-xs text-[var(--muted-fg)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role] ?? ROLE_STYLES.guest}`}>
                        {u.role === 'super_admin' ? 'Admin' : u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-fg)] capitalize">{u.plan}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        <span className="text-xs text-[var(--muted-fg)]">{u.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-fg)]">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--muted-fg)]">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-[var(--border-gold)] text-[var(--pichwai-gold-deep)] disabled:opacity-40 hover:bg-[rgba(201,147,58,0.06)] transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
