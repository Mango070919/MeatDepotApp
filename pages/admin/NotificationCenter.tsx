
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Bell, Send, Copy, MessageCircle, Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { AppNotification, UserRole } from '../../types';
import { uploadFile } from '../../services/storageService';

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

const NotificationCenter: React.FC = () => {
  const { users, addNotification, config } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'STAFF' | 'USER'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('Meat Depot Notification: Please check the app for an update! https://meatdepot.co.za/app');
  
  // Image State
  const [notificationImage, setNotificationImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const customers = users.filter(u => u.role === UserRole.CUSTOMER);
  const staff = users.filter(u => u.role !== UserRole.CUSTOMER);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 800, 800);
        let url = resizedImageBase64;
        
        // Upload to Cloud if configured
        if (config.firebaseConfig?.apiKey) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `notif_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }
        
        setNotificationImage(url);
      } catch (error) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSendNotification = () => {
    if (!title || !body) {
      alert("Title and Body are required.");
      return;
    }

    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type: 'ANNOUNCEMENT',
      timestamp: new Date().toISOString(),
      targetUserId: targetType === 'USER' ? selectedUserId : (targetType === 'STAFF' ? 'admin' : undefined), // 'admin' is often treated as broadcast to admins
      imageUrl: notificationImage
    };

    if (targetType === 'ALL') {
      addNotification({ ...newNotification, targetUserId: undefined });
      alert(`Sent to all ${users.length} users.`);
    } else if (targetType === 'STAFF') {
      staff.forEach(s => addNotification({ ...newNotification, id: Math.random().toString(36).substr(2, 9), targetUserId: s.id }));
      alert(`Sent to ${staff.length} staff members.`);
    } else {
      if (!selectedUserId) {
        alert("Select a user.");
        return;
      }
      addNotification(newNotification);
      alert("Sent to user.");
    }

    setTitle('');
    setBody('');
    setNotificationImage('');
  };

  const copyPhoneNumbers = () => {
      const numbers = customers
        .filter(u => u.phone && u.phone.length > 5)
        .map(u => {
            let p = u.phone.replace(/\s+/g, '').replace(/-/g, '');
            if(p.startsWith('0')) p = '27' + p.substring(1);
            return p;
        })
        .join(',');
      
      navigator.clipboard.writeText(numbers);
      alert("Phone numbers copied! Paste into a text file or broadcast tool.");
  };

  const copyBroadcastMessage = () => {
      navigator.clipboard.writeText(broadcastMessage);
      alert("Message copied!");
  };

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 px-4 pb-20 space-y-8 pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm">Manage alerts and broadcasts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
          {/* In-App Notifications */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Bell size={24} /></div>
                  <div>
                      <h2 className="text-xl font-bold text-gray-900">In-App Alert</h2>
                      <p className="text-xs text-gray-500">Send push-style notification inside the app</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Audience</label>
                      <div className="flex gap-2">
                          <button onClick={() => setTargetType('ALL')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${targetType === 'ALL' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>All Clients</button>
                          <button onClick={() => setTargetType('STAFF')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${targetType === 'STAFF' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Staff Only</button>
                          <button onClick={() => setTargetType('USER')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${targetType === 'USER' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>Specific</button>
                      </div>
                  </div>

                  {targetType === 'USER' && (
                      <select 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                      >
                          <option value="">Select User...</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                      </select>
                  )}

                  <input 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 font-bold placeholder-gray-400"
                    placeholder="Notification Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  
                  {/* Image Uploader */}
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attachment (Optional)</label>
                      <div className="relative w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                          {notificationImage ? (
                              <>
                                <img src={notificationImage} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setNotificationImage('')}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500"
                                >
                                    <X size={14} />
                                </button>
                              </>
                          ) : (
                              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                  {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                                  <span className="text-[10px] font-bold uppercase mt-2">{isUploading ? 'Uploading...' : 'Add Image'}</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                              </label>
                          )}
                      </div>
                      <input 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs text-gray-900 placeholder-gray-400"
                        placeholder="Or paste image URL..."
                        value={notificationImage}
                        onChange={e => setNotificationImage(e.target.value)}
                      />
                  </div>

                  <textarea 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 placeholder-gray-400 min-h-[100px]"
                    placeholder="Message Body..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />

                  <button onClick={handleSendNotification} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg">
                      <Send size={16} /> Send Alert
                  </button>
              </div>
          </div>

          {/* WhatsApp Broadcast Helper */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="bg-green-100 p-3 rounded-2xl text-green-600"><MessageCircle size={24} /></div>
                  <div>
                      <h2 className="text-xl font-bold text-gray-900">WhatsApp Broadcast</h2>
                      <p className="text-xs text-gray-500">Prepare manual broadcast to clients</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-green-800 text-sm">
                      <p className="font-bold mb-1">How to use:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-xs">
                          <li>Copy the client phone list below.</li>
                          <li>Paste into a new Broadcast List on WhatsApp (Mobile).</li>
                          <li>Copy the message text.</li>
                          <li>Paste and send in the Broadcast chat.</li>
                      </ol>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">1. Client Phone List ({customers.length})</label>
                      <button onClick={copyPhoneNumbers} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors border border-gray-200">
                          <Copy size={14} /> Copy All Numbers
                      </button>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. Message Text</label>
                      <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 text-sm min-h-[100px]"
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                      />
                      <button onClick={copyBroadcastMessage} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow-lg">
                          <Copy size={14} /> Copy Message
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
