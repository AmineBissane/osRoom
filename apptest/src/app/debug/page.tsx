'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash } from 'lucide-react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug');
      if (response.ok) {
        const text = await response.text();
        setLogs(text);
      } else {
        setError(`Failed to fetch logs: ${response.status} ${response.statusText}`);
        console.error('Failed to fetch logs:', response.status, response.statusText);
      }
    } catch (error) {
      setError(`Error fetching logs: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    setLoading(true);
    try {
      await fetch('/api/debug', { method: 'DELETE' });
      setLogs('');
    } catch (error) {
      console.error('Error clearing logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh logs every 3 seconds when enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Fetch logs on first load
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Debug Logs
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-green-100" : ""}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchLogs} 
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={clearLogs} 
                disabled={loading}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto max-h-[70vh]">
            {loading ? (
              <p>Loading logs...</p>
            ) : error ? (
              <p>{error}</p>
            ) : logs ? (
              <pre>{logs}</pre>
            ) : (
              <p>No logs available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 