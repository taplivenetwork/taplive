import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TranslatedText } from "@/components/translated-text";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Bell, Shield, Globe, Camera, Save, MapPin, Wifi, Smartphone, UserCheck, ShoppingCart, CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function Settings() {
  const { currentLanguage, setCurrentLanguage } = useTranslation();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  
  // Use Clerk user ID
  const CURRENT_USER_ID = user?.id || "guest";
  
  // User mode state
  const [userMode, setUserMode] = useState<'customer' | 'provider'>('customer');
  
  // Profile form state
  const [profile, setProfile] = useState({
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    bio: 'Passionate content creator and live streaming enthusiast. Love exploring new places and sharing experiences with the world!',
    // Provider-specific fields
    currentLatitude: 40.7128,
    currentLongitude: -74.0060,
    availableRadius: 10,
    networkSpeed: 50,
    devicePerformance: 85,
    deviceName: 'iPhone 14 Pro',
    availability: true,
    walletAddress: '',
    // Preferences
    timezone: 'America/New_York',
    notifyNewOrders: true,
    notifyMessages: true,
    notifyUpdates: true,
    notifyPromotions: false,
    // Privacy settings
    profileVisibility: true,
    locationSharing: true,
  });

  // Fetch user data
  const { data: userData, isLoading } = useQuery({
    queryKey: [`/api/users/${CURRENT_USER_ID}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${CURRENT_USER_ID}`);
      const data = await response.json();
      return data;
    },
    retry: false,
    enabled: CURRENT_USER_ID !== 'guest',
  });

  // Update profile from fetched data
  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      // Sync user role from database
      setUserMode(user.role === 'provider' ? 'provider' : 'customer');
      
      setProfile({
        name: user.name || 'Sarah Chen',
        email: user.email || 'sarah.chen@example.com',
        bio: user.bio || 'Passionate content creator and live streaming enthusiast.',
        currentLatitude: parseFloat(user.currentLatitude || '40.7128'),
        currentLongitude: parseFloat(user.currentLongitude || '-74.0060'),
        availableRadius: user.availableRadius || 10,
        networkSpeed: parseFloat(user.networkSpeed || '50'),
        devicePerformance: parseFloat(user.devicePerformance || '85'),
        deviceName: user.deviceName || 'iPhone 14 Pro',
        availability: user.availability !== false,
        walletAddress: user.walletAddress || '',
        timezone: user.timezone || 'America/New_York',
        notifyNewOrders: user.notifyNewOrders !== false,
        notifyMessages: user.notifyMessages !== false,
        notifyUpdates: user.notifyUpdates !== false,
        notifyPromotions: user.notifyPromotions === true,
        profileVisibility: user.profileVisibility !== false,
        locationSharing: user.locationSharing !== false,
      });
    }
  }, [userData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest('PATCH', `/api/users/${CURRENT_USER_ID}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${CURRENT_USER_ID}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (role: 'customer' | 'provider') => {
      return await apiRequest('PATCH', `/api/users/${CURRENT_USER_ID}`, { role });
    },
    onSuccess: (_, role) => {
      toast({
        title: "Role Updated",
        description: `You are now in ${role} mode.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${CURRENT_USER_ID}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
      // Revert the UI change on error
      if (userData?.data?.role) {
        setUserMode(userData.data.role === 'provider' ? 'provider' : 'customer');
      }
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      return await apiRequest('POST', `/api/users/${CURRENT_USER_ID}/location`, {
        latitude,
        longitude,
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Your service location has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Location Update Failed",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

  // Update network metrics mutation
  const updateNetworkMutation = useMutation({
    mutationFn: async ({ networkSpeed, devicePerformance }: { networkSpeed: number; devicePerformance: number }) => {
      return await apiRequest('POST', `/api/users/${CURRENT_USER_ID}/network-metrics`, {
        networkSpeed,
        devicePerformance,
      });
    },
    onSuccess: () => {
      toast({
        title: "Network Metrics Updated",
        description: "Your device and network information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update network metrics",
        variant: "destructive",
      });
    },
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availability: boolean) => {
      return await apiRequest('PATCH', `/api/users/${CURRENT_USER_ID}`, {
        availability,
      });
    },
    onSuccess: (_, availability) => {
      toast({
        title: "Availability Updated",
        description: `You are now ${availability ? 'available' : 'unavailable'} for orders.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${CURRENT_USER_ID}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  // Stripe Connect status query
  const { data: stripeConnectStatus, isLoading: isLoadingStripeStatus, refetch: refetchStripeStatus } = useQuery({
    queryKey: [`/api/stripe/connect/status/${CURRENT_USER_ID}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stripe/connect/status/${CURRENT_USER_ID}`);
      const data = await response.json();
      return data;
    },
    enabled: CURRENT_USER_ID !== 'guest' && userMode === 'provider',
  });

  // Create Stripe Connect account link mutation
  const createStripeConnectLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/connect/create-account-link', {
        userId: CURRENT_USER_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Stripe Connect response:', data);
      if (data.success && data.data?.url) {
        console.log('🔗 Redirecting to:', data.data.url);
        // Redirect to Stripe Connect onboarding
        window.location.href = data.data.url;
      } else {
        // Handle specific error cases
        if (data.error === 'STRIPE_CONNECT_NOT_ENABLED') {
          toast({
            title: "Setup In Progress",
            description: "Payment system is being configured. Please try again later.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to create Stripe Connect link",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Stripe",
        variant: "destructive",
      });
    },
  });

  // Create Stripe dashboard link mutation
  const createStripeDashboardLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/connect/dashboard-link', {
        userId: CURRENT_USER_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.url) {
        // Open Stripe dashboard in new tab
        window.open(data.data.url, '_blank');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to open Stripe dashboard",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    },
  });

  // Disconnect Stripe account mutation
  const disconnectStripeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/connect/disconnect', {
        userId: CURRENT_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Your Stripe account has been disconnected.",
      });
      refetchStripeStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect Stripe account",
        variant: "destructive",
      });
    },
  });

  // Handle URL parameters for Stripe Connect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connected') === 'true') {
      toast({
        title: "Stripe Connected!",
        description: "Your Stripe account has been successfully connected.",
      });
      refetchStripeStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('stripe_refresh') === 'true') {
      toast({
        title: "Connection Incomplete",
        description: "Please complete your Stripe onboarding to receive payouts.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: profile.name,
      email: profile.email,
      bio: profile.bio,
      walletAddress: profile.walletAddress,
    });
  };

  const handleSaveProviderSettings = () => {
    updateProfileMutation.mutate({
      currentLatitude: profile.currentLatitude.toString(),
      currentLongitude: profile.currentLongitude.toString(),
      availableRadius: profile.availableRadius,
      networkSpeed: profile.networkSpeed.toString(),
      devicePerformance: profile.devicePerformance.toString(),
      deviceName: profile.deviceName,
    });
  };

  const handleAvailabilityToggle = (checked: boolean) => {
    setProfile({ ...profile, availability: checked });
    updateAvailabilityMutation.mutate(checked);
  };

  const handleRoleChange = (newRole: 'customer' | 'provider') => {
    setUserMode(newRole);
    updateRoleMutation.mutate(newRole);
  };

  const handleNotificationToggle = (key: 'notifyNewOrders' | 'notifyMessages' | 'notifyUpdates' | 'notifyPromotions', value: boolean) => {
    const updatedProfile = { ...profile, [key]: value };
    setProfile(updatedProfile);
    updateProfileMutation.mutate({ [key]: value });
  };

  const handleTimezoneChange = (timezone: string) => {
    setProfile({ ...profile, timezone });
    updateProfileMutation.mutate({ timezone });
  };

  const handlePrivacyToggle = (key: 'profileVisibility' | 'locationSharing', value: boolean) => {
    const updatedProfile = { ...profile, [key]: value };
    setProfile(updatedProfile);
    updateProfileMutation.mutate({ [key]: value });
  };

  const handleChangePassword = () => {
    toast({
      title: "Change Password",
      description: "Password change functionality will be implemented soon.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Delete Account",
      description: "Account deletion requires confirmation. Contact support.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            <TranslatedText context="settings">Settings</TranslatedText>
          </h1>
          <p className="text-slate-600 text-lg">
            <TranslatedText context="settings">Manage your account preferences and streaming settings</TranslatedText>
          </p>
        </div>

        <div className="space-y-6">
          {/* User Mode Toggle */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <TranslatedText context="settings">Account Mode</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Switch between Customer and Provider modes</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`h-28 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                    userMode === 'customer'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  onClick={() => handleRoleChange('customer')}
                  disabled={updateRoleMutation.isPending || CURRENT_USER_ID === 'guest'}
                >
                  <ShoppingCart className="w-7 h-7" />
                  <div className="text-center">
                    <div className="font-semibold text-base"><TranslatedText context="settings">Customer</TranslatedText></div>
                    <div className="text-xs opacity-90"><TranslatedText context="settings">Order streams</TranslatedText></div>
                  </div>
                </button>
                
                <button
                  className={`h-28 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                    userMode === 'provider'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  onClick={() => handleRoleChange('provider')}
                  disabled={updateRoleMutation.isPending || CURRENT_USER_ID === 'guest'}
                >
                  <Camera className="w-7 h-7" />
                  <div className="text-center">
                    <div className="font-semibold text-base"><TranslatedText context="settings">Provider</TranslatedText></div>
                    <div className="text-xs opacity-90"><TranslatedText context="settings">Provide streams</TranslatedText></div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <TranslatedText context="settings">Profile Settings</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Update your personal information and profile details</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  <TranslatedText context="settings">Full Name</TranslatedText>
                </Label>
                <Input 
                  id="name" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  <TranslatedText context="settings">Email</TranslatedText>
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
                  <TranslatedText context="settings">Bio</TranslatedText>
                </Label>
                <Textarea 
                  id="bio" 
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wallet" className="text-sm font-medium text-slate-700">
                  <TranslatedText context="settings">Crypto Wallet Address</TranslatedText>
                </Label>
                <Input 
                  id="wallet" 
                  placeholder="0x... or bc1..."
                  value={profile.walletAddress}
                  onChange={(e) => setProfile({ ...profile, walletAddress: e.target.value })}
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  <TranslatedText context="settings">For crypto payments and payouts</TranslatedText>
                </p>
              </div>
              
              <Button 
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30" 
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? (
                  <TranslatedText context="settings">Saving...</TranslatedText>
                ) : (
                  <TranslatedText context="settings">Save Profile</TranslatedText>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Provider-Specific Settings */}
          {userMode === 'provider' && (
            <>
              {/* Service Location Settings */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <TranslatedText context="settings">Service Location</TranslatedText>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    <TranslatedText context="settings">Set your livestream availability location and service radius</TranslatedText>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-slate-700">
                        <TranslatedText context="settings">Latitude</TranslatedText>
                      </Label>
                      <Input 
                        id="latitude" 
                        type="number"
                        step="0.0001"
                        value={profile.currentLatitude}
                        onChange={(e) => setProfile({ ...profile, currentLatitude: parseFloat(e.target.value) || 0 })}
                        className="border-slate-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-slate-700">
                        <TranslatedText context="settings">Longitude</TranslatedText>
                      </Label>
                      <Input 
                        id="longitude" 
                        type="number"
                        step="0.0001"
                        value={profile.currentLongitude}
                        onChange={(e) => setProfile({ ...profile, currentLongitude: parseFloat(e.target.value) || 0 })}
                        className="border-slate-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="radius" className="text-sm font-medium text-slate-700">
                      <TranslatedText context="settings">Service Radius (km)</TranslatedText>
                    </Label>
                    <Input 
                      id="radius" 
                      type="number"
                      min="1"
                      max="100"
                      value={profile.availableRadius}
                      onChange={(e) => setProfile({ ...profile, availableRadius: parseInt(e.target.value) || 10 })}
                      className="border-slate-200 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-slate-500">
                      <TranslatedText context="settings">Maximum distance you can travel for orders</TranslatedText>
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <p className="text-sm text-slate-900">
                      <strong><TranslatedText context="settings">Current Location:</TranslatedText></strong>{' '}
                      {profile.currentLatitude.toFixed(4)}, {profile.currentLongitude.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Orders within {profile.availableRadius}km will be visible to you
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Device & Network Settings */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-orange-600" />
                    </div>
                    <TranslatedText context="settings">Device & Network</TranslatedText>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    <TranslatedText context="settings">Configure your device details and network performance</TranslatedText>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="deviceName" className="text-sm font-medium text-slate-700">
                      <TranslatedText context="settings">Device Name</TranslatedText>
                    </Label>
                    <Input 
                      id="deviceName" 
                      placeholder="e.g., iPhone 14 Pro, Samsung Galaxy S23"
                      value={profile.deviceName}
                      onChange={(e) => setProfile({ ...profile, deviceName: e.target.value })}
                      className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="networkSpeed" className="text-sm font-medium text-slate-700">
                      <TranslatedText context="settings">Network Speed (Mbps)</TranslatedText>
                    </Label>
                    <Input 
                      id="networkSpeed" 
                      type="number"
                      min="0"
                      max="1000"
                      value={profile.networkSpeed}
                      onChange={(e) => setProfile({ ...profile, networkSpeed: parseFloat(e.target.value) || 0 })}
                      className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500">
                      <TranslatedText context="settings">Your internet upload speed (minimum 5 Mbps recommended)</TranslatedText>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="devicePerformance" className="text-sm font-medium text-slate-700">
                      <TranslatedText context="settings">Device Performance (0-100)</TranslatedText>
                    </Label>
                    <Input 
                      id="devicePerformance" 
                      type="number"
                      min="0"
                      max="100"
                      value={profile.devicePerformance}
                      onChange={(e) => setProfile({ ...profile, devicePerformance: parseFloat(e.target.value) || 0 })}
                      className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500">
                      <TranslatedText context="settings">Device capability score (higher = better video quality)</TranslatedText>
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-slate-900">
                        <TranslatedText context="settings">Available for Orders</TranslatedText>
                      </Label>
                      <p className="text-sm text-slate-600">
                        <TranslatedText context="settings">Toggle your availability to receive orders</TranslatedText>
                      </p>
                    </div>
                    <Switch 
                      checked={profile.availability}
                      onCheckedChange={handleAvailabilityToggle}
                      disabled={updateAvailabilityMutation.isPending}
                    />
                  </div>
                  
                  <Button 
                    className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30" 
                    onClick={handleSaveProviderSettings}
                    disabled={updateLocationMutation.isPending || updateNetworkMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {(updateLocationMutation.isPending || updateNetworkMutation.isPending) ? (
                      <TranslatedText context="settings">Saving...</TranslatedText>
                    ) : (
                      <TranslatedText context="settings">Save Provider Settings</TranslatedText>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Stripe Connect - Payment Settings */}
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <TranslatedText context="settings">Payment Settings</TranslatedText>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    <TranslatedText context="settings">Connect your Stripe account to receive payouts for completed orders</TranslatedText>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isLoadingStripeStatus ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="ml-2 text-slate-600">Loading payment settings...</span>
                    </div>
                  ) : stripeConnectStatus?.data?.isConnected ? (
                    <>
                      {/* Connected State */}
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-800">Stripe Account Connected</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your Stripe account is connected and ready to receive payouts.
                            </p>
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className={`w-2 h-2 rounded-full ${stripeConnectStatus.data.chargesEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-slate-700">
                                  Charges: {stripeConnectStatus.data.chargesEnabled ? 'Enabled' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className={`w-2 h-2 rounded-full ${stripeConnectStatus.data.payoutsEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-slate-700">
                                  Payouts: {stripeConnectStatus.data.payoutsEnabled ? 'Enabled' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions for connected account */}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="border-purple-200 hover:bg-purple-50 text-purple-700"
                          onClick={() => createStripeDashboardLinkMutation.mutate()}
                          disabled={createStripeDashboardLinkMutation.isPending}
                        >
                          {createStripeDashboardLinkMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          <TranslatedText context="settings">Stripe Dashboard</TranslatedText>
                        </Button>
                        
                        {!stripeConnectStatus.data.detailsSubmitted && (
                          <Button
                            variant="outline"
                            className="border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                            onClick={() => createStripeConnectLinkMutation.mutate()}
                            disabled={createStripeConnectLinkMutation.isPending}
                          >
                            {createStripeConnectLinkMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mr-2" />
                            )}
                            <TranslatedText context="settings">Complete Setup</TranslatedText>
                          </Button>
                        )}
                        
                        {/* DEV ONLY: Force verify test account */}
                        {process.env.NODE_ENV === 'development' && !stripeConnectStatus.data.chargesEnabled && (
                          <Button
                            variant="outline"
                            className="border-orange-200 hover:bg-orange-50 text-orange-700"
                            onClick={async () => {
                              try {
                                const response = await apiRequest('POST', `/api/stripe/connect/test-verify/${CURRENT_USER_ID}`);
                                const data = await response.json();
                                if (data.success) {
                                  toast({
                                    title: "✅ Test Account Verified",
                                    description: "Charges and payouts enabled for testing!",
                                  });
                                  refetchStripeStatus();
                                } else {
                                  toast({
                                    title: "Error",
                                    description: data.message || "Failed to verify test account",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to verify test account",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            🔧 [DEV] Force Verify Test Account
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => disconnectStripeMutation.mutate()}
                          disabled={disconnectStripeMutation.isPending}
                        >
                          {disconnectStripeMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          <TranslatedText context="settings">Disconnect</TranslatedText>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Not Connected State */}
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">Stripe Account Not Connected</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Connect your Stripe account to receive payouts when you complete streaming orders. 
                              You'll earn 90% of each order amount (10% platform fee).
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2 text-purple-800">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Instant Payouts</span>
                          </div>
                          <p className="text-xs text-purple-600 mt-1">Get paid as soon as orders are completed</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2 text-purple-800">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Secure Transfers</span>
                          </div>
                          <p className="text-xs text-purple-600 mt-1">Bank-level security with Stripe</p>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                        onClick={() => createStripeConnectLinkMutation.mutate()}
                        disabled={createStripeConnectLinkMutation.isPending}
                      >
                        {createStripeConnectLinkMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <TranslatedText context="settings">Connecting...</TranslatedText>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            <TranslatedText context="settings">Connect Stripe Account</TranslatedText>
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-slate-500 text-center">
                        By connecting, you agree to Stripe's Terms of Service and will be redirected to complete setup.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Streaming Settings */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Camera className="w-5 h-5 text-pink-600" />
                </div>
                <TranslatedText context="settings">Streaming Settings</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Configure your default streaming preferences</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDuration">
                    <TranslatedText context="settings">Default Stream Duration</TranslatedText>
                  </Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 <TranslatedText context="settings">min</TranslatedText></SelectItem>
                      <SelectItem value="30">30 <TranslatedText context="settings">min</TranslatedText></SelectItem>
                      <SelectItem value="45">45 <TranslatedText context="settings">min</TranslatedText></SelectItem>
                      <SelectItem value="60">60 <TranslatedText context="settings">min</TranslatedText></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultCategory">
                    <TranslatedText context="settings">Default Category</TranslatedText>
                  </Label>
                  <Select defaultValue="travel">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel"><TranslatedText context="settings">Travel</TranslatedText></SelectItem>
                      <SelectItem value="food"><TranslatedText context="settings">Food</TranslatedText></SelectItem>
                      <SelectItem value="music"><TranslatedText context="settings">Music</TranslatedText></SelectItem>
                      <SelectItem value="events"><TranslatedText context="settings">Events</TranslatedText></SelectItem>
                      <SelectItem value="fitness"><TranslatedText context="settings">Fitness</TranslatedText></SelectItem>
                      <SelectItem value="education"><TranslatedText context="settings">Education</TranslatedText></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Auto-start recording</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Automatically record all your streams</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">HD Quality</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Stream in high definition (uses more data)</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <TranslatedText context="settings">Notifications</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Choose what notifications you want to receive</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">New Order Alerts</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Get notified when someone places a new order</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.notifyNewOrders}
                  onCheckedChange={(checked) => handleNotificationToggle('notifyNewOrders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Message Notifications</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Get notified about new messages</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.notifyMessages}
                  onCheckedChange={(checked) => handleNotificationToggle('notifyMessages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Platform Updates</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Get notified about platform updates and features</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.notifyUpdates}
                  onCheckedChange={(checked) => handleNotificationToggle('notifyUpdates', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Promotional Emails</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Receive promotional offers and updates</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.notifyPromotions}
                  onCheckedChange={(checked) => handleNotificationToggle('notifyPromotions', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Globe className="w-5 h-5 text-indigo-600" />
                </div>
                <TranslatedText context="settings">Language & Region</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Set your language and regional preferences</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  <TranslatedText context="settings">Language / 语言</TranslatedText>
                </Label>
                <LanguageSelector 
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  className="w-full md:w-64"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  <TranslatedText context="settings">Timezone</TranslatedText>
                </Label>
                <Select 
                  value={profile.timezone} 
                  onValueChange={handleTimezoneChange}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York"><TranslatedText context="settings">Eastern Time (ET)</TranslatedText></SelectItem>
                    <SelectItem value="America/Chicago"><TranslatedText context="settings">Central Time (CT)</TranslatedText></SelectItem>
                    <SelectItem value="America/Denver"><TranslatedText context="settings">Mountain Time (MT)</TranslatedText></SelectItem>
                    <SelectItem value="America/Los_Angeles"><TranslatedText context="settings">Pacific Time (PT)</TranslatedText></SelectItem>
                    <SelectItem value="Europe/London"><TranslatedText context="settings">London (GMT)</TranslatedText></SelectItem>
                    <SelectItem value="Europe/Paris"><TranslatedText context="settings">Paris (CET)</TranslatedText></SelectItem>
                    <SelectItem value="Asia/Tokyo"><TranslatedText context="settings">Tokyo (JST)</TranslatedText></SelectItem>
                    <SelectItem value="Asia/Shanghai"><TranslatedText context="settings">Shanghai (CST)</TranslatedText></SelectItem>
                    <SelectItem value="Australia/Sydney"><TranslatedText context="settings">Sydney (AEDT)</TranslatedText></SelectItem>
                    <SelectItem value="UTC"><TranslatedText context="settings">UTC</TranslatedText></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <TranslatedText context="settings">Privacy & Security</TranslatedText>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <TranslatedText context="settings">Manage your privacy settings and account security</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    <TranslatedText context="settings">Profile Visibility</TranslatedText>
                  </Label>
                  <p className="text-sm text-slate-600">
                    <TranslatedText context="settings">Make your profile visible to other users</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.profileVisibility}
                  onCheckedChange={(checked) => handlePrivacyToggle('profileVisibility', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-slate-900">
                    <TranslatedText context="settings">Location Sharing</TranslatedText>
                  </Label>
                  <p className="text-sm text-slate-600">
                    <TranslatedText context="settings">Allow sharing your location during streams</TranslatedText>
                  </p>
                </div>
                <Switch 
                  checked={profile.locationSharing}
                  onCheckedChange={(checked) => handlePrivacyToggle('locationSharing', checked)}
                />
              </div>
              
              <div className="pt-2 space-y-3">
                <Button variant="outline" className="w-full md:w-auto border-slate-200 hover:bg-slate-50 text-slate-700" onClick={handleChangePassword}>
                  <TranslatedText context="settings">Change Password</TranslatedText>
                </Button>
              
                <Button variant="outline" className="w-full md:w-auto border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700" onClick={handleDeleteAccount}>
                  <TranslatedText context="settings">Delete Account</TranslatedText>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}