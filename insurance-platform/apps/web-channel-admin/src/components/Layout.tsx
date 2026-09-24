import { useState } from 'react';
import type { ViewId } from '../App';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewId;
  navigateTo: (view: ViewId, params?: { channelId?: string; roleId?: string }) => void;
}

export default function Layout({ children, currentView, navigateTo }: LayoutProps) {
  return (
    <div className="flex h-screen bg-page">
      <Sidebar currentView={currentView} navigateTo={navigateTo} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar currentView={currentView} navigateTo={navigateTo} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
