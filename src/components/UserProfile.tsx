import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  MapPin, 
  Heart, 
  Bell, 
  Settings,
  Save,
  Trash2,
  Star,
  Loader2,
  LogOut
} from 'lucide-react';

interface SavedLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  is_favorite: boolean;
  created_at: string;
}

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    health_profile: {
      age_range: '',
      health_conditions: [] as string[],
      activity_level: '',
      air_sensitivity: 'normal',
      smoking_status: 'never'
    },
    preferences: {
      units: 'metric',
      notifications: true,
      theme: 'dark'
    }
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        username: userProfile.username || '',
        full_name: userProfile.full_name || '',
        health_profile: userProfile.health_profile || {
          age_range: '',
          health_conditions: [],
          activity_level: '',
          air_sensitivity: 'normal',
          smoking_status: 'never'
        },
        preferences: userProfile.preferences || {
          units: 'metric',
          notifications: true,
          theme: 'dark'
        }
      });
    }
  }, [userProfile]);

  useEffect(() => {
    fetchSavedLocations();
  }, []);

  const fetchSavedLocations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          health_profile: profileData.health_profile,
          preferences: profileData.preferences
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationDelete = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;
      
      setSavedLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast({
        title: "Location removed",
        description: "The location has been removed from your saved locations.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove location. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLocationToggleFavorite = async (locationId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .update({ is_favorite: !isFavorite })
        .eq('id', locationId);

      if (error) throw error;
      
      setSavedLocations(prev => 
        prev.map(loc => 
          loc.id === locationId 
            ? { ...loc, is_favorite: !isFavorite }
            : loc
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSignOut} className="glass">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button variant="outline" onClick={onClose} className="glass">
                ✕
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="locations">
                <MapPin className="w-4 h-4 mr-2" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="health">
                <Heart className="w-4 h-4 mr-2" />
                Health
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card className="glass p-4">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        full_name: e.target.value
                      }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        username: e.target.value
                      }))}
                      className="glass"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleProfileUpdate} 
                  className="mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card className="glass p-4">
                <h3 className="text-lg font-semibold mb-4">Saved Locations</h3>
                {savedLocations.length === 0 ? (
                  <p className="text-muted-foreground">No saved locations yet. Search for cities to save them!</p>
                ) : (
                  <div className="space-y-3">
                    {savedLocations.map((location) => (
                      <div key={location.id} className="flex items-center justify-between p-3 glass rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-medium">{location.name || location.city}</div>
                            <div className="text-sm text-muted-foreground">
                              {location.city}, {location.country}
                            </div>
                          </div>
                          {location.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLocationToggleFavorite(location.id, location.is_favorite)}
                          >
                            <Star className={`w-4 h-4 ${location.is_favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLocationDelete(location.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <Card className="glass p-4">
                <h3 className="text-lg font-semibold mb-4">Health Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age_range">Age Range</Label>
                    <select
                      id="age_range"
                      value={profileData.health_profile.age_range}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        health_profile: {
                          ...prev.health_profile,
                          age_range: e.target.value
                        }
                      }))}
                      className="w-full p-2 rounded-md glass bg-background/50"
                    >
                      <option value="">Select age range</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-50">36-50</option>
                      <option value="51-65">51-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity_level">Activity Level</Label>
                    <select
                      id="activity_level"
                      value={profileData.health_profile.activity_level}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        health_profile: {
                          ...prev.health_profile,
                          activity_level: e.target.value
                        }
                      }))}
                      className="w-full p-2 rounded-md glass bg-background/50"
                    >
                      <option value="">Select activity level</option>
                      <option value="low">Low (Sedentary)</option>
                      <option value="moderate">Moderate (Regular exercise)</option>
                      <option value="high">High (Very active)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="air_sensitivity">Air Quality Sensitivity</Label>
                    <select
                      id="air_sensitivity"
                      value={profileData.health_profile.air_sensitivity}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        health_profile: {
                          ...prev.health_profile,
                          air_sensitivity: e.target.value
                        }
                      }))}
                      className="w-full p-2 rounded-md glass bg-background/50"
                    >
                      <option value="low">Low sensitivity</option>
                      <option value="normal">Normal sensitivity</option>
                      <option value="high">High sensitivity</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smoking_status">Smoking Status</Label>
                    <select
                      id="smoking_status"
                      value={profileData.health_profile.smoking_status}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        health_profile: {
                          ...prev.health_profile,
                          smoking_status: e.target.value
                        }
                      }))}
                      className="w-full p-2 rounded-md glass bg-background/50"
                    >
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleProfileUpdate} 
                  className="mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Health Profile
                    </>
                  )}
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card className="glass p-4">
                <h3 className="text-lg font-semibold mb-4">App Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive air quality alerts</p>
                    </div>
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={profileData.preferences.notifications}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <select
                      id="units"
                      value={profileData.preferences.units}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          units: e.target.value
                        }
                      }))}
                      className="w-full p-2 rounded-md glass bg-background/50"
                    >
                      <option value="metric">Metric (°C, km/h)</option>
                      <option value="imperial">Imperial (°F, mph)</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleProfileUpdate} 
                  className="mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;