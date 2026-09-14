import './index.css'
import AppRoutes from './routes/AppRoutes';
import { ConfigChangeProvider } from './context/ConfigChangeContext';

export default function App() {
  return (
    <ConfigChangeProvider>
      <AppRoutes />
    </ConfigChangeProvider>
  );
}