"use client";

import React, { useState } from 'react';

interface Video {
  id: number;
  title: string;
  status: 'ready' | 'processing' | 'failed';
  date: string;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([
    { id: 1, title: 'Team Sync - Q3', status: 'ready', date: 'Oct 24, 2026' },
    { id: 2, title: 'Product Demo Recording', status: 'processing', date: 'Oct 25, 2026' },
    { id: 3, title: 'Client Onboarding', status: 'failed', date: 'Oct 25, 2026' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Video Library</h1>
          <p className="text-slate-500 mt-2">Upload and search your video transcripts.</p>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-100 transition-colors cursor-pointer bg-white">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-sm text-slate-500 mt-1">MP4, WebM or MOV (max. 2GB)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {videos.map((video) => (
              <div key={video.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{video.title}</span>
                  <span className="text-sm text-slate-400">{video.date}</span>
                </div>

                <div>
                  {video.status === 'ready' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ready to Search
                    </span>
                  )}
                  {video.status === 'processing' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                      Processing Transcript...
                    </span>
                  )}
                  {video.status === 'failed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Processing Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}