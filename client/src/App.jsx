import React, { useState } from 'react';
import AppShell from './components/layout/AppShell';
import CreateSpeechPage from './pages/CreateSpeechPage';
import HistoryPage from './pages/HistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <AppShell activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'create' && <CreateSpeechPage />}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'favorites' && <FavoritesPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}
