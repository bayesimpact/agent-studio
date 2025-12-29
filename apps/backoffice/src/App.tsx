import { Toaster } from './components/Sonner';
import { useInitApi } from './hooks/use-init-api';
import { Router } from './routes/Router';


function App() {
  useInitApi();
  return (
    <>
      <Toaster />
      <Router />
    </>
  );
}

export default App;
