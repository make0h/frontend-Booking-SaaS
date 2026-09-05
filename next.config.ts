import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ¡LA LLAVE MÁGICA! Le damos permiso a tu celular para descargar React
  allowedDevOrigins: ['192.168.1.8', 'localhost'],

  // Apagamos el compilador agresivo porque choca con FullCalendar
  // reactCompiler: true, 
  
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction'
  ],
};

export default nextConfig;