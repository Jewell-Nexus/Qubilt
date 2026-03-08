import { Outlet } from 'react-router-dom';
import WikiSidebar from '../components/WikiSidebar';

export default function WikiLayout() {
  return (
    <div className="flex h-full">
      <WikiSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
