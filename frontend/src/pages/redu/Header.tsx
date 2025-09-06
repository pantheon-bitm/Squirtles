import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

const Header: FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/integration', label: 'Sources' },
    { path: '/chat', label: 'ChatBot' },
    { path: '/library', label: 'Library' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex lg:ml-0 mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold text-2xl">ReDU</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex flex-1">
          <ul className="flex items-center justify-center space-x-4 lg:space-x-8">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="group relative flex flex-col items-center"
                >
                  <span className={`text-lg font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'text-primary' 
                      : 'text-foreground/60 hover:text-primary'
                  }`}>
                    {item.label}
                  </span>
                  <span 
                    className={`absolute -bottom-[1.5rem] h-[3px] w-full bg-primary transform transition-all duration-300 ${
                      location.pathname === item.path ? 'scale-x-100' : 'scale-x-0'
                    } group-hover:scale-x-100`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account */}
        <div className="ml-auto flex items-center space-x-4 lg:ml-4">
            <Link to="/profile">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>UN</AvatarFallback>
                </Avatar>
            </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
