import React, { useEffect, useMemo, useState } from 'react';
import { Send, Trash2, Edit2, MessageCircleReply } from 'lucide-react';
import commentService from '../../../services/commentService';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

const getCommentId = (comment) => comment?.commentId ?? comment?.id;

const normalizeComments = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    commentId: getCommentId(item),
    parentCommentId: item?.parentCommentId ?? null,
    children: [],
  }));

const buildCommentTree = (flatComments) => {
  const normalized = normalizeComments(flatComments);
  const byId = new Map(normalized.map((c) => [c.commentId, { ...c, children: [] }]));
  const roots = [];

  normalized.forEach((comment) => {
    const node = byId.get(comment.commentId);
    const parentId = comment.parentCommentId;

    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByCreatedAt = (a, b) =>
    new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime();

  const sortRecursively = (nodes) => {
    nodes.sort(sortByCreatedAt);
    nodes.forEach((node) => sortRecursively(node.children));
  };

  sortRecursively(roots);
  return roots;
};

function CommentNode({
  node,
  depth = 0,
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
  const isEditing = editingId === node.commentId;
  const isReplying = replyingToId === node.commentId;
  const isOwner = Number(currentUserId) === Number(node?.user?.userId || node?.userId);
  const authorName = node?.user?.fullName || 'User';

  return (
    <div
      className={[
        'rounded-lg border border-neutral-200 bg-white p-3',
        depth > 0 ? 'ml-5 mt-2 border-l-4 border-l-neutral-200' : '',
      ].join(' ')}
    >
      {isEditing ? (
        <form onSubmit={(e) => onSubmitEdit(e, node.commentId)} className="flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            value={editContent}
            onChange={(e) => onChangeEdit(e.target.value)}
            className="w-full rounded-md border-neutral-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="secondary">
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm">
                <span className="mr-2 font-semibold text-neutral-800">{authorName}</span>
                <span className="text-neutral-700 break-words">{node.content}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {node?.createdAt ? new Date(node.createdAt).toLocaleString() : ''}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onStartReply(node)}
                className="rounded p-1 text-neutral-400 hover:text-primary-600"
                aria-label="Reply"
                type="button"
              >
                <MessageCircleReply className="h-3.5 w-3.5" />
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => onStartEdit(node)}
                    className="rounded p-1 text-neutral-400 hover:text-primary-600"
                    aria-label="Edit comment"
                    type="button"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(node.commentId)}
                    className="rounded p-1 text-neutral-400 hover:text-error-600"
                    aria-label="Delete comment"
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isReplying && (
            <form onSubmit={(e) => onSubmitReply(e, node.commentId)} className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                autoFocus
                placeholder={`Reply to ${authorName}...`}
                value={replyContent}
                onChange={(e) => onChangeReply(e.target.value)}
                className="w-full rounded-md border-neutral-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="secondary">
                  Reply
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onCancelReply}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {node.children?.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <CommentNode
              key={child.commentId}
              node={child}
              depth={depth + 1}
              currentUserId={currentUserId}
              editingId={editingId}
              editContent={editContent}
              replyingToId={replyingToId}
              replyContent={replyContent}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onChangeEdit={onChangeEdit}
              onSubmitEdit={onSubmitEdit}
              onDelete={onDelete}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onChangeReply={onChangeReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
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

  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const data = await commentService.getAll(courseId, announcementId, { page: 0, size: 200 });
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

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

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

  if (isLoading) {
    return <div className="mt-2 text-sm text-neutral-400">Loading comments...</div>;
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <div className="mb-4 space-y-3">
        {tree.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
            No comments yet. Start the discussion.
          </div>
        ) : (
          tree.map((node) => (
            <CommentNode
              key={node.commentId}
              node={node}
              currentUserId={user?.userId}
              editingId={editingId}
              editContent={editContent}
              replyingToId={replyingToId}
              replyContent={replyContent}
              onStartEdit={(comment) => {
                setEditingId(comment.commentId);
                setEditContent(comment.content || '');
              }}
              onCancelEdit={() => {
                setEditingId(null);
                setEditContent('');
              }}
              onChangeEdit={setEditContent}
              onSubmitEdit={handleSubmitEdit}
              onDelete={handleDelete}
              onStartReply={(comment) => {
                setReplyingToId(comment.commentId);
                setReplyContent(`@${comment?.user?.fullName || 'user'} `);
              }}
              onCancelReply={() => {
                setReplyingToId(null);
                setReplyContent('');
              }}
              onChangeReply={setReplyContent}
              onSubmitReply={handleSubmitReply}
            />
          ))
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