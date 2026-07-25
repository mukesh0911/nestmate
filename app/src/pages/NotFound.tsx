import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-fire/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-display italic font-bold text-fire">404</span>
        </div>
        <h1 className="text-2xl font-display italic mb-2">Page not found</h1>
        <p className="text-sm text-ink/60 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-outline flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button onClick={() => navigate('/')} className="btn-fire flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
