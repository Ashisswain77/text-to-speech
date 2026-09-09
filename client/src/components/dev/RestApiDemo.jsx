import React, { useState } from 'react';
import { restTestApi, ApiError } from '../../services/api';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  WifiOff, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Code2
} from 'lucide-react';

/**
 * REST API Demonstration Component (Day 6 Development Testing)
 * 
 * Demonstrates:
 * - GET request -> JSON parsing -> React state -> Rendered output
 * - POST request with Content-Type: application/json -> Echo response -> React state
 * - HTTP 404 error handling
 * - Network failure handling
 * - Clean loading, success, and error indicators
 * 
 * NOTE: This is strictly isolated from the real TTS workflow.
 */
export default function RestApiDemo({
  sampleText = 'Hello from Vocalis',
  currentLanguage = 'en-US',
  currentVoice = 'sarah',
}) {
  const [activeRequest, setActiveRequest] = useState(null); // 'get' | 'post' | 'http_err' | 'net_err'
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [responseData, setResponseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [requestMeta, setRequestMeta] = useState(null);

  // 1. Run GET demonstration
  const handleTestGet = async () => {
    setActiveRequest('get');
    setStatus('loading');
    setErrorMessage(null);
    setResponseData(null);
    setRequestMeta({
      method: 'GET',
      endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: { 'Accept': 'application/json' },
      body: null,
    });

    try {
      const data = await restTestApi.demonstrateGet(1);
      setResponseData(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  // 2. Run POST demonstration with JSON body
  const handleTestPost = async () => {
    setActiveRequest('post');
    setStatus('loading');
    setErrorMessage(null);
    setResponseData(null);

    const payload = {
      text: sampleText.trim() || 'Hello from Vocalis',
      language: currentLanguage,
      voice: currentVoice,
      timestamp: new Date().toISOString(),
    };

    setRequestMeta({
      method: 'POST',
      endpoint: 'https://jsonplaceholder.typicode.com/posts',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: payload,
    });

    try {
      const data = await restTestApi.demonstratePost(payload);
      setResponseData(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  // 3. Run HTTP Error demonstration (404)
  const handleTestHttpError = async () => {
    setActiveRequest('http_err');
    setStatus('loading');
    setErrorMessage(null);
    setResponseData(null);
    setRequestMeta({
      method: 'GET',
      endpoint: 'https://jsonplaceholder.typicode.com/posts/99999999',
      headers: { 'Accept': 'application/json' },
      body: null,
    });

    try {
      const data = await restTestApi.demonstrateHttpError();
      setResponseData(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      const isHttp = err instanceof ApiError && err.status;
      setErrorMessage(
        isHttp 
          ? `HTTP ${err.status} (${err.statusText}): The requested resource was not found.`
          : err.message
      );
    }
  };

  // 4. Run Network Error demonstration
  const handleTestNetworkError = async () => {
    setActiveRequest('net_err');
    setStatus('loading');
    setErrorMessage(null);
    setResponseData(null);
    setRequestMeta({
      method: 'GET',
      endpoint: 'https://invalid-nonexistent-domain-rest-test-xyz.example/api',
      headers: { 'Accept': 'application/json' },
      body: null,
    });

    try {
      const data = await restTestApi.demonstrateNetworkError();
      setResponseData(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  const handleReset = () => {
    setActiveRequest(null);
    setStatus('idle');
    setResponseData(null);
    setErrorMessage(null);
    setRequestMeta(null);
  };

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Day 6 Frontend REST Testing:
          </span>
          <span className="text-[11px] text-slate-300">
            Isolated fetch() demonstrations (No backend required)
          </span>
        </div>
        {status !== 'idle' && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={handleTestGet}
          disabled={status === 'loading'}
          className={`px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
            activeRequest === 'get'
              ? 'bg-blue-600/30 border-blue-500/60 text-blue-200'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold block text-[11px]">1. Test GET</span>
            <span className="text-[10px] text-slate-400 truncate block">Receive & render JSON</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleTestPost}
          disabled={status === 'loading'}
          className={`px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
            activeRequest === 'post'
              ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold block text-[11px]">2. Test POST</span>
            <span className="text-[10px] text-slate-400 truncate block">application/json body</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleTestHttpError}
          disabled={status === 'loading'}
          className={`px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
            activeRequest === 'http_err'
              ? 'bg-amber-600/30 border-amber-500/60 text-amber-200'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold block text-[11px]">3. Test HTTP Error</span>
            <span className="text-[10px] text-slate-400 truncate block">Simulate 404 error</span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleTestNetworkError}
          disabled={status === 'loading'}
          className={`px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
            activeRequest === 'net_err'
              ? 'bg-rose-600/30 border-rose-500/60 text-rose-200'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold block text-[11px]">4. Test Network Error</span>
            <span className="text-[10px] text-slate-400 truncate block">Simulate offline failure</span>
          </div>
        </button>
      </div>

      {/* Execution / Response Viewer */}
      {status !== 'idle' && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
              {status === 'loading' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-[11px] animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
              {status === 'success' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  Success (HTTP 200/201)
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-semibold text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  Error
                </span>
              )}
            </div>

            {requestMeta && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {requestMeta.method}
              </span>
            )}
          </div>

          {/* Request Endpoint details */}
          {requestMeta && (
            <div className="text-[11px] font-mono text-slate-400 truncate bg-black/40 px-2 py-1 rounded border border-slate-800/80">
              {requestMeta.endpoint}
            </div>
          )}

          {/* Error Banner */}
          {status === 'error' && errorMessage && (
            <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-200 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="break-words">
                <span className="font-semibold block">Error Details:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* JSON Payload Sent (if POST) */}
          {requestMeta?.body && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Code2 className="w-3 h-3 text-slate-400" />
                Outgoing JSON Body:
              </span>
              <pre className="p-2 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-24">
                {JSON.stringify(requestMeta.body, null, 2)}
              </pre>
            </div>
          )}

          {/* JSON Response Received */}
          {status === 'success' && responseData && (
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Code2 className="w-3 h-3 text-emerald-400" />
                Parsed Response JSON (Stored in State):
              </span>
              <pre className="p-2 rounded bg-black/60 border border-emerald-900/40 text-[10px] font-mono text-emerald-200/90 overflow-x-auto max-h-36">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
