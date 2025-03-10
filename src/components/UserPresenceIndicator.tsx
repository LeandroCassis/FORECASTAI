import React, { useState, useEffect } from 'react';
import { OnlineUser, getOnlineUsers, getUserInitials } from '@/services/presenceService';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from 'lucide-react';
const UserPresenceIndicator: React.FC = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const {
    user
  } = useAuth();
  useEffect(() => {
    // Fetch online users initially
    const fetchOnlineUsers = async () => {
      const users = await getOnlineUsers();
      setOnlineUsers(users);
    };
    fetchOnlineUsers();

    // Set up polling to refresh the list
    const interval = setInterval(fetchOnlineUsers, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);
  if (!user) return null;

  // Filter out current user from the display list
  const otherUsers = onlineUsers.filter(onlineUser => onlineUser.id !== user.id);

  // If no other users are online, show a minimal indicator
  if (otherUsers.length === 0) {
    return <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-gray-400 text-sm">
                <Users size={16} className="mr-1" />
                <span>Só você trabalhando agora!
              </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nenhum outro usuário conectado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>;
  }

  // Display up to 5 user circles directly, others in count
  const displayLimit = 5;
  const displayUsers = otherUsers.slice(0, displayLimit);
  const remainingCount = otherUsers.length - displayLimit;
  return <div className="flex items-center">
      <div className="flex -space-x-2 mr-2">
        {displayUsers.map(onlineUser => <TooltipProvider key={onlineUser.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white">
                  {onlineUser.initials}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{onlineUser.nome}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>)}
        
        {remainingCount > 0 && <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>+{remainingCount} outros usuários online</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}
      </div>
      <span className="text-gray-600 text-sm">{otherUsers.length + 1} online</span>
    </div>;
};
export default UserPresenceIndicator;