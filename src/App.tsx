import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChatInterface } from './components/ChatInterface';
import { FileUploader } from './components/FileUploader';
import { MessageSquare, LayoutDashboard } from 'lucide-react';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize a new session on load if one doesn't exist
    // In a real app, you might persist this in localStorage
    const initSession = async () => {
      try {
        const response = await axios.post('http://localhost:8000/api/sessions');
        setSessionId(response.data.session_id);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    initSession();
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar for navigation / context */}
      <aside className="sidebar">
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'white' }}>
            <MessageSquare size={24} />
          </div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>NeuroChat</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
            <LayoutDashboard size={20} className="text-gradient" />
            Active Session
          </a>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <FileUploader sessionId={sessionId} />
        </div>
      </aside>

      {/* Main chat area */}
      <main className="main-content" style={{ padding: '1.5rem' }}>
        <ChatInterface sessionId={sessionId} />
      </main>
    </div>
  );
}

export default App;
