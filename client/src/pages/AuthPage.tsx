import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, register, user, error, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      return;
    }

    let success = false;
    if (activeTab === 'login') {
      success = await login(username, password);
    } else {
      success = await register(username, password);
    }

    if (success) {
      navigate('/admin');
    } else if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-5xl w-full mx-auto grid gap-6 md:grid-cols-2 items-center">
        <div className="flex flex-col justify-center p-6 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Ella AI Admin</h1>
          <p className="text-muted-foreground">
            The Ella AI administration portal gives you full control over your AI assistant's configuration, 
            performance analytics, and customer interaction history.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <p className="font-medium">Full conversation history and analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <p className="font-medium">Persona and voice customization</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <p className="font-medium">Advanced sales intelligence reporting</p>
            </div>
          </div>
        </div>
        
        <Card className="max-w-md w-full mx-auto">
          <CardHeader>
            <CardTitle>Admin Portal</CardTitle>
            <CardDescription>
              Sign in to access your administrative dashboard
            </CardDescription>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mx-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <CardContent className="space-y-4 pt-6">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Back to Home
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Register'}
              </Button>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}