import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const ALLOWED_IMAGE_HOSTNAMES = [
    'placehold.co',
    'epocacosmeticos.vteximg.com.br',
    'a-static.mlcdn.com.br',
    'm.media-amazon.com',
    'res.cloudinary.com',
    'http2.mlstatic.com',
];


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function isValidImageUrl(string: string | null | undefined): boolean {
    if (!string) return false;
    try {
        const url = new URL(string);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false;
        }
        // Check if the hostname is in the allowed list
        return ALLOWED_IMAGE_HOSTNAMES.includes(url.hostname);
    } catch (_) {
        return false;
    }
}

export function isValidHttpUrl(str: string | null | undefined): boolean {
    if (typeof str !== 'string' || !str) {
        return false;
    }
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

    