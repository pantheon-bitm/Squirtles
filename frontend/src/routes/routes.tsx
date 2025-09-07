import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Layout from "../Layout";
import LandingPage from "../pages/landingPage/main.tsx";
import Auth from "@/pages/AuthPages/Auth.tsx";
import EmailSent from "@/pages/AuthPages/EmailSent.tsx";

import EmailVerify from "@/pages/AuthPages/EmailVerify.tsx";

import ChangePassword from "@/pages/AuthPages/changePassword.tsx";
import TokenizedRoute from "./TokenizedLayout.tsx";
import VerifiedRoute from "./VerifiedLayout.tsx";
import ProgramaticRoutesLayout from "./ProgramaticRoutesLayout.tsx";

import Pay from "@/pages/pricingPages/payment.tsx";
import Pricing from "@/pages/landingPage/pricing.tsx";
import Integrations from "@/pages/integrationPages/integration.tsx";
import Chat from "@/pages/chatPages/Chat.tsx";
import SettingsPage from "@/pages/profileSettingsPage/settings.tsx";






export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="" element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
    
        <Route
          path="/payment"
          element={
            <VerifiedRoute>
              <ProgramaticRoutesLayout>
                <Pay />
              </ProgramaticRoutesLayout>
            </VerifiedRoute>
          }
        />
        <Route path="/auth" element={<Auth />} />

        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/auth/email-sent"
          element={
            <ProgramaticRoutesLayout>
              <EmailSent />
            </ProgramaticRoutesLayout>
          }
        />
        <Route
          path="/auth/verify"
          element={
            <TokenizedRoute>
              <EmailVerify />
            </TokenizedRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <TokenizedRoute>
              <ChangePassword />
            </TokenizedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <Integrations/>
          }
        />
        <Route
          path="/chat"
          element={
            <VerifiedRoute>

                <Chat />

            </VerifiedRoute>
          }
        />
        <Route
        path="/dashboard"
        element={
          <VerifiedRoute>
            <SettingsPage/>
          </VerifiedRoute>
          }
        />
      </Route>


    </>,
  ),
);
