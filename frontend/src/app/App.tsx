import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { WalletProvider } from '../features/wallet/WalletContext';
import { TransactionProvider } from '../features/transactions/TransactionContext';
import { RegistrationProvider } from '../features/registration/RegistrationContext';
import { CandidateProvider } from '../features/candidate-release/CandidateContext';

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <TransactionProvider>
        <RegistrationProvider>
          <CandidateProvider>
            <RouterProvider router={router} />
          </CandidateProvider>
        </RegistrationProvider>
      </TransactionProvider>
    </WalletProvider>
  );
};

export default App;
