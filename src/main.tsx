import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupClientBackEnd } from './clientBackEnd.ts';

// Handle offline or static server fallback seamlessly globally
setupClientBackEnd();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
