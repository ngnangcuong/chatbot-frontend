import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface FileUploaderProps {
  sessionId: string | null;
}

export function FileUploader({ sessionId }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file || !sessionId) return;
    
    setStatus('uploading');
    
    // Check file type
    const validTypes = ['text/plain', 'text/csv', 'application/pdf', 'text/markdown'];
    // some browsers give different mime types for csv/txt, but backend does rough extension check too.
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    
    try {
      await axios.post('http://localhost:8000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || 'Failed to upload file');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={20} className="text-gradient" />
        Document Context
      </h3>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Upload a PDF, TXT, or CSV file to give the AI context for your questions.
      </p>

      <div 
        style={{ 
          border: '2px dashed var(--border-color)', 
          borderRadius: 'var(--radius-md)',
          padding: '2rem 1rem',
          textAlign: 'center',
          transition: 'border-color var(--transition-fast)'
        }}
      >
        <input 
          type="file" 
          id="file-upload" 
          style={{ display: 'none' }} 
          accept=".pdf,.txt,.csv,.md"
          onChange={handleFileChange}
        />
        
        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={32} color="var(--accent-primary)" />
              <span style={{ fontWeight: 500 }}>{file.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={32} color="var(--text-tertiary)" />
              <span style={{ color: 'var(--text-secondary)' }}>Click to select a file</span>
            </div>
          )}
        </label>
      </div>

      <button 
        className="btn-primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        disabled={!file || status === 'uploading' || !sessionId}
        onClick={handleUpload}
      >
        {status === 'uploading' ? 'Processing...' : 'Upload Document'}
      </button>

      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginTop: '1rem', fontSize: '0.9rem' }}>
          <CheckCircle size={16} />
          <span>File processed and indexed successfully.</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
