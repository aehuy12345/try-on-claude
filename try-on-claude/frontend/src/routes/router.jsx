import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/MainLayout.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const router = createBrowserRouter([
  {
    Component: MainLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export default router;
