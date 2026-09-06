import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authApiClient from '../lib/auth-api-client';

// TypeScript types
export interface User {
  userId: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Create context with undefined (will be provided by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const jwtToken = localStorage.getItem('auth.access_token');
      const userDataStr = localStorage.getItem('auth.user_info');

      if (jwtToken && userDataStr) {
        const user: User = JSON.parse(userDataStr);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Login function - calls backend API and updates local state
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authApiClient.post('/login', credentials);
      
      const { accessToken, refreshToken, user: userData } = response.data.data;

      // Store tokens and user info
      localStorage.setItem('auth.access_token', accessToken);
      localStorage.setItem('auth.refresh_token', refreshToken);
      localStorage.setItem('auth.user_info', JSON.stringify(userData));

      // Update state
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 423) {
        throw new Error('Account locked, please try again later');
      } else {
        throw new Error('Network error, please try again');
      }
    }
  };

  // Logout function - invalidates refresh token and clears local state
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('auth.refresh_token');
      if (refreshToken) {
        await authApiClient.post('/logout', {});
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Clear local storage and state regardless of API success/failure
      localStorage.removeItem('auth.access_token');
      localStorage.removeItem('auth.refresh_token');
      localStorage.removeItem('auth.user_info');
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Refresh access token function
  const refreshToken = async (): Promise<void> => {
    try {
      const currentRefreshToken = localStorage.getItem('auth.refresh_token');
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApiClient.post('/refresh', {
        refreshToken: currentRefreshToken,
      });

      const { accessToken } = response.data.data;

      // Update stored access token
      localStorage.setItem('auth.access_token', accessToken);
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, force logout
      if (error.response?.status === 401) {
        await logout();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
