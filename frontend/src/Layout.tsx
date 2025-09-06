// import { ModeToggle } from './components/mode-toggle'
import { ThemeProvider } from "./components/ui/theme-provider";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
// import Header from "./pages/landingPage/header";
import { lazy, useEffect } from "react";
import { useUserStore } from "./store/store";
// const Footer = lazy(() => import("@/pages/landingPage/footer"));
import { useApiGet } from "./hooks/apiHooks";
import ApiRoutes from "./connectors/api-routes";

function Layout() {
  const userStore = useUserStore();
  const user = useApiGet({
    key: ["getUser"],
    path: ApiRoutes.getUserDetails,
    enabled: true,
  });
  useEffect(() => {
    (async () => {
      if (user.isSuccess) {
        await userStore.updateUser(user.data?.data.data);
      }
    })();

    return () => {};
  }, [user.dataUpdatedAt]);

  
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* <ModeToggle /> */}
      <Toaster/>
      <Outlet />

    </ThemeProvider>
  );
}

export default Layout;
