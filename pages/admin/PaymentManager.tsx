
import React, { useState } from 'react';
import { useApp } from '../../store';
import { CreditCard, Send, Search, User as UserIcon, X, Phone, Mail, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';

const PaymentManager: React.FC = () => {
    const { users, addNotification } = useApp();
    const navigate = useNavigate();
    
    // Form State
    const [selectedUserId, setSelectedUserId] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paymentLink, setPaymentLink] = useState('');
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u => 
        u.role === UserRole.CUSTOMER && 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         u.phone.includes(searchTerm))
    );

    const handleSelectUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setSelectedUserId(userId);
            setName(user.name);
            setPhone(user.phone || '');
            setEmail(user.email);
            setSearchTerm('');
        }
    };

    const handleClearUser = () => {
        setSelectedUserId('');
        setName('');
        setPhone('');
        setEmail('');
    };

    const sendAppNotification = () => {
        if (!selectedUserId) {
            alert("Please select a registered user for App Notifications.");
            return;
        }
        if (!paymentLink || !amount) {
            alert("Payment Link and Amount are required.");
            return;
        }

        addNotification({
            id: Math.random().toString(36).substr(2, 9),
            title: 'Payment Request',
            body: `Please complete payment for: ${description || 'Order'}. Tap below to pay securely.`,
            type: 'PROMO',
            timestamp: new Date().toISOString(),
            targetUserId: selectedUserId,
            actionUrl: paymentLink,
            actionLabel: `Pay R${amount}`
        });

        alert("Notification sent to user's app inbox.");
    };

    const sendWhatsApp = () => {
        if (!phone) {
            alert("Phone number required.");
            return;
        }
        if (!paymentLink) {
            alert("Payment link required.");
            return;
        }

        let cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
        if(cleanPhone.startsWith('0')) cleanPhone = '27' + cleanPhone.substring(1);

        const message = `Hi ${name.split(' ')[0]}, please use this link to pay R${amount} for your Meat Depot order (${description}):\n\n${paymentLink}\n\nThank you!`;
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const sendEmail = () => {
        if (!email) {
            alert("Email required.");
            return;
        }
        if (!paymentLink) {
            alert("Payment link required.");
            return;
        }

        const subject = `Payment Request: Meat Depot`;
        const body = `Hi ${name},\n\nPlease complete your payment of R${amount} for ${description}.\n\nSecure Payment Link:\n${paymentLink}\n\nRegards,\nMeat Depot`;
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-8 pb-20 pt-8 max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin')} className="p-3 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors">
                    {/* Reuse ArrowLeft implicitly or explicitly from lucide imports if available in context, handled by props usually */}
                    <span className="font-bold text-xl">←</span>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Send Payment Link</h1>
                    <p className="text-gray-500 text-sm">Manually send payment requests to clients</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-8">
                
                {/* 1. Client Details */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">1. Client Details</h2>
                    
                    {/* Search / Select */}
                    {!selectedUserId && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#f4d300] focus:ring-1 focus:ring-[#f4d300]"
                                placeholder="Search existing customer..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-xl rounded-xl mt-1 max-h-40 overflow-y-auto z-10">
                                    {filteredUsers.map(u => (
                                        <button 
                                            key={u.id} 
                                            onClick={() => handleSelectUser(u.id)}
                                            className="w-full text-left p-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-none"
                                        >
                                            <span className="font-bold">{u.name}</span> <span className="text-gray-400">({u.phone})</span>
                                        </button>
                                    ))}
                                    {filteredUsers.length === 0 && <div className="p-3 text-gray-400 text-xs">No users found. Enter details manually below.</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected / Manual Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Client Name"
                                    disabled={!!selectedUserId}
                                />
                                {selectedUserId && <button onClick={handleClearUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={16}/></button>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="082 123 4567"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input 
                                    className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="client@email.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Payment Details */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">2. Payment Details</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (R)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-lg font-bold"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Reference / Note</label>
                            <input 
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Order #123"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Payment Link URL</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-mono text-blue-600 focus:ring-2 focus:ring-[#f4d300]"
                                value={paymentLink}
                                onChange={e => setPaymentLink(e.target.value)}
                                placeholder="Paste your Yoco/PayFast/Zapper link here..."
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">Generate a link from your payment provider's dashboard and paste it here.</p>
                    </div>
                </div>

                {/* 3. Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                    <button 
                        onClick={sendAppNotification}
                        disabled={!selectedUserId || !paymentLink}
                        className="flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                    >
                        <Send size={16} /> App Alert
                    </button>
                    <button 
                        onClick={sendWhatsApp}
                        disabled={!phone || !paymentLink}
                        className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 disabled:opacity-50"
                    >
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button 
                        onClick={sendEmail}
                        disabled={!email || !paymentLink}
                        className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50"
                    >
                        <Mail size={16} /> Email
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentManager;
