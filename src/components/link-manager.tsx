"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { LinkIcon, IconPickerGrid } from "@/components/link-icon";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import type { LinkRow } from "@/components/phone-preview";

// ---------------------------------------------------------------------------
// Server action prop types
// ---------------------------------------------------------------------------

type FormAction = (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
type ReorderAction = (linkIds: string[]) => Promise<{ ok: boolean; message?: string }>;

export type { LinkRow };

// ---------------------------------------------------------------------------
// LinkManager
// ---------------------------------------------------------------------------

export function LinkManager({
  initialLinks,
  createLinkAction,
  updateLinkAction,
  toggleLinkAction,
  deleteLinkAction,
  reorderAction,
}: {
  initialLinks: LinkRow[];
  createLinkAction: FormAction;
  updateLinkAction: FormAction;
  toggleLinkAction: FormAction;
  deleteLinkAction: FormAction;
  reorderAction: ReorderAction;
}) {
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, startTransition] = useTransition();

  // Keep local state fresh after a server round-trip (e.g., create/delete).
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart() {
    setIsDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(links, oldIndex, newIndex);
    setLinks(next);

    // Fire the server action with the new id order.
    startTransition(async () => {
      const res = await reorderAction(next.map((l) => l.id));
      if (res && !res.ok) {
        setLinks(links); // roll back on failure
      }
    });
  }

  return (
    <div className="space-y-3">
      <AddLinkForm createAction={createLinkAction} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setIsDragging(false)}
      >
        <SortableContext
          items={links.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {links.length === 0 ? (
            <div className="animate-pop-in rounded-xl border border-dashed border-zinc-700 p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-300">Your tree is empty</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add your first link above and it appears on your public page instantly.
              </p>
            </div>
          ) : (
            <ul className="stagger space-y-3" aria-label="Your links">
              {links.map((link) => (
                <li key={link.id}>
                  <SortableLinkRow
                    link={link}
                    isEditing={editingId === link.id}
                    isDragging={isDragging}
                    onEdit={() => setEditingId(editingId === link.id ? null : link.id)}
                    updateAction={updateLinkAction}
                    toggleAction={toggleLinkAction}
                    deleteAction={deleteLinkAction}
                    onDeleted={() => setEditingId((cur) => (cur === link.id ? null : cur))}
                  />
                </li>
              ))}
            </ul>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add link form
// ---------------------------------------------------------------------------

function AddLinkForm({ createAction }: { createAction: FormAction }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();
  const valid = title.trim().length > 0 && isValidUrl(url);

  return (
    <form
      action={async (fd) => {
        if (isPending) return;
        fd.set("url", normalizeUrl(url));
        setIsPending(true);
        try {
          const res = await createAction(fd);
          if (res?.ok) {
            toast.success(res.message ?? "Link added.");
            setTitle("");
            setUrl("");
          } else {
            toast.error(res?.message ?? "Couldn't add the link.");
          }
        } catch {
          toast.error("Something went wrong — try again.");
        } finally {
          setIsPending(false);
        }
      }}
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors focus-within:border-emerald-500/50"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-title">Title</Label>
          <Input
            id="new-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My newsletter"
            maxLength={120}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="new-url">URL</Label>
          <Input
            id="new-url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com/post"
            inputMode="url"
            className="mt-1.5"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500" aria-live="polite">
          {!valid && (title.trim() || url) ? "Add a title and a valid URL to continue." : ""}
        </p>
        <Button type="submit" disabled={!valid || isPending} size="sm">
          {isPending ? <Spinner /> : null}
          {isPending ? "Adding…" : "+ Add link"}
        </Button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// One sortable row (drag handle + toggle + inline editor)
// ---------------------------------------------------------------------------

function SortableLinkRow({
  link,
  isEditing,
  isDragging,
  onEdit,
  updateAction,
  toggleAction,
  deleteAction,
  onDeleted,
}: {
  link: LinkRow;
  isEditing: boolean;
  isDragging: boolean;
  onEdit: () => void;
  updateAction: FormAction;
  toggleAction: FormAction;
  deleteAction: FormAction;
  onDeleted: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const toast = useToast();
  const [optimisticActive, setOptimisticActive] = useState(link.is_active);
  const [isToggling, setIsToggling] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => setOptimisticActive(link.is_active), [link.is_active]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  async function handleToggle(checked: boolean) {
    if (isToggling) return;
    setOptimisticActive(checked); // instant feedback
    setIsToggling(true);

    const loadingId = toast.loading(checked ? "Showing link…" : "Hiding link…");
    try {
      const fd = new FormData();
      fd.set("id", link.id);
      fd.set("is_active", String(checked));
      const res = await toggleAction(fd);
      if (res?.ok) {
        toast.update(loadingId, { kind: "success", message: res.message ?? "Saved." });
      } else {
        setOptimisticActive(!checked); // roll back
        toast.update(loadingId, {
          kind: "error",
          message: res?.message ?? "Couldn't update visibility.",
        });
      }
    } catch {
      setOptimisticActive(!checked); // roll back
      toast.update(loadingId, { kind: "error", message: "Network error — try again." });
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-zinc-900 transition-colors duration-200 ${
        isEditing ? "border-emerald-500/40" : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="9" cy="6" r="1.4" fill="currentColor" />
            <circle cx="15" cy="6" r="1.4" fill="currentColor" />
            <circle cx="9" cy="12" r="1.4" fill="currentColor" />
            <circle cx="15" cy="12" r="1.4" fill="currentColor" />
            <circle cx="9" cy="18" r="1.4" fill="currentColor" />
            <circle cx="15" cy="18" r="1.4" fill="currentColor" />
          </svg>
        </button>

        <LinkIcon name={link.icon} color="#10b981" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{link.title}</p>
          <p className="truncate text-xs text-zinc-500">{link.url}</p>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={optimisticActive}
            disabled={isToggling}
            onCheckedChange={handleToggle}
            aria-label="Toggle link visibility"
          />
          <Button variant="ghost" size="sm" onClick={onEdit} className="transition-transform active:scale-95">
            {isEditing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <EditForm
          link={link}
          updateAction={updateAction}
          deleteAction={deleteAction}
          confirmingDelete={confirmingDelete}
          onConfirmDeleteChange={setConfirmingDelete}
          onDeleted={onDeleted}
        />
      ) : null}
    </div>
  );
}

function EditForm({
  link,
  updateAction,
  deleteAction,
  confirmingDelete,
  onConfirmDeleteChange,
  onDeleted,
}: {
  link: LinkRow;
  updateAction: FormAction;
  deleteAction: FormAction;
  confirmingDelete: boolean;
  onConfirmDeleteChange: (v: boolean) => void;
  onDeleted: () => void;
}) {
  const [icon, setIcon] = useState(link.icon);
  const [isPending, setIsPending] = useState<"save" | "delete" | null>(null);
  const toast = useToast();

  return (
    <form
      action={async (fd) => {
        if (isPending) return;
        setIsPending("save");
        try {
          const res = await updateAction(fd);
          if (res?.ok) toast.success(res.message ?? "Changes saved.");
          else toast.error(res?.message ?? "Couldn't save changes.");
        } catch {
          toast.error("Something went wrong — try again.");
        } finally {
          setIsPending(null);
        }
      }}
      className="animate-fade-in border-t border-zinc-800 p-4"
    >
      <input type="hidden" name="id" value={link.id} />
      <input type="hidden" name="icon" value={icon} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`title-${link.id}`}>Title</Label>
          <Input
            id={`title-${link.id}`}
            name="title"
            defaultValue={link.title}
            maxLength={120}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor={`url-${link.id}`}>URL</Label>
          <Input
            id={`url-${link.id}`}
            name="url"
            defaultValue={link.url}
            inputMode="url"
            className="mt-1.5"
            required
          />
        </div>
      </div>

      <div className="mt-3">
        <Label>Icon</Label>
        <div className="mt-2">
          <IconPickerGrid value={icon} onChange={setIcon} />
        </div>
      </div>

      <input
        type="hidden"
        name="is_active"
        value={link.is_active ? "true" : "false"}
      />

      <div className="mt-4 flex items-center justify-between gap-2">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Delete this link?</span>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              disabled={isPending !== null}
              onClick={async () => {
                setIsPending("delete");
                try {
                  const fd = new FormData();
                  fd.set("id", link.id);
                  const res = await deleteAction(fd);
                  if (res?.ok) {
                    toast.success(res.message ?? "Link deleted.");
                    onDeleted();
                  } else {
                    toast.error(res?.message ?? "Couldn't delete the link.");
                  }
                } catch {
                  toast.error("Something went wrong — try again.");
                } finally {
                  setIsPending(null);
                  onConfirmDeleteChange(false);
                }
              }}
            >
              {isPending === "delete" ? <Spinner /> : null}
              {isPending === "delete" ? "Deleting…" : "Yes, delete"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => onConfirmDeleteChange(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={isPending !== null}
            onClick={() => onConfirmDeleteChange(true)}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Delete
          </Button>
        )}

        <Button type="submit" size="sm" disabled={isPending !== null}>
          {isPending === "save" ? <Spinner /> : null}
          {isPending === "save" ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
