import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 tekens zijn'),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const onSubmit = async (data: AuthForm) => {
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        toast.success('Welkom terug!');
        navigate('/');
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) throw error;
        toast.success('Account aangemaakt! U bent nu ingelogd.');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Ongeldige inloggegevens');
      } else if (error.message?.includes('User already registered')) {
        toast.error('Dit e-mailadres is al geregistreerd');
      } else {
        toast.error(error.message || 'Er ging iets mis');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mx-auto mb-4">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            {isLogin ? 'Inloggen' : 'Account Aanmaken'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? 'Log in om uw bestellingen te bekijken'
              : 'Maak een account aan om te bestellen'}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="uw@email.nl"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLogin ? 'Inloggen' : 'Account Aanmaken'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin
                ? 'Nog geen account? Registreer hier'
                : 'Al een account? Log hier in'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
