import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Loader2, Lock, User, Shield } from 'lucide-react';

export default function ProfileView() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const res = await fetch('https://dms-backend-gf47.onrender.com/api/users/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPassword }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setMessage('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(result.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch (err) {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User className="text-slate-700" size={20} /> ข้อมูลโปรไฟล์ผู้ใช้งาน
        </h2>
        <p className="text-xs text-slate-500 mt-1">จัดการข้อมูลบัญชีและเปลี่ยนรหัสผ่านของคุณ</p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-2"><User size={16} /> อีเมลบัญชี:</span>
            <span className="font-medium text-slate-900">{user?.email || '-'}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 flex items-center gap-2"><Shield size={16} /> สถานะสิทธิ์:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs uppercase font-semibold ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
              {user?.role || 'User'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Lock size={16} /> เปลี่ยนรหัสผ่านใหม่
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">รหัสผ่านใหม่</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
            />
          </div>

          {message && (
            <p className={`text-xs p-3 rounded-lg ${message.includes('สำเร็จ') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isUpdating}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating && <Loader2 size={16} className="animate-spin" />}
            {isUpdating ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
}