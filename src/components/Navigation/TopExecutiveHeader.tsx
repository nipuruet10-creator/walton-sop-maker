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
  Menu,
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
  onToggleMobileMenu?: () => void;
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
  onToggleMobileMenu,
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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-3 sm:px-6 py-2.5 no-print select-none">
      <div className="flex items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Left: Mobile Menu Toggle + Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-slate-500 tracking-wide uppercase truncate hidden sm:block">
              Walton Hi-Tech Industries PLC.
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">AC Process Development</span>
              <span className="text-slate-300 font-normal hidden sm:inline">|</span>
              <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0 hidden md:inline">
                {currentView === 'dashboard'
                  ? 'Executive Dashboard'
                  : currentView === 'workplace'
                  ? activeConcern.name
                  : currentView === 'editor'
                  ? 'SOP Studio'
                  : currentView === 'approval_route'
                  ? 'Approval Route'
                  : currentView === 'archive'
                  ? 'Master Archive'
                  : 'Analytics'}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Quick Actions (Matching ac-process-monthly-report) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px]">Real-Time Live</span>
          </div>

          {/* Sync Data Button */}
          <button
            type="button"
            onClick={onTriggerGlobalSync}
            disabled={isSyncing}
            title="Synchronize latest SOPs with IndexedDB & Cloud"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-2xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Notifications</span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="flex border-b border-slate-200 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setNotifTab('unread')}
                    className={`flex-1 py-1.5 text-center font-bold text-xs ${
                      notifTab === 'unread'
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-slate-500'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab('all')}
                    className={`flex-1 py-1.5 text-center font-bold text-xs ${
                      notifTab === 'all'
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-slate-500'
                    }`}
                  >
                    All ({effectiveNotifications.length})
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {displayedNotifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <CheckCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No notifications in this tab</p>
                    </div>
                  ) : (
                    displayedNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          if (notif.sopId && onSelectSopById) {
                            onSelectSopById(notif.sopId);
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-3 transition cursor-pointer hover:bg-slate-50 ${
                          !notif.isRead ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{notif.sopTitle}</span>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(notif.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 pl-2.5 rounded-xl border border-slate-200">
              <div className="text-left leading-none">
                <div className="text-[11px] font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-[9.5px] font-mono font-semibold text-slate-500 uppercase mt-0.5">
                  {currentUser.role}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Log Out"
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Red Fast Action Button (+ New SOP) - Exact ac-process-monthly-report style */}
          <button
            type="button"
            onClick={onFastCreateSop}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            title="Create New SOP Document"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New SOP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
