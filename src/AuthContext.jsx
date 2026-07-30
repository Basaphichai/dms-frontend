import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. ระบุ URL และ Anon Key ของ Supabase ลงไปตรงๆ
const supabaseUrl = 'https://whgzswfyjkbfxluccnea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZ3pzd2Z5amtiZnhsdWNjbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE5MjM0NiwiZXhwIjoyMTAwNzY4MzQ2fQ.ecNJI1XzykrIN4d1C0RiEfeWdgUOErZkl5NG-xK4lUg'; 

// 2. สร้าง Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันช่วยดึงข้อมูล role จากตาราง profiles เพิ่มเติม
  const fetchUserProfile = async (sessionUser) => {
    if (!sessionUser) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUser.id)
        .single();

      return {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
        role: data?.role || 'user', // ดึง role จากตาราง profiles ถ้าไม่มีให้เป็น 'user'
      };
    } catch (err) {
      console.error('Error fetching user profile role:', err);
      return {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
        role: 'user',
      };
    }
  };

  useEffect(() => {
    // 1. ตรวจสอบ Session จาก Supabase เมื่อโหลดหน้าเว็บ
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setToken(session.access_token);
        const enrichedUser = await fetchUserProfile(session.user);
        setUser(enrichedUser);
      }
      setLoading(false);
    };

    initAuth();

    // 2. ดักฟัง Event เปลี่ยนแปลงสถานะ Auth (เช่น Login, Logout, Session หมดอายุ)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token);
        const enrichedUser = await fetchUserProfile(session.user);
        setUser(enrichedUser);
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ฟังก์ชัน Login เช็คกับ Supabase Auth จริง
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('อีเมลนี้ยังไม่ได้ทำการยืนยันตัวตน');
      }
      throw new Error(error.message);
    }

    return data;
  };

  // ฟังก์ชัน Register บันทึก User ใหม่ลง Database ของจริง
  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว');
      }
      throw new Error(error.message);
    }

    return data;
  };

  // ฟังก์ชัน Logout สั่งเคลียร์ Session ฝั่ง Supabase
  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);