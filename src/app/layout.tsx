import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Nutria',
  description: 'Sistema de administración de clases y reservas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-800 text-white antialiased min-h-screen`}>
        {children}
        
        {/* EL MOTOR DE NOTIFICACIONES ESTILO DARK MODE */}
        <Toaster 
        toastOptions={{
          className: 'bg-slate-100 text-white font-extrabold rounded-3xl shadow-clay px-6 py-4 border-none',
          duration: 4000,
          style: {
            background: '#f1f5f9', // Un tono claro para que el brillo 3D resalte
            color: '#1e293b',
          }
        }} 
      />
      </body>
    </html>
  );
}