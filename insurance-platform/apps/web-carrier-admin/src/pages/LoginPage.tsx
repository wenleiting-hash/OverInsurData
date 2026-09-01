import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple login - will be integrated with API later
    localStorage.setItem('jwt', 'dummy-jwt-token');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="glass-light p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">{t('login.title', 'Login')}</h1>
        <p className="text-slate-600 text-center mb-6">{t('login.subtitle', 'Welcome back to the platform')}</p>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline">Contact admin</a>
        </div>
      </div>
    </div>
  );
}
