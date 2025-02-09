import { createRoot } from 'react-dom/client'
import { Header } from './views/components/header.tsx';
import { Router } from './route/index.tsx'

createRoot(document.getElementById('root')!).render(
  <>
    <Header />
    <Router />
  </>
);