import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Circle as CircleIcon, 
  ClipboardList, 
  User as UserIcon, 
  Users,
  LogOut, 
  Map as MapIcon, 
  Filter, 
  Plus,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Send,
  Trash2,
  History,
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
  FileText,
  PieChart as PieChartIcon,
  Bell,
  ChevronLeft,
  ChevronDown,
  Award,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  AreaChart,
  Area as RechartsArea
} from 'recharts';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  User, 
  Activity, 
  Location, 
  Message,
  Occurrence,
  ActivityStatus, 
  STATUS_COLORS, 
  OM_CODES, 
  OM_MODELS, 
  ACTIVITY_STATUSES,
  StatusHistory,
  Training
} from './types';

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to get current date/time in Brasília
// --- Utils ---

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

function PhotoEditorModal({ 
  image, 
  onClose, 
  onSave,
  onDelete
}: { 
  image: string, 
  onClose: () => void, 
  onSave: (croppedImage: string) => void,
  onDelete?: () => void
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onSave(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Ajustar Foto</h3>
            {onDelete && (
              <button 
                onClick={() => {
                  if (confirm("Tem certeza que deseja remover sua foto de perfil?")) {
                    onDelete();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
              >
                <Trash2 size={14} />
                Remover Foto
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative h-80 bg-slate-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Salvar Foto
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  let cleaned = digits;
  
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  
  cleaned = cleaned.substring(0, 11);
  
  if (cleaned.length === 0) return '';
  
  let result = '+55 ';
  if (cleaned.length > 0) {
    result += '(' + cleaned.substring(0, 2);
  }
  if (cleaned.length > 2) {
    result += ') ' + cleaned.substring(2, 7);
  }
  if (cleaned.length > 7) {
    result += ' - ' + cleaned.substring(7, 11);
  }
  return result;
};
const getBrasiliaDate = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const mapArr = parts.map(p => [p.type, p.value] as [string, string]);
  const map = new Map<string, string>(mapArr);
  return new Date(
    parseInt(map.get('year') || '0'),
    parseInt(map.get('month') || '1') - 1,
    parseInt(map.get('day') || '1'),
    parseInt(map.get('hour') || '0'),
    parseInt(map.get('minute') || '0'),
    parseInt(map.get('second') || '0')
  );
};

const getBrasiliaDateString = () => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const roundCoord = (val: number) => Number(val.toFixed(6));

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Components ---

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  loading = false,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger',
  loading?: boolean
}) => {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button 
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[40px]',
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};

const Input = ({ label, error, icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string, icon?: React.ElementType }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={18} />
        </div>
      )}
      <input 
        className={cn(
          "w-full px-3 py-1.5 text-base md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all",
          Icon && "pl-10",
          error && "border-red-500 focus:ring-red-500/10 focus:border-red-500"
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Select = ({ label, options, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: { value: string | number, label: string }[], error?: string }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select 
      className={cn(
        "w-full px-3 py-1.5 text-base md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all appearance-none",
        error && "border-red-500 focus:ring-red-500/10 focus:border-red-500"
      )}
      {...props}
    >
      <option value="">Selecione...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);


// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'forgot_password' | 'dashboard'>('login');
  const [activeTab, setActiveTab] = useState<'profile' | 'new' | 'list' | 'manager' | 'manager_records' | 'manager_employees' | 'occurrences'>(() => {
    return (localStorage.getItem('activeTab') as any) || 'profile';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, title: string, message: string, type: 'training' | 'occurrence', category: 'personal' | 'manager', date: string, read: boolean, userId?: number, occurrenceId?: number }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(null);
  const [currentToast, setCurrentToast] = useState<{ title: string, message: string, occurrenceId?: number } | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Data states
  // Data states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  // Global Supabase Realtime Subscription
  const wsStateRef = React.useRef({ activities, user });
  useEffect(() => {
    wsStateRef.current = { activities, user };
  }, [activities, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, (payload) => {
        const currentUser = wsStateRef.current.user;
        if (!currentUser) return;

        if (payload.eventType === 'INSERT') {
          const occ = payload.new as Occurrence;
          setOccurrences(prev => {
            if (prev.find(o => o.id === occ.id)) return prev;
            return [occ, ...prev];
          });

          if (currentUser.role === 'manager') {
            setCurrentToast({
              title: `Nova Ocorrência: ${occ.title}`,
              message: `${occ.user_name} em ${occ.location}`,
              occurrenceId: occ.id
            });
            setTimeout(() => setCurrentToast(null), 5000);

            setNotifications(prev => {
              const id = `occ-${occ.id}`;
              if (prev.find(n => n.id === id)) return prev;
              
              return [
                {
                  id,
                  title: `Ocorrência: ${occ.title}`,
                  message: `${occ.user_name}: ${occ.description}`,
                  type: 'occurrence',
                  category: 'manager',
                  date: format(new Date(), 'HH:mm'),
                  read: false,
                  occurrenceId: occ.id
                },
                ...prev
              ].slice(0, 20);
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const occ = payload.new as Occurrence;
          setOccurrences(prev => prev.map(o => o.id === occ.id ? occ : o));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'occurrence_comments' }, (payload) => {
        const currentUser = wsStateRef.current.user;
        if (!currentUser) return;

        const comment = payload.new as any;
        // Fetch occurrence title for the notification
        fetch(`/api/occurrences`)
          .then(res => res.json())
          .then((occs: Occurrence[]) => {
            const occ = occs.find(o => o.id === comment.occurrence_id);
            if (!occ) return;

            // Only notify if someone else commented
            if (comment.user_id !== currentUser.id) {
              setCurrentToast({
                title: `Novo comentário em: ${occ.title}`,
                message: `Uma nova mensagem foi enviada na ocorrência.`,
                occurrenceId: occ.id
              });
              setTimeout(() => setCurrentToast(null), 5000);

              setNotifications(prev => {
                const id = `comm-${comment.id}`;
                if (prev.find(n => n.id === id)) return prev;
                
                return [
                  {
                    id,
                    title: `Novo Comentário: ${occ.title}`,
                    message: `Alguém comentou na ocorrência que você está acompanhando.`,
                    type: 'occurrence',
                    category: 'manager',
                    date: format(new Date(), 'HH:mm'),
                    read: false,
                    occurrenceId: occ.id
                  },
                  ...prev
                ].slice(0, 20);
              });
            }
          });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        const currentUser = wsStateRef.current.user;
        if (payload.eventType === 'INSERT') {
          const act = payload.new as Activity;
          setActivities(prev => {
            if (prev.find(a => a.id === act.id)) return prev;
            return [act, ...prev];
          });
          
          if (currentUser && currentUser.role === 'manager') {
            setCurrentToast({
              title: `Novo Registro Adicionado`,
              message: `${act.operation || 'Nova Operação'} (OM: ${act.om_number || 'S/N'})`
            });
            setTimeout(() => setCurrentToast(null), 5000);
          }
        } else if (payload.eventType === 'UPDATE') {
          const act = payload.new as Activity;
          setActivities(prev => prev.map(a => a.id === act.id ? act : a));
          
          if (currentUser && currentUser.role === 'manager') {
            setCurrentToast({
              title: `Status de Registro Atualizado`,
              message: `A OM ${act.om_number} foi para ${act.status}.`
            });
            setTimeout(() => setCurrentToast(null), 5000);
          }
        }
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime status:`, status);
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error. Data might not update automatically.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data states
  // (Moved up)

  // Auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role === 'manager' && !parsedUser.is_active) {
        localStorage.removeItem('user');
        setIsPendingApproval(true);
        return;
      }
      setUser(parsedUser);
      setView('dashboard');
      
      const savedTab = localStorage.getItem('activeTab') as any;
      if (savedTab) {
        setActiveTab(savedTab);
      } else {
        setActiveTab(parsedUser.role === 'manager' ? 'manager' : 'profile');
      }
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<Response>[] = [
        fetch('/api/activities'),
        fetch('/api/locations'),
        fetch('/api/users'),
        fetch('/api/occurrences')
      ];

      if (user?.id) {
        promises.push(fetch(`/api/users/${user.id}`));
      }

      const results = await Promise.all(promises);
      
      if (user?.id && results[4]) {
        if (results[4].status === 404) {
          handleLogout();
          return;
        }
        const updatedUser = await results[4].json();
        // Single session check
        if (user.current_session_id && updatedUser.current_session_id && updatedUser.current_session_id !== user.current_session_id) {
          console.warn("Sessão invalidada: Outro login detectado.");
          handleLogout();
          return;
        }
      }

      const [actRes, locRes, empRes, occRes] = results;
      
      if (!actRes.ok || !locRes.ok || !empRes.ok || !occRes.ok) {
        throw new Error(`Fetch failed: ${actRes.status} ${locRes.status} ${empRes.status} ${occRes.status}`);
      }
      
      const [actData, locData, empData, occData] = await Promise.all([
        actRes.json(),
        locRes.json(),
        empRes.json(),
        occRes.json()
      ]);

      setActivities(actData);
      setLocations(locData);
      setEmployees(empData);
      setOccurrences(occData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Erro ao sincronizar dados. Tente novamente.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on manual mount and tab switch (but avoid redundant calls)
  const lastTabRef = React.useRef(activeTab);
  useEffect(() => {
    if (user && activeTab !== lastTabRef.current) {
      fetchData();
      lastTabRef.current = activeTab;
    } else if (user && !activities.length) {
      fetchData();
    }
  }, [user, activeTab, activities.length]);

  // Auto-refresh for Map Tab (every 5 seconds)
  useEffect(() => {
    if (!user || activeTab !== 'manager') return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, activeTab, fetchData]);



  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    setNotifications([]);
    setView('login');
  }, []);

  // Check for expiring trainings
  useEffect(() => {
    if (!user) return;

    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);

    let allExpiring: { id: string, title: string, message: string, type: 'training', category: 'personal' | 'manager', date: string, read: boolean, userId: number }[] = [];

    // Check own trainings (Everyone)
    if (user.training_list) {
      user.training_list.forEach(t => {
        const expDate = new Date(t.expiration_date);
        if (expDate > today && expDate <= oneMonthFromNow) {
          allExpiring.push({
            id: `training-me-${t.name}-${t.expiration_date}`,
            title: 'Meu Treinamento a Vencer',
            message: `Seu treinamento "${t.name}" vence em ${format(expDate, 'dd/MM/yyyy')}.`,
            type: 'training',
            category: 'personal',
            date: format(new Date(), 'HH:mm'),
            read: false,
            userId: user.id
          });
        }
      });
    }

    // If manager, check all employees
    if (user.role === 'manager' && employees.length > 0) {
      employees.forEach(emp => {
        if (emp.training_list) {
          emp.training_list.forEach(t => {
            const expDate = new Date(t.expiration_date);
            if (expDate > today && expDate <= oneMonthFromNow) {
              allExpiring.push({
                id: `training-${emp.name}-${t.name}-${t.expiration_date}`,
                title: 'Treinamento de Equipe a Vencer',
                message: `O colaborador "${emp.name}" tem o treinamento "${t.name}" vencendo em ${format(expDate, 'dd/MM/yyyy')}.`,
                type: 'training',
                category: 'manager',
                date: format(new Date(), 'HH:mm'),
                read: false,
                userId: emp.id
              });
            }
          });
        }
      });
    }

    setNotifications(prev => {
      // Keep occurrence notifications (they are dynamic)
      const persistentNotifs = prev.filter(n => n.type === 'occurrence');
      
      // Filter out training notifications that are no longer in allExpiring
      // but keep their "read" status if they still exist
      const updatedTrainingNotifs = allExpiring.map(newNotif => {
        const existing = prev.find(p => p.id === newNotif.id);
        return existing ? { ...newNotif, read: existing.read, date: existing.date } : newNotif;
      });

      // Combine and sort by id (which contains timing info)
      return [...persistentNotifs, ...updatedTrainingNotifs].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 30);
    });
  }, [user, employees]);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (isPendingApproval || view === 'forgot_password') {
    return (
      <div className="min-h-screen bg-[#00153D] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-b from-[#1A3A8A] via-[#00153D] to-[#000B26] -z-10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-2xl p-8 rounded-[32px] border border-white/10 shadow-2xl max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="text-blue-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
            {isPendingApproval ? "Aguardando Aprovação" : "Esqueceu sua senha?"}
          </h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            {isPendingApproval 
              ? "Seu perfil de gestor foi criado com sucesso! Por motivos de segurança, um administrador precisa liberar seu acesso antes de você começar."
              : "Por motivos de segurança, a redefinição de senha deve ser solicitada diretamente à nossa equipe técnica."
            }
          </p>
          <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-2xl mb-8">
            <p className="text-xs text-blue-300">
              {isPendingApproval
                ? "Entre em contato com o responsável pelo sistema para solicitar a liberação do seu acesso."
                : "Entre em contato com o responsável pelo sistema para solicitar a alteração de senha."
              }
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsPendingApproval(false);
              setView('login');
            }}
            className="w-full border-white/10 text-white hover:bg-white/10 h-12 rounded-xl text-base font-bold transition-all active:scale-[0.98]"
          >
            Voltar para o Login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (view === 'login' || view === 'register') {
    return <AuthPage view={view} setView={setView} setIsPendingApproval={setIsPendingApproval} setUser={(u) => {
      if (u.role === 'manager' && !u.is_active) {
        setIsPendingApproval(true);
        return;
      }
      setUser(u);
      setIsPendingApproval(false); // Clear if user was pending but now cleared
      setView('dashboard');
      setActiveTab(u.role === 'manager' ? 'manager' : 'profile');
    }} />;
  }

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1004] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: (window.innerWidth < 1024 && !isMobileMenuOpen) ? -280 : 0,
          width: (window.innerWidth >= 1024) ? (isSidebarOpen ? 280 : 80) : 280
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-[#00153D] text-white flex flex-col z-[1010] overflow-hidden shadow-2xl lg:shadow-none",
          "fixed inset-y-0 left-0 lg:relative h-full"
        )}
      >
        <div className="p-4 lg:p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo className="scale-65 shrink-0" />
            <motion.h1 
              animate={{ opacity: (isSidebarOpen || window.innerWidth < 1024) ? 1 : 0 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap"
            >
              nort.
            </motion.h1>
          </div>
          <div className="flex items-center gap-2">
            {window.innerWidth >= 1024 && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            )}
            {window.innerWidth < 1024 && (
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white lg:hidden p-1">
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem 
            icon={<UserIcon size={20} />} 
            label={user?.role === 'manager' ? 'Painel do Gestor' : 'Meu Painel'} 
            active={activeTab === 'profile'} 
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} 
            collapsed={!isSidebarOpen && window.innerWidth >= 1024}
          />
          {user?.role === 'employee' && (
            <>
              <SidebarItem 
                icon={<PlusCircle size={20} />} 
                label="Novo Registro" 
                active={activeTab === 'new'} 
                onClick={() => navigateTo('new')} 
                collapsed={!isSidebarOpen && window.innerWidth >= 1024}
              />
              <SidebarItem 
                icon={<ClipboardList size={20} />} 
                label="Lista de Registros" 
                active={activeTab === 'list'} 
                onClick={() => navigateTo('list')} 
                collapsed={!isSidebarOpen && window.innerWidth >= 1024}
              />
            </>
          )}
          {user?.role === 'manager' && (
            <>

              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Mapa Operacional" 
                active={activeTab === 'manager'} 
                onClick={() => navigateTo('manager')} 
                collapsed={!isSidebarOpen && window.innerWidth >= 1024}
              />
              <SidebarItem 
                icon={<ClipboardList size={20} />} 
                label="Lista de Registros" 
                active={activeTab === 'manager_records'} 
                onClick={() => navigateTo('manager_records')} 
                collapsed={!isSidebarOpen && window.innerWidth >= 1024}
              />
              <SidebarItem 
                icon={<UserIcon size={20} />} 
                label="Funcionários" 
                active={activeTab === 'manager_employees'} 
                onClick={() => navigateTo('manager_employees')} 
                collapsed={!isSidebarOpen && window.innerWidth >= 1024}
              />
            </>
          )}
          <SidebarItem 
            icon={<Bell size={20} />} 
            label="Ocorrências" 
            active={activeTab === 'occurrences'} 
            onClick={() => navigateTo('occurrences')} 
            collapsed={!isSidebarOpen && window.innerWidth >= 1024}
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white",
              (!isSidebarOpen && window.innerWidth >= 1024) ? "justify-center" : ""
            )}
          >
            <LogOut size={20} />
            {(isSidebarOpen || window.innerWidth < 1024) && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 relative flex flex-col no-scrollbar overflow-hidden")}>
        {/* Toast Notification */}
        <AnimatePresence>
          {currentToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-0 left-1/2 z-[2000] w-[90%] max-w-sm"
            >
              <button 
                onClick={() => {
                  setActiveTab('occurrences');
                  setCurrentToast(null);
                }}
                className="w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center gap-4 hover:bg-slate-50 transition-all active:scale-95"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  {currentToast.occurrenceId ? <Bell size={20} /> : <MessageCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-slate-900 truncate">{currentToast.title}</p>
                  <p className="text-xs text-slate-500 truncate">{currentToast.message}</p>
                </div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="bg-[#00153D] border-b border-white/5 px-4 lg:px-8 py-2 lg:py-2.5 flex items-center justify-between sticky top-0 z-[1005] shadow-lg lg:shadow-none">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 -ml-2 text-white hover:bg-white/10 rounded-lg lg:hidden shrink-0"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <div className="min-w-0">
              <h2 className="text-base lg:text-lg font-bold text-white leading-tight truncate">
                {activeTab === 'profile' && (user?.role === 'manager' ? 'Painel do Gestor' : 'Painel Funcionário')}
                {activeTab === 'new' && 'Novo Registro'}
                {activeTab === 'list' && 'Lista de Registros'}
                {activeTab === 'manager' && 'Mapa Operacional'}
                {activeTab === 'manager_records' && 'Lista de Registros'}
                {activeTab === 'manager_employees' && 'Gestão de Funcionários'}
                {activeTab === 'occurrences' && 'Ocorrências'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => fetchData()}
                disabled={loading}
                className={cn(
                  "p-2.5 text-white/60 hover:bg-white/5 rounded-lg transition-all",
                  loading && "opacity-50 cursor-not-allowed"
                )}
                title="Sincronizar Dados"
              >
                <RefreshCw size={20} className={cn(loading && "animate-spin")} />
              </button>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-white/60 hover:bg-white/5 rounded-lg relative"
              >
                <Bell size={24} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#00153D]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-[1999]" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 lg:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[2000] overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Notificações</h4>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {notifications.filter(n => !n.read).length} Novas
                        </span>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Bell size={24} className="text-slate-200" />
                            </div>
                            <p className="text-xs text-slate-400 italic">Nenhuma notificação por enquanto.</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                                if (n.type === 'occurrence') {
                                  setActiveTab('occurrences');
                                }
                                if (n.type === 'training') {
                                  if (user?.role === 'manager' && n.userId && n.userId !== user.id) {
                                    setViewingEmployeeId(n.userId);
                                    setActiveTab('manager_employees');
                                  } else {
                                    setActiveTab('profile');
                                  }
                                }
                                setShowNotifications(false);
                              }}
                              className={cn(
                                "w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex gap-3",
                                !n.read && "bg-blue-50/30"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                n.type === 'training' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                              )}>
                                {n.type === 'training' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                <p className="text-[9px] text-slate-400 mt-1.5 font-medium">{n.date}</p>
                              </div>
                              {!n.read && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />}
                            </button>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                          <button 
                            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                            className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                          >
                            Marcar todas como lidas
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className={cn(
          "flex-1 flex flex-col min-h-0 w-full mx-auto",
          activeTab === 'manager'
            ? "max-w-none px-4 lg:px-8 overflow-hidden py-2 sm:py-3 lg:py-5"
            : "max-w-[1440px] px-2 sm:px-3 lg:px-6 overflow-y-auto no-scrollbar py-2 sm:py-3 lg:py-6"
        )}>
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ProfileView user={user!} onUpdate={fetchData} onUserUpdate={setUser} />
              </motion.div>
            )}
            {activeTab === 'new' && (
              <motion.div 
                key="new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardNewRecordView 
                  user={user!} 
                  locations={locations} 
                  employees={employees}
                  onSuccess={() => {
                    fetchData();
                    setActiveTab('list');
                  }} 
                />
              </motion.div>
            )}
            {activeTab === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardActivityListView 
                  activities={activities.filter(a => {
                    const isOwner = a.user_id === user?.id;
                    let isInvolved = false;
                    try {
                      const involved = typeof a.involved_employees === 'string' 
                        ? JSON.parse(a.involved_employees) 
                        : a.involved_employees;
                      isInvolved = Array.isArray(involved) && involved.includes(user?.registration);
                    } catch (e) {
                      console.error("Error parsing involved_employees:", e);
                    }
                    return isOwner || isInvolved;
                  })}
                  employees={employees}
                  occurrences={occurrences}
                  user={user}
                  onUpdate={fetchData}
                  onTabChange={setActiveTab}
                />
              </motion.div>
            )}
            {activeTab === 'manager' && (
              <motion.div 
                key="manager"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                <ManagerDashboard 
                  activities={activities} 
                  locations={locations}
                  employees={employees}
                  onTabChange={setActiveTab}
                />
              </motion.div>
            )}
            {activeTab === 'manager_records' && (
              <motion.div 
                key="manager_records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardRecordsView 
                  activities={activities} 
                  employees={employees}
                  onTabChange={setActiveTab}
                />
              </motion.div>
            )}
            {activeTab === 'manager_employees' && (
              <motion.div 
                key="manager_employees"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DashboardEmployeesView 
                  employees={employees}
                  activities={activities}
                  onUpdate={fetchData}
                  initialEmployeeId={viewingEmployeeId}
                  onClearInitialEmployeeId={() => setViewingEmployeeId(null)}
                />
              </motion.div>
            )}
            {activeTab === 'occurrences' && (
              <motion.div 
                key="occurrences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <DashboardOccurrencesView 
                  user={user!} 
                  occurrences={occurrences}
                  onUpdate={fetchData}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-white rounded-3xl m-4 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">A aba não pôde ser carregada corretamente.</p>
          <Button onClick={() => window.location.reload()}>Recarregar Página</Button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// --- Components ---

function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-10 h-1 bg-white rounded-full" 
      />
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="w-10 h-1 bg-white rounded-full" 
      />
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        className="w-10 h-8 border-x-[5px] border-t-[5px] border-white rounded-t-md mt-0.5" 
      />
    </div>
  );
}

// --- Auth Page ---

function AuthPage({ view, setView, setUser, setIsPendingApproval }: { view: 'login' | 'register', setView: (v: 'login' | 'register' | 'forgot_password') => void, setUser: (u: User) => void, setIsPendingApproval: (v: boolean) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    registration: '',
    function: '',
    role: 'employee' as 'employee' | 'manager',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    trainings: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (view === 'register' && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.registration.length !== 6) {
      setError('A matrícula deve ter exatamente 6 dígitos');
      return;
    }

    if (formData.password.length !== 8) {
      setError('A senha deve ter exatamente 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      } else {
        if (data.error === 'approval_pending') {
          setIsPendingApproval(true);
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#00153D] relative overflow-hidden flex flex-col">
      <div className="flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="min-h-full w-full flex items-center justify-center p-4 lg:p-6 relative z-10">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 bg-gradient-to-b from-[#1A3A8A] via-[#00153D] to-[#000B26] -z-10" />
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "w-full transition-all duration-500 z-10",
            view === 'login' ? "max-w-[340px]" : "max-w-[340px] md:max-w-[540px]"
          )}
        >
        <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 pb-4 text-center">
            <div className="flex justify-center mb-2">
              <Logo className="scale-90" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">nort.</h1>
            <p className="text-blue-400/60 text-xs font-medium mt-1">Inteligência Operacional</p>
          </div>

          <div className="px-6 pt-2">
            <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1">
              <button 
                onClick={() => setView('login')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  view === 'login' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Entrar
              </button>
              <button 
                onClick={() => setView('register')}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  view === 'register' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Cadastrar
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80dvh]">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <div className="min-h-0">
              {view === 'register' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AuthInput 
                    icon={UserIcon}
                    placeholder="Nome Completo" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50 group-focus-within:text-blue-400 transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-base md:text-sm"
                    >
                      <option value="employee" className="bg-[#00153D]">Perfil: Funcionário</option>
                      <option value="manager" className="bg-[#00153D]">Perfil: Gestor</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400/50 pointer-events-none">
                      <ChevronRight size={16} className="rotate-90" />
                    </div>
                  </div>
                  <AuthInput 
                    icon={ShieldCheck}
                    placeholder="Matrícula (6 dígitos)" 
                    required 
                    maxLength={6}
                    value={formData.registration}
                    onChange={e => setFormData({...formData, registration: e.target.value.substring(0, 6)})}
                  />
                  <AuthInput 
                    icon={Briefcase}
                    placeholder="Função (Ex: Eletricista)" 
                    required 
                    value={formData.function}
                    onChange={e => setFormData({...formData, function: e.target.value})}
                  />
                  <AuthInput 
                    icon={Mail}
                    type="email"
                    placeholder="seu@email.com" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                  <AuthInput 
                    icon={MessageCircle}
                    placeholder="Nº de Contato" 
                    required 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  />
                  <AuthInput 
                    icon={Lock}
                    type="password" 
                    placeholder="Senha (8 dígitos)" 
                    required 
                    maxLength={8}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value.substring(0, 8)})}
                  />
                  <AuthInput 
                    icon={Lock}
                    type="password" 
                    placeholder="Confirmar Senha" 
                    required 
                    maxLength={8}
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value.substring(0, 8)})}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <AuthInput 
                    icon={ShieldCheck}
                    placeholder="Sua Matrícula" 
                    required 
                    maxLength={6}
                    value={formData.registration}
                    onChange={e => setFormData({...formData, registration: e.target.value.substring(0, 6)})}
                  />
                  <AuthInput 
                    icon={Lock}
                    type="password" 
                    placeholder="Sua Senha" 
                    required 
                    maxLength={8}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value.substring(0, 8)})}
                  />
                </div>
              )}
            </div>

            {view === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600 focus:ring-offset-0" 
                  />
                  Lembrar-me
                </label>
                <button 
                  type="button" 
                  onClick={() => setView('forgot_password')}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <div className="flex justify-center mt-2">
              <Button 
                type="submit" 
                loading={loading}
                className="w-full max-w-[220px] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                {view === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          © {new Date().getFullYear()} nort. • Todos os direitos reservados
        </p>
      </motion.div>
        </div>
      </div>
    </div>
  );
}

function AuthInput({ icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50 group-focus-within:text-blue-400 transition-colors">
        <Icon size={20} />
      </div>
      <input 
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-base md:text-sm"
      />
    </div>
  );
}

// --- Sidebar Item ---

function SidebarItem({ icon, label, active, onClick, collapsed, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all relative",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// --- Views ---

function ProfileView({ user, onUpdate, onUserUpdate, canToggleStatus = true, readOnly = false }: { user: User, onUpdate: () => void, onUserUpdate: (user: User) => void, canToggleStatus?: boolean, readOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [trainingList, setTrainingList] = useState<Training[]>(user.training_list || []);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  useEffect(() => {
    setTrainingList(user.training_list || []);
  }, [user.training_list]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert("A imagem deve ter no máximo 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result as string);
      setShowPhotoEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedImage = async (croppedImage: string) => {
    setLoadingAvatar(true);
    setShowPhotoEditor(false);
    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: croppedImage })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAvatar(false);
      setTempImage(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (readOnly || !user.avatar_url) return;
    
    setLoadingAvatar(true);
    setShowPhotoEditor(false);
    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: null })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAvatar(false);
      setTempImage(null);
    }
  };

  const handleAddTraining = () => {
    if (readOnly) return;
    setTrainingList([...trainingList, { name: '', expiration_date: '' }]);
  };

  const handleRemoveTraining = (index: number) => {
    if (readOnly) return;
    setTrainingList(trainingList.filter((_, i) => i !== index));
  };

  const handleTrainingChange = (index: number, field: keyof Training, value: string) => {
    if (readOnly) return;
    const newList = [...trainingList];
    newList[index] = { ...newList[index], [field]: value };
    setTrainingList(newList);
  };

  const handleToggleStatus = async () => {
    if (readOnly) return;
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/trainings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_list: trainingList })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        onUpdate();
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-1 space-y-4 lg:space-y-6">
        <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto mb-4 lg:mb-6 group">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center border-4 border-slate-50 overflow-hidden shadow-inner">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <UserIcon size={64} className="text-slate-400" />
              )}
              {loadingAvatar && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {!readOnly && (
              <>
                <label className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors z-10">
                  <Camera size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loadingAvatar} />
                </label>
                
                {user.avatar_url && (
                  <button 
                    onClick={() => {
                      setTempImage(user.avatar_url!);
                      setShowPhotoEditor(true);
                    }}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-blue-600"
                    title="Ajustar Posição"
                  >
                    <MapIcon size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {showPhotoEditor && tempImage && (
            <PhotoEditorModal 
              image={tempImage} 
              onClose={() => {
                setShowPhotoEditor(false);
                setTempImage(null);
              }} 
              onSave={handleSaveCroppedImage} 
              onDelete={user.avatar_url ? handleRemoveAvatar : undefined}
            />
          )}
          <h3 className="text-lg lg:text-lg font-bold text-slate-900">{user.name}</h3>
          <p className="text-slate-500 text-xs lg:text-sm">Matrícula: {user.registration}</p>
          <div className="mt-4 inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
            {user.function || (user.role === 'employee' ? 'Funcionário' : 'Gestor')}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4 lg:space-y-6 pb-6 lg:pb-8">
        {user.role === 'employee' && canToggleStatus && (
          <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-1 lg:p-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm lg:text-base text-slate-900 font-bold">Status de Presença</p>
                </div>
              </div>
              <button 
                onClick={handleToggleStatus}
                disabled={loadingStatus}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  user.is_active ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    user.is_active ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-4 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-center mb-4 lg:mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações Pessoais</p>
          </div>
          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seu Nome</p>
                  <p className="text-sm lg:text-base text-slate-900 font-medium">{user.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Função</p>
                  <p className="text-sm lg:text-base text-slate-900 font-medium">{user.function || 'Não informada'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matrícula</p>
                  <p className="text-sm lg:text-base text-slate-900 font-medium">{user.registration}</p>
                </div>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contato</p>
                    <p className="text-sm lg:text-base text-slate-900 font-medium">{user.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {user.email && (
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de Email</p>
                    <p className="text-sm lg:text-base text-slate-900 font-medium">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 pb-6 lg:pb-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h4 className="text-base lg:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="text-blue-500" size={18} />
              Treinamentos
            </h4>
            {!readOnly && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {trainingList.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                  <button 
                    onClick={() => handleRemoveTraining(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                  >
                    <X size={14} />
                  </button>
                  <Input 
                    label="Nome do Treinamento"
                    placeholder="Ex: NR10" 
                    value={t.name}
                    onChange={e => handleTrainingChange(i, 'name', e.target.value)}
                  />
                  <Input 
                    label="Data de Validade"
                    type="date"
                    value={t.expiration_date}
                    onChange={e => handleTrainingChange(i, 'expiration_date', e.target.value)}
                  />
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline"
                  onClick={handleAddTraining}
                  className="flex-1"
                >
                  <PlusCircle size={18} />
                  Adicionar Treinamento
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {user.training_list && user.training_list.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.training_list.map((t, i) => {
                    const isExpiring = (() => {
                      const today = new Date();
                      const oneMonthFromNow = new Date();
                      oneMonthFromNow.setMonth(today.getMonth() + 1);
                      const expDate = new Date(t.expiration_date);
                      return expDate > today && expDate <= oneMonthFromNow;
                    })();

                    const isExpired = new Date(t.expiration_date) < new Date();

                    return (
                      <div key={i} className={cn(
                        "p-4 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-md group",
                        isExpired ? "bg-red-50/50 border-red-200" : 
                        isExpiring ? "bg-amber-50/50 border-amber-200" : 
                        "bg-white border-slate-200"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                          isExpired ? "bg-red-100 text-red-600" :
                          isExpiring ? "bg-amber-100 text-amber-600" : 
                          "bg-blue-50 text-blue-600"
                        )}>
                          <Award size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{t.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar size={12} className="text-slate-400" />
                            <p className={cn(
                              "text-[11px] font-medium",
                              isExpired ? "text-red-700" :
                              isExpiring ? "text-amber-700" : 
                              "text-slate-500"
                            )}>
                              {isExpired ? 'Expirado em' : 'Expira em'}: {format(new Date(t.expiration_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isExpired ? (
                            <div className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[9px] font-bold uppercase tracking-wider border border-red-200">
                              Vencido
                            </div>
                          ) : isExpiring ? (
                            <div className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider border border-amber-200">
                              Vence em breve
                            </div>
                          ) : (
                            <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                              Válido
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs lg:text-sm text-slate-500 italic">Nenhum treinamento registrado.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardNewRecordView({ user, locations, employees, onSuccess }: { user: User, locations: Location[], employees: User[], onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    om_number: '',
    operation: '',
    model: 'Programada' as 'Programada' | 'Emergencial',
    code: 'CIVIPED',
    involved_employees: [] as string[],
    location_id: '',
    description: '',
    status: 'Em andamento' as ActivityStatus
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPos, setCurrentPos] = useState<{ latitude: number, longitude: number, accuracy: number } | null>(null);

  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'captured' | 'error'>('requesting');

  const captureLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPos({
          latitude: roundCoord(position.coords.latitude),
          longitude: roundCoord(position.coords.longitude),
          accuracy: position.coords.accuracy
        });
        setGpsStatus('captured');
      },
      (err) => {
        console.error('GPS Capture Error:', err);
        setGpsStatus('error');
        setError('Erro ao capturar localização. Verifique o GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  }, []);

  useEffect(() => {
    captureLocation();
    
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const acc = position.coords.accuracy;
          setCurrentPos(prev => {
            if (!prev || acc <= prev.accuracy) {
              setGpsStatus('captured');
              return {
                latitude: roundCoord(position.coords.latitude),
                longitude: roundCoord(position.coords.longitude),
                accuracy: acc
              };
            }
            return prev;
          });
        },
        (err) => console.log('Radar GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [captureLocation]);
  const [searchEmp, setSearchEmp] = useState('');
  const [showEmpList, setShowEmpList] = useState(false);
  const [searchLoc, setSearchLoc] = useState('');
  const [showLocList, setShowLocList] = useState(false);
  const [showStatusList, setShowStatusList] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [showCodeList, setShowCodeList] = useState(false);

  const filteredEmployees = employees.filter(e => 
    (e.name.toLowerCase().includes(searchEmp.toLowerCase()) || e.registration.includes(searchEmp)) &&
    !formData.involved_employees.includes(e.registration) &&
    e.registration !== user.registration
  );

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchLoc.toLowerCase())
  );

  // Close lists on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowEmpList(false);
        setShowLocList(false);
        setShowStatusList(false);
        setShowModelList(false);
        setShowCodeList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    const saveRecord = async (lat: number, lon: number) => {
      try {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            latitude: lat,
            longitude: lon,
            user_id: user.id
          })
        });

        if (res.ok) {
          onSuccess();
        } else {
          setError('Erro ao salvar registro');
        }
      } catch (err) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    if (currentPos) {
      await saveRecord(currentPos.latitude, currentPos.longitude);
    } else {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await saveRecord(roundCoord(latitude), roundCoord(longitude));
      }, (err) => {
        let msg = 'Erro ao capturar geolocalização.';
        if (err.code === err.PERMISSION_DENIED) msg = 'Permissão de geolocalização negada. Por favor, habilite o acesso.';
        else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Posição indisponível. Verifique seu GPS.';
        else if (err.code === err.TIMEOUT) msg = 'Tempo esgotado ao capturar localização. Tente novamente.';
        
        setError(msg);
        setLoading(false);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      });
    }
  };

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            gpsStatus === 'requesting' ? "bg-blue-100 text-blue-600 animate-pulse" :
            gpsStatus === 'captured' ? "bg-emerald-100 text-emerald-600" :
            "bg-red-100 text-red-600"
          )}>
            {gpsStatus === 'requesting' ? <RefreshCw size={20} className="animate-spin" /> : 
             gpsStatus === 'captured' ? <MapPin size={20} /> : 
             <AlertTriangle size={20} />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              {gpsStatus === 'requesting' ? 'Solicitando localização...' :
               gpsStatus === 'captured' ? 'Localização capturada!' :
               'Erro na localização'}
            </p>
            <p className="text-[10px] text-slate-500">
              {gpsStatus === 'requesting' ? 'Aguardando sinal do navegador...' :
               gpsStatus === 'captured' ? `Raio de precisão: ${currentPos?.accuracy.toFixed(1)}m` :
               'Habilite o acesso ao GPS nas configurações'}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={captureLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={12} />
          Recapturar
        </button>
      </div>

      {error && (
        <div className="p-3 lg:p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-[10px] lg:text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <Input 
          label="Nº da OM" 
          placeholder="Ex: OM-2024-001" 
          required 
          value={formData.om_number}
          onChange={e => setFormData({...formData, om_number: e.target.value})}
        />
        <Input 
          label="Operação" 
          placeholder="Ex: Troca de Válvula" 
          required 
          value={formData.operation}
          onChange={e => setFormData({...formData, operation: e.target.value})}
        />
        <div className="space-y-1.5 relative">
          <label className="text-sm font-medium text-slate-700">Modelo da OM</label>
          <div className="relative" onClick={() => setShowModelList(!showModelList)}>
            <div className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm cursor-pointer flex items-center justify-between">
              <span>{formData.model}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
          
          {showModelList && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto top-full">
              {OM_MODELS.map(model => (
                <button
                  key={model}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({...formData, model: model as any});
                    setShowModelList(false);
                  }}
                >
                  <span className="text-sm text-slate-900">{model}</span>
                  {formData.model === model ? <CheckCircle2 size={14} className="text-blue-500" /> : <CircleIcon size={14} className="text-slate-200" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-sm font-medium text-slate-700">Código da OM</label>
          <div className="relative" onClick={() => setShowCodeList(!showCodeList)}>
            <div className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm cursor-pointer flex items-center justify-between">
              <span>{formData.code}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
          
          {showCodeList && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto top-full">
              {OM_CODES.map(code => (
                <button
                  key={code}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({...formData, code});
                    setShowCodeList(false);
                  }}
                >
                  <span className="text-sm text-slate-900">{code}</span>
                  {formData.code === code ? <CheckCircle2 size={14} className="text-blue-500" /> : <CircleIcon size={14} className="text-slate-200" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Equipe Envolvida</label>
        <div className="relative">
          <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all">
            {formData.involved_employees.map(reg => {
              const emp = employees.find(e => e.registration === reg);
              return (
                <div key={reg} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] lg:text-xs flex items-center gap-1.5">
                  <span className="truncate max-w-[100px]">{emp?.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, involved_employees: formData.involved_employees.filter(r => r !== reg)})}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            <input 
              className="flex-1 outline-none min-w-[100px] text-base lg:text-sm"
              placeholder="Adicionar colegas..."
              value={searchEmp}
              onChange={e => {
                setSearchEmp(e.target.value);
                setShowEmpList(true);
              }}
              onFocus={() => setShowEmpList(true)}
            />
          </div>
          
          {showEmpList && searchEmp && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.registration}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    onClick={() => {
                      setFormData({...formData, involved_employees: [...formData.involved_employees, emp.registration]});
                      setSearchEmp('');
                      setShowEmpList(false);
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-900">{emp.name}</p>
                      <p className="text-[10px] text-slate-500">{emp.registration}</p>
                    </div>
                    <PlusCircle size={14} className="text-blue-500" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500 italic">Nenhum resultado</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-2 relative">
          <label className="text-sm font-medium text-slate-700">Local da Atividade</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin size={18} />
            </div>
            <input 
              className="w-full pl-10 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-base lg:text-sm"
              placeholder="Buscar local..."
              value={searchLoc}
              onChange={e => {
                setSearchLoc(e.target.value);
                setShowLocList(true);
                if (formData.location_id) setFormData({...formData, location_id: ''});
              }}
              onFocus={() => setShowLocList(true)}
              onClick={() => setShowLocList(!showLocList)}
              required={!formData.location_id}
            />
            {searchLoc && (
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setSearchLoc('');
                  setFormData({...formData, location_id: ''});
                  setShowLocList(true);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {showLocList && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {filteredLocations.length > 0 ? (
                filteredLocations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    onClick={() => {
                      setFormData({...formData, location_id: loc.id.toString()});
                      setSearchLoc(loc.name);
                      setShowLocList(false);
                    }}
                  >
                    <span className="text-xs font-medium text-slate-900">{loc.name}</span>
                    {Number(formData.location_id) === loc.id ? <CheckCircle2 size={14} className="text-blue-500" /> : <CircleIcon size={14} className="text-slate-200" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500 italic">Nenhum local encontrado</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-sm font-medium text-slate-700">Status Inicial</label>
          <div className="relative" onClick={() => setShowStatusList(!showStatusList)}>
            <div className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm cursor-pointer flex items-center justify-between">
              <span>{formData.status}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
          
          {showStatusList && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto top-full">
              {ACTIVITY_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({...formData, status: status as any});
                    setShowStatusList(false);
                  }}
                >
                  <span className="text-sm text-slate-900">{status}</span>
                  {formData.status === status ? <CheckCircle2 size={14} className="text-blue-500" /> : <CircleIcon size={14} className="text-slate-200" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Descrição</label>
        <textarea 
          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all min-h-[60px] text-base lg:text-sm"
          placeholder="Descreva a atividade..."
          required
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="secondary" className="w-full sm:w-auto px-8 py-3 lg:py-2.5 text-sm lg:text-base" disabled={loading}>
          {loading ? 'Capturando Localização...' : 'Enviar Registro'}
        </Button>
      </div>
    </form>
  );
}

function DashboardActivityListView({ activities, employees, occurrences, user, onUpdate, onTabChange }: { activities: Activity[], employees: User[], occurrences: Occurrence[], user: User | null, onUpdate: () => void, onTabChange: (tab: any) => void }) {
  const [filters, setFilters] = useState({
    startDate: '',
    serviceCode: '',
    status: '',
    search: ''
  });
  const [showCodeFilterList, setShowCodeFilterList] = useState(false);
  const [showStatusFilterList, setShowStatusFilterList] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [justificationModal, setJustificationModal] = useState<{ id: number, status: ActivityStatus } | null>(null);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [occurrenceModalData, setOccurrenceModalData] = useState<Activity | null>(null);
  const [occLoading, setOccLoading] = useState(false);

  const handleAddOccurrenceFromActivity = async (data: any) => {
    if (!user || !occurrenceModalData) return;
    setOccLoading(true);
    try {
      const response = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id,
          userName: user.name,
          om_number: `${occurrenceModalData.om_number} - ${occurrenceModalData.operation}`
        })
      });

      if (response.ok) {
        setOccurrenceModalData(null);
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding occurrence:", error);
    } finally {
      setOccLoading(false);
    }
  };

  const filteredActivities = activities.filter(a => {
    let dateMatch = true;
    if (filters.startDate) {
      const date = parseISO(a.created_at);
      const start = startOfDay(parseISO(filters.startDate));
      const end = endOfDay(parseISO(filters.startDate));
      dateMatch = isWithinInterval(date, { start, end });
    }
    
    const codeMatch = !filters.serviceCode || a.code === filters.serviceCode;
    const searchMatch = !filters.search || 
      a.operation?.toLowerCase().includes(filters.search.toLowerCase()) ||
      a.om_number?.toLowerCase().includes(filters.search.toLowerCase());
    
    return dateMatch && codeMatch && searchMatch;
  });

  const handleStatusChange = async (id: number, newStatus: ActivityStatus, just?: string) => {
    if (newStatus === 'Pausada' || newStatus === 'Cancelada') {
      if (!just) {
        setJustificationModal({ id, status: newStatus });
        return;
      }
    }

    setLoading(true);
    try {
      await fetch(`/api/activities/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, justification: just })
      });
      onUpdate();
      setJustificationModal(null);
      setJustification('');
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInvolvedTeam = (act: Activity) => {
    let registrations: string[] = [];
    try {
      registrations = typeof act.involved_employees === 'string' 
        ? JSON.parse(act.involved_employees) 
        : (Array.isArray(act.involved_employees) ? act.involved_employees : []);
    } catch (e) {
      registrations = [];
    }
    
    const names = registrations.map(reg => {
      const emp = employees.find(e => e.registration === reg);
      return emp ? emp.name : reg;
    });

    return [act.user_name, ...names].filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm relative z-[100]">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 items-end">
          {/* Search Row */}
          <div className="w-full lg:col-span-6 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block hidden">Busca</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por OM ou Operação..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm h-[42px]"
                />
              </div>
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "lg:hidden px-4 h-[42px] rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  showMobileFilters 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} />
                Filtrar
              </button>
            </div>
          </div>
          
          {/* Collapsible Filters */}
          <AnimatePresence>
            {(showMobileFilters || window.innerWidth >= 1024) && (
              <motion.div 
                initial={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                animate={window.innerWidth < 1024 ? { height: 'auto', opacity: 1 } : false}
                exit={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                className={cn(
                  "w-full lg:contents",
                  window.innerWidth < 1024 && "overflow-hidden"
                )}
              >
                <div className="flex flex-col lg:contents gap-3 pt-3 lg:pt-0 border-t border-slate-100 lg:border-0 mt-3 lg:mt-0">
                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Data</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0 pointer-events-none" />
                      <input 
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({...filters, startDate: e.target.value})}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="w-full pl-8 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm text-slate-600 h-[42px] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Cód. Serviço</label>
                    <div 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                      onClick={() => setShowCodeFilterList(!showCodeFilterList)}
                    >
                      <span className="truncate">{filters.serviceCode || 'Todos'}</span>
                      <ChevronDown size={16} className="text-slate-400 ml-2 shrink-0 mr-1" />
                    </div>
                    
                    {showCodeFilterList && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({...filters, serviceCode: ''});
                            setShowCodeFilterList(false);
                          }}
                        >
                          <span className="text-sm text-slate-900">Todos</span>
                          {!filters.serviceCode && <CheckCircle2 size={14} className="text-blue-500" />}
                        </button>
                        {OM_CODES.map(code => (
                          <button
                            key={code}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters({...filters, serviceCode: code});
                              setShowCodeFilterList(false);
                            }}
                          >
                            <span className="text-sm text-slate-900">{code}</span>
                            {filters.serviceCode === code && <CheckCircle2 size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <Button 
                      variant="outline" 
                      className="h-[42px] w-full px-4 border-slate-200 hover:bg-slate-50 transition-colors shrink-0 flex items-center justify-center gap-2" 
                      onClick={() => setFilters({
                        startDate: '',
                        serviceCode: '',
                        search: ''
                      })}
                    >
                      <X size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Limpar</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {filteredActivities.length === 0 ? (
          <div className="bg-white p-8 lg:p-12 rounded-2xl border border-slate-200 text-center">
            <ClipboardList size={40} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-base lg:text-lg font-bold text-slate-900">Nenhum registro</h3>
            <p className="text-xs lg:text-sm text-slate-500">Nenhum registro encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredActivities.map(activity => {
            const isCreator = activity.user_id === user?.id;
            return (
              <div key={activity.id} className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3 lg:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] lg:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {activity.code}
                      </span>
                      <h4 className="font-bold text-[11px] lg:text-sm text-slate-900 truncate max-w-[200px] sm:max-w-none">
                        {activity.om_number} - {activity.operation}
                      </h4>
                    </div>
                    <div className="flex items-start justify-between gap-2 lg:gap-4 w-full">
                      <p className="text-[9px] lg:text-[10px] text-slate-500 flex items-center gap-2 truncate">
                        <MapPin size={12} className="shrink-0" /> {activity.location_name}
                      </p>
                      <div className="text-[9px] lg:text-[10px] text-slate-500 flex items-start gap-2 text-right shrink-0">
                        <Clock size={12} className="mt-0.5 shrink-0" />
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{format(parseISO(activity.created_at), 'dd/MM/yyyy')}</span>
                          <span className="text-slate-400">{format(parseISO(activity.created_at), 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 overflow-hidden">
                      <Users size={12} className="text-slate-400 shrink-0" />
                      <p className="text-[8px] lg:text-[9px] font-medium text-slate-600 truncate">Equipe: {getInvolvedTeam(activity)}</p>
                    </div>
                    {!isCreator && (
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] lg:text-[10px] text-slate-400 italic">
                        <ShieldCheck size={10} className="shrink-0" />
                        Apenas o criador ({activity.user_name}) pode alterar o status
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 lg:gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <Clock size={10} className="text-blue-500 shrink-0" />
                        <span>Ativo: <span className="font-bold text-slate-900">{activity.total_active_time || 0} min</span></span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <AlertCircle size={10} className="text-orange-500 shrink-0" />
                        <span>Parado: <span className="font-bold text-slate-900">{activity.total_paused_time || 0} min</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status Atual</span>
                      <div className="px-2 lg:px-3 py-1 rounded-lg text-[9px] lg:text-[10px] font-bold uppercase tracking-wider border truncate max-w-full" style={{
                        backgroundColor: `${STATUS_COLORS[activity.status]}15`,
                        borderColor: `${STATUS_COLORS[activity.status]}40`,
                        color: STATUS_COLORS[activity.status]
                      }}>
                        {activity.status}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 lg:gap-1.5 shrink-0">
                      <button 
                        onClick={() => setOccurrenceModalData(activity)}
                        className="p-1.5 lg:p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200"
                        title="Informar ocorrência"
                      >
                        <AlertTriangle size={16} />
                      </button>
                      
                      {isCreator && activity.status !== 'Concluída' && activity.status !== 'Cancelada' && (
                        <>
                          {activity.status === 'Em andamento' ? (
                            <button 
                              onClick={() => handleStatusChange(activity.id, 'Pausada')}
                              className="p-1.5 lg:p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-200"
                              title="Pausar"
                            >
                              <Clock size={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusChange(activity.id, 'Em andamento')}
                              className="p-1.5 lg:p-2 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors border border-yellow-200"
                              title="Retomar"
                            >
                              <Clock size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleStatusChange(activity.id, 'Concluída')}
                            className="p-1.5 lg:p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                            title="Concluir"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(activity.id, 'Cancelada')}
                            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                            title="Cancelar"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600 italic line-clamp-2">"{activity.description}"</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Justification Modal */}
      <AnimatePresence>
        {justificationModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJustificationModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    justificationModal.status === 'Cancelada' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {justificationModal.status === 'Cancelada' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Justificativa</h3>
                    <p className="text-xs text-slate-500">Mudança para status: {justificationModal.status}</p>
                  </div>
                </div>
                <button onClick={() => setJustificationModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Motivo da alteração</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[16px] min-h-[120px] resize-none"
                    placeholder="Descreva o motivo desta alteração..."
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setJustificationModal(null)}>
                  Voltar
                </Button>
                <Button 
                  variant={justificationModal.status === 'Cancelada' ? 'danger' : 'secondary'} 
                  className="flex-1"
                  loading={loading}
                  disabled={!justification.trim()}
                  onClick={() => handleStatusChange(justificationModal.id, justificationModal.status, justification)}
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {occurrenceModalData && (
          <DashboardAddOccurrenceModal
            onClose={() => setOccurrenceModalData(null)}
            onSave={handleAddOccurrenceFromActivity}
            loading={occLoading}
            initialLocation={occurrenceModalData.location_name}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeProfileModal({ employee, onClose, onUpdate, onUserUpdate, readOnly = false }: { employee: User | null, onClose: () => void, onUpdate: () => void, onUserUpdate?: (u: User) => void, readOnly?: boolean }) {
  if (!employee) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <UserIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{readOnly ? 'Visualizar Perfil' : 'Perfil do Colaborador'}</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <ProfileView 
              user={employee} 
              onUpdate={onUpdate} 
              onUserUpdate={onUserUpdate || (() => {})}
              canToggleStatus={!readOnly}
              readOnly={readOnly}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ManagerDashboard({ activities, locations, employees, onTabChange }: { activities: Activity[], locations: Location[], employees: User[], onTabChange: (tab: any) => void }) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null);
  const [filters, setFilters] = useState({
    startDate: getBrasiliaDateString(),
    serviceCode: '',
    status: '',
    search: ''
  });
  const [showCodeFilterList, setShowCodeFilterList] = useState(false);
  const [showStatusFilterList, setShowStatusFilterList] = useState(false);

  const getInvolvedTeam = (act: Activity) => {
    let registrations: string[] = [];
    try {
      registrations = typeof act.involved_employees === 'string' 
        ? JSON.parse(act.involved_employees) 
        : (Array.isArray(act.involved_employees) ? act.involved_employees : []);
    } catch (e) {
      registrations = [];
    }
    
    const names = registrations.map(reg => {
      const emp = employees.find(e => e.registration === reg);
      return emp ? emp.name : reg;
    });

    return [act.user_name, ...names].filter(Boolean).join(', ');
  };

  // Fechar fullscreen com Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMapFullscreen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const date = parseISO(a.created_at);
      const start = startOfDay(parseISO(filters.startDate));
      const end = endOfDay(parseISO(filters.startDate));
      
      const dateMatch = isWithinInterval(date, { start, end });
      const serviceMatch = !filters.serviceCode || a.code === filters.serviceCode;
      const statusMatch = !filters.status || a.status === filters.status;
      const searchMatch = !filters.search || 
        a.operation?.toLowerCase().includes(filters.search.toLowerCase()) ||
        a.om_number?.toLowerCase().includes(filters.search.toLowerCase());
      
      return dateMatch && serviceMatch && statusMatch && searchMatch;
    });
  }, [activities, filters]);

  const stats = useMemo(() => ({
    total: filteredActivities.length,
    completed: filteredActivities.filter(a => a.status === 'Concluída').length,
    inProgress: filteredActivities.filter(a => a.status === 'Em andamento').length,
    paused: filteredActivities.filter(a => a.status === 'Pausada').length,
    canceled: filteredActivities.filter(a => a.status === 'Cancelada').length,
  }), [filteredActivities]);

  return (
    <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-6 2xl:gap-8 flex flex-col gap-3 h-full min-h-0">

      {/* LEFT COLUMN: Filtros + Stats */}
      <div className="flex flex-col gap-2 lg:overflow-y-auto lg:no-scrollbar min-h-0">
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Busca</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="OM ou Operação..."
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm h-[42px]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Data</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  className="w-full pl-8 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Código</label>
              <div 
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                onClick={() => setShowCodeFilterList(!showCodeFilterList)}
              >
                <span className="truncate">{filters.serviceCode || 'Todos'}</span>
                <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
              </div>
              
              {showCodeFilterList && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, serviceCode: ''});
                      setShowCodeFilterList(false);
                    }}
                  >
                    <span className="text-xs text-slate-900">Todos</span>
                    {!filters.serviceCode && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
                  {OM_CODES.map(code => (
                    <button
                      key={code}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({...filters, serviceCode: code});
                        setShowCodeFilterList(false);
                      }}
                    >
                      <span className="text-xs text-slate-900">{code}</span>
                      {filters.serviceCode === code && <CheckCircle2 size={12} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Status</label>
              <div 
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                onClick={() => setShowStatusFilterList(!showStatusFilterList)}
              >
                <span className="truncate">{filters.status || 'Todos'}</span>
                <ChevronDown size={14} className="text-slate-400 ml-1 shrink-0" />
              </div>
              
              {showStatusFilterList && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, status: ''});
                      setShowStatusFilterList(false);
                    }}
                  >
                    <span className="text-xs text-slate-900">Todos</span>
                    {!filters.status && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
                  {ACTIVITY_STATUSES.map(status => (
                    <button
                      key={status}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({...filters, status: status});
                        setShowStatusFilterList(false);
                      }}
                    >
                      <span className="text-xs text-slate-900">{status}</span>
                      {filters.status === status && <CheckCircle2 size={12} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full h-[42px] text-xs font-bold border-slate-200 hover:bg-slate-50" onClick={() => setFilters({
                startDate: getBrasiliaDateString(),
                serviceCode: '',
                status: '',
                search: ''
              })}>
                <X size={14} className="mr-1" /> Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2">
          <DashboardStatCard label="Total de Atividades" value={stats.total} icon={<ClipboardList size={22} />} color="bg-slate-900" />
          <div className="grid grid-cols-2 gap-2">
            <DashboardStatCard label="Concluídas" value={stats.completed} icon={<CheckCircle2 size={18} />} color="bg-blue-500" />
            <DashboardStatCard label="Em Andamento" value={stats.inProgress} icon={<Clock size={18} />} color="bg-yellow-500" />
            <DashboardStatCard label="Pausadas" value={stats.paused} icon={<AlertCircle size={18} />} color="bg-orange-500" />
            <DashboardStatCard label="Canceladas" value={stats.canceled} icon={<XCircle size={18} />} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Map */}
      <div className={cn(
        "bg-slate-900 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300 min-h-0",
        isMapFullscreen
          ? "fixed inset-0 z-[2000] rounded-none border-0 p-0"
          : "flex-1 lg:h-auto border border-slate-200"
      )}>
        {/* Expand / Collapse Button */}
        <button
          onClick={() => setIsMapFullscreen(v => !v)}
          className="absolute top-4 left-4 z-[2001] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-bold px-3 py-2 rounded-xl shadow-lg border border-slate-200 hover:bg-white transition-all"
        >
          {isMapFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isMapFullscreen ? 'Reduzir' : 'Ampliar'}
        </button>

        {/* Fullscreen Stats Overlay (Top Right Glass Pill) */}
        {isMapFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 z-[2001]"
          >
            <div className="flex flex-col gap-1.5 bg-slate-900/70 backdrop-blur-xl border border-white/20 p-2.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
              {[
                  { label: 'Total', value: stats.total, color: '#0F172A', icon: <ClipboardList size={13} /> },
                  { label: 'Concluídas', value: stats.completed, color: '#3B82F6', icon: <CheckCircle2 size={13} /> },
                  { label: 'Em Andamento', value: stats.inProgress, color: '#EAB308', icon: <Clock size={13} /> },
                  { label: 'Pausadas', value: stats.paused, color: '#F97316', icon: <AlertCircle size={13} /> },
                  { label: 'Canceladas', value: stats.canceled, color: '#EF4444', icon: <XCircle size={13} /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 px-1.5 py-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg shrink-0" style={{ backgroundColor: s.color }}>
                    {s.icon}
                  </div>
                  <span className="text-[10px] text-white/90 font-bold w-22 leading-none uppercase tracking-wide">{s.label}</span>
                  <span className="text-sm font-black text-white leading-none drop-shadow-md min-w-[18px] text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hovered Activity Overlay (Top Right Free Panel) */}
        {isMapFullscreen && (
          <div className="absolute top-4 right-4 z-[2001] w-[calc(100%-32px)] sm:w-[280px] pointer-events-none space-y-3">
            <AnimatePresence>
              {hoveredActivity && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden pointer-events-auto"
                >
                  {/* Accent bar at top */}
                  <div 
                    className="h-1.5 w-full shadow-[0_0_10px_rgba(0,0,0,0.2)]" 
                    style={{ backgroundColor: STATUS_COLORS[hoveredActivity.status] }} 
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none outline-none ring-0 border-none">{hoveredActivity.om_number}</span>
                      <div 
                        className="px-2 py-0.5 rounded-md text-[8px] font-extrabold text-white uppercase tracking-tighter shadow-sm"
                        style={{ backgroundColor: STATUS_COLORS[hoveredActivity.status] }}
                      >
                        {hoveredActivity.status}
                      </div>
                    </div>
                    
                    <h4 className="font-extrabold text-white text-[13px] sm:text-[14px] leading-tight mb-2 drop-shadow-sm">{hoveredActivity.operation}</h4>
                    
                    <div className="space-y-3 sm:space-y-4 mt-2 pt-3 sm:pt-4 border-t border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Localização</p>
                          <p className="text-[11px] text-white font-semibold leading-tight truncate">{hoveredActivity.location_name || 'Local não identificado'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center shrink-0">
                          <Users size={14} className="text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Equipe Envolvida</p>
                          <p className="text-[11px] text-white leading-tight font-medium opacity-90">{getInvolvedTeam(hoveredActivity)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-white/30 mt-4 pt-3 border-t border-white/5">
                        <Clock size={12} className="shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Registrado às {format(parseISO(hoveredActivity.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div className={cn("h-full overflow-hidden", isMapFullscreen ? "rounded-none" : "rounded-xl border border-slate-100")}>
          <MapContainer 
            center={[-23.5505, -46.6333]} 
            zoom={13} 
            maxZoom={22}
            style={{ height: isMapFullscreen ? '100vh' : '100%', width: '100%' }}
          >
            <TileLayer 
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
              maxZoom={22}
            />
            {(filteredActivities || []).map(act => (
              <Marker 
                key={act?.id} 
                position={[act?.latitude || 0, act?.longitude || 0]}
                eventHandlers={{
                  click: () => {
                    if (window.innerWidth >= 1024) {
                      setSelectedActivity(act);
                    }
                  },
                  mouseover: () => setHoveredActivity(act),
                  mouseout: () => setHoveredActivity(null)
                }}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="${act.status === 'Em andamento' ? 'marker-pulse' : ''}" style="position: relative; display: flex; flex-direction: column; align-items: center;">
                      <div style="background-color: ${STATUS_COLORS[act.status]}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 2;"></div>
                      <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 8px solid white; margin-top: -4px; z-index: 1;"></div>
                      <div style="width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; margin-top: 2px; filter: blur(1px);"></div>
                    </div>
                  `,
                  iconSize: [18, 28],
                  iconAnchor: [9, 28]
                })}
              >
                <Popup closeButton={false}>
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-0 min-w-[200px] font-sans overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{act.om_number}</span>
                        <div 
                          className="px-2 py-0.5 rounded-md text-[8px] font-extrabold text-white uppercase tracking-tighter"
                          style={{ backgroundColor: STATUS_COLORS[act.status] }}
                        >
                          {act.status}
                        </div>
                      </div>
                      
                      <h4 className="font-extrabold text-white text-[13px] leading-tight mb-2 pr-2">{act.operation}</h4>
                      
                      <div className="space-y-3 mt-2 pt-3 border-t border-white/10">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center shrink-0">
                            <MapPin size={10} className="text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider mb-0.5">Localização</p>
                            <p className="text-[11px] text-white font-semibold leading-tight truncate">{act.location_name || 'Desconhecido'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Users size={10} className="text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-white/30 font-bold uppercase tracking-wider mb-0.5">Equipe Envolvida</p>
                            <p className="text-[11px] text-white font-medium opacity-90 truncate">{getInvolvedTeam(act)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-white/30 mt-3 pt-2 border-t border-white/5">
                          <Clock size={11} className="shrink-0" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Registrado às {format(parseISO(act.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            <MapResizer trigger={isMapFullscreen} />
            <MapUpdater activities={filteredActivities} filters={filters} />
          </MapContainer>
        </div>
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-[1100] flex flex-col border-l border-slate-200"
          >
            <button 
              onClick={() => setSelectedActivity(null)}
              className="absolute top-5 right-5 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-slate-50 rounded-full transition-all text-slate-600 z-[1010] shadow-md hover:scale-110 active:scale-95"
              aria-label="Fechar"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8 no-scrollbar pr-12">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">Detalhes do Registro</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">OM: {selectedActivity.om_number}</p>
              </div>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Informações Gerais</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[selectedActivity.status] }} />
                        <span className="text-xs font-bold text-slate-900">{selectedActivity.status}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Código</p>
                      <span className="text-xs font-bold text-slate-900">{selectedActivity.code}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Operação</p>
                      <span className="text-xs font-bold text-slate-900">{selectedActivity.operation}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modelo</p>
                      <span className="text-xs font-bold text-slate-900">{selectedActivity.model}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data/Hora</p>
                      <span className="text-xs font-bold text-slate-900">{format(parseISO(selectedActivity.created_at), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Equipe e Local</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Colaboradores Envolvidos</p>
                      <div className="flex flex-wrap gap-2">
                        <div 
                          onClick={() => {
                            const emp = employees.find(e => e.name === selectedActivity.user_name);
                            if (emp) setSelectedEmployee(emp);
                          }}
                          className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {(() => {
                            const emp = employees.find(e => e.name === selectedActivity.user_name);
                            return emp ? `${emp.name} - ${emp.registration}` : selectedActivity.user_name;
                          })()} (Responsável)
                        </div>
                        {(() => {
                          let regs: string[] = [];
                          try {
                            regs = typeof selectedActivity.involved_employees === 'string' 
                              ? JSON.parse(selectedActivity.involved_employees) 
                              : (Array.isArray(selectedActivity.involved_employees) ? selectedActivity.involved_employees : []);
                          } catch(e) {}
                          return regs.map(reg => {
                            const emp = employees.find(e => e.registration === reg);
                            return (
                              <div 
                                key={reg} 
                                onClick={() => emp && setSelectedEmployee(emp)}
                                className={cn(
                                  "px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors",
                                  emp ? "cursor-pointer hover:bg-slate-50" : ""
                                )}
                              >
                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                {emp ? `${emp.name} - ${emp.registration}` : reg}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Localização</p>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <MapPin size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{selectedActivity.location_name}</p>
                          <p className="text-[10px] text-slate-500">{selectedActivity.latitude.toFixed(6)}, {selectedActivity.longitude.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Métricas de Tempo</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-blue-600" />
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Tempo Ativo</p>
                      </div>
                      <p className="text-lg font-bold text-blue-700">{selectedActivity.total_active_time || 0} <span className="text-xs font-medium">min</span></p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={14} className="text-orange-600" />
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Tempo Parado</p>
                      </div>
                      <p className="text-lg font-bold text-orange-700">{selectedActivity.total_paused_time || 0} <span className="text-xs font-medium">min</span></p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Descrição</h4>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{selectedActivity.description || 'Sem descrição informada.'}"
                    </p>
                  </div>
                </section>
              </div>

            </motion.div>
        )}
      </AnimatePresence>

      <EmployeeProfileModal 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        onUpdate={() => {}} 
        onUserUpdate={(u) => setSelectedEmployee(u)}
        readOnly={true}
      />
    </div>
  );
}

function DashboardRecordsView({ activities, employees, onTabChange }: { activities: Activity[], employees: User[], onTabChange: (tab: any) => void }) {
  const [filters, setFilters] = useState({
    startDate: getBrasiliaDateString(),
    serviceCode: '',
    status: '',
    search: ''
  });
  const [showCodeFilterList, setShowCodeFilterList] = useState(false);
  const [showStatusFilterList, setShowStatusFilterList] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async (id: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/activities/${id}/history`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedActivity) {
      fetchHistory(selectedActivity.id);
    } else {
      setHistory([]);
    }
  }, [selectedActivity]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const date = parseISO(a.created_at);
      const start = startOfDay(parseISO(filters.startDate));
      const end = endOfDay(parseISO(filters.startDate));
      
      const dateMatch = isWithinInterval(date, { start, end });
      const serviceMatch = !filters.serviceCode || a.code === filters.serviceCode;
      const statusMatch = !filters.status || a.status === filters.status;
      const searchMatch = !filters.search || 
        a.operation?.toLowerCase().includes(filters.search.toLowerCase()) ||
        a.om_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(filters.search.toLowerCase()));
      
      return dateMatch && serviceMatch && statusMatch && searchMatch;
    });
  }, [activities, filters]);

  const chartData = useMemo(() => (ACTIVITY_STATUSES || []).map(s => ({
    name: s,
    value: (filteredActivities || []).filter(a => a?.status === s).length,
    color: STATUS_COLORS[s]
  })), [filteredActivities]);

  const totalActivities = useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData]);

  const exportToExcel = () => {
    const data = (filteredActivities || []).map(a => ({
      'ID': a?.id,
      'OM': a?.om_number,
      'Operação': a?.operation,
      'Modelo': a?.model,
      'Código': a?.code,
      'Local': a?.location_name,
      'Funcionário': a?.user_name,
      'Status': a?.status,
      'Data': a?.created_at ? format(parseISO(a.created_at), 'dd/MM/yyyy HH:mm') : '-',
      'Tempo Ativo (min)': a?.total_active_time || 0,
      'Tempo Parado (min)': a?.total_paused_time || 0,
      'Descrição': a?.description
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, `registros_operacionais_${format(getBrasiliaDate(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const getInvolvedTeam = (act: Activity) => {
    let registrations: string[] = [];
    try {
      registrations = typeof act.involved_employees === 'string' 
        ? JSON.parse(act.involved_employees) 
        : (Array.isArray(act.involved_employees) ? act.involved_employees : []);
    } catch (e) {
      registrations = [];
    }
    
    const names = (registrations || []).map(reg => {
      const emp = (employees || []).find(e => e?.registration === reg);
      return emp ? emp.name : reg;
    });

    return [act.user_name, ...names].filter(Boolean).join(', ');
  };

  const downloadPDF = async () => {
    if (!selectedActivity) return;
    const element = document.getElementById('detailed-report-content');
    if (!element) return;

    try {
      // Create a temporary container for the PDF content to style it specifically for PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.width = '800px';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.backgroundColor = '#ffffff';
      pdfContainer.style.fontFamily = 'Inter, sans-serif';
      pdfContainer.innerHTML = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; display: flex; justify-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: bold; color: #0f172a; margin: 0;">Relatório Operacional</h1>
            <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">OM: ${selectedActivity.om_number} • Código: ${selectedActivity.code}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
        ${element.innerHTML}
      `;
      
      // Temporary append to document to capture
      document.body.appendChild(pdfContainer);
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio_${selectedActivity.om_number}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Filters */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm relative z-[100]">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 items-end">
          {/* Search Row */}
          <div className="w-full lg:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block hidden">Busca</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar OM, Operação ou Descrição..."
                  value={filters.search}
                  onChange={e => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm h-[42px]"
                />
              </div>
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "lg:hidden px-4 h-[42px] rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  showMobileFilters 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} />
                Filtrar
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          <AnimatePresence>
            {(showMobileFilters || window.innerWidth >= 1024) && (
              <motion.div 
                initial={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                animate={window.innerWidth < 1024 ? { height: 'auto', opacity: 1 } : false}
                exit={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                className={cn(
                  "w-full lg:contents",
                  window.innerWidth < 1024 && "overflow-hidden"
                )}
              >
                <div className="flex flex-col lg:contents gap-3 pt-3 lg:pt-0 border-t border-slate-100 lg:border-0 mt-3 lg:mt-0">
                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Data</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0 pointer-events-none" />
                      <input 
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({...filters, startDate: e.target.value})}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="w-full pl-8 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm text-slate-600 h-[42px] cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Código</label>
                    <div 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                      onClick={() => setShowCodeFilterList(!showCodeFilterList)}
                    >
                      <span className="truncate">{filters.serviceCode || 'Todos'}</span>
                      <ChevronDown size={16} className="text-slate-400 ml-2 shrink-0 mr-1" />
                    </div>

                    {showCodeFilterList && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({...filters, serviceCode: ''});
                            setShowCodeFilterList(false);
                          }}
                        >
                          <span className="text-sm text-slate-900">Todos</span>
                          {!filters.serviceCode && <CheckCircle2 size={14} className="text-blue-500" />}
                        </button>
                        {(OM_CODES || []).map(code => (
                          <button
                            key={code}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters({...filters, serviceCode: code});
                              setShowCodeFilterList(false);
                            }}
                          >
                            <span className="text-sm text-slate-900">{code}</span>
                            {filters.serviceCode === code && <CheckCircle2 size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Status</label>
                    <div 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                      onClick={() => setShowStatusFilterList(!showStatusFilterList)}
                    >
                      <span className="truncate">{filters.status || 'Todos'}</span>
                      <ChevronDown size={16} className="text-slate-400 ml-2 shrink-0 mr-1" />
                    </div>

                    {showStatusFilterList && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({...filters, status: ''});
                            setShowStatusFilterList(false);
                          }}
                        >
                          <span className="text-sm text-slate-900">Todos</span>
                          {!filters.status && <CheckCircle2 size={14} className="text-blue-500" />}
                        </button>
                        {ACTIVITY_STATUSES.map(status => (
                          <button
                            key={status}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters({...filters, status: status as any});
                              setShowStatusFilterList(false);
                            }}
                          >
                            <span className="text-sm text-slate-900">{status}</span>
                            {filters.status === status && <CheckCircle2 size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <Button 
                      variant="outline" 
                      className="h-[42px] w-full px-4 border-slate-200 hover:bg-slate-50 transition-colors shrink-0 flex items-center justify-center gap-2" 
                      onClick={() => setFilters({
                        startDate: getBrasiliaDateString(),
                        serviceCode: '',
                        status: '',
                        search: ''
                      })}
                    >
                      <X size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Limpar</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500 italic">Nenhum registro encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            filteredActivities.map(act => (
              <div 
                key={act.id} 
                onClick={() => setSelectedActivity(act)}
                className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{act.code}</span>
                      <h4 className="font-bold text-xs lg:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{act.om_number}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500">{act.operation} • {act.location_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users size={12} className="text-slate-400" />
                      <p className="text-[9px] font-medium text-slate-600">Equipe: {getInvolvedTeam(act)}</p>
                    </div>
                  </div>
                  <div 
                    className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: STATUS_COLORS[act.status] }}
                  >
                    {act.status}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      const emp = employees.find(emp => emp.name === act.user_name);
                      if (emp) setSelectedEmployee(emp);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors group/user"
                  >
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center group-hover/user:bg-blue-50 transition-colors">
                      <UserIcon size={12} className="text-slate-400 group-hover/user:text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 group-hover/user:text-blue-600">{act.user_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{format(parseISO(act.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats/Charts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-blue-600" />
              Distribuição de Status
            </h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-bold text-slate-900">{totalActivities}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
              {chartData.map(item => (
                <div key={item.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({totalActivities > 0 ? Math.round((item.value / totalActivities) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
            >
              <div className="p-4 lg:p-6 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <ClipboardList size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base lg:text-lg font-bold text-slate-900 truncate">Relatório Detalhado</h3>
                    <p className="text-[10px] lg:text-xs text-slate-500 truncate">{selectedActivity.code} • {selectedActivity.om_number}</p>
                  </div>
                </div>
                  <button onClick={() => setSelectedActivity(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                  </button>
              </div>
              
              <div id="detailed-report-content" className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 lg:space-y-8 bg-slate-50 no-scrollbar">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-blue-600" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Ativo</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{selectedActivity.total_active_time || 0} <span className="text-xs font-medium text-slate-500">min</span></p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-orange-500" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Parado</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{selectedActivity.total_paused_time || 0} <span className="text-xs font-medium text-slate-500">min</span></p>
                  </div>
                </div>
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operação</p>
                    <p className="text-sm font-bold text-slate-900">{selectedActivity.operation}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Local</p>
                    <p className="text-sm font-bold text-slate-900">{selectedActivity.location_name}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                    <p 
                      onClick={() => {
                        const emp = employees.find(e => e.name === selectedActivity.user_name);
                        if (emp) setSelectedEmployee(emp);
                      }}
                      className="text-sm font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {selectedActivity.user_name} - {(() => {
                        const emp = employees.find(e => e.name === selectedActivity.user_name);
                        return emp ? emp.registration : 'N/A';
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipe</p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        let regs: string[] = [];
                        try {
                          regs = typeof selectedActivity.involved_employees === 'string' 
                            ? JSON.parse(selectedActivity.involved_employees) 
                            : (Array.isArray(selectedActivity.involved_employees) ? selectedActivity.involved_employees : []);
                        } catch(e) {}
                        
                        const teamRegs = regs.map(reg => {
                          const emp = employees.find(e => e.registration === reg);
                          return { name: emp ? emp.name : reg, reg, emp };
                        });

                        return teamRegs.map((member, idx) => (
                          <span 
                            key={idx}
                            onClick={() => member.emp && setSelectedEmployee(member.emp)}
                            className={cn(
                              "text-sm font-bold text-slate-900",
                              member.emp ? "cursor-pointer hover:text-blue-600 transition-colors" : ""
                            )}
                          >
                            {member.name} - {member.reg}{idx < teamRegs.length - 1 ? ', ' : ''}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    Descrição do Registro
                  </h4>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed italic shadow-sm">
                    "{selectedActivity.description}"
                  </div>
                </div>

                {/* History */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History size={16} className="text-blue-600" />
                    Histórico de Status
                  </h4>
                  
                  {loadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-500 italic">Nenhum histórico disponível.</p>
                  ) : (
                    <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      {history.map((item, idx) => (
                        <div key={idx} className="relative pl-12">
                          <div 
                            className="absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10"
                            style={{ backgroundColor: STATUS_COLORS[item.status] }}
                          >
                            {item.status === 'Em andamento' && <Clock size={14} className="text-white" />}
                            {item.status === 'Pausada' && <AlertCircle size={14} className="text-white" />}
                            {item.status === 'Concluída' && <CheckCircle2 size={14} className="text-white" />}
                            {item.status === 'Cancelada' && <XCircle size={14} className="text-white" />}
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-slate-900">{item.status}</span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {format(parseISO(item.timestamp), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            {item.justification && (
                              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Justificativa</p>
                                {item.justification}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EmployeeProfileModal 
        employee={selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        onUpdate={() => {}} 
        onUserUpdate={(u) => setSelectedEmployee(u)}
        readOnly={true}
      />
    </div>
  );
}

function DashboardEmployeesView({ employees, activities, onUpdate, initialEmployeeId, onClearInitialEmployeeId }: { employees: User[], activities: Activity[], onUpdate: () => void, initialEmployeeId?: number | null, onClearInitialEmployeeId?: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (initialEmployeeId) {
      const emp = (employees || []).find(e => e?.id === initialEmployeeId);
      if (emp) {
        setSelectedEmployee(emp);
        setIsReadOnly(true);
      }
      if (onClearInitialEmployeeId) onClearInitialEmployeeId();
    }
  }, [initialEmployeeId, employees, onClearInitialEmployeeId]);

  const handleCloseModal = () => {
    setSelectedEmployee(null);
    setIsReadOnly(false);
  };
  
  const filteredEmployees = (employees || []).filter(e => 
    e?.name?.toLowerCase().includes(search.toLowerCase()) || 
    e?.registration?.toLowerCase().includes(search.toLowerCase())
  );

  const getEmployeeStats = (userId: number) => {
    const userActivities = (activities || []).filter(a => a?.user_id === userId);
    return {
      total: userActivities.length,
      completed: userActivities.filter(a => a.status === 'Concluída').length,
      lastActivity: userActivities.length > 0 ? userActivities[0].created_at : null
    };
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-end gap-4">
          <div className="flex-1 max-w-md space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Busca</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por nome ou matrícula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-sm h-[42px]"
              />
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-sm mb-[0px] h-[42px] items-center">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 lg:p-1.5 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutDashboard size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 lg:p-1.5 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ClipboardList size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] lg:text-sm text-slate-500 font-medium">{filteredEmployees.length} Colaboradores</span>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(filteredEmployees || []).map(employee => {
            const stats = getEmployeeStats(employee.id);
            return (
              <motion.div 
                key={employee.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedEmployee(employee)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100 overflow-hidden">
                      {employee.avatar_url ? (
                        <img 
                          src={employee.avatar_url} 
                          alt={employee.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        employee.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{employee.name}</h4>
                      {employee.function && (
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{employee.function}</p>
                      )}
                      {stats.lastActivity && (
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                          <Clock size={12} />
                          <span className="text-[10px] font-medium">
                            Última: {format(parseISO(stats.lastActivity), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {employee.registration}
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      employee.is_active ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    )}>
                      {employee.is_active ? 'Ativo' : 'Não Ativo'}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Matrícula</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Função</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Treinamento</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Última Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredEmployees || []).map(employee => {
                  const stats = getEmployeeStats(employee.id);
                  return (
                    <tr 
                      key={employee.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 overflow-hidden shrink-0">
                            {employee.avatar_url ? (
                              <img 
                                src={employee.avatar_url} 
                                alt={employee.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <span className="text-xs lg:text-sm">{employee.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs lg:text-sm group-hover:text-blue-600 transition-colors truncate">{employee.name}</p>
                            <p className="text-[9px] lg:text-[10px] text-slate-500 truncate">{employee.email || 'Sem e-mail'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        <span className="px-2 py-0.5 lg:py-1 rounded-md bg-slate-100 text-[9px] lg:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {employee.registration}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        <span className="text-[10px] lg:text-xs text-slate-600 font-medium">{employee.function || '-'}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        <div className={cn(
                          "inline-flex px-2 py-0.5 lg:py-1 rounded-md text-[9px] lg:text-[10px] font-bold uppercase tracking-wider",
                          employee.is_active ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        )}>
                          {employee.is_active ? 'Ativo' : 'Não Ativo'}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        {(() => {
                          const list = employee.training_list ?? [];
                          if (list.length === 0) return <span className="text-[9px] text-slate-400 italic">Sem dados</span>;
                          const today = new Date();
                          const soon = new Date(); soon.setDate(soon.getDate() + 30);
                          const hasExpired = list.some(t => new Date(t.expiration_date) < today);
                          const hasSoon = !hasExpired && list.some(t => { const d = new Date(t.expiration_date); return d >= today && d <= soon; });
                          if (hasExpired) return (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider">
                              <AlertCircle size={10} /> Vencido
                            </div>
                          );
                          if (hasSoon) return (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider">
                              <Clock size={10} /> A vencer
                            </div>
                          );
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={10} /> Em dia
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        {stats.lastActivity ? (
                          <div className="flex items-center justify-center gap-2 text-slate-500">
                            <Clock size={12} className="shrink-0" />
                            <span className="text-[9px] lg:text-[10px] font-medium">
                              {format(parseISO(stats.lastActivity), 'dd/MM HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] lg:text-[10px] text-slate-400 italic">Sem registros</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden p-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium italic">Deslize para o lado para ver mais informações</p>
          </div>
        </div>
      )}

      <EmployeeProfileModal 
        employee={selectedEmployee} 
        onClose={handleCloseModal} 
        onUpdate={onUpdate} 
        onUserUpdate={(u) => setSelectedEmployee(u)}
        readOnly={true}
      />
    </div>
  );
}

function DashboardOccurrencesView({ user, occurrences, onUpdate }: { user: User, occurrences: Occurrence[], onUpdate: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Todas');
  const [filterCode, setFilterCode] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showCategoryFilterList, setShowCategoryFilterList] = useState(false);
  const [showCodeFilterList, setShowCodeFilterList] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);

  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => {
      const matchesSearch = 
        occ.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occ.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occ.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        occ.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (occ.om_number && occ.om_number.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = filterType === 'Todas' || occ.type === filterType;
      
      const matchesCode = !filterCode || (occ.om_number && occ.om_number.startsWith(filterCode)); // If om_number starts with code or similar logic
      // Wait, usually the code is separate. Let's see if occurrences have a 'code' field. 
      // If not, I'll just use searchQuery or similar. 
      // Actually, looking at image 3, code is CIVI-HID etc. 
      // I'll assume occ.type or check if they have a code.
      
      const occDate = new Date(occ.timestamp).toISOString().split('T')[0];
      const matchesDate = !filterDate || occDate === filterDate;
      
      return matchesSearch && matchesType && matchesCode && matchesDate;
    });
  }, [occurrences, searchQuery, filterType, filterCode, filterDate]);

  const handleAddOccurrence = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id,
          userName: user.name
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding occurrence:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (occ: Occurrence) => {
    const newStatus = occ.status === 'Solucionado' ? 'Não Solucionado' : 'Solucionado';
    try {
      const res = await fetch(`/api/occurrences/${occ.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6 flex-1 min-h-0 no-scrollbar">
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm relative z-[100]">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 items-end">
          {/* Search Row */}
          <div className="w-full lg:col-span-4 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block hidden">Busca</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar ocorrências..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm h-[42px]"
                />
              </div>
              <button 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "lg:hidden px-4 h-[42px] rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2",
                  showMobileFilters 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} />
                Filtrar
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          <AnimatePresence>
            {(showMobileFilters || window.innerWidth >= 1024) && (
              <motion.div 
                initial={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                animate={window.innerWidth < 1024 ? { height: 'auto', opacity: 1 } : false}
                exit={window.innerWidth < 1024 ? { height: 0, opacity: 0 } : false}
                className={cn(
                  "w-full lg:contents",
                  window.innerWidth < 1024 && "overflow-hidden"
                )}
              >
                <div className="flex flex-col lg:contents gap-3 pt-3 lg:pt-0 border-t border-slate-100 lg:border-0 mt-3 lg:mt-0">
                  <div className="lg:col-span-2 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Categoria</label>
                    <div 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                      onClick={() => setShowCategoryFilterList(!showCategoryFilterList)}
                    >
                      <span className="truncate">{filterType || 'Todas'}</span>
                      <ChevronDown size={16} className="text-slate-400 ml-2 shrink-0 mr-1" />
                    </div>
                    
                    {showCategoryFilterList && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                        {['Todas', 'Segurança', 'Operacional', 'Ambiental', 'Outros'].map(type => (
                          <button
                            key={type}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterType(type);
                              setShowCategoryFilterList(false);
                            }}
                          >
                            <span className="text-sm text-slate-900">{type}</span>
                            {filterType === type && <CheckCircle2 size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Código</label>
                    <div 
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all outline-none shadow-sm h-[42px] cursor-pointer flex items-center justify-between"
                      onClick={() => setShowCodeFilterList(!showCodeFilterList)}
                    >
                      <span className="truncate">{filterCode || 'Todos'}</span>
                      <ChevronDown size={16} className="text-slate-400 ml-2 shrink-0 mr-1" />
                    </div>
                    
                    {showCodeFilterList && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto top-full">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterCode('');
                            setShowCodeFilterList(false);
                          }}
                        >
                          <span className="text-sm text-slate-900">Todos</span>
                          {!filterCode && <CheckCircle2 size={14} className="text-blue-500" />}
                        </button>
                        {(OM_CODES || []).map(code => (
                          <button
                            key={code}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterCode(code);
                              setShowCodeFilterList(false);
                            }}
                          >
                            <span className="text-sm text-slate-900">{code}</span>
                            {filterCode === code && <CheckCircle2 size={14} className="text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 lg:block">Data</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0 pointer-events-none" />
                      <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="w-full pl-8 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm text-slate-600 h-[42px] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <Button 
                      variant="outline" 
                      className="h-[42px] w-full px-4 border-slate-200 hover:bg-slate-50 transition-colors shrink-0 flex items-center justify-center gap-2" 
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('Todas');
                        setFilterCode('');
                        setFilterDate('');
                      }}
                    >
                      <X size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Limpar</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {filteredOccurrences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma ocorrência encontrada</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto italic">
              {searchQuery || filterType !== 'Todas' 
                ? "Tente ajustar seus filtros de busca." 
                : "Ainda não há ocorrências registradas nas frentes de serviço."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOccurrences.map((occ) => (
              <motion.div 
                layout
                key={occ.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedOccurrence(occ)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                      {occ.user_avatar ? (
                        <img 
                          src={occ.user_avatar} 
                          alt={occ.user_name} 
                          className="w-full h-full object-cover"
                          style={{ objectPosition: occ.user_avatar_position }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{occ.user_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {format(new Date(occ.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border text-center whitespace-nowrap",
                      occ.type === 'Segurança' ? "bg-red-50 text-red-600 border-red-100" :
                      occ.type === 'Operacional' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      occ.type === 'Ambiental' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {occ.type}
                    </div>
                    <button
                      onClick={() => handleToggleStatus(occ)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors",
                        occ.status === 'Solucionado' 
                          ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {occ.status === 'Solucionado' ? <CheckCircle2 size={12} /> : <CircleIcon size={12} />}
                      {occ.status === 'Solucionado' ? 'Solucionado' : 'Não Solucionado'}
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">{occ.title}</h4>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">{occ.description}</p>
                
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 font-medium truncate">{occ.location}</p>
                  </div>
                  {occ.om_number && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-blue-500 shrink-0" />
                      <p className="text-xs font-bold text-blue-600 truncate">OM: {occ.om_number}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <DashboardAddOccurrenceModal 
            onClose={() => setShowAddModal(false)}
            onSave={handleAddOccurrence}
            loading={loading}
          />
        )}
        {selectedOccurrence && (
          <OccurrenceDetailsModal 
            occurrence={selectedOccurrence}
            onClose={() => setSelectedOccurrence(null)}
            user={user}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OccurrenceDetailsModal({ occurrence, onClose, user, onUpdate }: { occurrence: Occurrence, onClose: () => void, user: User, onUpdate: () => void }) {
  const [comments, setComments] = useState<OccurrenceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/occurrences/${occurrence.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [occurrence.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !selectedImage) || submitting) return;

    setSubmitting(true);
    let imageUrl = null;

    try {
      if (selectedImage) {
        // Upload image to Supabase
        const fileName = `${Date.now()}-${selectedImage.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('occurrence-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          // If the bucket doesn't exist, we might get an error here.
          // For now, I'll just skip the image if there's an error.
        } else if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('occurrence-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const res = await fetch(`/api/occurrences/${occurrence.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newComment,
          userId: user.id,
          imageUrl
        })
      });

      if (res.ok) {
        setNewComment('');
        setSelectedImage(null);
        setImagePreview(null);
        fetchComments();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90dvh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <AlertCircle size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Detalhes da Ocorrência</h3>
               <p className="text-xs text-slate-400 font-medium">Informações e Acompanhamento</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-slate-900">{occurrence.title}</h2>
              <div className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                occurrence.status === 'Solucionado' ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-500 border-slate-100"
              )}>
                {occurrence.status}
              </div>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
              {occurrence.description}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <MapPin size={16} className="text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localização</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{occurrence.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                <Calendar size={16} className="text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data/Hora</p>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {format(new Date(occurrence.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle size={16} className="text-blue-500" />
                Comentários e Observações
              </h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">
                {comments.length} Mensagens
              </span>
            </div>

            <div className="space-y-4 min-h-[100px]">
              {loading && comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 italic text-xs">
                  <RefreshCw size={24} className="animate-spin mb-2 opacity-20" />
                  Carregando comentários...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">Ainda não há comentários nesta ocorrência.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        comment.user_id === user.id ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-100 mt-1">
                        {comment.user_avatar ? (
                          <img src={comment.user_avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <UserIcon size={14} />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[80%] flex flex-col",
                        comment.user_id === user.id ? "items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-900">{comment.user_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{format(new Date(comment.created_at), "HH:mm", { locale: ptBR })}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                          comment.user_id === user.id 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                        )}>
                          {comment.text && <p>{comment.text}</p>}
                          {comment.image_url && (
                            <div className="mt-2 relative group">
                              <img src={comment.image_url} className="rounded-lg max-w-full h-auto border border-white/20 shadow-sm" alt="Foto da ocorrência" />
                              <a 
                                href={comment.image_url} 
                                download 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-md" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 rounded-xl transition-all"
            >
              <Paperclip size={20} />
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 rounded-xl transition-all"
            >
              <Camera size={20} />
            </button>
            <input 
              type="text"
              placeholder="Escreva seu comentário..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
            <button 
              type="submit"
              disabled={submitting || (!newComment.trim() && !selectedImage)}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardAddOccurrenceModal({ onClose, onSave, loading, initialLocation = '' }: { onClose: () => void, onSave: (data: any) => void, loading: boolean, initialLocation?: string }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: initialLocation,
    type: 'Operacional' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Registrar Ocorrência</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80dvh]">
          <Input 
            label="Título da Ocorrência"
            placeholder="Ex: Vazamento de óleo, Falha mecânica..."
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Categoria"
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              options={[
                { value: 'Segurança', label: 'Segurança' },
                { value: 'Operacional', label: 'Operacional' },
                { value: 'Ambiental', label: 'Ambiental' },
                { value: 'Outros', label: 'Outros' }
              ]}
            />
            <Input 
              label="Localização"
              placeholder="Ex: Frente 02, Km 45..."
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Descrição Detalhada</label>
            <textarea 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[120px] resize-none"
              placeholder="Descreva o que ocorreu com o máximo de detalhes possível..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 whitespace-nowrap" type="button">Cancelar</Button>
            <Button 
              className="flex-1" 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.description.trim() || !formData.location.trim()}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DashboardStatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0", color)}>
        {React.cloneElement(icon as React.ReactElement, { size: 15 })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function MapResizer({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { map.invalidateSize(); }, 50);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

function MapUpdater({ activities, filters }: { activities: Activity[], filters?: any }) {
  const map = useMap();
  const lastFilterRef = React.useRef<string>('');
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    // Criamos uma chave para identificar se os filtros mudaram de fato
    const filterKey = JSON.stringify(filters || {});
    const isFilterChange = filterKey !== lastFilterRef.current;
    
    // Só faz o "fit" se for a primeira vez com dados OU se o usuário mudou os filtros
    if (activities.length > 0 && (!hasInitializedRef.current || isFilterChange)) {
      const validActivities = activities.filter(a => a.latitude && a.longitude);
      if (validActivities.length > 0) {
        const bounds = L.latLngBounds(validActivities.map(a => [a.latitude, a.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        hasInitializedRef.current = true;
        lastFilterRef.current = filterKey;
      }
    }
  }, [activities.length, filters, map]);

  return null;
}

function DashboardsView({ activities, occurrences, employees }: { activities: Activity[], occurrences: Occurrence[], employees: User[] }) {
  // ── Filtros ──────────────────────────────────────────────
  const [filterPeriod, setFilterPeriod] = useState<'7' | '14' | '30' | 'all'>('30');
  const [filterEmployee, setFilterEmployee] = useState<string>('Todos');
  const [filterOccType, setFilterOccType] = useState<string>('Todos');

  const filteredActivities = useMemo(() => {
    const cutoff = filterPeriod === 'all' ? null : subDays(new Date(), parseInt(filterPeriod));
    return activities.filter(a => {
      const inPeriod = !cutoff || new Date(a.created_at) >= cutoff;
      const inEmployee = filterEmployee === 'Todos' || a.user_name === filterEmployee;
      return inPeriod && inEmployee;
    });
  }, [activities, filterPeriod, filterEmployee]);

  const filteredOccurrences = useMemo(() => {
    const cutoff = filterPeriod === 'all' ? null : subDays(new Date(), parseInt(filterPeriod));
    return occurrences.filter(o => {
      const inPeriod = !cutoff || new Date(o.timestamp) >= cutoff;
      const inEmployee = filterEmployee === 'Todos' || o.user_name === filterEmployee;
      const inType = filterOccType === 'Todos' || o.type === filterOccType;
      return inPeriod && inEmployee && inType;
    });
  }, [occurrences, filterPeriod, filterEmployee, filterOccType]);

  // ── KPIs ─────────────────────────────────────────────────
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter(a => a.status === 'Concluída').length;
  const inProgressActivities = filteredActivities.filter(a => a.status === 'Em andamento').length;
  const pausedActivities = filteredActivities.filter(a => a.status === 'Pausada').length;
  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  const totalOccurrences = filteredOccurrences.length;
  const solvedOccurrences = filteredOccurrences.filter(o => o.status === 'Solucionado').length;
  const activeEmployees = employees.filter(e => e.is_active).length;

  const employeeNames = useMemo(() => ['Todos', ...Array.from(new Set(activities.map(a => a.user_name))).sort()], [activities]);

  const activitiesByStatus = useMemo(() => {
    return (ACTIVITY_STATUSES || []).map(status => ({
      name: status,
      value: (activities || []).filter(a => a?.status === status).length,
      color: STATUS_COLORS[status],
      fill: STATUS_COLORS[status]
    })).filter(item => item.value > 0);
  }, [filteredActivities]);

  const occurrencesByType = useMemo(() => {
    const types = [
      { name: 'Segurança', color: '#EF4444' },
      { name: 'Operacional', color: '#6366F1' },
      { name: 'Ambiental', color: '#10B981' },
      { name: 'Outros', color: '#94A3B8' }
    ];
    return types.map(t => ({
      ...t,
      value: (filteredOccurrences || []).filter(o => o?.type === t.name).length
    })).filter(item => item.value > 0);
  }, [filteredOccurrences]);

  const activitiesOverTime = useMemo(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 13));
    const days = eachDayOfInterval({ start, end });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd/MM'),
        criadas: filteredActivities.filter(a => a.created_at.startsWith(dayStr)).length,
        concluidas: filteredActivities.filter(a => a.status === 'Concluída' && a.created_at.startsWith(dayStr)).length
      };
    });
  }, [filteredActivities, filterPeriod]);

  const occurrencesByLocation = useMemo(() => {
    const locMap = new Map<string, number>();
    filteredOccurrences.forEach(o => {
      locMap.set(o.location, (locMap.get(o.location) || 0) + 1);
    });
    return Array.from(locMap.entries())
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredOccurrences]);

  const tooltipStyle = {
    contentStyle: {
      borderRadius: '12px',
      border: 'none',
      boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)',
      fontFamily: 'inherit',
      fontSize: '12px'
    },
    itemStyle: { fontWeight: 600, color: '#0F172A' }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white shadow-xl rounded-xl px-4 py-3 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs font-bold text-slate-700">{p.name}: {p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Filtros</span>
        </div>
        <div className="h-5 w-px bg-slate-200 shrink-0" />

        {/* Período */}
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
          {([['7', '7 dias'], ['14', '14 dias'], ['30', '30 dias'], ['all', 'Tudo']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterPeriod(val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filterPeriod === val
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Funcionário */}
        <select
          value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)}
          className="px-3 py-2 bg-slate-50 border-0 rounded-xl text-base md:text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
        >
          {employeeNames.map(n => <option key={n}>{n}</option>)}
        </select>

        {/* Tipo de Ocorrência */}
        <select
          value={filterOccType}
          onChange={e => setFilterOccType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border-0 rounded-xl text-base md:text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
        >
          {['Todos', 'Segurança', 'Operacional', 'Ambiental', 'Outros'].map(t => <option key={t}>{t}</option>)}
        </select>

        {/* Limpar filtros */}
        {(filterPeriod !== '30' || filterEmployee !== 'Todos' || filterOccType !== 'Todos') && (
          <button
            onClick={() => { setFilterPeriod('30'); setFilterEmployee('Todos'); setFilterOccType('Todos'); }}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={13} /> Limpar
          </button>
        )}
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Atividades',
            value: totalActivities,
            sub: `${inProgressActivities} em andamento`,
            icon: <ClipboardList size={20} />,
            gradient: 'from-blue-500 to-indigo-600',
            light: 'bg-blue-50 text-blue-600',
            trend: '↑',
            trendColor: 'text-emerald-500'
          },
          {
            label: 'Taxa de Conclusão',
            value: `${completionRate}%`,
            sub: `${completedActivities} concluídas`,
            icon: <CheckCircle2 size={20} />,
            gradient: 'from-emerald-400 to-teal-600',
            light: 'bg-emerald-50 text-emerald-600',
            trend: completionRate >= 50 ? '↑' : '↓',
            trendColor: completionRate >= 50 ? 'text-emerald-500' : 'text-red-400'
          },
          {
            label: 'Ocorrências',
            value: totalOccurrences,
            sub: `${solvedOccurrences} solucionadas`,
            icon: <AlertTriangle size={20} />,
            gradient: 'from-orange-400 to-rose-500',
            light: 'bg-orange-50 text-orange-600',
            trend: '↓',
            trendColor: 'text-emerald-500'
          },
          {
            label: 'Funcionários Ativos',
            value: activeEmployees,
            sub: `de ${employees.length} total`,
            icon: <Users size={20} />,
            gradient: 'from-violet-500 to-purple-700',
            light: 'bg-violet-50 text-violet-600',
            trend: '↑',
            trendColor: 'text-emerald-500'
          }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 bg-gradient-to-br ${card.gradient}`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.light}`}>
                {card.icon}
              </div>
              <span className={`text-xs font-bold ${card.trendColor}`}>{card.trend}</span>
            </div>
            <p className="text-lg lg:text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart - wide */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolução de Atividades</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 14 dias</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span className="text-xs text-slate-500 font-medium">Criadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                <span className="text-xs text-slate-500 font-medium">Concluídas</span>
              </div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitiesOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCriadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={8} interval={1} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip content={<CustomTooltip />} />
                <RechartsArea type="monotone" dataKey="criadas" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradCriadas)" dot={false} activeDot={{ r: 5, fill: '#6366F1' }} />
                <RechartsArea type="monotone" dataKey="concluidas" stroke="#34D399" strokeWidth={2.5} fill="url(#gradConcluidas)" dot={false} activeDot={{ r: 5, fill: '#34D399' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut - Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Status das Atividades</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribuição atual</p>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={activitiesByStatus} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {activitiesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-black text-slate-900">{totalActivities}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {activitiesByStatus.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-slate-600 font-medium">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Horizontal bars - Ocorrencias por local */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Top Locais com Ocorrências</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranking dos 5 mais críticos</p>
          </div>
          {occurrencesByLocation.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">Sem dados ainda</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occurrencesByLocation} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18} background={{ fill: '#F8FAFC', radius: 6 }}>
                    {(occurrencesByLocation || []).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#EF4444' : i === 1 ? '#F97316' : '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Occurrences by type - Donut + list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Ocorrências por Tipo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Classificação das intercorrências</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-40 w-40 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={occurrencesByType.length > 0 ? occurrencesByType : [{ name: 'Sem dados', value: 1, color: '#E2E8F0' }]}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {(occurrencesByType.length > 0 ? occurrencesByType : [{ name: 'Sem dados', value: 1, color: '#E2E8F0' }]).map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-black text-slate-900">{totalOccurrences}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Total</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: 'Segurança', color: '#EF4444' },
                { name: 'Operacional', color: '#6366F1' },
                { name: 'Ambiental', color: '#10B981' },
                { name: 'Outros', color: '#94A3B8' }
              ].map(t => {
                const count = (occurrences || []).filter(o => o?.type === t.name).length;
                const pct = totalOccurrences > 0 ? Math.round((count / totalOccurrences) * 100) : 0;
                return (
                  <div key={t.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600 font-medium">{t.name}</span>
                      <span className="text-xs font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: t.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
