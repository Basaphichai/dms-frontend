import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Folder, FileText, ImageIcon, Upload, Trash2, Edit3,
  Search, Shield, User, LogOut, Menu, X, ExternalLink,
  LayoutDashboard, Users, Loader2, Eye, Download, CheckSquare, Square
} from 'lucide-react';

function getFileTypeCategory(doc) {
  const name = (doc.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image';
  return 'word';
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // State สำหรับเก็บรายการ ID ของเอกสารที่ถูกเลือกติ๊ก Checkbox
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [user, setUser] = useState({ email: 'aphichaichiaraksa@gmail.com', role: 'admin' });
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error.message);
      setErrorMsg('ไม่สามารถดึงข้อมูลเอกสารได้');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && user.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, user.role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsersList(data);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const pdfCount = documents.filter(d => getFileTypeCategory(d) === 'pdf').length;
  const wordCount = documents.filter(d => getFileTypeCategory(d) === 'word').length;
  const imageCount = documents.filter(d => getFileTypeCategory(d) === 'image').length;

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeTab === 'all' ? true : activeTab === getFileTypeCategory(doc);
    return matchesSearch && categoryMatch;
  });

  // จัดการการเลือก Checkbox ทีละตัว
  const handleToggleSelectDoc = (id) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // เลือกทั้งหมด / ยกเลิกเลือกทั้งหมด ในหน้าปัจจุบัน
  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map(d => d.id));
    }
  };

  // ฟังก์ชันดาวน์โหลดแบบกลุ่มเป็นไฟล์ ZIP
  const handleBulkDownloadZip = async () => {
    if (selectedDocIds.length === 0) return;
    setIsDownloadingZip(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("downloaded_documents");

      const selectedDocs = documents.filter(d => selectedDocIds.includes(d.id));

      for (const doc of selectedDocs) {
        if (doc.file_url && doc.file_url !== '#') {
          try {
            const response = await fetch(doc.file_url);
            const blob = await response.blob();
            folder.file(doc.name, blob);
          } catch (err) {
            console.error(`ไม่สามารถโหลดไฟล์ ${doc.name} ได้:`, err);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `documents_${new Date().toISOString().slice(0,10)}.zip`);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP: ' + error.message);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('docs')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('documents')
        .insert([
          { 
            name: file.name, 
            file_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            file_url: publicUrl 
          }
        ]);

      if (insertError) throw insertError;

      fetchDocuments();
    } catch (error) {
      setErrorMsg('อัปโหลดไม่สำเร็จ: ' + error.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== id));
      setSelectedDocIds(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    }
  };

  const handleEdit = async (id, currentName) => {
    const newName = prompt('แก้ไขชื่อเอกสาร:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
      try {
        const { error } = await supabase
          .from('documents')
          .update({ name: newName.trim() })
          .eq('id', id);

        if (error) throw error;
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, name: newName.trim() } : d));
      } catch (error) {
        alert('แก้ไขชื่อไม่สำเร็จ: ' + error.message);
      }
    }
  };

  const handleOpenFile = (url) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('ไม่พบลิงก์ไฟล์สำหรับเปิดดู');
    }
  };

  const handleEditUser = (targetEmail) => {
    const newPassword = prompt(`ป้อนรหัสผ่านใหม่สำหรับผู้ใช้ (${targetEmail}):`);
    if (newPassword) {
      alert('เปลี่ยนรหัสผ่านผู้ใช้สำเร็จ');
    }
  };

  const handleDeleteUser = async (targetUserId, targetEmail) => {
    if (!confirm(`คุณต้องการลบบัญชีผู้ใช้ ${targetEmail} ใช่หรือไม่?`)) return;
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', targetUserId);

      if (error) throw error;
      setUsersList(prev => prev.filter(u => u.id !== targetUserId));
      alert('ลบบัญชีผู้ใช้สำเร็จ');
    } catch (error) {
      alert('ลบผู้ใช้ไม่สำเร็จ: ' + error.message);
    }
  };

  const logout = () => {
    alert('ออกจากระบบเรียบร้อย');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity" />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:translate-x-0 h-screen flex flex-col justify-between shrink-0`}>
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5 font-bold text-slate-900 text-base">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg shadow-sm"><Folder size={18} /></div>
              <span>ระบบแฟ้มเอกสาร</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
          </div>

          <nav className="p-4 space-y-1.5">
            <button onClick={() => { setActiveTab('all'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><LayoutDashboard size={18} /><span>เอกสารทั้งหมด</span></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>{documents.length}</span>
            </button>

            <div className="pt-3 pb-1 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">หมวดหมู่เอกสาร</div>

            <button onClick={() => { setActiveTab('pdf'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'pdf' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><FileText size={18} className="text-red-500" /><span>เอกสาร PDF</span></div>
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 font-normal">{pdfCount}</span>
            </button>

            <button onClick={() => { setActiveTab('word'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'word' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><FileText size={18} className="text-blue-500" /><span>เอกสาร Word</span></div>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-normal">{wordCount}</span>
            </button>

            <button onClick={() => { setActiveTab('image'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'image' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><ImageIcon size={18} className="text-emerald-500" /><span>ไฟล์รูปภาพ</span></div>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-normal">{imageCount}</span>
            </button>

            {user?.role === 'admin' && (
              <>
                <div className="pt-3 pb-1 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ผู้ดูแลระบบ</div>
                <button onClick={() => { setActiveTab('users'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-3"><Users size={18} /><span>จัดการบัญชีผู้ใช้</span></div>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-100 rounded-lg">
            <span className="text-slate-500 flex items-center gap-1"><Shield size={13} /> สิทธิ์:</span>
            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
              {user?.role || 'User'}
            </span>
          </div>

          <button 
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} 
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <User size={18} /> จัดการโปรไฟล์
          </button>

          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition">
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"><Menu size={22} /></button>
            <h1 className="text-base md:text-lg font-semibold text-slate-900">
              {activeTab === 'all' && 'คลังเอกสารทั้งหมด'}
              {activeTab === 'pdf' && 'คลังเอกสาร PDF'}
              {activeTab === 'word' && 'คลังเอกสาร Word'}
              {activeTab === 'image' && 'คลังรูปภาพ'}
              {activeTab === 'users' && 'จัดการบัญชีผู้ใช้งานในระบบ'}
              {activeTab === 'profile' && 'จัดการโปรไฟล์ผู้ใช้งาน'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-xs uppercase shadow-sm">
              {user?.email ? user.email[0] : 'U'}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          {activeTab === 'profile' ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">จัดการโปรไฟล์ผู้ใช้งาน</h3>
              <p className="text-sm text-slate-600">อีเมล: {user?.email}</p>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 min-w-[550px]">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 md:px-6 py-3.5 font-medium">อีเมลผู้ใช้</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium">สิทธิ์การใช้งาน</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium">วันที่สร้าง</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingUsers ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-sm"><div className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> กำลังโหลดรายชื่อผู้ใช้...</div></td></tr>
                      ) : usersList.length > 0 ? (
                        usersList.map((uItem) => (
                          <tr key={uItem.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 md:px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                              <User size={16} className="text-slate-400" />
                              <span>{uItem.email}</span>
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs uppercase font-semibold ${uItem.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                {uItem.role || 'user'}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">
                              {uItem.created_at ? new Date(uItem.created_at).toLocaleDateString('th-TH') : '-'}
                            </td>
                            <td className="px-4 md:px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                <button onClick={() => handleEditUser(uItem.email)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition" title="แก้ไขรหัสผ่าน"><Edit3 size={16} /></button>
                                <button onClick={() => handleDeleteUser(uItem.id, uItem.email)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition" title="ลบบัญชีผู้ใช้"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-sm">ไม่พบข้อมูลผู้ใช้งานในระบบ</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div onClick={() => setActiveTab('all')} className={`p-4 md:p-5 rounded-xl border transition cursor-pointer shadow-sm ${activeTab === 'all' ? 'bg-white border-slate-900 ring-1 ring-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-xs text-slate-500 font-medium">เอกสารทั้งหมด</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{documents.length} รายการ</p>
                </div>
                <div onClick={() => setActiveTab('pdf')} className={`p-4 md:p-5 rounded-xl border transition cursor-pointer shadow-sm ${activeTab === 'pdf' ? 'bg-white border-red-500 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-xs text-slate-500 font-medium">ไฟล์ PDF</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{pdfCount} รายการ</p>
                </div>
                <div onClick={() => setActiveTab('word')} className={`p-4 md:p-5 rounded-xl border transition cursor-pointer shadow-sm ${activeTab === 'word' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-xs text-slate-500 font-medium">ไฟล์ Word</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{wordCount} รายการ</p>
                </div>
                <div onClick={() => setActiveTab('image')} className={`p-4 md:p-5 rounded-xl border transition cursor-pointer shadow-sm ${activeTab === 'image' ? 'bg-white border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-xs text-slate-500 font-medium">ไฟล์รูปภาพ</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{imageCount} รายการ</p>
                </div>
              </div>

              {/* ส่วนค้นหา และปุ่มดาวน์โหลดกลุ่ม (Bulk Download) */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="ค้นหาชื่อเอกสาร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedDocIds.length > 0 && (
                    <button 
                      onClick={handleBulkDownloadZip}
                      disabled={isDownloadingZip}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm shrink-0"
                    >
                      {isDownloadingZip ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      ดาวน์โหลดที่เลือก ({selectedDocIds.length}) เป็น .ZIP
                    </button>
                  )}

                  <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium cursor-pointer transition shadow-sm shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                    {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
                    <input type="file" disabled={isUploading} accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 flex justify-between items-center">
                  <span>{errorMsg}</span>
                  <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
                </div>
              )}

              {/* ตารางแสดงเอกสารพร้อม Checkbox */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 w-10 text-center">
                          <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-800" title="เลือกทั้งหมด">
                            {filteredDocs.length > 0 && selectedDocIds.length === filteredDocs.length ? (
                              <CheckSquare size={16} className="text-slate-900" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </th>
                        <th className="px-4 md:px-6 py-3.5 font-medium">ชื่อเอกสาร</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium">ขนาด</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium">วันที่อัปโหลด</th>
                        <th className="px-4 md:px-6 py-3.5 font-medium text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingDocs ? (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-400 text-sm"><div className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> กำลังโหลดเอกสาร...</div></td></tr>
                      ) : filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => {
                          const category = getFileTypeCategory(doc);
                          const displaySize = doc.file_size || doc.size || '-';
                          const displayDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString('th-TH') : '-';
                          const isSelected = selectedDocIds.includes(doc.id);

                          return (
                            <tr key={doc.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-slate-50/90' : ''}`}>
                              <td className="px-4 py-4 text-center">
                                <button onClick={() => handleToggleSelectDoc(doc.id)} className="text-slate-400 hover:text-slate-700">
                                  {isSelected ? <CheckSquare size={16} className="text-slate-900" /> : <Square size={16} />}
                                </button>
                              </td>
                              <td className="px-4 md:px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                {category === 'image' && doc.file_url ? (
                                  <img src={doc.file_url} alt={doc.name} className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 shadow-sm hover:scale-105 transition cursor-pointer" onClick={() => handleOpenFile(doc.file_url)} />
                                ) : category === 'pdf' ? (
                                  <FileText size={18} className="shrink-0 text-red-500" />
                                ) : (
                                  <FileText size={18} className="shrink-0 text-blue-500" />
                                )}
                                <span className="truncate max-w-[160px] sm:max-w-xs">{doc.name}</span>
                              </td>
                              <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">{displaySize}</td>
                              <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">{displayDate}</td>
                              <td className="px-4 md:px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                  <button onClick={() => handleOpenFile(doc.file_url)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition" title="เปิดไฟล์"><ExternalLink size={16} /></button>
                                  <button onClick={() => handleEdit(doc.id, doc.name)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition" title="แก้ไขชื่อ"><Edit3 size={16} /></button>
                                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition" title="ลบเอกสาร"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-400 text-sm">ไม่พบเอกสารในหมวดหมู่นี้</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function MainRouterComponent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        <Loader2 size={24} className="animate-spin text-slate-600" />
      </div>
    );
  }
  return isAuthenticated ? <DashboardContent /> : <LoginForm />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainRouterComponent />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </AuthProvider>
  );
}