import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { ConnectWalletModal } from '../ui/ConnectWalletModal';
import { WrongNetworkModal } from '../ui/WrongNetworkModal';
import { TransactionConfirmationModal } from '../transactions/TransactionConfirmationModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream text-brand-charcoal selection:bg-brand-pastelYellow selection:text-brand-charcoal">
      <AppHeader />
      <main className="flex-grow flex flex-col w-full">
        <Outlet />
      </main>
      <AppFooter />

      {/* Global Modals */}
      <ConnectWalletModal />
      <WrongNetworkModal />
      <TransactionConfirmationModal />
    </div>
  );
};
