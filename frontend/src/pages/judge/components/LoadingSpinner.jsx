import { USALoader } from '../../../components/ui';

// Judge loading indicator — reuses the system's own loader (USALoader) so the
// whole app spins with the same branded spinner instead of a one-off circle.
export default function LoadingSpinner({ fullScreen = false, prompt = 'Building interface…' }) {
  return <USALoader fullScreen={fullScreen} prompt={prompt} background="transparent" />;
}