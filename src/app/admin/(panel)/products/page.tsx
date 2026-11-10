"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ConfirmDialog,
  ImageUpload,
  Modal,
  PageHeader,
  SectionCard,
  SelectField,
  TextArea,
  TextField,
  Toggle,
  useApi,
  useToast,
} from "@/components/admin/ui";

type Category = { id: string; name: string; slug: string; order: number };
type Product = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  badge: string | null;
  description: string | null;
  order: number;
  published: boolean;
  categoryId: string;
  category?: Category;
};

type Draft = Omit<Product, "id" | "category"> & { id?: string };

const BLANK: Draft = { name: "", slug: "", image: "", badge: "", description: "", order: 0, published: true, categoryId: "" };

export default function ProductsAdmin() {
  const api = useApi();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([api<Product[]>("/api/admin/products"), api<Category[]>("/api/admin/categories")]);
    setProducts(p);
    setCategories(c);
  }, [api]);

  useEffect(() => {
    load().catch((e) => toast(e.message, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function saveProduct() {
    if (!editing) return;
    if (!editing.name || !editing.categoryId) {
      toast("Nama dan kategori wajib dipilih", "error");
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        await api("/api/admin/products", { method: "POST", body: JSON.stringify(editing) });
        toast("Produk ditambahkan");
      } else {
        await api(`/api/admin/products/${editing.id}`, { method: "PATCH", body: JSON.stringify(editing) });
        toast("Produk diperbarui");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/products/${deleting.id}`, { method: "DELETE" });
      toast("Produk dihapus");
      setDeleting(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    try {
      await api("/api/admin/categories", { method: "POST", body: JSON.stringify({ name: newCat.trim() }) });
      setNewCat("");
      toast("Kategori ditambahkan");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal", "error");
    }
  }

  async function removeCategory() {
    if (!deletingCat) return;
    setBusy(true);
    try {
      await api(`/api/admin/categories/${deletingCat.id}`, { method: "DELETE" });
      toast("Kategori dihapus (beserta produknya)");
      setDeletingCat(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Produk & Kategori"
        subtitle="Katalog peralatan pada section 'Pilih Perlindungannya'"
        actions={
          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditing({ ...BLANK, categoryId: categories[0]?.id || "" });
            }}
            className="btn-primary !py-2 !text-xs"
          >
            + Tambah produk
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <SectionCard title={`Produk (${products.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink/40">
                  <th className="py-2 pr-2">Gambar</th>
                  <th className="py-2 pr-2">Nama</th>
                  <th className="hidden py-2 pr-2 sm:table-cell">Kategori</th>
                  <th className="hidden py-2 pr-2 md:table-cell">Badge</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-2">
                      <div className="h-12 w-10 overflow-hidden rounded-md bg-sand">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2 pr-2 font-semibold">{p.name}</td>
                    <td className="hidden py-2 pr-2 text-ink/60 sm:table-cell">{p.category?.name}</td>
                    <td className="hidden py-2 pr-2 md:table-cell">
                      {p.badge && <span className="rounded-sm bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-dark">{p.badge}</span>}
                    </td>
                    <td className="py-2 pr-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-sand text-ink/50"}`}>
                        {p.published ? "Tayang" : "Sembunyi"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing(p);
                        }}
                        className="mr-1 rounded-md px-2.5 py-1 text-xs font-bold hover:bg-sand"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => setDeleting(p)} className="rounded-md px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink/40">
                      Belum ada produk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={`Kategori filter (${categories.length})`}>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-[13px]">
                <span className="font-semibold">{c.name}</span>
                <button type="button" onClick={() => setDeletingCat(c)} className="text-[11px] font-bold text-red-600 hover:underline">
                  Hapus
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input className="input !py-2 !text-xs" placeholder="Nama kategori baru" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button type="button" onClick={addCategory} className="btn-dark !px-3 !py-2 !text-xs shrink-0">
                +
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? "Tambah produk" : "Edit produk"} wide>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nama produk" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
            <SelectField
              label="Kategori"
              value={editing.categoryId}
              onChange={(v) => setEditing({ ...editing, categoryId: v })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <TextField label="Badge (opsional)" value={editing.badge || ""} onChange={(v) => setEditing({ ...editing, badge: v })} placeholder="Best seller" />
            <TextField label="Urutan" type="number" value={String(editing.order)} onChange={(v) => setEditing({ ...editing, order: Number(v) || 0 })} />
            <div className="sm:col-span-2">
              <TextArea label="Deskripsi (opsional)" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} rows={2} />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} />
            </div>
            <Toggle label="Tayang di katalog" value={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 !text-xs">
                Batal
              </button>
              <button type="button" onClick={saveProduct} disabled={busy} className="btn-primary !py-2 !text-xs disabled:opacity-60">
                {busy ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Hapus produk"
        message={`Yakin menghapus "${deleting?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={removeProduct}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
      <ConfirmDialog
        open={Boolean(deletingCat)}
        title="Hapus kategori"
        message={`Hapus kategori "${deletingCat?.name}"? Semua produk di dalamnya ikut terhapus.`}
        onConfirm={removeCategory}
        onCancel={() => setDeletingCat(null)}
        busy={busy}
      />
    </div>
  );
}
