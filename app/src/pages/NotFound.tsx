import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import StateEmpty from '@/components/StateEmpty';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4 page-transition">
      <StateEmpty
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <>
            <button onClick={() => navigate(-1)} className="btn-outline flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <button onClick={() => navigate('/')} className="btn-fire flex items-center gap-2 text-sm">
              <Home className="w-4 h-4" /> Home
            </button>
          </>
        }
      />
    </div>
  );
}
