'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingPeriod: string;
  features: any;
  maxServices: number;
  maxUsers: number;
  isActive: boolean;
  trialDays: number;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [plansRes, subscriptionRes] = await Promise.all([
          api.get('/plans'),
          api.get('/subscriptions/me').catch(() => null),
        ]);

        setPlans(plansRes.data || []);
        setSubscription(subscriptionRes?.data || null);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCreateSubscription = async (planId: string) => {
    if (subscription && subscription.status === 'ACTIVE') {
      if (!confirm('У вас уже есть активная подписка. Хотите изменить план?')) {
        return;
      }
      await handleChangePlan(planId);
      return;
    }

    setProcessing(planId);
    try {
      await api.post('/subscriptions', { planId });
      alert('Подписка успешно создана!');
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      alert(error.response?.data?.message || 'Ошибка при создании подписки');
    } finally {
      setProcessing(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setProcessing(planId);
    try {
      await api.put('/subscriptions/change-plan', { planId });
      alert('План успешно изменен!');
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      console.error('Error changing plan:', error);
      alert(error.response?.data?.message || 'Ошибка при изменении плана');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Вы уверены, что хотите отменить подписку? Она будет активна до конца текущего периода.')) {
      return;
    }

    try {
      await api.post('/subscriptions/cancel');
      alert('Подписка будет отменена в конце текущего периода');
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert(error.response?.data?.message || 'Ошибка при отмене подписки');
    }
  };

  const formatPrice = (price: number, period: string) => {
    const periodMap: Record<string, string> = {
      MONTHLY: 'мес',
      QUARTERLY: 'кв',
      YEARLY: 'год',
      LIFETIME: 'разово',
    };
    return `${price} ₽/${periodMap[period] || period.toLowerCase()}`;
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.planId === planId;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {subscription && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Текущая подписка</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">План: </span>
              <span className="font-semibold">{subscription.plan?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Статус: </span>
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
            </div>
            <div>
              <span className="text-gray-600">Текущий период: </span>
              <span>
                {new Date(subscription.currentPeriodStart).toLocaleDateString('ru-RU')} -{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {subscription.trialEnd && (
              <div>
                <span className="text-gray-600">Пробный период до: </span>
                <span>{new Date(subscription.trialEnd).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <div className="text-yellow-600">
                Подписка будет отменена в конце текущего периода
              </div>
            )}
            {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancel}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Отменить подписку
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Доступные планы</h2>
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  isCurrentPlan(plan.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatPrice(Number(plan.price), plan.billingPeriod)}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-sm">
                    <span className="font-semibold">Макс. услуг: </span>
                    {plan.maxServices === 999 ? 'Безлимит' : plan.maxServices}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Макс. пользователей: </span>
                    {plan.maxUsers === 999 ? 'Безлимит' : plan.maxUsers}
                  </div>
                  {plan.trialDays > 0 && (
                    <div className="text-sm text-green-600">
                      Пробный период: {plan.trialDays} дней
                    </div>
                  )}
                  {plan.features && typeof plan.features === 'object' && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        Особенности:
                      </div>
                      <ul className="text-xs space-y-1">
                        {Object.entries(plan.features).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>
                              {key}: {String(value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    isCurrentPlan(plan.id)
                      ? alert('Это ваш текущий план')
                      : handleCreateSubscription(plan.id)
                  }
                  disabled={processing === plan.id || isCurrentPlan(plan.id)}
                  className={`w-full px-4 py-2 rounded font-semibold ${
                    isCurrentPlan(plan.id)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : processing === plan.id
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCurrentPlan(plan.id)
                    ? 'Текущий план'
                    : processing === plan.id
                    ? 'Обработка...'
                    : subscription
                    ? 'Изменить план'
                    : 'Выбрать план'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Нет доступных планов</p>
        )}
      </div>
    </div>
  );
}

