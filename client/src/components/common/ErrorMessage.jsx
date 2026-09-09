import React from 'react';
import { AlertCircle, AlertTriangle, WifiOff, XCircle, X } from 'lucide-react';

const ERROR_CONFIGS = {
  empty_text: {
    title: "Empty Input",
    message: "Please enter some text before generating speech.",
    icon: AlertCircle,
    color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
  },
  limit_exceeded: {
    title: "Character Limit Exceeded",
    message: "Your text exceeds the maximum character limit of 5,000 characters. Please shorten your text.",
    icon: AlertTriangle,
    color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60",
  },
  generation_failure: {
    title: "Generation Failed",
    message: "We couldn't generate the audio. Please try again.",
    icon: XCircle,
    color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60",
  },
  network_failure: {
    title: "Connection Error",
    message: "Unable to connect to the server. Please check your network connection.",
    icon: WifiOff,
    color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60",
  },
  auth_failure: {
    title: "Request Error",
    message: "Something went wrong while processing your request.",
    icon: AlertCircle,
    color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60",
  }
};

export default function ErrorMessage({ type = "empty_text", customMessage, onDismiss }) {
  const config = ERROR_CONFIGS[type] || ERROR_CONFIGS.empty_text;
  const Icon = config.icon;

  return (
    <div 
      role="alert" 
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${config.color}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold leading-5">{config.title}</h4>
        <p className="text-sm mt-0.5 opacity-90">{customMessage || config.message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-1 -mr-1 -mt-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
