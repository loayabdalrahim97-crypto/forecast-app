"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-nav";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { forecasts: number };
}

export function UsersClient({ locale }: { locale: string }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [changingId, setChangingId] = useState<string | null>(null);

  function load() {
    const qs = new URLSearchParams({ page: String(page) });
    if (q.trim()) qs.set("q", q.trim());
    fetch(`/api/admin/users?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUsers(data?.users ?? []);
        setTotalPages(data?.totalPages ?? 1);
      })
      .catch(() => setUsers([]));
  }

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  async function toggleRole(user: UserRow) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setChangingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    }).catch(() => null);
    setChangingId(null);
    if (res?.ok) load();
  }

  return (
    <DashboardShell locale={locale}>
      <main style={{ padding: "1.5rem 2rem 4rem", maxWidth: 780, margin: "0 auto" }}>
        <a href={`/${locale}/admin`} style={{ fontSize: "0.82rem", color: "var(--fc-text-muted)" }}>
          {locale === "ar" ? "← رجوع لمركز التحكم" : "← Back to Control Center"}
        </a>
        <h1 style={{ fontSize: "1.6rem", margin: "0.75rem 0 1.25rem" }}>{locale === "ar" ? "المستخدمون" : "Users"}</h1>

        <input
          className="fc-input"
          placeholder={locale === "ar" ? "ابحث بالإيميل أو الاسم..." : "Search by email or name..."}
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          style={{ marginBottom: "1.5rem" }}
        />

        {users === null ? (
          <p>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--fc-text-muted)" }}>{locale === "ar" ? "ما في نتائج." : "No results."}</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="fc-strip" style={{ marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 0.2rem", fontSize: "0.9rem" }}>{u.email}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--fc-text-muted)" }}>
                  {u.name ?? "—"} · {u._count.forecasts} {locale === "ar" ? "توقع" : "forecasts"} ·{" "}
                  {new Date(u.createdAt).toLocaleDateString(locale === "ar" ? "ar" : "en-US")}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  className="fc-pill"
                  style={{
                    color: u.role === "admin" ? "var(--fc-accent)" : "var(--fc-text-muted)",
                    background: u.role === "admin" ? "var(--fc-accent-soft)" : "var(--fc-bg-elevated)",
                  }}
                >
                  {u.role}
                </span>
                <button
                  type="button"
                  onClick={() => toggleRole(u)}
                  className="fc-btn fc-btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                  disabled={changingId === u.id}
                >
                  {u.role === "admin"
                    ? locale === "ar" ? "اسحب صلاحية الإدارة" : "Revoke admin"
                    : locale === "ar" ? "امنح صلاحية الإدارة" : "Make admin"}
                </button>
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="fc-btn fc-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ fontSize: "0.8rem" }}
            >
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <span style={{ fontSize: "0.82rem", color: "var(--fc-text-muted)", alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="fc-btn fc-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ fontSize: "0.8rem" }}
            >
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
