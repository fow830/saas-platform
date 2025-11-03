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
  sortOrder: number;
}

export default function AdminPlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingPeriod: 'MONTHLY',
    maxServices: '1',
    maxUsers: '1',
    trialDays: '0',
    sortOrder: '0',
    isActive: true,
    features: {},
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, plansRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/plans?includeInactive=true'),
        ]);

        setUser(userRes.data);
        setPlans(plansRes.data || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billingPeriod: 'MONTHLY',
      maxServices: '1',
      maxUsers: '1',
      trialDays: '0',
      sortOrder: '0',
      isActive: true,
      features: {},
    });
    setEditingPlan(null);
    setShowForm(false);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        billingPeriod: formData.billingPeriod,
        maxServices: formData.maxServices === '-1' ? -1 : parseInt(formData.maxServices),
        maxUsers: formData.maxUsers === '-1' ? -1 : parseInt(formData.maxUsers),
        trialDays: parseInt(formData.trialDays),
        sortOrder: parseInt(formData.sortOrder),
        isActive: formData.isActive,
        features: formData.features,
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        setMessage('Тариф успешно обновлен');
      } else {
        await api.post('/plans', payload);
        setMessage('Тариф успешно создан');
      }

      // Refresh plans
      const plansRes = await api.get('/plans?includeInactive=true');
      setPlans(plansRes.data || []);
      resetForm();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при сохранении тарифа',
      );
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      billingPeriod: plan.billingPeriod,
      maxServices: plan.maxServices === -1 ? '-1' : plan.maxServices.toString(),
      maxUsers: plan.maxUsers === -1 ? '-1' : plan.maxUsers.toString(),
      trialDays: plan.trialDays.toString(),
      sortOrder: plan.sortOrder.toString(),
      isActive: plan.isActive,
      features: plan.features || {},
    });
    setShowForm(true);
    setMessage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) {
      return;
    }

    try {
      await api.delete(`/plans/${id}`);
      setMessage('Тариф успешно удален');
      const plansRes = await api.get('/plans?includeInactive=true');
      setPlans(plansRes.data || []);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при удалении тарифа',
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getBillingPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      MONTHLY: 'Месяц',
      QUARTERLY: 'Квартал',
      YEARLY: 'Год',
      LIFETIME: 'Однократно',
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Доступ запрещен</h2>
          <p className="text-red-600">У вас нет прав для доступа к этой странице.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Конструктор тарифов</h1>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Создать тариф
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.includes('успешно')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingPlan ? 'Редактировать тариф' : 'Создать новый тариф'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена (₽) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Период оплаты *
                </label>
                <select
                  required
                  value={formData.billingPeriod}
                  onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MONTHLY">Месяц</option>
                  <option value="QUARTERLY">Квартал</option>
                  <option value="YEARLY">Год</option>
                  <option value="LIFETIME">Однократно</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Макс. услуг (-1 = безлимит)
                </label>
                <input
                  type="number"
                  min="-1"
                  value={formData.maxServices}
                  onChange={(e) => setFormData({ ...formData, maxServices: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Макс. пользователей (-1 = безлимит)
                </label>
                <input
                  type="number"
                  min="-1"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пробный период (дней)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.trialDays}
                  onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Порядок сортировки
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Активен
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingPlan ? 'Сохранить изменения' : 'Создать тариф'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Список тарифов</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Период
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Услуги
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователи
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Тарифы не найдены
                  </td>
                </tr>
              ) : (
                plans
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(plan.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBillingPeriodLabel(plan.billingPeriod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.maxServices === -1 ? 'Безлимит' : plan.maxServices}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plan.maxUsers === -1 ? 'Безлимит' : plan.maxUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            plan.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {plan.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
