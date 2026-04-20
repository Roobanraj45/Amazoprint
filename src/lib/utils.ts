import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImagePath(path?: string): string {
  if (!path) return '';

  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }

  if (path.includes('/public/')) {
    return path.split('/public')[1];
  }

  return path.startsWith('/') ? path : `/${path}`;
}
