import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Search, Eye, Zap, FileSearch, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  branchDepartment: z.string().min(2, 'Branch/Department is required').max(100),
});

export default function Landing() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const accessSectionRef = useRef<HTMLElement>(null);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const scrollToAccess = () => {
    accessSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    username: '', 
    branchDepartment: '' 
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(loginForm);
      const { error } = await signIn(validated.email, validated.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse(signupForm);
      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.username,
        validated.branchDepartment
      );
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered');
        } else {
          toast.error(error.message);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Trace & Rescue</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Missing Person System</p>
            </div>
          </div>
          <Button onClick={scrollToAccess} size="lg">
            Admin Access
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            AI-Powered Technology
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
            Advanced Facial Recognition
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-primary">
            Missing Person System
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Harness the power of artificial intelligence to analyze CCTV footage and identify
            missing persons with unprecedented accuracy and speed.
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button onClick={scrollToAccess} size="lg" className="px-8">
              <Shield className="mr-2 h-5 w-5" />
              Access System
            </Button>
            <Button onClick={scrollToAccess} variant="outline" size="lg" className="px-8">
              <Search className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* System Capabilities */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">System Capabilities</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-border">
              <CardContent className="pt-12 pb-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Facial Recognition</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Advanced AI algorithms analyze facial features from multiple angles and lighting conditions with 99.7% accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-12 pb-8">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <FileSearch className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">CCTV Analysis</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Process thousands of hours of surveillance footage across multiple locations simultaneously.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-12 pb-8">
                <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                  <Bell className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Real-time Alerts</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Instant notifications when matches are detected, enabling rapid response and coordination.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-[hsl(215,35%,10%)] to-[hsl(210,85%,20%)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">99.7%</div>
              <div className="text-sm text-white/80">Recognition Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-white/80">System Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">1000+</div>
              <div className="text-sm text-white/80">Cases Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">&lt;5min</div>
              <div className="text-sm text-white/80">Average Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section ref={accessSectionRef} className="py-20 px-6 bg-muted/30">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Authorized Access</CardTitle>
              <CardDescription>
                This system is designed for law enforcement and authorized organizations only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="officer@department.gov"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="officer@department.gov"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="officer.badge123"
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-branch">Branch / Department</Label>
                      <Input
                        id="signup-branch"
                        type="text"
                        placeholder="Metro Police - Missing Persons Unit"
                        value={signupForm.branchDepartment}
                        onChange={(e) => setSignupForm({ ...signupForm, branchDepartment: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-[hsl(215,35%,10%)] text-white/80">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-white">Trace & Rescue</span>
          </div>
          <p className="text-sm">
            © 2025 Trace & Rescue System. Advanced AI technology for public safety.
          </p>
        </div>
      </footer>
    </div>
  );
}
