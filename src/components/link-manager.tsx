"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
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
import { ClicksPopover } from "@/components/clicks-popover";
import { normalizeUrl, isValidUrl, detectIconForUrl } from "@/lib/utils";
import type { LinkRow } from "@/components/phone-preview";

// ---------------------------------------------------------------------------
// Server action prop types
// ---------------------------------------------------------------------------

type FormAction = (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
type ThumbAction = (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
type ReorderAction = (linkIds: string[]) => Promise<{ ok: boolean; message?: string }>;

export type { LinkRow };

// ---------------------------------------------------------------------------
// LinkManager
// ---------------------------------------------------------------------------

export function LinkManager({
  initialLinks,
  clicksByLink,
  clicksDailyByLink,
  createLinkAction,
  updateLinkAction,
  toggleLinkAction,
  deleteLinkAction,
  reorderAction,
  uploadThumbnailAction,
}: {
  initialLinks: LinkRow[];
  /** linkId → click count over the last 30 days. */
  clicksByLink: Record<string, number>;
  /** linkId → 30 daily buckets (oldest → newest) for the mini chart. */
  clicksDailyByLink: Record<string, number[]>;
  createLinkAction: FormAction;
  updateLinkAction: FormAction;
  toggleLinkAction: FormAction;
  deleteLinkAction: FormAction;
  reorderAction: ReorderAction;
  uploadThumbnailAction: ThumbAction;
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
            <div className="animate-pop-in rounded-xl border border-dashed border-edge p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-body">Nothing Here, Add It🗿</p>
            </div>
          ) : (
            <ul className="stagger space-y-3" aria-label="Your links">
              {links.map((link) => (
                <li key={link.id}>
                  <SortableLinkRow
                    link={link}
                    clicks={clicksByLink[link.id] ?? 0}
                    clickSeries={clicksDailyByLink[link.id] ?? []}
                    isEditing={editingId === link.id}
                    isDragging={isDragging}
                    onEdit={() => setEditingId(editingId === link.id ? null : link.id)}
                    updateAction={updateLinkAction}
                    toggleAction={toggleLinkAction}
                    deleteAction={deleteLinkAction}
                    uploadThumbnailAction={uploadThumbnailAction}
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

  // Auto-detect a matching icon from the domain as the user types the URL,
  // so most links get the right icon without touching the picker.
  const [autoIcon, setAutoIcon] = useState<string | null>(null);
  const [showIconHint, setShowIconHint] = useState(false);
  const lastAutoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isValidUrl(url)) {
      setAutoIcon(null);
      setShowIconHint(false);
      lastAutoRef.current = null;
      return;
    }
    const detected = detectIconForUrl(url);
    if (detected !== "link" && detected !== lastAutoRef.current) {
      lastAutoRef.current = detected;
      setAutoIcon(detected);
      setShowIconHint(true);
    } else if (detected === "link") {
      setAutoIcon(null);
    }
  }, [url]);

  return (
    <form
      action={async (fd) => {
        if (isPending) return;
        fd.set("url", normalizeUrl(url));
        // Auto-detected icon (falls back to "link" server-side).
        fd.set("icon", autoIcon ?? "link");
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
          toast.error("Something went wrong. Try again.");
        } finally {
          setIsPending(false);
        }
      }}
      className="rounded-xl border border-edge bg-surface p-4 transition-colors focus-within:border-brand/50"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-title">Title</Label>
          <Input
            id="new-title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yo Wasup"
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
            placeholder="minetallestpower.com"
            inputMode="url"
            className="mt-1.5"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted" aria-live="polite">
          {!valid && (title.trim() || url)
            ? "Add a title and a valid URL to continue."
            : showIconHint && autoIcon
              ? "" // icon chip below already communicates the auto-detection
              : ""}
        </p>
        <Button type="submit" disabled={!valid || isPending} size="sm">
          {isPending ? <Spinner /> : null}
          {isPending ? "Adding…" : "+ Add link"}
        </Button>
      </div>

      {showIconHint && autoIcon ? (
        <div className="animate-fade-in mt-2 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
          <LinkIcon name={autoIcon} color="#10b981" />
          <span className="text-xs text-body">
            We detected this is a <strong className="font-semibold">{autoIcon.replace("_", " ")}</strong> link and picked a matching icon.
          </span>
          <button
            type="button"
            onClick={() => setShowIconHint(false)}
            className="ml-auto rounded p-1 text-faint transition-colors hover:text-body"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
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
  clicks,
  clickSeries,
  isEditing,
  isDragging,
  onEdit,
  updateAction,
  toggleAction,
  deleteAction,
  uploadThumbnailAction,
  onDeleted,
}: {
  link: LinkRow;
  clicks: number;
  clickSeries: number[];
  isEditing: boolean;
  isDragging: boolean;
  onEdit: () => void;
  updateAction: FormAction;
  toggleAction: FormAction;
  deleteAction: FormAction;
  uploadThumbnailAction: ThumbAction;
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
      toast.update(loadingId, { kind: "error", message: "Network error. Try again." });
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-surface transition-colors duration-200 ${
        isEditing ? "border-brand/40" : "border-edge hover:border-faint"
      }`}
    >
      <div className="flex items-center gap-3 p-3 max-sm:p-2.5">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-body active:cursor-grabbing"
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
          <p className="truncate text-sm font-medium text-body">
            {link.title}
            {link.display_mode === "featured" ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-600 dark:text-amber-300">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8L12 2Z" />
                </svg>
                Featured
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-muted">{link.url}</p>
        </div>

        {/* 30-day click count — tap for the mini chart; eye-off icon when hidden */}
        {!optimisticActive ? (
          <span
            className="hidden shrink-0 items-center gap-1 text-xs text-faint sm:inline-flex"
            title="Hidden from visitors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.4 3.4M7.4 7.5C5.2 8.7 3.7 10.6 3 12c1.7 3.4 5 6 9 6 1.6 0 3.1-.4 4.4-1.1M10 6.2c.6-.1 1.3-.2 2-.2 4 0 7.3 2.6 9 6-.4.9-1 1.8-1.8 2.7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            hidden
          </span>
        ) : (
          <ClicksPopover series={clickSeries} total={clicks} title={link.title} />
        )}

        <div className="flex items-center gap-2">
          <Switch
            checked={optimisticActive}
            disabled={isToggling}
            onCheckedChange={handleToggle}
            aria-label="Toggle link visibility"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="transition-transform active:scale-95 max-sm:px-2"
          >
            {isEditing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <EditForm
          link={link}
          updateAction={updateAction}
          deleteAction={deleteAction}
          uploadThumbnailAction={uploadThumbnailAction}
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
  uploadThumbnailAction,
  confirmingDelete,
  onConfirmDeleteChange,
  onDeleted,
}: {
  link: LinkRow;
  updateAction: FormAction;
  deleteAction: FormAction;
  uploadThumbnailAction: ThumbAction;
  confirmingDelete: boolean;
  onConfirmDeleteChange: (v: boolean) => void;
  onDeleted: () => void;
}) {
  const [icon, setIcon] = useState(
    // Pre-fill a better guess if the link still has the generic icon.
    link.icon === "link" && link.url ? detectIconForUrl(link.url) : link.icon,
  );
  const [isPending, setIsPending] = useState<"save" | "delete" | null>(null);
  const [displayMode, setDisplayMode] = useState<"classic" | "featured">(link.display_mode ?? "classic");
  const [thumbUploading, setThumbUploading] = useState(false);
  const toast = useToast();

  async function handleThumbUpload(file: File) {
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.set("id", link.id);
      fd.set("file", file);
      const res = await uploadThumbnailAction(fd);
      if (res?.ok) toast.success(res.message ?? "Thumbnail updated.");
      else toast.error(res?.message ?? "Upload failed.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setThumbUploading(false);
    }
  }

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
          toast.error("Something went wrong. Try again.");
        } finally {
          setIsPending(null);
        }
      }}
      className="animate-fade-in border-t border-edge p-4"
    >
      <input type="hidden" name="id" value={link.id} />
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="display_mode" value={displayMode} />

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

      {/* Display mode — Classic row vs. Featured card, Linktree-style */}
      <div className="mt-4">
        <Label>Display</Label>
        <p className="mt-0.5 text-xs text-muted">How this link appears on your page</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDisplayMode("classic")}
            aria-pressed={displayMode === "classic"}
            className={`rounded-xl border-2 p-4 text-center transition-all active:scale-[0.98] ${
              displayMode === "classic"
                ? "border-brand bg-brand/10"
                : "border-edge hover:border-faint"
            }`}
          >
            {/* Classic illustration: pill row */}
            <span className="mx-auto mb-2 flex h-9 w-28 items-center gap-1.5 rounded-lg border-2 border-current px-1.5 text-faint">
              <span className="h-4 w-4 shrink-0 rounded bg-current opacity-60" />
              <span className="h-1.5 w-14 rounded bg-current opacity-40" />
            </span>
            <span className="text-xs font-semibold">Classic</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("featured")}
            aria-pressed={displayMode === "featured"}
            className={`rounded-xl border-2 p-4 text-center transition-all active:scale-[0.98] ${
              displayMode === "featured"
                ? "border-brand bg-brand/10"
                : "border-edge hover:border-faint"
            }`}
          >
            {/* Featured illustration: card with image area */}
            <span className="mx-auto mb-2 flex h-9 w-28 flex-col overflow-hidden rounded-lg border-2 border-current text-faint">
              <span className="h-5 w-full bg-current opacity-50" />
              <span className="h-1 w-10 self-center rounded bg-current opacity-40" />
            </span>
            <span className="text-xs font-semibold">Featured</span>
          </button>
        </div>
      </div>

      {/* Thumbnail — only relevant for featured mode */}
      {displayMode === "featured" ? (
        <div className="animate-fade-in mt-4 flex items-center gap-3 rounded-lg border border-edge bg-surface-2/60 p-3">
          {link.thumbnail_url ? (
            <Image
              src={link.thumbnail_url}
              alt="Thumbnail"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-faint">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M5 17l4.5-4.5 3 3L16 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-body">Thumbnail</p>
            <p className="text-[11px] text-muted">Square images work best. Max 3 MB.</p>
          </div>
          <label
            className={`cursor-pointer rounded-lg bg-surface-2 px-3 py-2 text-xs font-semibold text-body transition-colors hover:bg-edge ${
              thumbUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {thumbUploading ? "Uploading…" : link.thumbnail_url ? "Change" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={thumbUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleThumbUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : null}

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
            <span className="text-xs text-muted">Delete this link?</span>
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
                  toast.error("Something went wrong. Try again.");
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
