import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { lazy } from "react";
import Layout from "../Layout";

const Auth = lazy(() => import("@/pages/AuthPages/Auth.tsx"));
const EmailSent = lazy(() => import("@/pages/AuthPages/EmailSent.tsx"));

const EmailVerify = lazy(() => import("@/pages/AuthPages/EmailVerify.tsx"));
const ChangePassword = lazy(
  () => import("@/pages/AuthPages/changePassword.tsx")
);
import TokenizedRoute from "./TokenizedLayout.tsx";

import ProgramaticRoutesLayout from "./ProgramaticRoutesLayout.tsx";


import SuspenseWrapper from "../suspense.tsx";


import Header from "../pages/redu/Header.tsx";
import Chat from "../pages/redu/Chat.tsx";
import Integration from "../pages/redu/Integration.tsx";
import Profile from "../pages/redu/Profile.tsx";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path=""
        element={
          <SuspenseWrapper>
            <Layout />
          </SuspenseWrapper>
        }
      >
        
        <Route
          path="/auth"
          element={
            <SuspenseWrapper>
              

              <Auth />
            </SuspenseWrapper>
          }
        />
      
        <Route
          path="/auth/email-sent"
          element={
            <ProgramaticRoutesLayout>
              <SuspenseWrapper>
                {" "}
                <EmailSent />
              </SuspenseWrapper>
            </ProgramaticRoutesLayout>
          }
        />
        <Route
          path = "/chat"
          element = {
            <>
              <Header />
              <Chat />
            </>
          }
        />
        <Route 
          path = "/integration"
            element = {
              <>
                <Header />
                <Integration />
              </>
              
            }        
        />
        <Route
          path = "/profile"
          element={
            <>
            <Header />
            <Profile />
            </>
          }
        />
        <Route
          path="/auth/verify"
          element={
            <TokenizedRoute>
              <SuspenseWrapper>
                <EmailVerify />
              </SuspenseWrapper>
            </TokenizedRoute>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <TokenizedRoute>
              <SuspenseWrapper>
                <ChangePassword />
              </SuspenseWrapper>
            </TokenizedRoute>
          }
        />
        
      </Route>

     
    </>
  )
);
