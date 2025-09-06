import type { FC } from 'react';
import { Card } from '../../components/ui/card';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { FaGoogleDrive } from "react-icons/fa";
import { FaSlack } from "react-icons/fa";
import { SiGooglemeet } from "react-icons/si";
import { FaGithub } from "react-icons/fa";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected?: boolean;
}

const IntegrationCard: FC<IntegrationCardProps> = ({ title, description, icon, isConnected = false }) => {
  return (
    <Card className="relative p-6 transition-all hover:shadow-lg mt-16">
      {/* Options Menu */}
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <MoreVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              {isConnected ? 'Disconnect' : 'Connect'}
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="rounded-lg bg-primary/10 p-2">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`flex h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-muted'
          } mr-2`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>
    </Card>
  );
};

const Integration: FC = () => {
  const integrations = [
    {
      title: 'Google Drive',
      description: 'Connect your Google Drive to sync files',
      icon: (
        <FaGoogleDrive />
      ),
      isConnected: true
    },
    {
      title: 'GitHub',
      description: 'Sync your repositories and code',
      icon: (
        <FaGithub />
      ),
      isConnected: true
    },
    {
      title: 'Slack',
      description: 'Connect with your workspace channels',
      icon: (
        <FaSlack />
      ),
      isConnected: false
    },
    {
      title: 'Gmail',
      description: 'Integrate with video conferencing',
      icon: (
        <SiGooglemeet />
      ),
      isConnected: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {integrations.map((integration, index) => (
          <IntegrationCard
            key={index}
            title={integration.title}
            description={integration.description}
            icon={integration.icon}
            isConnected={integration.isConnected}
          />
        ))}
      </div>
    </div>
  );
};

export default Integration;
