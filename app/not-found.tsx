import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-[#C8A96E] font-serif text-6xl mb-2">404</div>
          <h1 className="text-[#1A1814] font-serif text-3xl mb-4">
            This threshold leads nowhere
          </h1>
          <p className="text-[#6B6456] text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#1A1814] text-[#F7F5F1] px-8 py-3 font-serif text-sm tracking-widest uppercase hover:bg-[#C8A96E] hover:text-[#1A1814] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="border border-[#1A1814] text-[#1A1814] px-8 py-3 font-serif text-sm tracking-widest uppercase hover:bg-[#1A1814] hover:text-[#F7F5F1] transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
