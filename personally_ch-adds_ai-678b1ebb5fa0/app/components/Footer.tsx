'use client';
import React from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function Footer() {
  const { isLoggedIn, loading } = useAuth();

  if (loading || !isLoggedIn) return null;

  return (
    <footer className="bg-white border-t text-white px-6 py-4">
        <p className="text-center text-sm text-gray-800">&copy; {new Date().getFullYear()} Adds AI. All rights reserved.</p>
    </footer>
  );
} 