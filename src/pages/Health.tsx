import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Activity, Shield } from 'lucide-react';
import { QuantumHealthAnalysisComponent } from '@/components/QuantumHealthAnalysis';
import { toast } from 'sonner';

interface LocationState {
  cityName?: string;
  airQuality?: {
    aqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  forecast?: Array<{ aqi: number; pm25: number; confidence: number }>;
}

const Health = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get data from navigation state
  const state = location.state as LocationState;
  
  useEffect(() => {
    // Check if we have the required data
    if (!state?.cityName || !state?.airQuality) {
      toast.error("Health analysis requires air quality data. Redirecting to home...");
      setTimeout(() => navigate('/'), 2000);
      return;
    }
    
    setIsLoading(false);
  }, [state, navigate]);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary-foreground animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Health Analysis...</h2>
          <p className="text-muted-foreground">Preparing quantum health assessment</p>
        </div>
      </div>
    );
  }

  if (!state?.cityName || !state?.airQuality) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="glass p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Health Data Available</h2>
          <p className="text-muted-foreground mb-4">
            Please select a city first to view health analysis.
          </p>
          <Button onClick={handleBackToHome} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={handleBackToHome} className="glass">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Globe
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Health Dashboard</h1>
              <p className="text-muted-foreground">Quantum-Enhanced Health Risk Analysis for {state.cityName}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Current AQI</p>
                <p className="text-2xl font-bold">{state.airQuality.aqi}</p>
              </div>
            </div>
          </Card>
          <Card className="glass p-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">PM2.5 Level</p>
                <p className="text-2xl font-bold">{state.airQuality.pm25} μg/m³</p>
              </div>
            </div>
          </Card>
          <Card className="glass p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <p className="text-lg font-semibold">
                  {state.airQuality.aqi <= 50 ? 'Good' : 
                   state.airQuality.aqi <= 100 ? 'Moderate' :
                   state.airQuality.aqi <= 150 ? 'Unhealthy for Sensitive' :
                   state.airQuality.aqi <= 200 ? 'Unhealthy' : 'Very Unhealthy'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Health Analysis Component */}
        <QuantumHealthAnalysisComponent
          cityName={state.cityName}
          currentAQI={state.airQuality.aqi}
          airQuality={state.airQuality}
          forecast={state.forecast}
        />

        {/* Footer Info */}
        <Card className="glass p-6 mt-8">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-5 h-5 text-red-500" />
            <h4 className="font-semibold">About Quantum Health Analysis</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Quantum Risk Assessment:</strong> Our quantum-enhanced algorithm 
              uses superposition to simultaneously evaluate multiple health risk factors, providing more accurate 
              personalized health predictions than traditional models.
            </div>
            <div>
              <strong className="text-foreground">Real-time Adaptation:</strong> The analysis continuously adapts 
              to your personal health profile, environmental conditions, and activity patterns to provide 
              the most relevant health recommendations and risk assessments.
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Medical Disclaimer:</strong> This quantum health analysis is for informational purposes only 
              and should not replace professional medical advice. Always consult with healthcare professionals 
              for medical decisions, especially if you have pre-existing health conditions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Health;