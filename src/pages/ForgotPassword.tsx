import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, generatePassword, canRequestPasswordReset } from '../lib/supabase';
import { Mail, Phone, Key, AlertCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get user by email or phone
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq(method === 'email' ? 'email' : 'phone', method === 'email' ? email : phone)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      const canReset = await canRequestPasswordReset(user.id);
      if (!canReset) {
        throw new Error('You can only request a password reset once per day');
      }

      // Generate new password
      const password = generatePassword();
      setNewPassword(password);

      // Update password and reset count
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_reset_count: 1,
          password_reset_timestamp: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // In a real app, send password via email/SMS
      setSuccess('A new password has been generated. Please use this to log in:');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Login
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setMethod('email')}
            className={`px-4 py-2 rounded-lg ${
              method === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            <Mail className="inline-block mr-2" size={18} />
            Email
          </button>
          <button
            onClick={() => setMethod('phone')}
            className={`px-4 py-2 rounded-lg ${
              method === 'phone' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            <Phone className="inline-block mr-2" size={18} />
            Phone
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
          <div>
            {method === 'email' ? (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone number"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="space-y-4">
              <div className="text-green-600">{success}</div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center">
                <Key className="h-5 w-5 text-gray-400 mr-2" />
                <code className="text-lg font-mono">{newPassword}</code>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Processing...' : 'Reset Password'}
            
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;