'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  icon: string | null;
  category: string | null;
}

interface UserService {
  id: string;
  serviceId: string;
  accessLevel: string;
  usageCount: number;
  lastUsedAt: string | null;
  service: Service;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [servicesRes, subscriptionRes, userServicesRes] = await Promise.all([
          api.get('/services'),
          api.get('/subscriptions/me').catch(() => null),
          api.get('/services/me').catch(() => ({ data: [] })),
        ]);

        setServices(servicesRes.data || []);
        setSubscription(subscriptionRes?.data || null);
        setUserServices(userServicesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const hasAccess = (serviceId: string) => {
    return userServices.some((us) => us.serviceId === serviceId);
  };

  const getUsageInfo = (serviceId: string) => {
    return userServices.find((us) => us.serviceId === serviceId);
  };

  const handleUseService = async (serviceId: string) => {
    try {
      const response = await api.post(`/services/${serviceId}/use`);
      // Update local state
      setUserServices((prev) =>
        prev.map((us) =>
          us.serviceId === serviceId
            ? {
                ...us,
                usageCount: response.data.usageCount,
                lastUsedAt: response.data.lastUsedAt,
              }
            : us,
        ),
      );
      alert('Сервис успешно использован!');
    } catch (error: any) {
      console.error('Error using service:', error);
      alert(
        error.response?.data?.message ||
          error.message ||
          'Ошибка при использовании сервиса',
      );
    }
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
      {!subscription ? (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            Для доступа к услугам необходимо оформить подписку.
          </p>
          <a
            href="/dashboard/subscription"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Выбрать план
          </a>
        </div>
      ) : (
        <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Доступные услуги</h2>
                <p className="text-gray-600 mb-6">
                  Активный план: <strong>{subscription.plan?.name}</strong>
                </p>

                {services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => {
                      const hasServiceAccess = hasAccess(service.id);
                      const usageInfo = getUsageInfo(service.id);

                      return (
                        <div
                          key={service.id}
                          className={`border rounded-lg p-6 ${
                            hasServiceAccess
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{service.name}</h3>
                              {service.category && (
                                <span className="text-xs text-gray-500">{service.category}</span>
                              )}
                            </div>
                            {hasServiceAccess && (
                              <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded">
                                Доступно
                              </span>
                            )}
                          </div>

                          {service.description && (
                            <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                          )}

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-600">Базовая цена: </span>
                              <span className="font-semibold">
                                {service.basePrice} RUB
                              </span>
                            </div>

                            {hasServiceAccess && usageInfo && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                <div className="text-sm text-gray-600">
                                  <div className="mb-1">
                                    <strong>Использований:</strong> {usageInfo.usageCount}
                                  </div>
                                  {usageInfo.lastUsedAt && (
                                    <div className="mb-3">
                                      <strong>Последнее использование:</strong>{' '}
                                      {new Date(usageInfo.lastUsedAt).toLocaleDateString('ru-RU', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleUseService(service.id)}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  Использовать сервис
                                </button>
                              </div>
                            )}

                            {!hasServiceAccess && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">
                                  Не входит в текущий план
                                </p>
                                <a
                                  href="/dashboard/subscription"
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Обновить план →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Нет доступных услуг</p>
                )}
              </div>

              {userServices.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Статистика использования</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Услуга
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Использований
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Последнее использование
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userServices.map((userService) => (
                          <tr key={userService.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {userService.service.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {userService.usageCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {userService.lastUsedAt
                                ? new Date(userService.lastUsedAt).toLocaleDateString('ru-RU')
                                : 'Никогда'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
        </div>
      )}
    </div>
  );
}

