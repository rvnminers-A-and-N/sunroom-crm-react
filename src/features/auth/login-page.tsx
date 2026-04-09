import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@core/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginFormData) {
    setError('');
    login.mutate(data, {
      onSuccess: () => navigate('/dashboard'),
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Login failed';
        setError(message);
      },
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-sr-light-bg px-4">
      <Card className="w-full max-w-[420px] shadow-sm">
        <CardContent className="p-10">
          <div className="text-center mb-8">
            <span className="sr-gradient-bg inline-flex items-center justify-center w-12 h-12 rounded-xl text-white font-bold text-2xl">
              S
            </span>
            <h1 className="text-2xl font-bold text-sr-text mt-4 mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">Sign in to Sunroom CRM</p>
          </div>

          {error && (
            <div className="bg-sr-coral/10 text-sr-coral px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-sr-coral">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-sr-coral">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base mt-2 bg-sr-primary hover:bg-sr-primary-dark"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/auth/register"
              className="text-sr-primary font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
