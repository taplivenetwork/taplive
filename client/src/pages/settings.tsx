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
import { User, Bell, Shield, Globe, Camera, Save } from "lucide-react";

export default function Settings() {
  const { currentLanguage, setCurrentLanguage } = useTranslation();
  // Remove the incorrect hook usage

  const handleSaveProfile = () => {
    // TODO: Implement save profile functionality
    console.log('Save profile clicked');
  };

  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    console.log('Change password clicked');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement delete account functionality
    console.log('Delete account clicked');
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <TranslatedText context="settings">Settings</TranslatedText>
          </h1>
          <p className="text-muted-foreground">
            <TranslatedText context="settings">Manage your account preferences and streaming settings</TranslatedText>
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="solid-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <TranslatedText context="settings">Profile Settings</TranslatedText>
              </CardTitle>
              <CardDescription>
                <TranslatedText context="settings">Update your personal information and profile details</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    <TranslatedText context="settings">First Name</TranslatedText>
                  </Label>
                  <Input id="firstName" defaultValue="Sarah" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    <TranslatedText context="settings">Last Name</TranslatedText>
                  </Label>
                  <Input id="lastName" defaultValue="Chen" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  <TranslatedText context="settings">Email</TranslatedText>
                </Label>
                <Input id="email" type="email" defaultValue="sarah.chen@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">
                  <TranslatedText context="settings">Bio</TranslatedText>
                </Label>
                <Textarea 
                  id="bio" 
                  placeholder={placeholderText}
                  value={bioText}
                  onChange={() => {}} // Read-only for demo purposes
                  rows={3}
                  key={currentLanguage} // Force re-render when language changes
                />
              </div>
              
              <Button className="w-full md:w-auto" onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                <TranslatedText context="settings">Save Profile</TranslatedText>
              </Button>
            </CardContent>
          </Card>

          {/* Streaming Settings */}
          <Card className="solid-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <TranslatedText context="settings">Streaming Settings</TranslatedText>
              </CardTitle>
              <CardDescription>
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
          <Card className="solid-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <TranslatedText context="settings">Notifications</TranslatedText>
              </CardTitle>
              <CardDescription>
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
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Stream Reminders</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Remind you before scheduled streams</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Payment Notifications</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Get notified when you receive payments</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Marketing Emails</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Receive tips and updates about the platform</TranslatedText>
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card className="solid-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <TranslatedText context="settings">Language & Region</TranslatedText>
              </CardTitle>
              <CardDescription>
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
                <Select defaultValue="pst">
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst"><TranslatedText context="settings">Pacific Standard Time (PST)</TranslatedText></SelectItem>
                    <SelectItem value="mst"><TranslatedText context="settings">Mountain Standard Time (MST)</TranslatedText></SelectItem>
                    <SelectItem value="cst"><TranslatedText context="settings">Central Standard Time (CST)</TranslatedText></SelectItem>
                    <SelectItem value="est"><TranslatedText context="settings">Eastern Standard Time (EST)</TranslatedText></SelectItem>
                    <SelectItem value="utc"><TranslatedText context="settings">Coordinated Universal Time (UTC)</TranslatedText></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="solid-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <TranslatedText context="settings">Privacy & Security</TranslatedText>
              </CardTitle>
              <CardDescription>
                <TranslatedText context="settings">Manage your privacy settings and account security</TranslatedText>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Profile Visibility</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Make your profile visible to other users</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>
                    <TranslatedText context="settings">Location Sharing</TranslatedText>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText context="settings">Allow sharing your location during streams</TranslatedText>
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full md:w-auto" onClick={handleChangePassword}>
                  <TranslatedText context="settings">Change Password</TranslatedText>
                </Button>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full md:w-auto text-red-600 hover:text-red-700" onClick={handleDeleteAccount}>
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