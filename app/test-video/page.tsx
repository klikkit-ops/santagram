'use client';

import { useState } from 'react';

interface TestResult {
    success?: boolean;
    orderId?: string;
    predictionId?: string;
    audioUrl?: string;
    script?: string;
    message?: string;
    error?: string;
    details?: string;
}

interface StatusResult {
    status: string;
    video_url?: string;
    error?: string;
}

export default function TestVideoPage() {
    const [formData, setFormData] = useState({
        childName: 'Emma',
        childAge: 7,
        childGender: 'girl',
        achievements: 'learning to read and helping with chores',
        interests: 'unicorns and painting',
        specialMessage: '',
        messageType: 'christmas-morning',
        email: 'test@example.com',
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [statusResult, setStatusResult] = useState<StatusResult | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setStatusResult(null);

        try {
            const response = await fetch('/api/test-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: 'Request failed', details: String(error) });
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        if (!result?.orderId) return;
        setStatusLoading(true);

        try {
            const response = await fetch(`/api/video-status?orderId=${result.orderId}`);
            const data = await response.json();
            setStatusResult(data);
        } catch (error) {
            setStatusResult({ status: 'error', error: String(error) });
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-yellow-400">🧪 Video Generation Test</h1>
                <p className="text-gray-400 mb-8">This page bypasses payment to test the video generation flow.</p>

                <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Child Name</label>
                            <input
                                type="text"
                                value={formData.childName}
                                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Age</label>
                            <input
                                type="number"
                                value={formData.childAge}
                                onChange={(e) => setFormData({ ...formData, childAge: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Gender</label>
                            <select
                                value={formData.childGender}
                                onChange={(e) => setFormData({ ...formData, childGender: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            >
                                <option value="boy">Boy</option>
                                <option value="girl">Girl</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Message Type</label>
                            <select
                                value={formData.messageType}
                                onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            >
                                <option value="christmas-morning">Christmas Morning</option>
                                <option value="bedtime">Bedtime</option>
                                <option value="encouragement">Encouragement</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Achievements</label>
                        <input
                            type="text"
                            value={formData.achievements}
                            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                            className="w-full bg-gray-700 rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Interests</label>
                        <input
                            type="text"
                            value={formData.interests}
                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                            className="w-full bg-gray-700 rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Email (for delivery)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-700 rounded px-3 py-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-lg font-bold"
                    >
                        {loading ? '⏳ Generating...' : '🚀 Start Video Generation'}
                    </button>
                </form>

                {result && (
                    <div className={`mt-6 p-4 rounded-xl ${result.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                        <h2 className="font-bold mb-2">{result.success ? '✅ Success' : '❌ Error'}</h2>
                        {result.success ? (
                            <div className="space-y-2 text-sm">
                                <p><strong>Order ID:</strong> {result.orderId}</p>
                                <p><strong>Prediction ID:</strong> {result.predictionId}</p>
                                <p><strong>Audio URL:</strong> <a href={result.audioUrl} target="_blank" className="text-blue-400 underline">Listen</a></p>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-gray-400">View Script</summary>
                                    <p className="mt-2 p-2 bg-gray-800 rounded text-xs">{result.script}</p>
                                </details>

                                <button
                                    onClick={checkStatus}
                                    disabled={statusLoading}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-bold"
                                >
                                    {statusLoading ? '⏳ Checking...' : '🔄 Check Video Status'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p>{result.error}</p>
                                {result.details && <p className="text-sm text-gray-400 mt-1">{result.details}</p>}
                            </div>
                        )}
                    </div>
                )}

                {statusResult && (
                    <div className={`mt-4 p-4 rounded-xl ${statusResult.status === 'completed' ? 'bg-green-900/50' : statusResult.status === 'failed' ? 'bg-red-900/50' : 'bg-yellow-900/50'}`}>
                        <h3 className="font-bold mb-2">Video Status: {statusResult.status}</h3>
                        {statusResult.video_url && (
                            <div>
                                <p className="mb-2">🎉 Video ready!</p>
                                <a href={statusResult.video_url} target="_blank" className="text-blue-400 underline">Download Video</a>
                                <video src={statusResult.video_url} controls className="mt-4 rounded-lg w-full" />
                            </div>
                        )}
                        {statusResult.error && <p className="text-red-400">{statusResult.error}</p>}
                        {(statusResult.status === 'processing' || statusResult.status === 'starting') && (
                            <p className="text-yellow-400">Video is still being generated. Check again in a minute.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
