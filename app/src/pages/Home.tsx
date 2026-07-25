import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (!profile?.onboardingComplete) {
      navigate('/role-select');
    } else {
      navigate(profile.role === 'owner' ? '/owner-dashboard' : '/dashboard');
    }
  }, [isAuthenticated, profile, navigate]);

  return null;
}
