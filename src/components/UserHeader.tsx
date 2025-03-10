
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, LogOut } from 'lucide-react';
import UserPresenceIndicator from './UserPresenceIndicator';

const UserHeader: React.FC = () => {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="flex items-center space-x-4 text-sm">
      <UserPresenceIndicator />
      
      <div className="flex items-center space-x-1 border rounded-full px-3 py-1 bg-white/90">
        <UserIcon className="h-4 w-4 text-gray-500" />
        <span>{user.nome}</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={logout} 
        className="text-gray-600 hover:text-red-600"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sair
      </Button>
    </div>
  );
};

export default UserHeader;
