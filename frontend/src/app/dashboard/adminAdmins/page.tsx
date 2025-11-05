'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

interface Admin {
  id: string;
  simpleId?: string | null;
  email: string;
  firstName: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminsResponse {
  data: Admin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminAdminsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
  });
  const limit = 10;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Сначала загружаем профиль пользователя
        const userRes = await api.get('/auth/profile');
        setUser(userRes.data);
        
        // Проверяем роль перед запросом админов
        if (userRes.data.role !== 'ADMIN') {
          setLoading(false);
          return;
        }

        // Загружаем админов только если пользователь админ
        const adminsRes = await api.get(`/admin/admins?page=${page}&limit=${limit}`);
        const adminsData: AdminsResponse = adminsRes.data;
        setAdmins(adminsData.data || []);
        setTotalPages(adminsData.totalPages || 1);
        setTotal(adminsData.total || 0);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          if (error.config?.url?.includes('/auth/profile')) {
            router.push('/login');
            return;
          }
          router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, page]);

  const fetchData = async () => {
    try {
      // Сначала загружаем профиль пользователя
      const userRes = await api.get('/auth/profile');
      setUser(userRes.data);
      
      // Проверяем роль перед запросом админов
      if (userRes.data.role !== 'ADMIN') {
        setLoading(false);
        return;
      }

      // Загружаем админов только если пользователь админ
      const adminsRes = await api.get(`/admin/admins?page=${page}&limit=${limit}`);
      const adminsData: AdminsResponse = adminsRes.data;
      setAdmins(adminsData.data || []);
      setTotalPages(adminsData.totalPages || 1);
      setTotal(adminsData.total || 0);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        if (error.config?.url?.includes('/auth/profile')) {
          router.push('/login');
          return;
        }
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const response = await api.post('/admin/admins', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
      });

      // Обновляем список администраторов
      await fetchData();
      
      // Сбрасываем форму
      setFormData({ email: '', password: '', firstName: '' });
      setShowCreateForm(false);
      setMessage('Администратор успешно создан');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при создании администратора',
      );
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    );
  }

  // Проверка доступа только после загрузки данных пользователя
  if (!loading) {
    if (!user) {
      return (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Ошибка</h2>
            <p className="text-red-600">Не удалось загрузить данные пользователя.</p>
          </div>
        </div>
      );
    }
    if (user.role !== 'ADMIN') {
      return (
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Доступ запрещен</h2>
            <p className="text-red-600">У вас нет прав для доступа к этой странице.</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div>
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

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Администраторы</h1>
            <p className="mt-1 text-sm text-gray-500">
              Всего администраторов: {total}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Отмена' : '+ Добавить администратора'}
          </button>
        </div>

        {/* Форма создания администратора */}
        {showCreateForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль *
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Минимум 6 символов"
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Необязательно"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creating || !formData.email || !formData.password || formData.password.length < 6}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Создание...' : 'Создать администратора'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последнее обновление
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Администраторы не найдены
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {admin.simpleId && /^[0-9]+$/.test(admin.simpleId)
                        ? admin.id
                        : (admin.simpleId || admin.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.firstName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(admin.status)}`}
                      >
                        {admin.status === 'ACTIVE' ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(admin.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Предыдущая
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Следующая
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Показано <span className="font-medium">{(page - 1) * limit + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(page * limit, total)}</span> из{' '}
                  <span className="font-medium">{total}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Предыдущая
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующая
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

