import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 🟢 1. นำเข้า Link จาก react-router-dom

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <p style={styles.text}>
          เว็บไซต์นี้มีการใช้งานคุกกี้ (Cookies) เพื่อเพิ่มประสบการณ์การใช้งานที่ดี และวิเคราะห์การเข้าชมเว็บไซต์ อ่านเพิ่มเติมได้ที่{' '}
          {/* 🟢 2. เปลี่ยนจาก <a href="..."> เป็น <Link to="..."> */}
          <Link to="/privacy-policy" style={styles.link}>
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>
        <button onClick={handleAccept} style={styles.button}>
          ยอมรับทั้งหมด
        </button>
      </div>
    </div>
  );
}

// (สไตล์เดิมคงไว้ตามเดิมได้เลยครับ)
const styles = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    padding: '16px 24px',
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  text: {
    margin: 0,
    fontSize: '14px',
    flex: 1,
    lineHeight: '1.5',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'underline',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
};