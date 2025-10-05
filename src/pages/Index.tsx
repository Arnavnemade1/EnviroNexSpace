import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import GlobeComponent from '@/components/Globe';
import CitySearch from '@/components/CitySearch';
import DataPanel from '@/components/DataPanel';
import NaturalDisasters from '@/components/NaturalDisasters';
import Chatbot from '@/components/Chatbot';
import HomeScreen from '@/components/HomeScreen';
import UserProfile from '@/components/UserProfile';
import QuantumAnalytics from '@/components/QuantumAnalytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings } from 'lucide-react';
import { nasaService } from '@/services/nasaApi';
import { geocodingService } from '@/services/geocoding';
import { openaqService } from '@/services/openAq';
import { quantumPredictor, type QuantumForecast } from '@/services/quantumPredictor';
import { ibmQuantumAer } from '@/services/ibmQuantum';
import { supabase } from '@/integrations/supabase/client';
import { AirQualityData, PredictionData, CityData } from '@/types';

const Index = () => {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const location = useLocation();
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [quantumForecast, setQuantumForecast] = useState<QuantumForecast | null>(null);
  const [pollutionData, setPollutionData] = useState<Array<{ lat: number; lng: number; value: number; color: string }>>([]);
  const [currentYear, setCurrentYear] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<'current' | 'clean_energy' | 'no_action'>('current');
  const [showIntro, setShowIntro] = useState(true);
  const [globeHue, setGlobeHue] = useState<string>('none');
  const [showHomeScreen, setShowHomeScreen] = useState(!location.state?.skipHomeScreen);
  const [showDisasters, setShowDisasters] = useState(false);
  const [showQuantumAnalytics, setShowQuantumAnalytics] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Auto-hide intro after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Globe hue effect based on scenario
  useEffect(() => {
    if (currentScenario === 'clean_energy') {
      setGlobeHue('green');
    } else if (currentScenario === 'no_action') {
      setGlobeHue('red');
    } else {
      setGlobeHue('orange');
    }
  }, [currentScenario]);

  const handleCitySelect = async (city: { name: string; country: string; lat: number; lng: number }) => {
    try {
      setShowHomeScreen(false);
      setShowIntro(false);
      setShowDisasters(false);
      setShowQuantumAnalytics(false);
      
      toast({
        title: "Loading city data...",
        description: `Fetching air quality data for ${city.name}`,
      });

      // Fetch live air quality from OpenAQ and forecasts
      const aqData = await openaqService.getLatestAirQuality(city.lat, city.lng);
      const forecasts = await nasaService.getPollutionForecast(city.lat, city.lng);
      // IBM Quantum Aer simulation for enhanced predictions
      let qForecast: QuantumForecast | null = null;
      try {
        const historicalAQI = [aqData.aqi, ...forecasts.map(f => f.aqi)];
        const quantumResult = await ibmQuantumAer.simulateAQIPrediction(
          aqData.aqi,
          historicalAQI,
          { shots: 2048, qubits: 5 }
        );
        
        qForecast = await quantumPredictor.get24hForecast(city, aqData);
        
        // Enhance with IBM Quantum metrics
        if (qForecast) {
          const metrics = ibmQuantumAer.getQuantumAdvantageMetrics(quantumResult);
          toast({
            title: "Quantum Analysis Complete",
            description: `IBM Aer: ${metrics.speedup} speedup, ${metrics.accuracy} confidence`,
          });
        }
      } catch (e) {
        console.warn('Quantum predictor failed:', e);
      }

      const cityData: CityData = {
        ...city,
        airQuality: aqData,
        healthImpact: {
          outdoorActivityDays: Math.floor(300 - (aqData.aqi * 1.2)),
          asthmaRisk: Math.floor(aqData.aqi * 0.3),
          respiratoryIndex: Math.floor(aqData.aqi * 0.8)
        }
      };

      setSelectedCity(cityData);
      setAirQuality(aqData);
      setPredictions(forecasts);
      setQuantumForecast(qForecast);

      // Generate pollution visualization data
      const pollutionPoints = [];
      for (let i = 0; i < 100; i++) {
        const lat = city.lat + (Math.random() - 0.5) * 10;
        const lng = city.lng + (Math.random() - 0.5) * 10;
        const value = Math.random() * 150;
        const color = value > 100 ? '#ef4444' : value > 50 ? '#f59e0b' : '#10b981';
        
        pollutionPoints.push({ lat, lng, value, color });
      }
      setPollutionData(pollutionPoints);

      toast({
        title: "Data loaded!",
        description: `Showing air quality data for ${city.name}, ${city.country}`,
      });
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleGlobeClick = async (lat: number, lng: number) => {
    try {
      setShowDisasters(false);
      const location = await geocodingService.reverseGeocode(lat, lng);
      if (location) {
        handleCitySelect({
          name: location.name,
          country: location.country,
          lat,
          lng
        });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const handleQuickStart = (type: 'search' | 'globe' | 'disasters') => {
    setShowHomeScreen(false);
    setShowIntro(false);
    
    if (type === 'disasters') {
      setShowDisasters(true);
    } else if (type === 'search') {
      // Show search in the center
    } else if (type === 'globe') {
      // Just show the globe for clicking
    }
  };

  const handleForecastToggle = (scenario: 'current' | 'clean_energy' | 'no_action') => {
    setCurrentScenario(scenario);
    
    // Update pollution data based on scenario
    if (selectedCity) {
      const multiplier = scenario === 'clean_energy' ? 0.7 : scenario === 'no_action' ? 1.4 : 1.0;
      const updatedPollution = pollutionData.map(point => ({
        ...point,
        value: Math.min(200, point.value * multiplier),
        color: point.value * multiplier > 100 ? '#ef4444' : point.value * multiplier > 50 ? '#f59e0b' : '#10b981'
      }));
      setPollutionData(updatedPollution);
    }
  };

  const handleYearChange = (direction: 'next' | 'prev') => {
    setCurrentYear(prev => {
      if (direction === 'next' && prev < 6) return prev + 1;
      if (direction === 'prev' && prev > 0) return prev - 1;
      return prev;
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-space">
      {/* Quantum Analytics */}
      {showQuantumAnalytics && quantumForecast && selectedCity && airQuality && (
        <QuantumAnalytics
          quantumForecast={quantumForecast}
          cityName={`${selectedCity.name}, ${selectedCity.country}`}
          currentAQI={airQuality.aqi}
          onBack={() => setShowQuantumAnalytics(false)}
        />
      )}

      {/* Home Screen */}
      {showHomeScreen && (
        <HomeScreen 
          onStartExploring={() => setShowHomeScreen(false)}
          onQuickStart={handleQuickStart}
        />
      )}

      {/* Globe Container */}
      <div className="absolute inset-0">
        <GlobeComponent
          onCityClick={handleGlobeClick}
          selectedCity={selectedCity ? { lat: selectedCity.lat, lng: selectedCity.lng } : null}
          pollutionData={pollutionData}
          showSatellites={true}
        />
        {/* Globe Hue Overlay */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${
            globeHue === 'green' ? 'bg-clean-green/10' : 
            globeHue === 'red' ? 'bg-pollution-red/10' :
            globeHue === 'orange' ? 'bg-accent/10' : 'bg-transparent'
          }`} 
        />
      </div>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}

      {/* User Controls */}
      {!showHomeScreen && (
        <div className="absolute top-6 right-6 z-40 flex flex-col gap-2">
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUserProfile(true)}
              className="glass bg-transparent border-white/10"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          )}
          {!user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = '/auth'}
              className="glass bg-transparent border-white/10"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      )}

      {/* Natural Disasters Sidebar - Only show when requested */}
      {showDisasters && (
        <div className="absolute top-6 right-6 z-40">
          <NaturalDisasters onDisasterClick={handleGlobeClick} />
        </div>
      )}

      {/* Intro Hook - Only show if no home screen */}
      {showIntro && !showHomeScreen && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="text-center max-w-2xl px-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-earth bg-clip-text text-transparent animate-pulse-glow">
              Earth's Skies in 2030
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-8">
              See tomorrow's air quality, today. Live NASA data meets AI predictions.
            </p>
            <div className="animate-bounce">
              <div className="w-8 h-8 bg-primary rounded-full mx-auto glow"></div>
            </div>
          </div>
        </div>
      )}

      {/* City Search - Center when not selected */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        {!selectedCity && !showIntro && !showHomeScreen && (
          <div className="text-center animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Name a city you care about.
            </h2>
            <CitySearch onCitySelect={handleCitySelect} />
          </div>
        )}
      </div>

      {/* Data Panel */}
      {selectedCity && airQuality && predictions.length > 0 && !showQuantumAnalytics && (
        <DataPanel
          cityName={`${selectedCity.name}, ${selectedCity.country}`}
          airQuality={airQuality}
          predictions={predictions}
          quantumForecast={quantumForecast ?? undefined}
          onForecastToggle={handleForecastToggle}
          isAnimating={false}
          onAnimationToggle={() => handleYearChange('next')}
          currentYear={currentYear}
          onYearChange={handleYearChange}
          onShowQuantumAnalytics={quantumForecast ? () => setShowQuantumAnalytics(true) : undefined}
          onBackToHome={() => {
            setShowHomeScreen(true);
            setSelectedCity(null);
            setAirQuality(null);
            setPredictions([]);
            setQuantumForecast(null);
            setPollutionData([]);
            setCurrentYear(0);
            setCurrentScenario('current');
          }}
        />
      )}

      {/* Chatbot - Only show when not on home screen */}
      {!showHomeScreen && (
        <Chatbot 
          selectedCity={selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : undefined}
          currentScenario={currentScenario}
          currentYear={currentYear}
        />
      )}

      {/* Bottom Credits - Only show when not on home screen */}
      {!showHomeScreen && (
        <div className="absolute bottom-6 left-6 z-40 group">
          <Badge 
            variant="outline" 
            className="glass text-xs px-2 py-1 bg-transparent border-white/10 transition-all duration-300 group-hover:px-4 group-hover:py-2 cursor-default"
          >
            <span className="inline group-hover:hidden">🌍 🚀</span>
            <span className="hidden group-hover:inline">
              Powered by <span className="text-primary font-medium">NASA EarthData</span> + IBM Quantum
            </span>
          </Badge>
        </div>
      )}

    </div>
  );
};

export default Index;
