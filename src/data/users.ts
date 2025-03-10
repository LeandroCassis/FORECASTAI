
/**
 * Local users data file
 * This replaces database authentication to avoid server response issues
 */

export interface LocalUser {
  id: number;
  username: string;
  nome: string;
  role: string;
  password: string;  // Note: In a real app, passwords should never be stored in plain text
}

// Local users database
export const users: LocalUser[] = [
  { id: 1, username: 'admin', password: 'admin', nome: 'Administrador', role: 'admin' },
  { id: 2, username: 'rogerio.bousas', password: 'Rogerio123', nome: 'Rogério Bousas', role: 'user' },
  { id: 3, username: 'marco.bousas', password: 'Marco123', nome: 'Marco Bousas', role: 'user' },
  { id: 4, username: 'sulamita.nascimento', password: 'Sulamita123', nome: 'Sulamita Nascimento', role: 'user' },
  { id: 5, username: 'elisangela.tavares', password: 'Elisangela123', nome: 'Elisangela Tavares', role: 'user' },
  { id: 6, username: 'pedro.hoffmann', password: 'Pedro123', nome: 'Pedro Hoffmann', role: 'user' },
  { id: 7, username: 'guilherme.maia', password: 'Guilherme123', nome: 'Guilherme Maia', role: 'user' }
];

// Helper function to find a user by credentials
export const findUserByCredentials = (username: string, password: string): LocalUser | undefined => {
  return users.find(user => 
    user.username.toLowerCase() === username.toLowerCase() && 
    user.password === password
  );
};

// Helper function to find a user by ID
export const findUserById = (id: number): LocalUser | undefined => {
  return users.find(user => user.id === id);
};
