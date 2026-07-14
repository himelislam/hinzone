import type { JSX } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthProvider';
import AppRoutes from '@/routes/AppRoutes';

const App = (): JSX.Element => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
