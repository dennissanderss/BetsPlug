"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Edit2, Trash2, X, Save, Clock } from "lucide-react";
import type { BlogPost, BlogPostCreate, BlogPostUpdate } from "@/types/api";

// ─── Status pill (matches admin page pattern) ────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const colorMap: Record<string, string> = {
    published: "bg-green-500/15 text-green-400",
    draft: "bg-amber-500/15 text-amber-400",
    archived: "bg-slate-500/15 text-slate-400",
  };
  const cls = colorMap[s] ?? "bg-slate-500/15 text-slate-400";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {status}
    </span>
  );
}

// ─── Inline form ─────────────────────────────────────────────────────────────

const darkInputCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors placeholder:text-slate-600";

const darkSelectCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

interface BlogFormData {
  title: string;
  content: string;
  meta_description: string;
  status: "draft" | "published" | "archived";
}

function BlogForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: BlogFormData;
  onSave: (data: BlogFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<BlogFormData>(
    initial ?? { title: "", content: "", meta_description: "", status: "draft" }
  );

  return (
    <div className="border-b border-white/[0.06] px-6 py-5 space-y-4 bg-white/[0.02]">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Post title"
          className={darkInputCls}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Content</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Write your blog post content..."
          rows={6}
          className={cn(darkInputCls, "h-auto py-2.5 resize-y")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Meta Description</label>
          <input
            value={form.meta_description}
            onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            placeholder="SEO meta description"
            className={darkInputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as BlogFormData["status"] })
            }
            className={darkSelectCls}
          >
            <option value="draft" className="bg-[#111827]">Draft</option>
            <option value="published" className="bg-[#111827]">Published</option>
            <option value="archived" className="bg-[#111827]">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.title.trim() || !form.content.trim()}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold btn-primary text-white shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] hover:border-white/20 transition-all"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Blog Manager ────────────────────────────────────────────────────────────

export default function BlogManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["admin-blog-posts"],
    queryFn: () => api.getAdminBlogPosts(),
  });

  const createMutation = useMutation({
    mutationFn: (data: BlogPostCreate) => api.createBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BlogPostUpdate }) =>
      api.updateBlogPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setEditingPost(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  return (
    <div className="card-neon rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Blog Posts</h3>
          <p className="text-xs text-slate-500">Manage blog content and SEO</p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && posts && (
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
              {posts.length} post{posts.length !== 1 ? "s" : ""}
            </span>
          )}
          {!showForm && !editingPost && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold btn-primary shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <BlogForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isSaving={createMutation.isPending}
        />
      )}

      {/* Edit form */}
      {editingPost && (
        <BlogForm
          initial={{
            title: editingPost.title,
            content: editingPost.content,
            meta_description: editingPost.meta_description ?? "",
            status: editingPost.status,
          }}
          onSave={(data) =>
            updateMutation.mutate({ id: editingPost.id, data })
          }
          onCancel={() => setEditingPost(null)}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Title", "Status", "Published", "Actions"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                    h === "Actions" ? "text-right" : "text-left"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              : (posts ?? []).length === 0
              ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                          <FileText className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400">No blog posts yet.</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Create your first post to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                )
              : (posts ?? []).map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100 max-w-xs">
                          {post.title}
                        </p>
                        {post.meta_description && (
                          <p className="mt-0.5 truncate text-xs text-slate-500 max-w-xs">
                            {post.meta_description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={post.status} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {post.published_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDateTime(String(post.published_at))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this post?")) {
                              deleteMutation.mutate(post.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mutation errors */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="border-t border-white/[0.06] px-6 py-3">
          <p className="text-xs text-red-400">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : updateMutation.error instanceof Error
              ? updateMutation.error.message
              : deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : "An error occurred."}
          </p>
        </div>
      )}
    </div>
  );
}
