"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useAdminNiches } from "@/hooks/use-admin-niches";
import {
  useAdminProducts,
  useArchiveProductPaddle,
  useCreateProduct,
  useDeleteProduct,
  useSyncProductPaddle,
  useUpdateProduct,
  type ProductInput,
} from "@/hooks/use-admin-products";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatRelative } from "@/lib/format";
import { ProductForm } from "@/components/admin/product-form";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function AdminProductsPage() {
  const niches = useAdminNiches();
  const products = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const syncPaddle = useSyncProductPaddle();
  const archivePaddle = useArchiveProductPaddle();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (input: ProductInput) => {
    setError(null);
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, input });
      } else {
        await createProduct.mutateAsync(input);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    await deleteProduct.mutateAsync(product.id);
  };

  const handleSync = async (product: Product) => {
    setMessage(null);
    setBusyId(product.id);
    try {
      const result = await syncPaddle.mutateAsync(product.id);
      setMessage(
        `"${product.name}" synced to Paddle (${result.createdProduct ? "product created" : "product updated"}, ${
          result.createdPrice ? "price created" : "price updated"
        }).`,
      );
    } catch (syncError) {
      setMessage(getApiErrorMessage(syncError));
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (product: Product) => {
    if (
      !window.confirm(
        `Archive "${product.name}" in Paddle? This deactivates the product locally too.`,
      )
    ) {
      return;
    }
    setMessage(null);
    setBusyId(product.id);
    try {
      await archivePaddle.mutateAsync(product.id);
      setMessage(`"${product.name}" archived in Paddle.`);
    } catch (archiveError) {
      setMessage(getApiErrorMessage(archiveError));
    } finally {
      setBusyId(null);
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;
  const canCreate = (niches.data?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="One-time purchase PDF guides. Sync langsung ke katalog Paddle."
        actions={
          <Button onClick={openCreate} disabled={!canCreate}>
            + New product
          </Button>
        }
      />

      {message ? (
        <p className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-fg">
          {message}
        </p>
      ) : null}

      {!niches.isLoading && !canCreate ? (
        <p className="rounded-2xl border border-border bg-surface-muted p-4 text-sm text-fg">
          Create a niche first before adding products.
        </p>
      ) : null}

      {products.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading products...
        </div>
      ) : null}

      {products.data && products.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-2xl">
            ▤
          </span>
          <p className="mt-4 text-sm font-medium text-fg">No products yet</p>
          <p className="mt-1 text-xs text-fg-muted">
            Add your first guide to start selling.
          </p>
          {canCreate ? (
            <Button className="mt-5" onClick={openCreate}>
              + New product
            </Button>
          ) : null}
        </div>
      ) : null}

      {products.data && products.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-muted/60 text-[11px] uppercase tracking-[0.12em] text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Niche</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Paddle</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.data.map((product) => {
                const linked = Boolean(product.paddleProductId && product.paddlePriceId);
                return (
                  <tr key={product.id} className="transition hover:bg-surface-muted/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-fg">{product.name}</div>
                      <div className="text-xs text-fg-muted">{product.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-fg-muted">
                        {product.niche?.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-fg">
                      {formatCurrency(product.priceAmount, product.currency)}
                    </td>
                    <td className="px-5 py-4">
                      {linked ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-fg px-2 py-0.5 text-xs text-surface">
                            <span className="size-1.5 rounded-full bg-surface" />
                            linked
                          </span>
                          <div className="text-[11px] text-fg-muted">
                            {product.paddleSyncedAt
                              ? `synced ${formatRelative(product.paddleSyncedAt)}`
                              : null}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-fg-muted ring-1 ring-inset ring-border">
                          <span className="size-1.5 rounded-full bg-fg-muted" />
                          not linked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!linked ? (
                          <Button
                            size="sm"
                            onClick={() => handleSync(product)}
                            disabled={busyId === product.id}
                          >
                            {busyId === product.id ? <Spinner /> : null}
                            Sync to Paddle
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(product)}
                            disabled={busyId === product.id}
                          >
                            Archive
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => openEdit(product)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(product)}
                          disabled={deleteProduct.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        wide
        title={editing ? `Edit ${editing.name}` : "New product"}
        onClose={() => setModalOpen(false)}
      >
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <ProductForm
          product={editing}
          niches={niches.data ?? []}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>
    </div>
  );
}
