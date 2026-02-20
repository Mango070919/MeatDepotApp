
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../store';
import { Phone, Mail, Calendar, LogOut, Edit, Save, X, Camera, Cloud, Loader2, Check, Lock, ShieldCheck, AtSign } from 'lucide-react';
import { User, UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { uploadFile, deleteFile } from '../../services/storageService';

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
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const Account: React.FC = () => {
  const { currentUser, logout, updateUser, config, isCloudSyncing, addNotification, users, updateUserPassword, syncToSheet } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: Security Q, 2: New Password
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  // Initialize formData on mount or when currentUser changes, but ONLY if not editing
  useEffect(() => {
    if (!isEditing && currentUser) {
        setFormData(currentUser);
    }
  }, [currentUser, isEditing]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSavingDetails(true);
    
    try {
        // 1. Prepare optimistic update
        const updatedUser = { ...formData };
        
        // 2. Update Local State immediately
        updateUser(updatedUser);
        
        // 3. Prepare list for sync using the optimistic data
        // We use the 'users' from store but replace the current one
        const updatedUserList = users.map(u => u.id === updatedUser.id ? updatedUser : u);

        // 4. Trigger Cloud Sync
        await syncToSheet({ users: updatedUserList }); 

        // 5. Notify Admins (if changed)
        if (currentUser && (currentUser.name !== updatedUser.name || currentUser.phone !== updatedUser.phone)) {
            const admins = users.filter(u => u.role === UserRole.ADMIN);
            admins.forEach(admin => {
                addNotification({
                    id: Math.random().toString(36).substr(2, 9),
                    title: "Customer Profile Update",
                    body: `${updatedUser.name} updated their account details.`,
                    type: 'ANNOUNCEMENT', 
                    timestamp: new Date().toISOString(),
                    targetUserId: admin.id
                });
            });
        }

        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
        console.error("Save failed:", e);
        alert("Saved locally, but Cloud Sync failed. Please check your internet connection.");
        setIsEditing(false); 
    } finally {
        setIsSavingDetails(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) setFormData(currentUser);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (formData) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 400, 400);
        
        let imageUrl = resizedImageBase64;

        // Attempt cloud upload
        // uploadFile now handles method selection internally
        const uploadedUrl = await uploadFile(resizedImageBase64, `pfp_${currentUser.id}_${Date.now()}.jpg`, config);
        
        if (uploadedUrl) {
             if (currentUser.profilePicture?.startsWith('http') && !currentUser.profilePicture.includes('ui-avatars')) {
                 // Attempt to cleanup old file if it was hosted
                 await deleteFile(currentUser.profilePicture, config);
             }
             imageUrl = uploadedUrl;
        }

        const updatedUser = { ...currentUser, profilePicture: imageUrl };
        
        // Optimistic update
        updateUser(updatedUser);
        setFormData(updatedUser);
        
        // Sync
        const updatedUserList = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        await syncToSheet({ users: updatedUserList });

      } catch (error) {
        console.error("Image processing failed:", error);
        alert("Sorry, there was an error processing your image.");
      } finally {
          setIsUploading(false);
      }
    }
  };

  // Password Change Logic
  const handleStartPasswordChange = () => {
      setIsPasswordModalOpen(true);
      setPasswordStep(1);
      setSecurityAnswerInput('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
  };

  const verifySecurityAnswer = () => {
      if (!currentUser) return;
      if (!currentUser.securityQuestion || !currentUser.securityAnswer) {
          if (securityAnswerInput === currentUser.birthdate) {
              setPasswordStep(2);
              setPasswordError('');
          } else {
              setPasswordError("Incorrect security answer.");
          }
          return;
      }

      if (securityAnswerInput.toLowerCase().trim() === currentUser.securityAnswer.toLowerCase().trim()) {
          setPasswordStep(2);
          setPasswordError('');
      } else {
          setPasswordError("Incorrect answer to your security question.");
      }
  };

  const saveNewPassword = async () => {
      if (!currentUser) return;
      if (newPassword.length < 6) {
          setPasswordError("Password must be at least 6 characters.");
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordError("Passwords do not match.");
          return;
      }
      updateUserPassword(currentUser.email, newPassword);
      
      // Sync
      const updatedUserList = users.map(u => u.email === currentUser.email ? { ...u, password: newPassword } : u);
      await syncToSheet({ users: updatedUserList }); 
      
      setIsPasswordModalOpen(false);
      alert("Password updated and synced successfully!");
  };

  if (!currentUser || !formData) return null;

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-700 bg-black -mx-4 px-6 pt-6">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <h1 className="brand-font text-5xl font-bold italic text-white">Your Account</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Manage your profile</p>
        </div>
        {(isCloudSyncing || saveSuccess) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full animate-in fade-in duration-300">
                {saveSuccess ? (
                    <Check size={12} className="text-green-500" />
                ) : (
                    <Loader2 size={12} className="text-[#f4d300] animate-spin" />
                )}
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">
                    {saveSuccess ? 'Cloud Synced' : 'Syncing...'}
                </span>
            </div>
        )}
      </div>

      <div className="bg-[#121212] p-8 sm:p-12 rounded-[40px] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Subtle loading overlay */}
        {isSavingDetails && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#f4d300]" size={40} />
            </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg shadow-[#f4d300]/10 shrink-0 border-2 border-white/10 group-hover:border-[#f4d300] transition-colors bg-[#1a1a1a] relative">
                {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="animate-spin text-[#f4d300]" size={32} />
                    </div>
                ) : formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-[#f4d300] text-black flex items-center justify-center text-4xl font-bold">
                        {formData.name ? formData.name.charAt(0) : 'U'}
                    </div>
                )}
            </div>
            {/* Always allow picture upload */}
            <label htmlFor="pfp-upload" className="absolute -bottom-2 -right-2 bg-white text-black p-2 rounded-full cursor-pointer hover:bg-[#f4d300] transition-colors shadow-lg z-20">
                <Camera size={16} />
                <input id="pfp-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={isUploading} />
            </label>
            {formData.profilePicture?.includes('drive.google.com') && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg" title="Secured to Drive">
                    <Cloud size={12} />
                </div>
            )}
            {formData.profilePicture?.includes('firebasestorage') && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-lg" title="Secured to Firebase">
                    <Cloud size={12} />
                </div>
            )}
          </div>
          
          <div className="flex-1 w-full">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Full Name"
                className="brand-font text-3xl font-bold text-white bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full focus:ring-2 focus:ring-[#f4d300] outline-none"
              />
            ) : (
              <h2 className="brand-font text-4xl font-bold text-white">{formData.name}</h2>
            )}
            <span className="bg-[#f4d300]/10 text-[#f4d300] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block">
              {formData.role}
            </span>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-white/5 text-white/70 px-6 py-3 rounded-2xl font-bold text-xs tracking-widest flex items-center gap-2 hover:bg-white/10 hover:text-white transition-colors uppercase border border-white/5"
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-8 border-t border-white/10">
          <InfoItem icon={AtSign} label="Username" value={formData.username || ''} name="username" isEditing={false} onChange={handleChange} />
          <InfoItem icon={Mail} label="Email Address" value={formData.email || ''} name="email" isEditing={isEditing} onChange={handleChange} />
          <InfoItem icon={Phone} label="Phone Number" value={formData.phone || ''} name="phone" isEditing={isEditing} onChange={handleChange} />
          <InfoItem icon={Calendar} label="Birthdate" value={formData.birthdate || ''} name="birthdate" type="date" isEditing={isEditing} onChange={handleChange} />
          
          {/* Security Question Editing */}
          {isEditing ? (
              <div className="space-y-4 col-span-1 md:col-span-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <h4 className="text-xs font-bold text-[#f4d300] uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Security Settings</h4>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Security Question</label>
                      <select 
                        name="securityQuestion"
                        className="w-full pl-4 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all appearance-none"
                        value={formData.securityQuestion || ''}
                        onChange={handleChange}
                      >
                          <option value="" disabled>Select a question</option>
                          <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                          <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                          <option value="What city were you born in?">What city were you born in?</option>
                          <option value="What is your favorite food?">What is your favorite food?</option>
                          <option value="What was the name of your first school?">What was the name of your first school?</option>
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Security Answer</label>
                      <input 
                        type="text"
                        name="securityAnswer"
                        value={formData.securityAnswer || ''}
                        onChange={handleChange}
                        className="w-full pl-4 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
                        placeholder="Answer..."
                      />
                  </div>
              </div>
          ) : (
              <div className="col-span-1 md:col-span-2">
                  <button onClick={handleStartPasswordChange} className="w-full md:w-auto bg-white/5 border border-white/10 text-white py-4 px-8 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors uppercase">
                      <Lock size={16} /> Change Password
                  </button>
              </div>
          )}
        </div>

        {isEditing && (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-white/10">
            <button 
              onClick={handleSave}
              disabled={isSavingDetails}
              className="w-full sm:w-auto flex-1 bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-[#f4d300]/20 flex items-center justify-center gap-2 hover:scale-105 transition-transform uppercase disabled:opacity-50"
            >
              {isSavingDetails ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {isSavingDetails ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={handleCancel}
              className="w-full sm:w-auto bg-white/5 text-white/50 py-4 px-8 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-colors uppercase"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto pt-4 space-y-4">
        <button 
          onClick={logout}
          className="w-full bg-white/5 text-white/50 py-4 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-colors uppercase"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-[#1a1a1a] w-full max-w-md rounded-[32px] border border-white/10 p-8 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="brand-font text-2xl font-bold text-white">Change Password</h3>
                      <button onClick={() => setIsPasswordModalOpen(false)} className="text-white/50 hover:text-white"><X size={24}/></button>
                  </div>

                  {passwordStep === 1 ? (
                      <div className="space-y-6">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                              <p className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest mb-2">Security Check</p>
                              <p className="text-white text-lg font-medium">{currentUser.securityQuestion || "What is your date of birth? (YYYY-MM-DD)"}</p>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Your Answer</label>
                              <input 
                                  type="text" 
                                  className="w-full p-4 bg-black border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                  value={securityAnswerInput}
                                  onChange={e => setSecurityAnswerInput(e.target.value)}
                                  placeholder="Type answer here..."
                              />
                          </div>
                          {passwordError && <p className="text-red-500 text-xs font-bold text-center">{passwordError}</p>}
                          <button onClick={verifySecurityAnswer} className="w-full bg-white text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200">
                              Verify Identity
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in slide-in-from-right duration-300">
                          <div className="space-y-4">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">New Password</label>
                                  <input 
                                      type="password" 
                                      className="w-full p-4 bg-black border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                      value={newPassword}
                                      onChange={e => setNewPassword(e.target.value)}
                                      placeholder="Min 6 characters"
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Confirm Password</label>
                                  <input 
                                      type="password" 
                                      className="w-full p-4 bg-black border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                      value={confirmPassword}
                                      onChange={e => setConfirmPassword(e.target.value)}
                                      placeholder="Retype password"
                                  />
                              </div>
                          </div>
                          {passwordError && <p className="text-red-500 text-xs font-bold text-center">{passwordError}</p>}
                          <button onClick={saveNewPassword} className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:brightness-110">
                              Update Password
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  name: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, name, isEditing, onChange, type = 'text' }) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">{label}</label>
      {isEditing ? (
        <div className="relative">
          <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
          <input 
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 text-white/80 p-4 bg-transparent">
          <Icon size={18} className="text-[#f4d300]" />
          <span className="text-sm font-medium">{value || 'Not set'}</span>
        </div>
      )}
    </div>
  );
};

export default Account;
