import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { RegistryPage } from '../pages/RegistryPage';
import { PackageDetailPage } from '../pages/PackageDetailPage';
import { LivePackageDetailPage } from '../pages/LivePackageDetailPage';
import { RegisterStep1Page } from '../pages/RegisterStep1Page';
import { RegisterStep2Page } from '../pages/RegisterStep2Page';
import { RegisterStep3Page } from '../pages/RegisterStep3Page';
import { RegisterStep4Page } from '../pages/RegisterStep4Page';
import { RegisterSuccessPage } from '../pages/RegisterSuccessPage';
import { CandidateStep1Page } from '../pages/CandidateStep1Page';
import { CandidateStep2Page } from '../pages/CandidateStep2Page';
import { CandidateStep3Page } from '../pages/CandidateStep3Page';
import { LiveCandidateWizardLayout } from '../pages/LiveCandidateWizardLayout';
import { LiveCandidateStep1Page } from '../pages/LiveCandidateStep1Page';
import { LiveCandidateStep2Page } from '../pages/LiveCandidateStep2Page';
import { LiveCandidateStep3Page } from '../pages/LiveCandidateStep3Page';
import { LiveCandidateDetailPage } from '../pages/LiveCandidateDetailPage';
import { ReviewTrackerPage } from '../pages/ReviewTrackerPage';
import { DecisionApprovedPage } from '../pages/DecisionApprovedPage';
import { DecisionReviewRequiredPage } from '../pages/DecisionReviewRequiredPage';
import { DecisionViolationPage } from '../pages/DecisionViolationPage';
import { DecisionUnavailablePage } from '../pages/DecisionUnavailablePage';
import { VerificationPage } from '../pages/VerificationPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ActivityFeedPage } from '../pages/ActivityFeedPage';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'registry',
        element: <RegistryPage />
      },
      {
        path: 'packages/:publisher/:packageSlug/releases/new',
        element: <LiveCandidateWizardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="identity" replace />
          },
          {
            path: 'identity',
            element: <LiveCandidateStep1Page />
          },
          {
            path: 'evidence',
            element: <LiveCandidateStep2Page />
          },
          {
            path: 'confirm',
            element: <LiveCandidateStep3Page />
          }
        ]
      },
      {
        path: 'packages/:publisher/:packageSlug/candidates/:version',
        element: <LiveCandidateDetailPage />
      },
      {
        path: 'packages/:publisher/:packageSlug',
        element: <LivePackageDetailPage />
      },
      {
        path: 'packages/atlas-research-agent',
        element: <PackageDetailPage />
      },
      {
        path: 'packages/:packageId',
        element: <PackageDetailPage />
      },
      {
        path: 'register',
        children: [
          {
            index: true,
            element: <Navigate to="/register/identity" replace />
          },
          {
            path: 'identity',
            element: <RegisterStep1Page />
          },
          {
            path: 'baseline',
            element: <RegisterStep2Page />
          },
          {
            path: 'capabilities',
            element: <RegisterStep3Page />
          },
          {
            path: 'review',
            element: <RegisterStep4Page />
          },
          {
            path: 'success',
            element: <RegisterSuccessPage />
          }
        ]
      },
      {
        path: 'packages/:packageId/releases/new',
        children: [
          {
            index: true,
            element: <Navigate to="identity" replace />
          },
          {
            path: 'identity',
            element: <CandidateStep1Page />
          },
          {
            path: 'evidence',
            element: <CandidateStep2Page />
          },
          {
            path: 'confirm',
            element: <CandidateStep3Page />
          }
        ]
      },
      {
        path: 'reviews/review-atlas-150',
        element: <ReviewTrackerPage />
      },
      {
        path: 'reviews/:reviewId',
        element: <ReviewTrackerPage />
      },
      {
        path: 'decisions',
        children: [
          {
            index: true,
            element: <Navigate to="/decisions/approved" replace />
          },
          {
            path: 'approved',
            element: <DecisionApprovedPage />
          },
          {
            path: 'review-required',
            element: <DecisionReviewRequiredPage />
          },
          {
            path: 'capability-violation',
            element: <DecisionViolationPage />
          },
          {
            path: 'evidence-unavailable',
            element: <DecisionUnavailablePage />
          }
        ]
      },
      {
        path: 'verify',
        element: <VerificationPage />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'activity',
        element: <ActivityFeedPage />
      },
      {
        path: 'how-it-works',
        element: <HowItWorksPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);
