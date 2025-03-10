import { User, getCurrentUser } from './authService';
import { toast } from "@/hooks/use-toast";

// Type for online user data
export interface OnlineUser {
  id: number;
  username: string;
  nome: string;
  initials: string;
  lastSeen: Date;
}

// Store the current online users
let onlineUsers: OnlineUser[] = [];
let presenceInterval: ReturnType<typeof setInterval> | null = null;

// API URL based on environment
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost') {
    return 'http://localhost:3005';
  } else if (hostname.includes('lovable.dev') || hostname.includes('lovable.app')) {
    // Para lovable.dev e lovable.app, usar URL completa
    return `${window.location.protocol}//${hostname}`;
  } else {
    // Fallback padrão para outros ambientes
    return '';
  }
};

// Get initials from user name
export const getUserInitials = (name: string): string => {
  if (!name) return '?';
  
  // Split by spaces and get first letter of each word
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // Get first letter of first and last parts
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Update user presence (mark user as online)
export const updatePresence = async (): Promise<void> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    // Verificação para debug
    console.log('Sending presence update to:', `${getApiUrl()}/api/presence/update`);
    
    const response = await fetch(`${getApiUrl()}/api/presence/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: currentUser.id,
        username: currentUser.username,
        nome: currentUser.nome
      }),
    });
    
    // Log para debug da resposta
    console.log('Presence update response status:', response.status);
    
    // Se a resposta não for bem-sucedida, tente ler o conteúdo como texto para debug
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response content:', errorText);
      throw new Error(`Failed to update presence: ${response.status}`);
    }

    // Tente fazer parse da resposta como JSON, com fallback para um objeto simples em caso de erro
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      console.warn('Failed to parse JSON response, using default success object:', e);
      responseData = { success: true };
    }
    console.log('Presence update response:', responseData);
  } catch (error) {
    console.error('Presence update error:', error);
  }
};

// Get all online users
export const getOnlineUsers = async (): Promise<OnlineUser[]> => {
  try {
    // Verificação para debug
    console.log('Fetching online users from:', `${getApiUrl()}/api/presence/users`);
    
    const response = await fetch(`${getApiUrl()}/api/presence/users`);
    
    // Log para debug da resposta
    console.log('Get online users response status:', response.status);
    
    // Se a resposta não for bem-sucedida, tente ler o conteúdo como texto para debug
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response content:', errorText);
      throw new Error(`Failed to get online users: ${response.status}`);
    }
    
    // Tente fazer parse da resposta como JSON, com fallback para um array vazio em caso de erro
    let users;
    try {
      users = await response.json();
      console.log('Get online users response:', users);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      // Se falhar em fazer parse, tente ler como texto para debug
      const responseText = await response.text();
      console.error('Non-JSON response content:', responseText);
      return onlineUsers; // Return cached data on error
    }
    
    onlineUsers = users.map((user: any) => ({
      ...user,
      lastSeen: new Date(user.lastSeen),
      initials: getUserInitials(user.nome)
    }));
    
    return onlineUsers;
  } catch (error) {
    console.error('Get online users error:', error);
    return onlineUsers; // Return cached data on error
  }
};

// Start presence service
export const startPresenceService = (): void => {
  if (presenceInterval) return; // Already running
  
  // Update presence immediately
  updatePresence();
  
  // Set up regular updates
  presenceInterval = setInterval(async () => {
    await updatePresence();
  }, 30000); // Update every 30 seconds
};

// Stop presence service
export const stopPresenceService = (): void => {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
};
