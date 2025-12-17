import React, { useState, useRef, useEffect } from 'react';
import { Notification, Role, Action } from '../types';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  currentRole: Role;
  dispatch: React.Dispatch<Action>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, currentRole, dispatch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications for the current user role
  const myNotifications = notifications
    .filter(n => n.recipientRole === currentRole)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = myNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
            <span className="text-xs text-slate-500">{myNotifications.length} total</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No tienes notificaciones.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {myNotifications.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 leading-snug">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-1">
                        <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};