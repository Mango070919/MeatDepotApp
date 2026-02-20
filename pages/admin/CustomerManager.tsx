
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Search, User as UserIcon, ShieldAlert, Phone, Mail, ArrowLeft, Eye, X, Calendar, Lock, Coins, Trash2, ShoppingBag, ArrowRight, FileSpreadsheet, Edit2, Save, Ban, Plus, Camera, Loader2, Cloud, LayoutDashboard, Home, MessageCircle, Bell, ShieldCheck, Download, Upload, Copy, AtSign, EyeOff, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, Order, UserRole } from '../../types';
import { CUSTOMER_DATABASE_SHEET } from '../../constants';
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
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const CustomerManager: React.FC = () => {
  const { users, orders, updateUser, deleteUser, login, config, restoreData, syncToSheet } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });
  
  useEffect(() => {
      if (selectedUser && !isCreating) {
          setEditForm(selectedUser);
          setIsEditing(false);
          setShowPassword(false);
      }
  }, [selectedUser, isCreating]);

  const performDelete = async (user: User) => {
      if(window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
          deleteUser(user.id);
          // Sync deletion to cloud immediately
          const updatedUsers = users.filter(u => u.id !== user.id);
          await syncToSheet({ users: updatedUsers });
          
          if (selectedUser?.id === user.id) {
              setSelectedUser(null);
          }
      }
  };

  const handleCreateUser = () => {
      const newUser: User = {
          id: 'manual_' + Math.random().toString(36).substr(2, 9),
          username: '',
          name: '',
          email: '',
          phone: '',
          role: UserRole.CUSTOMER,
          loyaltyPoints: 0,
          blocked: false,
          password: 'MeatDepot123',
          securityQuestion: 'What is your favorite food?',
          securityAnswer: 'Biltong' // Default placeholder
      };
      setSelectedUser(newUser);
      setEditForm(newUser);
      setIsCreating(true);
      setIsEditing(true);
      setShowPassword(true); // Show password by default for new users
  };
  
  const handleSaveChanges = async () => {
      if (!editForm) return;
      if (!editForm.name || !editForm.email || !editForm.username) {
          alert("Username, Name and Email are required.");
          return;
      }
      setIsSaving(true);

      try {
          if (isCreating) {
              if (users.some(u => u.email.toLowerCase() === editForm.email.toLowerCase())) {
                  alert("A user with this email already exists.");
                  setIsSaving(false);
                  return;
              }
              if (users.some(u => u.username?.toLowerCase() === editForm.username.toLowerCase())) {
                  alert("Username already taken.");
                  setIsSaving(false);
                  return;
              }
              // Update local state
              login(editForm);
              // Sync to cloud
              const updatedUsers = [...users, editForm];
              await syncToSheet({ users: updatedUsers });

              alert(`User created successfully! Password: ${editForm.password}`);
              setIsCreating(false);
              setSelectedUser(null);
          } else {
              // Update local state
              updateUser(editForm);
              // Sync to cloud
              const updatedUsers = users.map(u => u.id === editForm.id ? editForm : u);
              await syncToSheet({ users: updatedUsers });

              setSelectedUser(editForm);
              setIsEditing(false);
              alert("User profile updated successfully.");
          }
      } catch (e) {
          console.error(e);
          alert("Changes saved locally, but cloud sync failed. Please check internet.");
      }
      
      setIsSaving(false);
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 400, 400);
        let url = resizedImageBase64;
        if (config.backupMethod === 'CUSTOM_DOMAIN' || (config.googleDrive?.accessToken && config.googleDrive?.folderId)) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `pfp_${editForm.id}_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }
        setEditForm({ ...editForm, profilePicture: url });
      } catch (error) {
        alert("Image processing failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleCopyData = () => {
      const data = JSON.stringify(users, null, 2);
      navigator.clipboard.writeText(data);
      alert("User database copied to clipboard! You can save this text manually.");
  };

  const handleBackupProfiles = () => {
      const data = JSON.stringify({ users }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meat_depot_users_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleRestoreProfiles = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              try {
                  const data = JSON.parse(ev.target?.result as string);
                  if (data.users && Array.isArray(data.users)) {
                      if(window.confirm(`Restore ${data.users.length} user profiles? This will overwrite the current user list.`)) {
                          restoreData({ users: data.users });
                          alert("User profiles restored successfully.");
                      }
                  } else {
                      alert("Invalid backup file. Missing 'users' array.");
                  }
              } catch (err) {
                  alert("Error parsing backup file.");
              }
          };
          reader.readAsText(e.target.files[0]);
      }
  };

  const handleNotifyCheckApp = (user: User) => {
      if (!user.phone) {
          alert("User has no phone number.");
          return;
      }
      let phone = user.phone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) {
          phone = '27' + phone.substring(1);
      }
      
      const message = `Hi ${user.name}, you have a new message on the Meat Depot App. Please check it here to stay updated: https://meatdepot.co.za/app`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const handleChat = (user: User) => {
      if (!user.phone) {
          alert("User has no phone number.");
          return;
      }
      let phone = user.phone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) {
          phone = '27' + phone.substring(1);
      }
      
      const url = `https://wa.me/${phone}`;
      window.open(url, '_blank');
  };

  const handleCopyResetLink = () => {
      if (!editForm || !editForm.email) return;
      const baseUrl = window.location.origin + window.location.pathname; // Gets base path
      // Handle hash router
      const link = `${baseUrl}#/forgot-password?email=${encodeURIComponent(editForm.email)}`;
      navigator.clipboard.writeText(link);
      alert(`Password reset link for ${editForm.email} copied to clipboard!`);
  };

  const userOrders = selectedUser ? orders.filter(o => o.customerId === selectedUser.id) : [];

  return (
    <div className="space-y-6 pb-20 pt-8">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <h1 className="text-3xl font-bold text-gray-900">User Database</h1>
        <div className="flex flex-wrap gap-2">
            <button onClick={handleBackupProfiles} className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all" title="Backup Users">
                <Download size={16} /> Backup
            </button>
            <label className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer" title="Restore Users">
                <Upload size={16} /> Restore
                <input type="file" accept=".json" className="hidden" onChange={handleRestoreProfiles} />
            </label>
            <button onClick={handleCreateUser} className="bg-[#f4d300] text-black px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md hover:scale-105 transition-all">
                <Plus size={16} /> New User
            </button>
            <button onClick={handleCopyData} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-colors text-[10px] uppercase tracking-widest">
                <Copy size={16} /> Copy Data
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 px-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, username or email..."
              className="w-full pl-12 pr-4 py-4 bg-white border text-gray-900 border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#f4d300]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
              {['ALL', UserRole.CUSTOMER, UserRole.DRIVER, UserRole.ADMIN].map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role as any)}
                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === role ? 'bg-[#f4d300] text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                      {role === 'ALL' ? 'All Users' : role + 's'}
                  </button>
              ))}
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm mx-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-left">Contact Info</th>
                <th className="px-6 py-4 text-left">Role & Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shrink-0">
                        {u.profilePicture ? <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" /> : <UserIcon size={20} />}
                      </div>
                      <div>
                        <button onClick={() => { setSelectedUser(u); setIsCreating(false); }} className="font-bold text-gray-900 hover:underline hover:text-[#f4d300] text-left block">{u.name}</button>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <AtSign size={10}/> {u.username || 'No Username'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Mail size={12}/> {u.email}</p>
                      <p className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Phone size={12}/> {u.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">{u.role}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.blocked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {u.blocked ? 'Blocked' : 'Active'}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleNotifyCheckApp(u)} 
                            className="text-yellow-600 hover:text-yellow-800 p-2 hover:bg-yellow-100 rounded-full transition-all"
                            title="Send 'Check App' notification"
                        >
                            <Bell size={18} />
                        </button>
                        <button 
                            onClick={() => handleChat(u)} 
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-100 rounded-full transition-all"
                            title="Chat via WhatsApp"
                        >
                            <MessageCircle size={18} />
                        </button>
                        <button onClick={() => { setSelectedUser(u); setIsCreating(false); }} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); performDelete(u); }} 
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && editForm && (
        <div className="fixed inset-0 bg-gray-50 z-[200] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="max-w-4xl mx-auto min-h-screen bg-white shadow-2xl relative md:my-8 md:rounded-[40px] md:min-h-[auto] md:h-auto border border-gray-100">
                <div className="p-8 md:p-12 space-y-10">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{isCreating ? 'Create New User' : 'Edit Profile'}</h2>
                            <p className="text-gray-500 mt-2">Manage user details, permissions, and status.</p>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-gray-100 hover:bg-[#f4d300] hover:text-black transition-colors rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Edit2 size={16} /> Edit
                                </button>
                            ) : (
                                <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-3 bg-[#f4d300] hover:bg-yellow-400 text-black transition-colors rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                                    {isSaving ? 'Syncing...' : 'Save'}
                                </button>
                            )}
                            <button onClick={() => { setSelectedUser(null); setIsEditing(false); setIsCreating(false); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="flex flex-col md:flex-row gap-10 items-start border-b border-gray-100 pb-10">
                        <div className="relative group mx-auto md:mx-0 flex flex-col items-center">
                            <div className="w-40 h-40 bg-[#f4d300] rounded-[40px] flex items-center justify-center text-5xl font-bold text-black shadow-2xl overflow-hidden border-4 border-white ring-1 ring-gray-100 shrink-0">
                                {isUploading ? <Loader2 className="animate-spin" size={40} /> : editForm.profilePicture ? <img src={editForm.profilePicture} alt={editForm.name} className="w-full h-full object-cover" /> : (editForm.name ? editForm.name.charAt(0) : <UserIcon size={40} />)}
                            </div>
                            {isEditing && (
                                <>
                                    <label className="absolute -bottom-3 -right-3 bg-white p-4 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 hover:text-[#f4d300]">
                                        <Camera size={20} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={isUploading} />
                                    </label>
                                    <input 
                                        className="w-40 p-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] outline-none mt-4 text-center text-gray-700" 
                                        placeholder="Or paste URL" 
                                        value={editForm.profilePicture || ''} 
                                        onChange={e => setEditForm({...editForm, profilePicture: e.target.value})} 
                                    />
                                </>
                            )}
                        </div>
                        
                        <div className="flex-1 space-y-6 w-full">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</label>
                                {isEditing ? (
                                    <input className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-[#f4d300] outline-none w-full bg-transparent placeholder-gray-300 pb-2" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.replace(/\s/g, '') })} placeholder="Username" />
                                ) : (
                                    <h3 className="text-xl font-bold text-gray-900">@{selectedUser.username || 'NoUsername'}</h3>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                {isEditing ? (
                                    <input className="text-3xl md:text-4xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-[#f4d300] outline-none w-full bg-transparent placeholder-gray-300 pb-2" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Enter Name" />
                                ) : (
                                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{selectedUser.name}</h3>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> Email Address</label>
                                    {isEditing ? (
                                        <input className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900 font-medium" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" />
                                    ) : (
                                        <p className="text-lg font-medium text-gray-700">{selectedUser.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12}/> Phone Number</label>
                                    {isEditing ? (
                                        <input className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900 font-medium" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="000 000 0000" />
                                    ) : (
                                        <p className="text-lg font-medium text-gray-700">{selectedUser.phone || 'N/A'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security & Admin Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2"><ShieldAlert size={18} className="text-[#f4d300]" /> Role Management</h4>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">System Role</label>
                                {isEditing ? (
                                    <select className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#f4d300]" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}>
                                        <option value={UserRole.CUSTOMER}>Customer</option>
                                        <option value={UserRole.DRIVER}>Driver</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                ) : (
                                    <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 font-bold text-gray-700">{selectedUser.role}</div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2"><Coins size={18} className="text-[#f4d300]" /> Loyalty Program</h4>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Points Balance</label>
                                {isEditing ? (
                                    <input 
                                        type="number"
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#f4d300]" 
                                        value={editForm.loyaltyPoints} 
                                        onChange={e => setEditForm({ ...editForm, loyaltyPoints: Number(e.target.value) })}
                                        placeholder="0"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                                        <span className="text-[#f4d300]"><Coins size={16} /></span>
                                        {selectedUser.loyaltyPoints} Points
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500" /> Security (Admin Access)</h4>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <div className="relative w-full">
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#f4d300]" 
                                                value={editForm.password || ''} 
                                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                placeholder="Password"
                                            />
                                            <button 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-600 w-full flex justify-between items-center">
                                            <span>••••••••</span>
                                            <span className="text-[10px] text-gray-400 italic">Hidden</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isEditing && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Security Answer (Recovery)</label>
                                    <input 
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#f4d300]" 
                                        value={editForm.securityAnswer || ''} 
                                        onChange={e => setEditForm({ ...editForm, securityAnswer: e.target.value })}
                                        placeholder="Recovery Answer"
                                    />
                                </div>
                            )}
                            <button onClick={handleCopyResetLink} className="w-full text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:underline py-2">
                                <Link size={12} /> Copy Reset Link
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 md:col-span-2">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2"><Ban size={18} className="text-red-500" /> Account Status</h4>
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                                <span className="text-sm font-bold text-gray-700">Block Access</span>
                                {isEditing ? (
                                    <button 
                                        onClick={() => setEditForm({ ...editForm, blocked: !editForm.blocked })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${editForm.blocked ? 'bg-red-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${editForm.blocked ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                ) : (
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${selectedUser.blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {selectedUser.blocked ? 'Blocked' : 'Active'}
                                    </span>
                                )}
                            </div>
                            {!isCreating && isEditing && (
                                <button onClick={() => performDelete(selectedUser)} className="w-full py-3 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors">
                                    Delete User Permanently
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
