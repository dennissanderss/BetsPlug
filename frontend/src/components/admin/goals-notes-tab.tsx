"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  Check,
  Target,
  StickyNote,
  Calendar,
  ChevronDown,
  Pencil,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  todo: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  done: "bg-green-500/15 text-green-400",
};

const statusLabels: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const priorityColors: Record<number, string> = {
  0: "bg-slate-500/15 text-slate-400",
  1: "bg-amber-500/15 text-amber-400",
  2: "bg-red-500/15 text-red-400",
};

const priorityLabels: Record<number, string> = {
  0: "Low",
  1: "Medium",
  2: "High",
};

const categoryColors: Record<string, string> = {
  idea: "bg-purple-500/15 text-purple-400",
  bug: "bg-red-500/15 text-red-400",
  feature: "bg-blue-500/15 text-blue-400",
  other: "bg-slate-500/15 text-slate-400",
};

function Badge({ label, colorCls }: { label: string; colorCls: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        colorCls
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

const selectCls =
  "h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

// ---------------------------------------------------------------------------
// Goals section
// ---------------------------------------------------------------------------

function GoalsSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState(1);
  const [dueDate, setDueDate] = React.useState("");

  // Edit mode state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editPriority, setEditPriority] = React.useState(1);
  const [editDueDate, setEditDueDate] = React.useState("");

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["admin-goals"],
    queryFn: () => api.getAdminGoals(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: number;
      due_date?: string;
    }) => api.createAdminGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-goals"] });
      setTitle("");
      setDescription("");
      setPriority(1);
      setDueDate("");
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateAdminGoal(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminGoal(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-goals"] }),
  });

  function handleCreate() {
    if (!title.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    });
  }

  function toggleDone(goal: Goal) {
    const newStatus = goal.status === "done" ? "todo" : "done";
    updateMutation.mutate({ id: goal.id, data: { status: newStatus } });
  }

  function cycleStatus(goal: Goal) {
    const order = ["todo", "in_progress", "done"];
    const idx = order.indexOf(goal.status);
    const next = order[(idx + 1) % order.length];
    updateMutation.mutate({ id: goal.id, data: { status: next } });
  }

  function startEditing(goal: Goal) {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? "");
    setEditPriority(goal.priority);
    setEditDueDate(goal.due_date ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function handleSaveEdit() {
    if (!editingId || !editTitle.trim()) return;
    updateMutation.mutate(
      {
        id: editingId,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          priority: editPriority,
          due_date: editDueDate || undefined,
        },
      },
      { onSuccess: () => setEditingId(null) }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-neon rounded-xl p-4 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-4 w-1/2 bg-white/[0.04]" />
            <Skeleton className="h-3 w-1/3 bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Doelstellingen
          </h3>
          {goals && goals.length > 0 && (
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-400">
              {goals.filter((g) => g.status !== "done").length} open
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Plus className="h-3 w-3" />
          Add Goal
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card-neon rounded-xl p-4 space-y-3 border border-blue-500/20">
          <input
            type="text"
            placeholder="Goal title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <textarea
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-none")}
          />
          <div className="flex gap-3">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-slate-400">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className={cn(selectCls, "w-full")}
              >
                <option value={0} className="bg-[#111827]">
                  Low
                </option>
                <option value={1} className="bg-[#111827]">
                  Medium
                </option>
                <option value={2} className="bg-[#111827]">
                  High
                </option>
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-slate-400">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(selectCls, "w-full")}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || createMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-400">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create goal."}
            </p>
          )}
        </div>
      )}

      {/* Goals list */}
      {!goals || goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-12 text-center">
          <Target className="mb-3 h-6 w-6 text-slate-600" />
          <p className="text-sm text-slate-500">No goals yet. Add your first goal!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) =>
            editingId === goal.id ? (
              /* ── Inline edit form ── */
              <div
                key={goal.id}
                className="card-neon rounded-xl p-4 space-y-3 border border-blue-500/20"
              >
                <input
                  type="text"
                  placeholder="Goal title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
                <div className="flex gap-3">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-medium text-slate-400">
                      Priority
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(Number(e.target.value))}
                      className={cn(selectCls, "w-full")}
                    >
                      <option value={0} className="bg-[#111827]">Low</option>
                      <option value={1} className="bg-[#111827]">Medium</option>
                      <option value={2} className="bg-[#111827]">High</option>
                    </select>
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-medium text-slate-400">
                      Due date
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className={cn(selectCls, "w-full")}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editTitle.trim() || updateMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal goal card ── */
              <div
                key={goal.id}
                className={cn(
                  "card-neon rounded-xl p-4 transition-all hover:bg-white/[0.03]",
                  goal.status === "done" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleDone(goal)}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      goal.status === "done"
                        ? "border-green-500/50 bg-green-500/20 text-green-400"
                        : "border-white/20 bg-white/[0.04] text-transparent hover:border-white/30"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium text-slate-100",
                          goal.status === "done" && "line-through text-slate-500"
                        )}
                      >
                        {goal.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditing(goal)}
                          className="rounded p-0.5 text-slate-600 transition-colors hover:text-blue-400"
                          title="Edit goal"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(goal.id)}
                          className="rounded p-0.5 text-slate-600 transition-colors hover:text-red-400"
                          title="Delete goal"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {goal.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {goal.description}
                      </p>
                    )}

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => cycleStatus(goal)}>
                        <Badge
                          label={statusLabels[goal.status] ?? goal.status}
                          colorCls={statusColors[goal.status] ?? "bg-slate-500/15 text-slate-400"}
                        />
                      </button>
                      <Badge
                        label={priorityLabels[goal.priority] ?? "Low"}
                        colorCls={priorityColors[goal.priority] ?? priorityColors[0]}
                      />
                      {goal.due_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(goal.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes section
// ---------------------------------------------------------------------------

function NotesSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("idea");

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["admin-notes"],
    queryFn: () => api.getAdminNotes(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { content: string; category?: string }) =>
      api.createAdminNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      setContent("");
      setCategory("idea");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminNote(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] }),
  });

  function handleCreate() {
    if (!content.trim()) return;
    createMutation.mutate({
      content: content.trim(),
      category,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/[0.03] p-3 space-y-2">
            <Skeleton className="h-4 w-full bg-white/[0.06]" />
            <Skeleton className="h-3 w-1/3 bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-100">Quick Notes</h3>
          {notes && notes.length > 0 && (
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-400">
              {notes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500"
        >
          <Plus className="h-3 w-3" />
          Add Note
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-purple-500/20 bg-white/[0.02] p-3 space-y-2.5">
          <textarea
            placeholder="Write a quick note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-none text-xs")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleCreate();
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(selectCls, "text-xs")}
            >
              <option value="idea" className="bg-[#111827]">
                Idea
              </option>
              <option value="bug" className="bg-[#111827]">
                Bug
              </option>
              <option value="feature" className="bg-[#111827]">
                Feature
              </option>
              <option value="other" className="bg-[#111827]">
                Other
              </option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!content.trim() || createMutation.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save
              </button>
            </div>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-red-400">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create note."}
            </p>
          )}
        </div>
      )}

      {/* Notes list */}
      {!notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-10 text-center">
          <StickyNote className="mb-2 h-5 w-5 text-slate-600" />
          <p className="text-xs text-slate-500">No notes yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    label={note.category}
                    colorCls={categoryColors[note.category] ?? categoryColors.other}
                  />
                  <span className="text-[10px] text-slate-600">
                    {formatDate(note.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(note.id)}
                className="shrink-0 rounded p-0.5 text-slate-700 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined tab
// ---------------------------------------------------------------------------

export default function GoalsNotesTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      {/* Left: Goals (60%) */}
      <div className="card-neon rounded-xl p-6">
        <GoalsSection />
      </div>

      {/* Right: Notes (40%) */}
      <div className="card-neon rounded-xl p-5">
        <NotesSection />
      </div>
    </div>
  );
}
