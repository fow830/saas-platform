import Link from 'next/link';

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">SaaS Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">
                Тарифы
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Войти
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Начать
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Платформа для вашего бизнеса
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Получите доступ к множеству сервисов с единой подпиской
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700"
          >
            Начать бесплатно
          </Link>
        </div>
      </main>
    </div>
  );
}

