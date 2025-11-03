'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import api from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;

    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, subscriptionRes, statsRes] = await Promise.all([
          api.get('/auth/profile').catch((err) => {
            console.error('Error fetching user:', err);
            throw err;
          }),
          api.get('/subscriptions/me').catch(() => null),
          api.get('/analytics/me').catch(() => null),
        ]);

        setUser(userRes.data);
        setSubscription(subscriptionRes?.data || null);
        setStats(statsRes?.data || null);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error.response?.status === 500) {
          console.error('Server error:', error.response.data);
        }
        // Don't throw - allow page to render with empty data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Добро пожаловать!</h2>

        {subscription ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Активная подписка</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">План</p>
                  <p className="font-semibold">{subscription.plan?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Статус</p>
                  <p className="font-semibold">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : subscription.status === 'TRIALING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Начало периода</p>
                  <p className="font-semibold">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Конец периода</p>
                  <p className="font-semibold">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>

            {stats && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Статистика</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Услуг</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.servicesCount || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Использований</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalUsage || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Счетов</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.invoicesCount || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Потрачено</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.totalSpent ? Number(stats.totalSpent).toFixed(2) : '0.00'} ₽
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex gap-4">
                <a
                  href="/dashboard/services"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Услуги
                </a>
                <a
                  href="/dashboard/subscription"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Управление подпиской
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">У вас нет активной подписки.</p>
            <a
                  href="/dashboard/subscription"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Выбрать план
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

