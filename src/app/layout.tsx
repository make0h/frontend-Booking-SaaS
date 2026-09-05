import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BookingZ',
  description: 'Sistema de administración de clases y reservas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        
        {/* EL MOTOR DE NOTIFICACIONES ESTILO DARK MODE */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1e293b', // bg-slate-800
              color: '#f8fafc',      // text-slate-50
              border: '1px solid #334155', // border-slate-700
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#1e293b' },
            }
          }}
        />
      </body>
    </html>
  );
}