import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, NotificationItem } from '../../types/auth';
import type { ProcessConcern } from '../../data/concernData';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../services/storageService';
import {
  RotateCw,
  LogIn,
  LogOut,
  Bell,
  CheckCheck,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface TopExecutiveHeaderProps {
  currentUser: UserProfile | null;
  activeConcern: ProcessConcern;
  currentView: string;
  notifications: NotificationItem[];
  onOpenLogin: () => void;
  onLogout: () => void;
  onFastCreateSop: () => void;
  onTriggerGlobalSync: () => void;
  isSyncing?: boolean;
  onSelectSopById?: (id: string) => void;
  zoom?: number;
  setZoom?: React.Dispatch<React.SetStateAction<number>>;
}

export const TopExecutiveHeader: React.FC<TopExecutiveHeaderProps> = ({
  currentUser,
  activeConcern,
  currentView,
  notifications = [],
  onOpenLogin,
  onLogout,
  onFastCreateSop,
  onTriggerGlobalSync,
  isSyncing = false,
  onSelectSopById,
  zoom = 0.85,
  setZoom,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [notifTab, setNotifTab] = useState<'unread' | 'all'>('unread');
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const effectiveNotifications = notifications.map((n) =>
    localReadIds.has(n.id) ? { ...n, isRead: true } : n
  );
  const unreadNotifs = effectiveNotifications.filter((n) => !n.isRead);
  const unreadCount = unreadNotifs.length;
  const displayedNotifs = notifTab === 'unread' ? unreadNotifs : effectiveNotifications;

  const handleMarkAsRead = (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalReadIds((prev) => new Set([...prev, notifId]));
    if (currentUser) {
      markNotificationAsRead(currentUser.id, notifId);
    }
  };

  const handleMarkAllRead = () => {
    if (currentUser && unreadNotifs.length > 0) {
      const ids = unreadNotifs.map((n) => n.id);
      setLocalReadIds((prev) => new Set([...prev, ...ids]));
      markAllNotificationsAsRead(currentUser.id, ids);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 sm:px-6 lg:px-8 py-2.5 no-print select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
            Walton Hi-Tech Industries PLC.
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>AC Process Development</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {currentView === 'dashboard'
                ? 'Executive Dashboard'
                : currentView === 'workplace'
                ? activeConcern.name
                : currentView === 'editor'
                ? 'SOP Studio Canvas'
                : currentView === 'approval_route'
                ? 'Approval Route Pipeline'
                : currentView === 'archive'
                ? 'Master Technical Archive'
                : 'Analytics'}
            </span>
          </h1>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Zoom controls (Only when in Editor view) */}
          {currentView === 'editor' && setZoom && (
            <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.05).toFixed(2))))}
                className="px-2 py-1 text-slate-700 hover:bg-white rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-1 font-bold text-[11px] min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.05).toFixed(2))))}
                className="px-2 py-1 text-slate-700 hover:bg-white rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="px-1.5 py-1 text-slate-500 hover:text-slate-900"
                title="Reset zoom to 85%"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Real-time Cloud Sync Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-Time Live</span>
          </div>

          {/* Trigger Global Cloud Sync Button */}
          <button
            type="button"
            onClick={onTriggerGlobalSync}
            disabled={isSyncing}
            title="Synchronize latest SOPs & approval statuses from Google Cloud"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span>Notifications &amp; Tasks</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="flex border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setNotifTab('unread')}
                    className={`flex-1 py-1.5 font-bold text-center border-b-2 transition ${
                      notifTab === 'unread'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab('all')}
                    className={`flex-1 py-1.5 font-bold text-center border-b-2 transition ${
                      notifTab === 'all'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    All ({effectiveNotifications.length})
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {displayedNotifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No {notifTab === 'unread' ? 'unread' : ''} notifications at this moment.
                    </div>
                  ) : (
                    displayedNotifs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          handleMarkAsRead(item.id);
                          if (onSelectSopById && item.sopId) {
                            onSelectSopById(item.sopId);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3 transition hover:bg-blue-50/50 cursor-pointer ${
                          !item.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-800 text-[11.5px] truncate">
                            {item.sopTitle}
                          </div>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.senderName} ({item.senderRole})</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge & Switcher */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentUser.role === 'admin'
                      ? 'Super Admin'
                      : currentUser.role === 'approved_by'
                      ? 'Process HOD'
                      : currentUser.role === 'checked_by'
                      ? 'Section In-Charge'
                      : 'Process Engineer'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Switch User / Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Generate Fast SOP Action Button (Red styling matching ac-process-monthly-report) */}
          <button
            type="button"
            onClick={onFastCreateSop}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            title="Create a new SOP"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New SOP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
