import { RainbowButton } from "@/components/magicui/rainbow-button";
import { FiGithub } from "react-icons/fi";
import { FaStar } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { IoIosArrowRoundForward } from "react-icons/io";
import useUser from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { useApiGet } from "@/hooks/apiHooks";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useUserStore } from "@/store/store";
import ApiRoutes from "@/connectors/api-routes";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function Header() {
  const [stars, setStars] = useState(0);
  const [isBtnHover, setIsBtnHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const repoLink = "https://github.com/kishan-agarwal-28/letshost";
  const repoApiLink = "https://api.github.com/repos/kishan-agarwal-28/letshost";
  const navigate = useNavigate();
  const getGithubStars = useQuery({
    queryKey: ["getGithubStars"],
    queryFn: async () => {
      const response = await axios.get(repoApiLink);
      return response.data.stargazers_count;
    },
    staleTime: 1000 * 60,
    enabled: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    (async () => {
      const stars = await getGithubStars.refetch();
      if (stars.isSuccess) {
        setStars(stars.data);
      }
      if (stars.isError) {
        setStars(0);
      }
    })();
    return () => {};
  }, []);

  const user = useUser();
  const userStore = useUserStore();

  const { toast } = useToast();
  const logout = useApiGet({
    key: ["logout"],
    path: ApiRoutes.logout,
    enabled: false,
  });
  const handleLogout = () => {
    logout.refetch();
  };
  useEffect(() => {
    if (logout.isSuccess) {
      toast({
        title: "Logout Success",
        description: "You have successfully logged out",
        duration: 5000,
        variant: "success",
      });
      userStore.deleteUser();
      navigate("/");
    }
    if (logout.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(logout),
        duration: 5000,
        variant: "error",
      });
    }
    return () => {};
  }, [logout.isSuccess, logout.isError, toast]);
  return (
    <div className="bg-white/5 backdrop-blur-sm shadow-md sticky top-0 w-full z-50">
      <div className="flex flex-wrap items-center justify-between p-4 md:px-12 lg:px-20">
        {/* Logo */}
        <div
          className="text-white text-2xl font-extrabold cursor-pointer"
          onClick={() => navigate("")}
        >
          Memora
        </div>

        {/* Hamburger */}
        <div
          className="md:hidden text-white cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>

        {/* Routes */}
        <ul
          className={`${
            menuOpen ? "block" : "hidden"
          } w-full md:flex md:w-auto md:items-center text-center text-white md:space-x-6 mt-4 md:mt-0 `}
        >
          {["", "/integrations", "/chat"].map((path, idx) => {
            const labels = ["home", "integrations", "chat"];
            return (
              <li key={path} className="py-2 md:py-0">
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `${isActive ? "text-white" : "text-slate-400"} transition-colors duration-200`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {labels[idx]}
                </NavLink>
              </li>
            );
          })}
        </ul>

       
        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-2 px-4">
          {user == null ? (
            <>
              <Button onClick={() => navigate("/auth?mode=login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/auth?mode=signup")}>
                Sign Up <IoIosArrowRoundForward />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate(`/dashboard?uid=${user?._id}`)}>
                Dashboard
              </Button>
              <Button onClick={handleLogout} disabled={logout.isFetching}>
                Logout
              </Button>
              <AvatarCircles
                numPeople={0}
                avatarUrls={[{ imageUrl: user?.avatar }]}
                className="cursor-text"
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile-only auth actions */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
          {user == null ? (
            <>
              <Button onClick={() => navigate("/auth?mode=login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/auth?mode=signup")}>
                Sign Up <IoIosArrowRoundForward />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate(`/dashboard?uid=${user?._id}`)}>
                Dashboard
              </Button>
              <Button onClick={handleLogout} disabled={logout.isFetching}>
                Logout
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Header;
