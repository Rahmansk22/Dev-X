import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { BackButton } from '@/components/back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* 404 Text */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-transparent bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text animate-pulse">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-400">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="flex justify-center gap-2">
          <div className="w-1 h-12 bg-linear-to-b from-blue-400 to-transparent rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-1 h-12 bg-linear-to-b from-purple-400 to-transparent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-12 bg-linear-to-b from-blue-400 to-transparent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2 h-11">
              <Home className="w-5 h-5" />
              Go Home
            </Button>
          </Link>
          <BackButton />
        </div>

        {/* Additional Info */}
        <div className="text-sm text-slate-500 pt-4">
          <p>
            Need help?{' '}
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
