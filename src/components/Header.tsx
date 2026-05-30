import React, { useState } from "react";
import { 
  Bell, 
  Settings, 
  User as UserIcon, 
  Menu, 
  Shield, 
  Zap, 
  Globe, 
  ChevronDown, 
  Users, 
  Sparkles,
  LogOut
} from "lucide-react";
import { User, UserRole } from "../types.js";
import Logo from "./Logo.tsx";

interface HeaderProps {
  currentUser: User;
  onSwitchSession: (userId: string) => void;
  usersList: any[];
  notifications: any[];
  onMarkNotificationsRead: () => void;
  onLogout?: () => void;
}

export default function Header({ 
  currentUser, 
  onSwitchSession, 
  usersList, 
  notifications,
  onMarkNotificationsRead,
  onLogout
}: HeaderProps) {
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-white text-slate-800 border-b border-slate-200 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo variant="dark" />

        {/* Mobile & Desktop Sandbox Session Switcher */}
        <div className="flex items-center gap-2 lg:bg-slate-105 lg:p-1.5 rounded-full lg:border lg:border-slate-200/80 max-w-sm">
          <span className="text-[10px] text-brand-teal font-mono uppercase font-bold pl-3 pr-2 hidden lg:inline">Sandbox Act:</span>
          <div className="relative">
            {/* Desktop trigger */}
            <button 
              onClick={() => setShowSessionSelector(!showSessionSelector)}
              className="hidden lg:flex bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full items-center gap-2 transition-all border border-slate-200 shadow-sm cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-brand-teal" />
              <span>
                {currentUser.role === UserRole.ADMIN 
                  ? "Administrator" 
                  : currentUser.role === UserRole.RECRUITER 
                    ? "Recruiter Session" 
                    : "Developer Session"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Mobile trigger */}
            <button 
              onClick={() => setShowSessionSelector(!showSessionSelector)}
              className="lg:hidden p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-all border border-slate-200 flex items-center justify-center cursor-pointer"
              title="Switch Sandbox Persona"
            >
              <Users className="w-4 h-4 text-brand-teal" />
            </button>

            {showSessionSelector && (
              <div className="absolute -right-24 sm:right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 text-slate-700">
                <p className="text-[11px] font-mono text-brand-teal uppercase tracking-wider p-2 border-b border-slate-100 mb-1 font-bold">
                  Connect Persona (Simulated Auth)
                </p>
                <div className="space-y-1">
                  {usersList.map((usr) => (
                    <button
                      key={usr.id}
                      onClick={() => {
                        onSwitchSession(usr.id);
                        setShowSessionSelector(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                        usr.id === currentUser.id ? "bg-brand-teal-light border border-brand-teal/20" : ""
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {usr.role === UserRole.ADMIN 
                            ? "info.bouuz@gmail.com (Admin)" 
                            : usr.devProfile?.fullName || usr.recProfile?.companyName || usr.email}
                          {usr.isVerified && <Sparkles className="w-3 h-3 text-brand-teal" />}
                        </p>
                        <p className="text-[10px] text-slate-500 capitalize font-medium">{usr.role.toLowerCase()}</p>
                      </div>
                      {usr.id === currentUser.id && (
                        <div className="w-1.5 h-1.5 bg-brand-teal rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Toolbar & Profile Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-brand-teal bg-brand-teal-light px-2 py-0.5 rounded border border-brand-teal/20 font-semibold hidden sm:inline">
              min ₹500/hr Standard
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  onMarkNotificationsRead();
                }
              }}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-all relative border border-slate-200"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-700">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-900">System Events</h4>
                  <span className="text-[10px] font-mono text-brand-teal font-bold">{unreadCount} Unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No notifications or logging alerts.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 hover:bg-slate-50/60 transition-colors">
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Just now</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{notif.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-950">
                {currentUser.role === UserRole.ADMIN 
                  ? "Admin Supervisor" 
                  : currentUser.role === UserRole.RECRUITER 
                    ? "Recruiter Portal" 
                    : "Developer Account"}
              </p>
              <p className="text-[10px] font-mono text-slate-500 font-medium">{currentUser.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center text-xs font-bold text-brand-teal-dark">
              {currentUser.role === UserRole.ADMIN ? (
                <Shield className="w-4 h-4 text-rose-500" />
              ) : (
                currentUser.email.substring(0, 2).toUpperCase()
              )}
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Disconnect from session"
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200/60 transition-all cursor-pointer shadow-sm ml-1"
                id="header-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
