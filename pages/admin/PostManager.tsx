
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Plus, Edit2, Trash2, X, Camera, ArrowUp, ArrowDown, Save, ArrowLeft, Eye, EyeOff, Loader2, Cloud, LayoutDashboard, Home, Newspaper, Facebook, RefreshCw } from 'lucide-react';
import { Post } from '../../types';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../../services/storageService';
import { fetchFacebookPosts } from '../../services/facebookService';

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const PostManager: React.FC = () => {
  const { posts, addPost, updatePost, deletePost, config, updateConfig, syncToSheet } = useApp();
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleSyncFacebook = async () => {
      if (!config.facebookPageId || !config.facebookAccessToken) {
          alert("Please configure Facebook Page ID and Access Token in Edit App > Social first.");
          return;
      }

      try {
          setIsSyncing(true);
          const fbPosts = await fetchFacebookPosts(config.facebookPageId, config.facebookAccessToken);
          
          // Merge with existing posts, avoiding duplicates by ID
          const existingIds = new Set(posts.map(p => p.id));
          let addedCount = 0;
          
          for (const fbPost of fbPosts) {
              if (!existingIds.has(fbPost.id)) {
                  addPost(fbPost);
                  addedCount++;
              }
          }

          if (addedCount > 0) {
              alert(`Successfully synced ${addedCount} new posts from Facebook!`);
              await syncToSheet();
          } else {
              alert("No new posts found on Facebook.");
          }
      } catch (error: any) {
          alert(`Sync failed: ${error.message}`);
      } finally {
          setIsSyncing(false);
      }
  };

  const orderedPosts = config.postOrder.map(id => posts.find(p => p.id === id)).filter(Boolean) as Post[];

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setEditingPost({ caption: '', imageUrl: 'https://images.unsplash.com/photo-1513135243354-206219b15da3?q=80&w=800', visible: true });
    setIsAddingNew(true);
  };

  const handleClosePanel = () => {
    setEditingPost(null);
    setIsAddingNew(false);
  };

  const handleSave = async (form: Partial<Post>) => {
    let updatedPosts = [...posts];
    let updatedConfig = { ...config };

    if (isAddingNew) {
      const newPost = { ...form, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), visible: form.visible ?? true } as Post;
      updatedPosts = [newPost, ...posts];
      addPost(newPost);
      updatedConfig.postOrder = [newPost.id, ...config.postOrder];
      updateConfig(updatedConfig);
    } else {
      updatedPosts = posts.map(p => p.id === form.id ? form as Post : p);
      updatePost(form as Post);
    }
    
    await syncToSheet({ posts: updatedPosts, config: updatedConfig });
    handleClosePanel();
  };

  const reorderPost = async (postId: string, direction: 'up' | 'down') => {
    const order = [...config.postOrder];
    const index = order.indexOf(postId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    updateConfig({ ...config, postOrder: order });
    await syncToSheet({ config: { ...config, postOrder: order } });
  };
  
  const toggleVisibility = async (post: Post) => {
      const updatedPost = { ...post, visible: !post.visible };
      const updatedPosts = posts.map(p => p.id === post.id ? updatedPost : p);
      updatePost(updatedPost);
      await syncToSheet({ posts: updatedPosts });
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('Are you sure?')) {
        const updatedPosts = posts.filter(p => p.id !== postId);
        const updatedOrder = config.postOrder.filter(id => id !== postId);
        
        deletePost(postId);
        updateConfig({ ...config, postOrder: updatedOrder });
        
        await syncToSheet({ posts: updatedPosts, config: { ...config, postOrder: updatedOrder } });
    }
  };

  return (
    <div className="space-y-8 pb-20 pt-8">
      <div className="flex gap-8 px-2">
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-black">
                      <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h1 className="text-3xl font-bold text-gray-900">News Feed</h1>
                      <p className="text-xs text-gray-500">Manage posts on the home screen</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={handleSyncFacebook}
                      disabled={isSyncing}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                      {isSyncing ? <RefreshCw className="animate-spin" size={16} /> : <Facebook size={16} />} 
                      Sync Facebook
                  </button>
                  <button onClick={handleAddNew} className="bg-[#f4d300] text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                      <Plus size={16} /> New Post
                  </button>
              </div>
          </div>
          <div className="space-y-4">
            {orderedPosts.map((post, index) => (
              <div key={post.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 ${!post.visible ? 'opacity-50' : ''}`}>
                <img src={post.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-700 truncate">{post.caption}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleVisibility(post)} className="p-2.5 rounded-xl bg-gray-50">{post.visible ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                  <button onClick={() => reorderPost(post.id, 'up')} disabled={index === 0} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button onClick={() => reorderPost(post.id, 'down')} disabled={index === orderedPosts.length - 1} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl disabled:opacity-30"><ArrowDown size={16} /></button>
                  <button onClick={() => handleEdit(post)} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-yellow-100"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(post.id)} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-red-100 hover:text-red-800"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {orderedPosts.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400">
                    <Newspaper size={40} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-sm font-bold uppercase tracking-widest">No posts yet</p>
                </div>
            )}
          </div>
        </div>
        {editingPost && <EditPanel post={editingPost} onSave={handleSave} onClose={handleClosePanel} isNew={isAddingNew} />}
      </div>
    </div>
  );
};

interface EditPanelProps {
  post: Partial<Post>;
  onSave: (post: Partial<Post>) => void;
  onClose: () => void;
  isNew: boolean;
}

const EditPanel: React.FC<EditPanelProps> = ({ post, onSave, onClose, isNew }) => {
  const [form, setForm] = useState(post);
  const { config } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 800, 800);
        let url = resizedImageBase64;
        if (config.backupMethod === 'CUSTOM_DOMAIN' || (config.googleDrive?.accessToken && config.googleDrive?.folderId)) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `post_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }
        setForm({ ...form, imageUrl: url });
      } catch (error) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handlePanelSave = async () => {
      setIsSaving(true);
      await onSave(form);
      setIsSaving(false);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-black border-l border-white/10 shadow-2xl z-[150] flex flex-col animate-in slide-in-from-right-full">
      <div className="p-6 bg-[#121212] border-b border-white/10 flex justify-between items-center shrink-0"><h2 className="text-xl font-bold text-white">{isNew ? 'Create Post' : 'Edit Post'}</h2><button onClick={onClose} className="p-2 text-white/50 rounded-full"><X size={20} /></button></div>
      <div className="p-8 space-y-6 overflow-y-auto flex-1 no-scrollbar">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Image</label>
          <div className="relative w-full h-48 bg-gray-800 rounded-2xl">
            <img src={form.imageUrl} className="w-full h-full object-cover rounded-2xl" />
            <label htmlFor="post-img" className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer rounded-2xl">
                {isUploading ? <Loader2 className="animate-spin" size={32} /> : <><Camera size={32} /><span className="text-xs font-bold mt-1">Upload</span></>}
            </label>
            <input id="post-img" type="file" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </div>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-[#1a1a1a] text-white border border-white/10 rounded-xl text-xs outline-none focus:border-[#f4d300]" 
            placeholder="Or paste image URL..." 
            value={form.imageUrl} 
            onChange={e => setForm({...form, imageUrl: e.target.value})} 
          />
        </div>
        <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caption</label><textarea className="w-full px-5 py-4 bg-white text-black rounded-2xl min-h-[150px]" value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} placeholder="Write a caption..." /></div>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"><label className="text-sm font-bold text-white">Public Visibility</label><button type="button" onClick={() => setForm({...form, visible: !form.visible})} className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${form.visible !== false ? 'bg-[#f4d300]' : 'bg-white/10'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${form.visible !== false ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>
      </div>
      <div className="p-6 border-t border-white/10 flex gap-4 bg-[#121212]"><button onClick={onClose} className="flex-1 py-4 font-bold text-white/50 uppercase text-xs tracking-widest">Cancel</button><button onClick={handlePanelSave} disabled={isSaving} className="flex-1 bg-[#f4d300] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest">{isSaving ? 'Syncing...' : <><Save size={18} /> Save</>}</button></div>
    </div>
  );
};

export default PostManager;
