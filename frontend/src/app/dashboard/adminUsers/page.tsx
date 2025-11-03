'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';

interface User {
  id: string;
  simpleId?: string | null;
  email: string;
  firstName: string | null;
  balance: number | string;
  role: string;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [message, setMessage] = useState('');
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
        
        // Проверяем роль перед запросом проектов
        if (userRes.data.role !== 'ADMIN') {
          setLoading(false);
          return;
        }

        // Загружаем проекты только если пользователь админ
        const usersRes = await api.get(`/admin/projects?page=${page}&limit=${limit}`);
        const usersData: UsersResponse = usersRes.data;
        console.log('Users data from API:', usersData.data); // Debug
        console.log('First user simpleId:', usersData.data?.[0]?.simpleId); // Debug
        console.log('Full response:', JSON.stringify(usersData, null, 2)); // Debug
        setUsers(usersData.data || []);
        setTotalPages(usersData.totalPages || 1);
        setTotal(usersData.total || 0);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Активен',
      SUSPENDED: 'Заблокирован',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setUpdatingStatus(userId);
    setMessage('');

    try {
      await api.patch(`/admin/projects/${userId}/status`, { status: newStatus });
      
      // Обновляем локальное состояние
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
      );
      
      setMessage('Статус проекта успешно обновлен');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating status:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при обновлении статуса проекта',
      );
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const startEditing = (userId: string, field: string, currentValue: string) => {
    setEditingUser(userId);
    setEditingField(field);
    setEditingValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditingField(null);
    setEditingValue('');
  };

  const saveEdit = async (userId: string, field: string) => {
    setEditingUser(userId);
    setMessage('');

    try {
      const updateData: any = {};
      if (field === 'email') {
        updateData.email = editingValue;
      } else if (field === 'firstName') {
        updateData.firstName = editingValue || null;
      }

      const response = await api.patch(`/admin/projects/${userId}`, updateData);
      
      // Обновляем локальное состояние
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, ...response.data } : u)),
      );
      
      setMessage(field === 'email' ? 'Email успешно обновлен' : field === 'firstName' ? 'Проект успешно обновлен' : 'Данные успешно обновлены');
      setTimeout(() => setMessage(''), 3000);
      cancelEditing();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при обновлении данных',
      );
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setEditingUser(null);
    }
  };


  const handlePasswordChange = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage('Пароль должен содержать минимум 6 символов');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setChangingPassword(userId);
    setMessage('');

    try {
      await api.patch(`/admin/projects/${userId}/password`, { password: newPassword });
      
      setMessage('Пароль успешно изменен');
      setTimeout(() => setMessage(''), 3000);
      setShowPasswordModal(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage(
        error.response?.data?.message || error.message || 'Ошибка при изменении пароля',
      );
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setChangingPassword(null);
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
  // Если загрузка завершена и пользователь не админ - показываем ошибку
  if (!loading) {
    if (!user) {
      return (
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Ошибка</h2>
            <p className="text-red-600">Не удалось загрузить данные пользователя.</p>
          </div>
        </div>
      );
    }
    if (user.role !== 'ADMIN') {
      return (
        <div className="px-4 py-6 sm:px-0">
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
          <p className="mt-1 text-sm text-gray-500">
            Всего проектов: {total} (администраторы не отображаются)
          </p>
        </div>

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
                  Проект
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Баланс
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Проекты не найдены
                  </td>
                </tr>
              ) : (
                users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {userItem.simpleId || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingUser === userItem.id && editingField === 'email' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEdit(userItem.id, 'email')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(userItem.id, 'email');
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => startEditing(userItem.id, 'email', userItem.email)}
                          title="Нажмите для редактирования"
                        >
                          {userItem.email}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUser === userItem.id && editingField === 'firstName' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => saveEdit(userItem.id, 'firstName')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(userItem.id, 'firstName');
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600"
                                 onClick={() => startEditing(userItem.id, 'firstName', userItem.firstName || '')}
                                 title="Нажмите для редактирования проекта"
                        >
                          {userItem.firstName || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {typeof userItem.balance === 'string' 
                        ? parseFloat(userItem.balance).toFixed(2)
                        : (userItem.balance || 0).toFixed(2)} ₽
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={userItem.status}
                        onChange={(e) =>
                          handleStatusChange(userItem.id, e.target.value as 'ACTIVE' | 'SUSPENDED')
                        }
                        disabled={updatingStatus === userItem.id}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border-0 focus:ring-2 focus:ring-blue-500 ${
                          updatingStatus === userItem.id
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        } ${getStatusColor(userItem.status)}`}
                      >
                        <option value="ACTIVE">Активен</option>
                        <option value="SUSPENDED">Заблокирован</option>
                      </select>
                      {updatingStatus === userItem.id && (
                        <span className="ml-2 text-xs text-gray-500">Обновление...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setShowPasswordModal(userItem.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Сменить пароль
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Страница {page} из {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для смены пароля */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Смена пароля</h2>
            <p className="text-sm text-gray-600 mb-4">
              Введите новый пароль для проекта (минимум 6 символов)
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите новый пароль"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={() => handlePasswordChange(showPasswordModal)}
                disabled={changingPassword === showPasswordModal || !newPassword || newPassword.length < 6}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {changingPassword === showPasswordModal ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

