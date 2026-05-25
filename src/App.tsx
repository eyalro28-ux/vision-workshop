import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import ParticipantForm from './views/ParticipantForm';
import AdminDashboard from './views/AdminDashboard';
import VisionResult from './views/VisionResult';
import SubmissionsView from './views/SubmissionsView';

export type Route = 'form' | 'admin' | 'result' | 'submissions';

function getRoute(): Route {
  const p = window.location.pathname;
  if (p.startsWith('/submissions')) return 'submissions';
  if (p.startsWith('/admin')) return 'admin';
  if (p.startsWith('/result')) return 'result';
  return 'form';
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute());

  const navigate = (to: Route) => {
    const path = to === 'form' ? '/' : `/${to}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(to);
  };

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div dir="rtl" lang="he" className="min-h-screen">
      <AnimatePresence mode="wait">
        {route === 'form' && <ParticipantForm key="form" />}
        {route === 'admin' && <AdminDashboard key="admin" navigate={navigate} />}
        {route === 'result' && <VisionResult key="result" navigate={navigate} />}
        {route === 'submissions' && <SubmissionsView key="submissions" navigate={navigate} />}
      </AnimatePresence>
    </div>
  );
}
