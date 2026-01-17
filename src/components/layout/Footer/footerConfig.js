/**
 * Footer Configuration - Data-driven content
 * 
 * Configuración centralizada del footer para fácil mantenimiento
 * 
 * Nota sobre WhatsApp:
 * - Los mensajes se incluyen en la URL pero WhatsApp Web puede no pre-llenarlos automáticamente
 * - Esto es una limitación de seguridad de WhatsApp para prevenir spam
 * - El usuario debe hacer clic en "Enviar" después de que se abra la conversación
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Usa iconos de imágenes desde public/assets/redes
 */

// ✅ CONFIGURACIÓN DE MÓDULOS INFORMATIVOS (Cards 2-4)
// Orden: WhatsApp → Instagram → Teléfono → Ubicación

// Función helper para crear items con WhatsApp, Instagram, teléfono y ubicación personalizados
const createModuleItems = (whatsappNumber, message = '', instagramUser = '', phone = '', location = '') => {
  // Construir URL de WhatsApp con mensaje codificado
  // Remover el + y espacios si están presentes en el número
  const cleanNumber = whatsappNumber.replace(/^\+/, '').replace(/\s/g, '').replace(/-/g, '');
  
  // Usar api.whatsapp.com para mejor compatibilidad con mensajes predefinidos
  // Nota: WhatsApp Web puede no pre-llenar el mensaje automáticamente por seguridad
  // El mensaje se incluye en la URL pero el usuario debe hacer clic en enviar
  let whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}`;
  
  if (message && message.trim() !== '') {
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message.trim());
    whatsappUrl += `&text=${encodedMessage}`;
  }
  
  // Crear item de Instagram personalizado
  const instagramItem = {
    icon: 'instagram',
    text: instagramUser ? `@${instagramUser.replace('@', '')}` : '@indianausados',
    href: `https://instagram.com/${instagramUser.replace('@', '')}`,
    type: 'link',
    external: true,
  };
  
  // Crear item de teléfono personalizado
  // Convertir el formato (0381) 421-2000 a tel:+543814212000
  const phoneText = phone || '(011) 1234-5678';
  const phoneNumber = phoneText.replace(/[^\d]/g, ''); // Remover todo excepto dígitos
  const phoneItem = {
    icon: 'phone',
    text: phoneText,
    href: `tel:+54${phoneNumber}`,
    type: 'link',
  };
  
  // Crear items de ubicación personalizados
  // Si hay múltiples direcciones (separadas por \n), crear un item separado para cada una
  const locationText = location || 'Av. Principal 1234, Ciudad';
  const locations = locationText.split('\n').map(addr => addr.trim()).filter(addr => addr !== '');
  
  // Crear un item de ubicación para cada dirección
  const locationItems = locations.map((loc) => ({
    icon: 'maps',
    text: loc,
    href: `https://maps.google.com/maps?q=${encodeURIComponent(loc)}`,
    type: 'link',
    external: true,
  }));
  
  return [
    {
      icon: 'whatsapp',
      text: 'WhatsApp',
      href: whatsappUrl,
      type: 'link',
      external: true,
    },
    instagramItem,
    phoneItem,
    ...locationItems,
  ];
};

// Crear módulos con mensajes, Instagram, teléfonos y ubicaciones personalizadas

// ✅ PEUGEOT: Ahora con 2 sedes separadas
const peugeotSanMiguelItems = createModuleItems(
  '543816295959', 
  'Hola, estoy interesado en vehículos 0KM - Sede San Miguel', 
  'peugeotindiana', 
  '(0381) 421-2000', 
  'Salta 160, San Miguel de Tucumán'
);

const peugeotYerbabuenaItems = createModuleItems(
  '543816295959', 
  'Hola, estoy interesado en vehículos 0KM - Sede Yerba Buena', 
  'peugeotindiana', 
  '(0381) 421-2000', 
  'Av. Aconquija y Bascary, Yerba Buena'
);

const usadosItems = createModuleItems('543816295959', 'Hola, estoy interesado en autos usados', 'usadosindiana', '(0381) 231-3107', 'Santa Fe 2145, San Miguel de Tucumán');
const postventaItems = createModuleItems('543816295959', 'Hola, quiero información sobre servicios de postventa', 'peugeotindiana', '(0381) 434-7700', 'Italia 2945, San Miguel de Tucumán');

// ✅ MÓDULO SITIO: Enlaces a páginas del sitio
const sitioItems = [
  {
    type: 'text-link',
    text: 'Peugeot | 0km',
    href: '/0km',
  },
  {
    type: 'text-link',
    text: 'Planes',
    href: '/planes',
  },
  {
    type: 'text-link',
    text: 'Usados | multimarca',
    href: '/usados',
  },
  {
    type: 'text-link',
    text: 'Postventa',
    href: '/postventa',
  },
];

// ✅ COLUMNA 1: CONTACTO - Módulos de redes
export const contactoModules = [
  {
    id: 'peugeot-oficial',
    title: 'Peugeot oficial | 0 km',
    // ✅ NUEVO: Array de sedes en lugar de items directos
    sedes: [
      {
        id: 'peugeot-san-miguel',
        name: 'Sede San Miguel de Tucumán',
        items: peugeotSanMiguelItems,
      },
      {
        id: 'peugeot-yerbabuena',
        name: 'Sede Yerba Buena - Tucumán',
        items: peugeotYerbabuenaItems,
      },
    ],
  },
  {
    id: 'multimarca-usados',
    title: 'Multimarca | Usados',
    items: usadosItems,
  },
  {
    id: 'posventa-taller',
    title: 'Posventa / Taller',
    items: postventaItems,
  },
];

// ✅ COLUMNA 2: SITIO - Enlaces internos
export const sitioModule = {
  id: 'sitio',
  title: 'Sitio',
  items: sitioItems,
  isTextLinks: true,
};

// ✅ MAPEO DE ÍCONOS - Usa imágenes desde public/assets/redes + SVG para teléfono
export const footerIcons = {
  whatsapp: '/assets/redes/Whatsapp_logo_PNG8.webp',
  instagram: '/assets/redes/Instagram_logo_PNG8.webp',
  gmail: '/assets/redes/Gmail-logo.webp',
  facebook: '/assets/redes/FacebookPNG2.webp',
  maps: '/assets/redes/Google-Maps-logo-1.webp',
  phone: 'svg', // Marcador especial para indicar que es SVG
};

