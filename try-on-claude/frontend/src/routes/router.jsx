import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/MainLayout.jsx';
import GuestRoute from './GuestRoute.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';

const router = createBrowserRouter([
  {
    Component: MainLayout,
    children: [
      { index: true, Component: LandingPage },
      {
        Component: GuestRoute,
        children: [
          { path: 'login', Component: LoginPage },
          { path: 'register', Component: RegisterPage },
        ],
      },
      {
        Component: ProtectedRoute,
        children: [{ path: 'profile', Component: ProfilePage }],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export default router;
