import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { initializeNotifications } from '../lib/notifications';
import { Bell, Globe, Award, History, Send } from 'lucide-react';

interface LoginHistory {
  browser: string;
  os: string;
  device_type: string;
  ip_address: string;
  login_time: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [points, setPoints] = useState(0);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
      loadLoginHistory();
      checkNotificationStatus();
    }
  }, [user]);

  const loadUserData = async () => {
    const { data: userData } = await supabase
      .from('users')
      .select('points, preferred_language')
      .eq('id', user.id)
      .single();

    if (userData) {
      setPoints(userData.points);
      setLanguage(userData.preferred_language);
    }
  };

  const loadLoginHistory = async () => {
    const { data: history } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('login_time', { ascending: false });

    if (history) {
      setLoginHistory(history);
    }
  };

  const checkNotificationStatus = async () => {
    const permission = await Notification.permission;
    setNotificationsEnabled(permission === 'granted');
  };

  const handleNotificationToggle = async () => {
    const enabled = await initializeNotifications();
    setNotificationsEnabled(enabled);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      // In a real app, implement OTP verification here
      await setLanguage(newLanguage);
      await supabase
        .from('users')
        .update({ preferred_language: newLanguage })
        .eq('id', user.id);
      setSuccess('Language updated successfully');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handlePointTransfer = async () => {
    try {
      if (points < 10) {
        throw new Error('You need at least 10 points to transfer');
      }

      const amount = parseInt(transferAmount);
      if (amount > points) {
        throw new Error('Insufficient points');
      }

      const { data: recipient } = await supabase
        .from('users')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      await supabase.from('points_transfer').insert({
        from_user_id: user.id,
        to_user_id: recipient.id,
        points: amount,
      });

      setSuccess('Points transferred successfully');
      loadUserData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-blue-500 mr-2" />
                <span>Notifications</span>
              </div>
              <button
                onClick={handleNotificationToggle}
                className={`px-4 py-2 rounded ${
                  notificationsEnabled
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-blue-500 mr-2" />
                <span>Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="hi">Hindi</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-blue-500 mr-2" />
                <span>Points: {points}</span>
              </div>
              {points >= 10 && (
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Recipient email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Amount to transfer"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <button
                    onClick={handlePointTransfer}
                    className="w-full bg-blue-500 text-white py-2 rounded flex items-center justify-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Transfer Points
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <History className="h-6 w-6 text-blue-500 mr-2" />
                <span>Login History</span>
              </div>
              <div className="space-y-2">
                {loginHistory.map((login, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <div className="text-sm">
                      <p>Device: {login.device_type}</p>
                      <p>Browser: {login.browser}</p>
                      <p>OS: {login.os}</p>
                      <p className="text-gray-500">
                        {new Date(login.login_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        {success && (
          <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;