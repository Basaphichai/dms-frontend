import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // 🟢 นำเข้า Router
import { AuthProvider, useAuth } from './AuthContext';
import LoginForm from './LoginForm';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './PrivacyPolicy'; // 🟢 นำเข้าหน้าเพจนโยบาย
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  Search, 
  LayoutDashboard, 
  Folder, 
  LogOut, 
  Menu, 
  X,
  Loader2 
} from 'lucide-react';

const BASE_DOMAIN = 'https://dms-backend-gf47.onrender.com';
const API_BASE_URL = `${BASE_DOMAIN}/api/documents`;

const getFileTypeCategory = (doc) => {
  const mime = (doc.file_type || doc.type || '').toLowerCase();
  const name = (doc.name || '').toLowerCase();
  const ext = name.split('.').pop() || '';

  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'svg', 'bmp'];
  const wordExts = ['doc', 'docx'];
  const pdfExts = ['pdf'];

  if (mime.startsWith('image/') || imageExts.includes(ext)) return 'image';
  if (mime.includes('pdf') || pdfExts.includes(ext)) return 'pdf';
  if (mime.includes('word') || mime.includes('msword') || mime.includes('officedocument') || wordExts.includes(ext)) return 'word';
  return 'other';
};

function DashboardContent() {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchDocuments = async () => {
    if (!user?.email) return;
    try {
      setLoadingDocs(true);
      setErrorMsg('');
      const url = new URL(API_BASE_URL);
      url.searchParams.append('userEmail', user.email);
      const res = await fetch(url.toString());
      const result = await res.json();
      if (res.ok && result.success) {
        setDocuments(result.data || []);
      } else {
        setErrorMsg(result.message || 'ไม่สามารถดึงข้อมูลเอกสารได้');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchDocuments();
  }, [user?.email]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user?.email) {
      setErrorMsg('ไม่พบข้อมูลอีเมลผู้ใช้ กรุณาล็อกอินใหม่อีกครั้ง');
      return;
    }

    const MAX_SIZE_MB = 25;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`ขนาดไฟล์ใหญ่เกินไป (รองรับสูงสุด ${MAX_SIZE_MB}MB)`);
      e.target.value = '';
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
    const isImageMime = file.type ? file.type.startsWith('image/') : false;
    const isPdfOrWordMime = file.type ? (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('officedocument') || file.type.includes('msword')) : false;
    const isValidExt = allowedExtensions.includes(fileExt);

    if (!isImageMime && !isPdfOrWordMime && !isValidExt) {
      setErrorMsg('อนุญาตใหัปโหลดเฉพาะไฟล์ PDF, Word และรูปภาพเท่านั้น!');
      e.target.value = '';
      return;
    }

    setErrorMsg('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', user.email);

      const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
      const result = await res.json();
      if (res.ok && result.success) {
        fetchDocuments();
      } else {
        setErrorMsg(result.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถส่งไฟล์ไปยังเซิร์ฟเวอร์ได้');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;
    try {
      const url = new URL(`${API_BASE_URL}/${id}`);
      if (user?.email) url.searchParams.append('userEmail', user.email);
      const res = await fetch(url.toString(), { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
      } else {
        alert(result.message || 'ไม่สามารถลบเอกสารได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบเอกสาร');
    }
  };

  const handleEdit = async (id, currentName) => {
    const newName = prompt('แก้ไขชื่อเอกสาร:', currentName);
    if (!newName || newName.trim() === '' || newName === currentName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), userEmail: user?.email }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setDocuments(prevDocs => prevDocs.map(doc => doc.id === id ? { ...doc, name: newName.trim() } : doc));
      } else {
        alert(result.message || 'ไม่สามารถแก้ไขชื่อเอกสารได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการแก้ไขชื่อเอกสาร');
    }
  };

  const handleOpenFile = (fileUrl) => {
    if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
    else alert('ไม่พบลิงก์ไฟล์เอกสาร');
  };

  const pdfCount = documents.filter(d => getFileTypeCategory(d) === 'pdf').length;
  const wordCount = documents.filter(d => getFileTypeCategory(d) === 'word').length;
  const imageCount = documents.filter(d => getFileTypeCategory(d) === 'image').length;

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name ? doc.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const category = getFileTypeCategory(doc);
    if (activeTab === 'pdf') return matchesSearch && category === 'pdf';
    if (activeTab === 'word') return matchesSearch && category === 'word';
    if (activeTab === 'image') return matchesSearch && category === 'image';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col justify-between`}>
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
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"><LogOut size={18} /> ออกจากระบบ</button>
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

          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="ค้นหาชื่อเอกสาร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
            </div>
            <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium cursor-pointer transition shadow-sm shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
              {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
              <input type="file" disabled={isUploading} accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 md:px-6 py-3.5 font-medium">ชื่อเอกสาร</th>
                    <th className="px-4 md:px-6 py-3.5 font-medium">ขนาด</th>
                    <th className="px-4 md:px-6 py-3.5 font-medium">วันที่อัปโหลด</th>
                    <th className="px-4 md:px-6 py-3.5 font-medium text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDocs ? (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-sm"><div className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> กำลังโหลดเอกสาร...</div></td></tr>
                  ) : filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => {
                      const category = getFileTypeCategory(doc);
                      const displaySize = doc.file_size || doc.size || '-';
                      const displayDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString('th-TH') : '-';
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 md:px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                            {category === 'image' && doc.file_url ? (
                              <img src={doc.file_url} alt={doc.name} className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 shadow-sm hover:scale-105 transition cursor-pointer" onClick={() => handleOpenFile(doc.file_url)} />
                            ) : category === 'pdf' ? (
                              <FileText size={18} className="shrink-0 text-red-500" />
                            ) : (
                              <FileText size={18} className="shrink-0 text-blue-500" />
                            )}
                            <span className="truncate max-w-[180px] sm:max-w-xs">{doc.name}</span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">{displaySize}</td>
                          <td className="px-4 md:px-6 py-4 text-slate-500 text-xs">{displayDate}</td>
                          <td className="px-4 md:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button onClick={() => handleOpenFile(doc.file_url)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition" title="เปิดไฟล์"><Eye size={16} /></button>
                              <button onClick={() => handleEdit(doc.id, doc.name)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition" title="แก้ไขชื่อ"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition" title="ลบเอกสาร"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400 text-sm">ไม่พบเอกสารในหมวดหมู่นี้</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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