
import React, { useState } from 'react';
import LandingPage from './screens/LandingPage';
import CheckoutPage from './screens/CheckoutPage';
import WaiverPage from './screens/WaiverPage';
import ConfirmationPage from './screens/ConfirmationPage';
import AdminDashboard from './screens/AdminDashboard';
import AdminSchedule from './screens/AdminSchedule';
import AdminLogin from './screens/AdminLogin';
import AdminPayouts from './screens/AdminPayouts';
import { ScreenType, Booking, CourtType } from './types';

const ADMIN_EMAIL = 'damon@theboombase.com';

import { api } from './src/api';

// ... (other imports)

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(ScreenType.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Fetch bookings on load
  React.useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const [currentBookingDraft, setCurrentBookingDraft] = useState<Partial<Booking>>({
    courtType: 'Full Court',
    price: 150
  });

  const navigateTo = (screen: ScreenType) => {
    const adminScreens = [
      ScreenType.ADMIN_DASHBOARD,
      ScreenType.ADMIN_SCHEDULE,
      ScreenType.ADMIN_PAYOUTS
    ];

    if (adminScreens.includes(screen) && !isAuthenticated) {
      setCurrentScreen(ScreenType.ADMIN_LOGIN);
    } else {
      setCurrentScreen(screen);
    }
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      setCurrentScreen(ScreenType.ADMIN_DASHBOARD);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen(ScreenType.LANDING);
  };

  const startBooking = (court: CourtType, price: number, time: string, duration: number) => {
    setCurrentBookingDraft({
      ...currentBookingDraft,
      courtType: court,
      price,
      time,
      date: new Date().toISOString().split('T')[0]
    });
    navigateTo(ScreenType.CHECKOUT);
  };

  const handlePayment = (details: { name: string, email: string }) => {
    setCurrentBookingDraft({ ...currentBookingDraft, ...details });
    navigateTo(ScreenType.WAIVER);
  };

  const finalizeBooking = async (waiverDetails?: { waiverName: string, waiverSignature: string }) => {
    try {
      const { booking } = await api.createBooking({
        ...currentBookingDraft,
        ...waiverDetails,
        status: 'Pending Approval', // API default is Pending Payment, but logic can vary
        waiverSigned: true,
      });

      // Refresh bookings
      await loadBookings();
      navigateTo(ScreenType.CONFIRMATION);
    } catch (e) {
      console.error("Booking failed", e);
      alert("Booking failed to ensure. Please try again.");
    }
  };

  const updateBookingStatus = async (id: string, newStatus: Booking['status']) => {
    try {
      await api.updateBookingStatus(id, newStatus);
      loadBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case ScreenType.LANDING:
        return <LandingPage onBookNow={startBooking} onAdminClick={() => navigateTo(ScreenType.ADMIN_DASHBOARD)} />;
      case ScreenType.ADMIN_LOGIN:
        return <AdminLogin onLoginSuccess={handleAdminLogin} onCancel={() => setCurrentScreen(ScreenType.LANDING)} />;
      case ScreenType.CHECKOUT:
        return <CheckoutPage
          booking={currentBookingDraft}
          onConfirm={handlePayment}
          onBack={() => navigateTo(ScreenType.LANDING)}
        />;
      case ScreenType.WAIVER:
        return <WaiverPage onContinue={finalizeBooking} onCancel={() => navigateTo(ScreenType.CHECKOUT)} />;
      case ScreenType.CONFIRMATION:
        return <ConfirmationPage onGoHome={() => navigateTo(ScreenType.LANDING)} />;
      case ScreenType.ADMIN_DASHBOARD:
        return <AdminDashboard
          bookings={bookings}
          adminEmail={ADMIN_EMAIL}
          onUpdateStatus={updateBookingStatus}
          onNavigateToSchedule={() => navigateTo(ScreenType.ADMIN_SCHEDULE)}
          onNavigateToPayouts={() => navigateTo(ScreenType.ADMIN_PAYOUTS)}
          onExit={handleLogout}
        />;
      case ScreenType.ADMIN_SCHEDULE:
        return <AdminSchedule
          onNavigateToDashboard={() => navigateTo(ScreenType.ADMIN_DASHBOARD)}
          onNavigateToPayouts={() => navigateTo(ScreenType.ADMIN_PAYOUTS)}
          onExit={handleLogout}
        />;
      case ScreenType.ADMIN_PAYOUTS:
        return <AdminPayouts
          onNavigateToDashboard={() => navigateTo(ScreenType.ADMIN_DASHBOARD)}
          onNavigateToSchedule={() => navigateTo(ScreenType.ADMIN_SCHEDULE)}
          adminEmail={ADMIN_EMAIL}
          onExit={handleLogout}
        />;
      default:
        return <LandingPage onBookNow={startBooking} onAdminClick={() => navigateTo(ScreenType.ADMIN_DASHBOARD)} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
};

export default App;
