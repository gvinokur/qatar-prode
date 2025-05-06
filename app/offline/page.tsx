'use client';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
      <p className="mb-4">
        No tienes conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Reintentar
      </a>
    </div>
  );
}
