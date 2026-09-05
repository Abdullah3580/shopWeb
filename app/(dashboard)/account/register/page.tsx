'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setErrorR = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/account/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-1 text-sm text-gray-500">Sign up to get started</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700">Full Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disaabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-640">
        Al\�XYH]�H[�X���[����	�B�[���Y�H��X���[����[���\�Ә[YOH��۝\�[ZX��^[ܘ[��KMLݙ\��[�\�[�H�����[���[�ς�����]���
NB��^ܝY�][�[��[ۈ�Y�\�\�Y�J
H�]\��
�]��\�Ә[YOH��^Z[�ZV���H][\�X�[�\��\�Y�KX�[�\�MKLL�����\�[��H�[�X��^�]��\�Ә[YOH�^\�H^Yܘ^KML���Y[�ˋ���]��O���Y�\�\��ܛHς���\�[��O���]���
N