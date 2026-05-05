"use client";

import React, { useState, useEffect, useRef } from 'react';

interface Video {
  id: string;
  title: string;
  status: 'ready' | 'processing' | 'failed' | 'PROCESSING' | 'READY'; // Added PROCESSING to match your backend
  date?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/upload');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        })
      });

      const data = await response.json();
      const uploadUrl = data.uploadUrl;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (uploadResponse.ok) {
        alert("Upload successful!");
        setFile(null); // Clear selection
        fetchVideos(); // Refresh the list
      }
    } catch (e) {
      console.error("Upload error:", e);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const isProcessing = videos.some(v =>
      v.status.toUpperCase() === 'PROCESSING' || v.status === 'processing'
    );

    if (isProcessing) {
      const interval = setInterval(() => {
        console.log("Checking cloud for transcription updates...");
        fetchVideos();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [videos]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Video Library</h1>
          <p className="text-lg text-slate-500 mt-2">Manage and search your processed transcripts.</p>
        </header>

        {/* Drop Zone & Input */}
        <section className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative p-12 border-2 rounded-2xl text-center transition-all cursor-pointer ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
              }`}
          >
            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  {file ? `Selected: ${file.name}` : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-400 mt-1">MP4, WebM or MOV (max. 2GB)</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {file && (
            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:transform active:scale-[0.98] transition-all"
            >
              Start Uploading to AWS
            </button>
          )}
        </section>

        {/* Video Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Recent Uploads</h2>
            {videos.some(v => v.status === 'PROCESSING') && (
              <span className="flex items-center text-xs font-medium text-blue-500 animate-pulse">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Syncing with Cloud...
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              // 3. SKELETON LOADER
              [1, 2, 3].map((i) => (
                <div key={i} className="p-5 flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              ))
            ) : videos.length > 0 ? (
              videos.map((v) => (
                <div key={v.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{v.title}</span>
                    <span className="text-xs text-slate-400 mt-1">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {v.status === 'READY' || v.status === 'ready' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        READY
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                          PROCESSING
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 italic">
                Your library is empty. Try uploading a video above.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}