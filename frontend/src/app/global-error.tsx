'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Критическая ошибка
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {error.message || 'Произошла непредвиденная ошибка'}
            </p>
            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}


