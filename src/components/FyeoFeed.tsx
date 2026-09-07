import React, { useState } from "react";
import { FyeoPost, FyeoComment, EmojiReactionKey } from "../types";
import { Shield, Clock, AlertTriangle, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface FyeoFeedProps {
  posts: FyeoPost[];
  comments: FyeoComment[];
  isAdmin?: boolean;
  onReactPost?: (postId: string, emoji: EmojiReactionKey) => void;
  onReactComment?: (commentId: string, emoji: EmojiReactionKey) => void;
  onPostComment: (postId: string, authorName: string, authorEmail: string, content: string) => Promise<{ success: boolean; error?: string }>;
  onCreatePost?: () => void;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const FyeoFeed: React.FC<FyeoFeedProps> = ({
  posts,
  comments,
  isAdmin,
  onReactPost,
  onReactComment,
  onPostComment,
  onCreatePost,
  onEditPost,
  onDeletePost
}) => {
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmitComment = async (postId: string) => {
    if (!commentEmail.includes("@")) {
      setErrorMsg("Debes ingresar un correo electrónico válido.");
      return;
    }
    if (commentContent.trim().length < 3) {
      setErrorMsg("El comentario debe tener al menos 3 caracteres.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    
    const res = await onPostComment(postId, commentName, commentEmail, commentContent);
    
    setIsSubmitting(false);
    if (res.success) {
      setCommentContent("");
      setActiveCommentPost(null);
    } else {
      setErrorMsg(res.error || "No se pudo publicar el comentario.");
    }
  };

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        {isAdmin && onCreatePost && (
          <div className="flex justify-end">
            <Button onClick={onCreatePost} variant="hero" className="border-2 border-black font-black">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Comunicado
            </Button>
          </div>
        )}
        <div className="text-center py-20 bg-black text-white border-4 border-red-600 rounded-xl shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
          <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Acceso Restringido</h2>
          <p className="text-zinc-400 font-bold max-w-sm mx-auto">No hay registros clasificados disponibles en este momento. Mantén los ojos abiertos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <div className="bg-black text-red-500 border-4 border-red-600 rounded-xl p-6 text-center shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
        <Shield className="w-10 h-10 mx-auto mb-2" />
        <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">For Your Eyes Only</h1>
        <p className="text-sm font-bold text-zinc-300">Registros y comunicados oficiales del cuerpo de moderación de UA Underground.</p>
      </div>

      {isAdmin && onCreatePost && (
        <div className="flex justify-end">
          <Button onClick={onCreatePost} variant="hero" className="border-2 border-black font-black">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Comunicado
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => {
          const postComments = comments.filter(c => c.postId === post.id);
          
          return (
            <div key={post.id} className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-zinc-100 border-b-4 border-black p-4 sm:p-6 flex flex-col gap-4 relative">
                
                {/* Admin controls */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    {onEditPost && (
                      <button onClick={() => onEditPost(post.id)} className="p-1.5 bg-white border-2 border-black rounded hover:bg-amber-100 cursor-pointer transition-colors" title="Editar comunicado">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDeletePost && (
                      <button onClick={() => { if(window.confirm('¿Seguro que deseas eliminar este comunicado?')) onDeletePost(post.id); }} className="p-1.5 bg-white border-2 border-black rounded hover:bg-red-100 text-red-600 cursor-pointer transition-colors" title="Borrar comunicado">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 pr-16">
                  <div className="w-14 h-14 rounded-full border-2 border-black overflow-hidden shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black">
                    <img src={post.authorAvatar} alt="Autor" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight text-black break-words">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-red-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest">
                        {post.authorAlias}
                      </span>
                      <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich Content Render */}
              <div 
                className="p-6 prose prose-zinc max-w-none prose-headings:font-black prose-headings:uppercase prose-p:font-semibold prose-a:text-red-600 prose-a:font-bold prose-strong:font-black prose-strong:text-black"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Reactions & Comment Toggle */}
              <div className="border-t-4 border-black bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-4">
                {onReactPost && (
                  <div className="flex flex-wrap gap-2">
                    {(["🔥", "😱", "💀", "👀", "🤫"] as EmojiReactionKey[]).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onReactPost(post.id, emoji)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-full font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                      >
                        <span>{emoji}</span>
                        <span className="text-zinc-600">{post.reactions?.[emoji] || 0}</span>
                      </button>
                    ))}
                  </div>
                )}

                <Button 
                  variant={activeCommentPost === post.id ? "heroDestructive" : "hero"}
                  size="sm"
                  className="font-black border-2 border-black shrink-0"
                  onClick={() => {
                    setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                    setErrorMsg("");
                  }}
                >
                  {activeCommentPost === post.id ? "Cancelar" : `Comentar (${postComments.length})`}
                </Button>
              </div>

              {/* Comment Input Section */}
              {activeCommentPost === post.id && (
                <div className="border-t-4 border-black bg-zinc-100 p-4 sm:p-6 animate-in slide-in-from-top-2">
                  <h4 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Dejar una respuesta cifrada
                  </h4>
                  
                  {errorMsg && (
                    <div className="bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold p-2 rounded mb-3">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        placeholder="Tu alias (Opcional)"
                        className="flex-1 bg-white border-2 border-black rounded p-2 text-sm font-bold placeholder:text-zinc-400"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <input 
                        type="email"
                        placeholder="Email (Requerido, secreto)"
                        className="flex-1 bg-white border-2 border-black rounded p-2 text-sm font-bold placeholder:text-zinc-400"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <textarea 
                      placeholder="Escribe tu comentario..."
                      className="w-full bg-white border-2 border-black rounded p-3 text-sm font-semibold min-h-[80px] resize-y"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                      <Button 
                        variant="hero" 
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={isSubmitting}
                        className="font-black border-2 border-black"
                      >
                        {isSubmitting ? "Enviando..." : "Publicar"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {postComments.length > 0 && (
                <div className="border-t-4 border-black bg-white">
                  {postComments.map((comment, idx) => (
                    <div key={comment.id} className={`p-4 sm:p-6 ${idx !== postComments.length - 1 ? 'border-b-2 border-zinc-200' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase">{comment.authorName}</span>
                          <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-zinc-800 mb-3 whitespace-pre-wrap">{comment.content}</p>
                      
                      {onReactComment && (
                        <div className="flex items-center gap-2">
                          {(["🔥", "😱", "💀", "👀", "🤫"] as EmojiReactionKey[]).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => onReactComment(comment.id, emoji)}
                              className="flex items-center gap-1 px-2 py-1 bg-zinc-100 border border-black rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              <span>{emoji}</span>
                              <span>{comment.reactions?.[emoji] || 0}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

