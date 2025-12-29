import React, { useState, useEffect, useCallback } from 'react'
import { reportAPI } from '../api/reports'
import type { ReportComment } from '../types/report'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import Card from './Card'
import Toast from './Toast'

interface CommentsPanelProps {
  reportId: number
  onClose?: () => void
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ reportId, onClose }) => {
  const { user } = useAuth()
  const [comments, setComments] = useState<ReportComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportAPI.getCommentsByReportId(reportId)
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) {
      setToast({ message: 'Comment cannot be empty', type: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const comment = await reportAPI.addCommentToReport(reportId, newComment.trim())
      setComments([...comments, comment])
      setNewComment('')
      setToast({ message: 'Comment added successfully', type: 'success' })
    } catch (err) {
      console.error('Failed to add comment:', err)
      setToast({ message: 'Failed to add comment', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editingText.trim()) {
      setToast({ message: 'Comment cannot be empty', type: 'error' })
      return
    }

    try {
      const updatedComment = await reportAPI.editCommentOnReport(reportId, commentId, editingText.trim())
      setComments(comments.map(c => c.id === commentId ? updatedComment : c))
      setEditingCommentId(null)
      setEditingText('')
      setToast({ message: 'Comment updated successfully', type: 'success' })
    } catch (err) {
      console.error('Failed to edit comment:', err)
      setToast({ message: 'Failed to update comment', type: 'error' })
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId)
    try {
      await reportAPI.deleteCommentFromReport(reportId, commentId)
      setComments(comments.filter(c => c.id !== commentId))
      setToast({ message: 'Comment deleted successfully', type: 'success' })
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setToast({ message: 'Failed to delete comment', type: 'error' })
    } finally {
      setDeletingCommentId(null)
    }
  }

  const startEditing = (comment: ReportComment) => {
    setEditingCommentId(comment.id)
    setEditingText(comment.comment)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const canEditOrDelete = (comment: ReportComment): boolean => {
    return user ? user.id === comment.commenter_id : false
  }

  return (
    <div className="w-full max-h-[600px] flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            aria-label="Close comments"
          >
            ×
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No comments yet.</div>
        ) : (
          comments.map(comment => (
            <Card key={comment.id} className="p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {user && user.id === comment.commenter_id ? 'You' : (
                      (comment as any).userdata ? 
                        `${(comment as any).userdata.first_name} ${(comment as any).userdata.last_name}` 
                        : `User ${comment.commenter_id}`
                    )}
                  </div>
                </div>
                {canEditOrDelete(comment) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(comment)}
                      disabled={editingCommentId === comment.id}
                      className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    id="updateCommentInput"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                    rows={3}
                    placeholder="Edit your comment..."
                  />
                  <div className="flex gap-2">
                    <button
                      id="updateCommentSave"
                      onClick={() => handleEditComment(comment.id)}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-xs px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleAddComment} className="space-y-2">
          <textarea
            id="newCommentInput"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={submitting}
            className="w-full p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              id="newCommentSave"
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default CommentsPanel
