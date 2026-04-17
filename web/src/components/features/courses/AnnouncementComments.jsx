import React, { useEffect, useMemo, useState } from 'react';
import { Send, Trash2, Edit2, MessageCircleReply, ChevronDown, ChevronUp } from 'lucide-react';
import commentService from '../../../services/commentService';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

const DEFAULT_VISIBLE_REPLIES = 3;

const getCommentId = (comment) => comment?.commentId ?? comment?.id;

const toTimestamp = (value) => new Date(value || 0).getTime();

const normalizeComments = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    commentId: getCommentId(item),
    parentCommentId: item?.parentCommentId ?? null,
  }));

/**
 * Build "social style" thread groups:
 * - top-level comments are roots
 * - ALL descendants are flattened into a single reply lane under their root
 * - each reply keeps context via replyTo metadata
 */
const buildThreadGroups = (flatComments) => {
  const normalized = normalizeComments(flatComments).filter((c) => c.commentId != null);
  const byId = new Map(normalized.map((c) => [c.commentId, c]));

  const roots = normalized
    .filter((c) => c.parentCommentId == null || !byId.has(c.parentCommentId))
    .sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));

  const groups = roots.map((root) => ({
    root,
    replies: [],
  }));

  const rootIdByCommentId = new Map();
  roots.forEach((root) => rootIdByCommentId.set(root.commentId, root.commentId));

  // Resolve each comment to its root by walking parent chain
  const resolveRootId = (comment) => {
    if (!comment || comment.commentId == null) return null;
    if (rootIdByCommentId.has(comment.commentId)) return rootIdByCommentId.get(comment.commentId);

    const visited = new Set();
    let cursor = comment;
    while (cursor && cursor.parentCommentId != null && !visited.has(cursor.commentId)) {
      visited.add(cursor.commentId);
      const parent = byId.get(cursor.parentCommentId);
      if (!parent) break;
      if (rootIdByCommentId.has(parent.commentId)) {
        const rootId = rootIdByCommentId.get(parent.commentId);
        rootIdByCommentId.set(comment.commentId, rootId);
        return rootId;
      }
      cursor = parent;
    }

    // Fallback to self if chain broken
    rootIdByCommentId.set(comment.commentId, comment.commentId);
    return comment.commentId;
  };

  const groupByRootId = new Map(groups.map((g) => [g.root.commentId, g]));
  normalized.forEach((comment) => {
    if (comment.parentCommentId == null || !byId.has(comment.parentCommentId)) return;
    const rootId = resolveRootId(comment);
    const group = groupByRootId.get(rootId);
    if (!group) return;

    const parent = byId.get(comment.parentCommentId);
    group.replies.push({
      ...comment,
      replyToName: parent?.user?.fullName || null,
      parentCommentId: comment.parentCommentId,
    });
  });

  groups.forEach((group) => {
    group.replies.sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
  });

  return groups;
};

function ReplyToggleButton({ expanded, hiddenCount, onToggle }) {
  if (hiddenCount <= 0 && !expanded) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
    >
      {expanded ? (
        <>
          <ChevronUp className="h-3.5 w-3.5" />
          Hide replies
        </>
      ) : (
        <>
          <ChevronDown className="h-3.5 w-3.5" />
          View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
        </>
      )}
    </button>
  );
}

function CommentActions({ isOwner, onReply, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onReply}
        className="rounded p-1 text-neutral-400 hover:text-primary-600"
        aria-label="Reply"
        type="button"
      >
        <MessageCircleReply className="h-3.5 w-3.5" />
      </button>

      {isOwner && (
        <>
          <button
            onClick={onEdit}
            className="rounded p-1 text-neutral-400 hover:text-primary-600"
            aria-label="Edit comment"
            type="button"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-neutral-400 hover:text-error-600"
            aria-label="Delete comment"
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

function InlineEditor({ value, onChange, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border-neutral-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReplyComposer({ value, onChange, onSubmit, onCancel, placeholder }) {
  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
      <input
        type="text"
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border-neutral-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Reply
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CommentBubble({
  comment,
  isReply = false,
  currentUserId,
  editingId,
  editContent,
  replyingToId,
  replyContent,
  onStartEdit,
  onCancelEdit,
  onChangeEdit,
  onSubmitEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onChangeReply,
  onSubmitReply,
}) {
  const id = comment.commentId;
  const isEditing = editingId === id;
  const isReplying = replyingToId === id;
  const isOwner = Number(currentUserId) === Number(comment?.user?.userId || comment?.userId);
  const authorName = comment?.user?.fullName || 'User';
  const createdAtLabel = comment?.createdAt ? new Date(comment.createdAt).toLocaleString() : '';
  const replyToName = comment?.replyToName || null;

  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-3 ${isReply ? 'ml-4' : ''}`}>
      {isEditing ? (
        <InlineEditor
          value={editContent}
          onChange={onChangeEdit}
          onSubmit={(e) => onSubmitEdit(e, id)}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm">
                <span className="mr-2 font-semibold text-neutral-800">{authorName}</span>
                <span className="break-words text-neutral-700">{comment.content}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                {createdAtLabel ? <span>{createdAtLabel}</span> : null}
                {replyToName ? (
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-500">
                    Replying to @{replyToName}
                  </span>
                ) : null}
              </div>
            </div>

            <CommentActions
              isOwner={isOwner}
              onReply={() => onStartReply(comment)}
              onEdit={() => onStartEdit(comment)}
              onDelete={() => onDelete(id)}
            />
          </div>

          {isReplying && (
            <ReplyComposer
              value={replyContent}
              onChange={onChangeReply}
              onSubmit={(e) => onSubmitReply(e, id)}
              onCancel={onCancelReply}
              placeholder={`Reply to ${authorName}...`}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function AnnouncementComments({ courseId, announcementId }) {
  const user = useAuthStore((s) => s.user);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const [expandedThreads, setExpandedThreads] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const data = await commentService.getAll(courseId, announcementId, { page: 0, size: 300 });
      setComments(data?.content || data?.data || data || []);
    } catch (error) {
      toast.error(error?.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchComments();
  }, [courseId, announcementId]);

  const groups = useMemo(() => buildThreadGroups(comments), [comments]);

  const handleCreateTopLevel = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentService.create(courseId, announcementId, { content: newComment.trim() });
      setNewComment('');
      await fetchComments();
      toast.success('Comment added');
    } catch (error) {
      toast.error(error?.message || 'Failed to add comment');
    }
  };

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await commentService.create(courseId, announcementId, {
        content: replyContent.trim(),
        parentCommentId,
      });
      setReplyingToId(null);
      setReplyContent('');
      await fetchComments();
      toast.success('Reply added');
    } catch (error) {
      toast.error(error?.message || 'Failed to add reply');
    }
  };

  const handleSubmitEdit = async (e, id) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      await commentService.update(courseId, announcementId, id, { content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
      await fetchComments();
      toast.success('Comment updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update comment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment and its replies?')) return;

    try {
      await commentService.delete(courseId, announcementId, id);
      await fetchComments();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete comment');
    }
  };

  const handleToggleThread = (rootId) => {
    setExpandedThreads((prev) => ({ ...prev, [rootId]: !prev[rootId] }));
  };

  const openReplyComposer = (comment) => {
    const mention = `@${comment?.user?.fullName || 'user'} `;
    setReplyingToId(comment.commentId);
    setReplyContent(mention);
    setEditingId(null);
    setEditContent('');
  };

  if (isLoading) {
    return <div className="mt-2 text-sm text-neutral-400">Loading comments...</div>;
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <div className="mb-4 space-y-3">
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
            No comments yet. Start the discussion.
          </div>
        ) : (
          groups.map(({ root, replies }) => {
            const expanded = !!expandedThreads[root.commentId];
            const hasManyReplies = replies.length > DEFAULT_VISIBLE_REPLIES;
            const visibleReplies =
              hasManyReplies && !expanded ? replies.slice(0, DEFAULT_VISIBLE_REPLIES) : replies;
            const hiddenCount = Math.max(replies.length - visibleReplies.length, 0);

            return (
              <div key={root.commentId} className="space-y-2">
                <CommentBubble
                  comment={root}
                  currentUserId={user?.userId}
                  editingId={editingId}
                  editContent={editContent}
                  replyingToId={replyingToId}
                  replyContent={replyContent}
                  onStartEdit={(comment) => {
                    setEditingId(comment.commentId);
                    setEditContent(comment.content || '');
                    setReplyingToId(null);
                    setReplyContent('');
                  }}
                  onCancelEdit={() => {
                    setEditingId(null);
                    setEditContent('');
                  }}
                  onChangeEdit={setEditContent}
                  onSubmitEdit={handleSubmitEdit}
                  onDelete={handleDelete}
                  onStartReply={openReplyComposer}
                  onCancelReply={() => {
                    setReplyingToId(null);
                    setReplyContent('');
                  }}
                  onChangeReply={setReplyContent}
                  onSubmitReply={handleSubmitReply}
                />

                {visibleReplies.length > 0 && (
                  <div className="space-y-2 border-l border-neutral-200 pl-2">
                    {visibleReplies.map((reply) => (
                      <CommentBubble
                        key={reply.commentId}
                        comment={reply}
                        isReply
                        currentUserId={user?.userId}
                        editingId={editingId}
                        editContent={editContent}
                        replyingToId={replyingToId}
                        replyContent={replyContent}
                        onStartEdit={(comment) => {
                          setEditingId(comment.commentId);
                          setEditContent(comment.content || '');
                          setReplyingToId(null);
                          setReplyContent('');
                        }}
                        onCancelEdit={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                        onChangeEdit={setEditContent}
                        onSubmitEdit={handleSubmitEdit}
                        onDelete={handleDelete}
                        onStartReply={openReplyComposer}
                        onCancelReply={() => {
                          setReplyingToId(null);
                          setReplyContent('');
                        }}
                        onChangeReply={setReplyContent}
                        onSubmitReply={handleSubmitReply}
                      />
                    ))}
                  </div>
                )}

                {hasManyReplies && (
                  <ReplyToggleButton
                    expanded={expanded}
                    hiddenCount={hiddenCount}
                    onToggle={() => handleToggleThread(root.commentId)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleCreateTopLevel} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 rounded-md border-neutral-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
        <Button type="submit" size="sm" variant="secondary" aria-label="Post comment">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}