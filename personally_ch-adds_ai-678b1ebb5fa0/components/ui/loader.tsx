import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ 
  className, 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}: LoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        <div 
          className={cn(
            'animate-spin rounded-full border-b-2 border-primary mx-auto mb-4',
            sizeClasses[size]
          )}
        />
        {text && <p className="text-gray-600">{text}</p>}
      </div>
    </div>
  );
}
