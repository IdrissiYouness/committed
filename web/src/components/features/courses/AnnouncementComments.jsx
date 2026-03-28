import React, { useState, useEffect } from 'react';
import { Send, Trash2, Edit2 } from 'lucide-react';
import commentService from '../../../services/commentService';
import { useAuthStore } from '../../../store/authStore';
import Button from '../../common/Button';
import toast from 'react-hot-toast';

export default function AnnouncementComments({ courseId, announcementId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const user = useAuthStore((s) => s.user);

  const fetchComments = async () => {
    try {
      const data = await commentService.getAll(courseId, announcementId);
      setComments(data?.content || data || []);
    } catch (error) {
      console.error('Failed to load comments', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [courseId, announcementId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await commentService.create(courseId, announcementId, { content: newComment });
      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  
  const handleUpdate = async (e, id) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    try {
      await commentService.update(courseId, announcementId, id, { content: editContent });
      setEditingId(null);
      fetchComments();
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      await commentService.delete(courseId, announcementId, id);
      fetchComments();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) return <div className="text-sm text-neutral-400 mt-2">Loading comments...</div>;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.commentId || c.id} className="flex justify-between items-start text-sm bg-neutral-50 p-3 rounded-lg group">
            
            {editingId === (c.commentId || c.id) ? (
              <form onSubmit={(e) => handleUpdate(e, c.commentId || c.id)} className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 text-sm rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <Button type="submit" size="sm" variant="secondary">Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <div>
                  <span className="font-semibold text-neutral-800 mr-2">{c.user?.fullName || 'User'}</span>
                  <span className="text-neutral-600">{c.content}</span>
                </div>
                {Number(user?.userId) === (c.user?.userId || c.userId) && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingId(c.commentId || c.id); setEditContent(c.content); }}
                      className="text-neutral-400 hover:text-primary-600"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.commentId || c.id)}
                      className="text-neutral-400 hover:text-error-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Add a comment..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 text-sm rounded-md border-neutral-200 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
        <Button type="submit" size="sm" variant="secondary">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
