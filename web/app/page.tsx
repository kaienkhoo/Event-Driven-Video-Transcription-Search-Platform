"use client";

import React, { useState, useEffect, useRef } from 'react';

interface Video {
  id: string;
  title: string;
  status: 'ready' | 'processing' | 'failed' | 'PROCESSING' | 'READY'; // Added PROCESSING to match your backend
  date?: string;
  createdAt: string;
  transcript?: string;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/upload');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      v.title.toLowerCase().includes(searchLower) || (v.transcript && v.transcript.toLowerCase().includes(searchLower))
    );
  })

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
    if (!file) return;


    const tempId = `temp-${Date.now()}`;
    const optimisticVideo: Video = {
      id: tempId,
      title: file.name,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };

    setVideos((prev) => [optimisticVideo, ...prev]);
    setFile(null);

    try {
      const response = await fetch('/api/upload', {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        })
      });

      const data = await response.json();


      setVideos((prev) =>
        prev.map((v) => v.id === tempId ? data.video : v)
      );

      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!uploadResponse.ok) throw new Error("S3 Upload Failed");

      alert("Upload started successfully!");

    } catch (e) {
      console.error("Upload error:", e);
      setVideos((prev) => prev.filter((v) => v.id !== tempId));
      alert("Upload failed. Please try again.");
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

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by title or transcript content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-4 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
          />
        </div>

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
              [1, 2, 3].map((i) => (
                <div key={i} className="p-5 flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              ))
            ) : filteredVideos.length > 0 ? (
              filteredVideos.map((v) => (
                <div
                  key={v.id}
                  onClick={() => v.status === 'READY' && setSelectedVideo(v)}
                  className={`p-5 flex items-center justify-between transition-all ${v.status === 'READY'
                    ? 'cursor-pointer hover:bg-blue-50 hover:shadow-inner'
                    : 'cursor-not-allowed opacity-75'
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{v.title}</span>
                    <span className="text-xs text-slate-400 mt-1">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${v.status === 'READY'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                      {v.status}
                    </span>
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

      {/* TRANSCRIPT MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVideo.title}</h2>
                <p className="text-sm text-slate-500">AI-Generated Transcript</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {selectedVideo.transcript ? (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedVideo.transcript}
                </p>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 italic">No transcript found for this video.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 rounded-b-3xl flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedVideo.transcript || "");
                  alert("Copied to clipboard!");
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Copy Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}