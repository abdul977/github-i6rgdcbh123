import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    return {
      valid: pwd.length >= minLength && 
             hasUppercase && 
             hasLowercase && 
             hasNumber && 
             hasSpecialChar,
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
    };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Basic validation
      if (!email || !password) {
        toast({
          title: 'Error',
          description: 'Please enter email and password',
          variant: 'destructive'
        });
        return;
      }

      // Password strength validation
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        toast({
          title: 'Weak Password',
          description: passwordValidation.message,
          variant: 'destructive'
        });
        return;
      }

      const { error } = await signUp(email, password);

      if (error) {
        toast({
          title: 'Registration Failed',
          description: error.message || 'An error occurred during registration',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Registration Successful',
          description: 'Welcome to Whimsical Idea Keeper!',
          variant: 'default'
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Create Account
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
          />
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
