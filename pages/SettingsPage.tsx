
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, Button, Input } from '../components/UI';
import { Store, Shield, Users, Palette, Bell } from 'lucide-react';

const InviteUserForm: React.FC = () => {
    const { inviteUser } = useApp();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'manager' | 'cashier'>('cashier');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            await inviteUser(email, role);
            setEmail('');
        }
    };

    return (
        <form onSubmit={handleInvite} className="flex gap-2">
            <Input
                type="email"
                placeholder="Invite member by email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            <select
                value={role}
                onChange={e => setRole(e.target.value as 'manager' | 'cashier')}
                className="bg-slate-700 text-white rounded-md px-2"
            >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
            </select>
            <Button type="submit">Invite</Button>
        </form>
    );
};

export const SettingsPage: React.FC = () => {
    const { user, logout, showToast } = useApp();
    const [storeInfo, setStoreInfo] = useState(user?.storeInfo || { name: '', address: '', phone: '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleStoreInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
    };

    const { updateStoreInfo } = useApp();

    const handleSaveStoreInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateStoreInfo(storeInfo);
    };
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if(passwords.new !== passwords.confirm) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        // In real app, call Firebase auth to update password
        showToast('Password changed successfully!', 'success');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    return (
        <div className="space-y-8">
            <h1 className="font-orbitron text-3xl text-white">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                    {/* Store Information */}
                    <Card>
                        <div className="p-4 border-b border-slate-700">
                            <h2 className="font-orbitron text-xl text-sky-400 flex items-center gap-2"><Store/> Store Information</h2>
                        </div>
                        <form onSubmit={handleSaveStoreInfo} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Store Name</label>
                                <Input name="name" value={storeInfo.name} onChange={handleStoreInfoChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                                <Input name="address" value={storeInfo.address} onChange={handleStoreInfoChange} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                                <Input name="phone" value={storeInfo.phone} onChange={handleStoreInfoChange} />
                            </div>
                            <Button type="submit" className="w-full">Save Store Info</Button>
                        </form>
                    </Card>

                     {/* App Settings */}
                    <Card>
                        <div className="p-4 border-b border-slate-700">
                            <h2 className="font-orbitron text-xl text-sky-400 flex items-center gap-2"><Palette/> App Settings</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-300">Dark Mode</label>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked/>
                                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer"></label>
                                </div>
                            </div>
                             <div className="flex justify-between items-center">
                                <label className="text-slate-300">Sound Effects</label>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="sound-toggle" id="sound-toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                    <label htmlFor="sound-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer"></label>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                     {/* Security */}
                    <Card>
                        <div className="p-4 border-b border-slate-700">
                            <h2 className="font-orbitron text-xl text-sky-400 flex items-center gap-2"><Shield/> Security</h2>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            <h3 className="font-semibold text-slate-200">Change Password</h3>
                            <Input type="password" name="current" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                            <Input type="password" name="new" placeholder="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                            <Input type="password" name="confirm" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}/>
                            <Button type="submit" className="w-full">Update Password</Button>
                             <hr className="border-slate-700"/>
                             <Button type="button" variant="secondary" className="w-full">Change PIN</Button>
                        </form>
                    </Card>

                    {/* Team Management */}
                     {user?.role === 'owner' && (
                        <Card>
                            <div className="p-4 border-b border-slate-700">
                                <h2 className="font-orbitron text-xl text-sky-400 flex items-center gap-2"><Users/> Team Management</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <InviteUserForm />
                                <div className="space-y-2">
                                    {/* TODO: List invited users */}
                                </div>
                            </div>
                        </Card>
                     )}

                </div>
            </div>
        </div>
    );
};
