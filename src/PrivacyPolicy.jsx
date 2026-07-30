import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        
        {/* ปุ่มย้อนกลับ */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft size={16} /> กลับสู่หน้าหลัก
        </button>

        {/* หัวข้อ */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
            <p className="text-xs text-slate-500">อัปเดตล่าสุด: กรกฎาคม 2026</p>
          </div>
        </div>

        {/* เนื้อหานโยบาย */}
        <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. การเก็บรวบรวมข้อมูลส่วนบุคคล</h2>
            <p>
              เว็บไซต์ระบบจัดเก็บเอกสารของเรา มีการเก็บรวบรวมข้อมูลเท่าที่จำเป็น เช่น อีเมล ชื่อผู้ใช้งาน และไฟล์เอกสารที่คุณอัปโหลดเข้าสู่ระบบ เพื่อใช้ในการยืนยันตัวตนและให้บริการจัดเก็บไฟล์ของคุณอย่างมีประสิทธิภาพ
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <p>
              ข้อมูลทั้งหมดจะถูกใช้เพื่อการให้บริการระบบจัดการเอกสาร การรักษาความปลอดภัยของบัญชีผู้ใช้งาน และการปรับปรุงประสบการณ์การใช้งานให้ดียิ่งขึ้น เราไม่มีนโยบายนำข้อมูลของคุณไปจำหน่ายหรือเผยแพร่ให้แก่บุคคลภายนอก
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. ความปลอดภัยของข้อมูล</h2>
            <p>
              เราใช้ระบบการเข้ารหัสผ่าน (Authentication) และมาตรการรักษาความปลอดภัยที่ได้มาตรฐาน เพื่อป้องกันการเข้าถึงข้อมูลส่วนตัวของคุณโดยไม่ได้รับอนุญาต
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. สิทธิของผู้ใช้งานตามกฎหมาย (PDPA)</h2>
            <p>
              ท่านมีสิทธิ์ในการเข้าถึง ขอรับสำเนา หรือขอลบข้อมูลส่วนบุคคลของท่านที่อยู่ในระบบของเราได้ตลอดเวลา โดยสามารถติดต่อผู้ดูแลระบบผ่านช่องทางหลักขององค์กร
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}