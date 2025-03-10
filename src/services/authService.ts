
import { toast } from "@/hooks/use-toast";
import { findUserByCredentials } from "@/data/users";

export interface User {
  id: number;
  username: string;
  nome: string;
  role: string;
}

// Local authentication using the users data file
export const loginUser = async (username: string, password: string): Promise<User> => {
  try {
    console.log('Attempting login with username:', username);
    
    // Simulate network delay for a more realistic experience
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = findUserByCredentials(username, password);
    
    if (!user) {
      const errorMessage = 'Nome de usuário ou senha inválidos';
      console.error('Login failed:', errorMessage);
      toast({ 
        title: 'Erro no login', 
        description: errorMessage,
        variant: 'destructive'
      });
      throw new Error(errorMessage);
    }
    
    // Create a user object without the password field for security
    const userData: User = {
      id: user.id,
      username: user.username,
      nome: user.nome,
      role: user.role
    };
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('Login process error:', error);
    toast({ 
      title: 'Erro no login', 
      description: (error as Error).message || 'Falha na autenticação',
      variant: 'destructive'
    });
    throw error;
  }
};

// Check if a user is authenticated
export const isAuthenticated = (): boolean => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return false;
    
    const user = JSON.parse(userJson);
    return Boolean(user && user.id && user.username);
  } catch {
    return false;
  }
};

// Get the current authenticated user
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    if (!user || !user.id || !user.username) {
      localStorage.removeItem('user');
      return null;
    }
    
    return user;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

// Logout function
export const logoutUser = (): void => {
  localStorage.removeItem('user');
  // Redirect to login page if needed
  window.location.href = '/login';
};
