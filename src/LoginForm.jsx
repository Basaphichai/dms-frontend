import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Folder, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
    if (isRegister) {
      // 1. เรียกสมัครสมาชิก
      await register(name, email, password);
      
      // 2. แจ้งเตือนผู้ใช้เมื่อสมัครสำเร็จ
      alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบด้วยบัญชีใหม่ของคุณ');
      
      // 3. สลับหน้ากลับมาที่หน้า Login และล้างรหัสผ่าน
      setIsRegister(false);
      setPassword('');
    } else {
      // เข้าสู่ระบบตามปกติ
      await login(email, password);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-slate-900 text-white rounded-xl mb-2">
            <Folder size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRegister ? 'สร้างบัญชีผู้ใช้ใหม่' : 'ยินดีต้อนรับกลับมา'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRegister 
              ? 'กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบจัดการเอกสาร' 
              : 'กรุณาเข้าสู่ระบบเพื่อเข้าถึงคลังเอกสารของคุณ'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100 font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">ชื่อ - นามสกุล</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">อีเมล</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">รหัสผ่าน</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังดำเนินการ...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isRegister ? 'มีบัญชีผู้ใช้อยู่แล้ว?' : 'ยังไม่มีบัญชีผู้ใช้?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="ml-1.5 font-semibold text-slate-900 hover:underline"
            >
              {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </p>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck size={14} />
          ระบบการจัดเก็บข้อมูลปลอดภัยด้วย JWT Authentication
        </div>

      </div>
    </div>
  );
}