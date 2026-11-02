import { createBrowserRouter } from 'react-router';
import MainLayout from '../layouts/MainLayout.jsx';
import GuestRoute from './GuestRoute.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProfilePlaceholderPage from '../pages/ProfilePlaceholderPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';

const router = createBrowserRouter([
  {
    Component: MainLayout,
    children: [
      { index: true, Component: LandingPage },
      { Component: GuestRoute, children: [{ path: 'register', Component: RegisterPage }] },
      { path: 'profile', Component: ProfilePlaceholderPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);

export default router;
