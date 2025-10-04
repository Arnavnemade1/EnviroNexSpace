import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Thermometer, 
  Eye, 
  Heart, 
  Activity,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
  Home,
  BarChart3,
  Atom
} from 'lucide-react';
import { AirQualityData, PredictionData } from '@/types';
 
 type QuantumForecast = {
   model: { name: string; backend: string; horizonHours: number };
   generatedAt: string;
   hourly: Array<{ hourOffset: number; aqi: number; pm25: number; confidence: number }>;
 };
 
 interface DataPanelProps {
   cityName?: string;
   airQuality: AirQualityData | null;
   predictions: PredictionData[];
   quantumForecast?: QuantumForecast;
   onForecastToggle: (scenario: 'current' | 'clean_energy' | 'no_action') => void;
   isAnimating: boolean;
   onAnimationToggle: () => void;
   currentYear: number;
   onYearChange: (direction: 'next' | 'prev') => void;
   onBackToHome?: () => void;
  onShowQuantumAnalytics?: () => void;
  onShowHealth?: () => void;
 }

export const DataPanel = ({
  cityName,
  airQuality,
  predictions,
  quantumForecast,
  onForecastToggle,
  isAnimating,
  onAnimationToggle,
  currentYear,
  onYearChange,
  onBackToHome,
  onShowQuantumAnalytics,
  onShowHealth
}: DataPanelProps) => {
  const [selectedScenario, setSelectedScenario] = useState<'current' | 'clean_energy' | 'no_action'>('current');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const navigate = useNavigate();

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-clean-green';
    if (aqi <= 100) return 'text-accent';
    if (aqi <= 150) return 'text-orange-400';
    return 'text-pollution-red';
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    return 'Unhealthy';
  };

  const handleScenarioChange = (scenario: 'current' | 'clean_energy' | 'no_action') => {
    setSelectedScenario(scenario);
    onForecastToggle(scenario);
  };

  const handleYearChange = (direction: 'next' | 'prev') => {
    onYearChange(direction);
  };

  const getCurrentPrediction = () => {
    if (!predictions.length) return null;
    const yearIndex = Math.min(currentYear - new Date().getFullYear(), predictions.length - 1);
    return predictions[Math.max(0, yearIndex)];
  };

  const calculateHealthImpact = () => {
    if (!airQuality) return { outdoorDays: 0, asthmaRisk: 0, respiratoryIndex: 0, projectedAQI: 0 } as any;

    const year = currentYear; // 0..6

    // Scenario-specific pollutant multipliers (non-linear where it makes sense)
    const expo = (r: number, y: number) => Math.exp(-r * y);

    let pm25Factor = 1, o3Factor = 1, no2Factor = 1, so2Factor = 1;
    switch (selectedScenario) {
      case 'clean_energy':
        pm25Factor = Math.max(0.35, expo(0.18, year));
        o3Factor = Math.max(0.55, expo(0.08, year));
        no2Factor = Math.max(0.40, expo(0.15, year));
        so2Factor = Math.max(0.45, expo(0.14, year));
        break;
      case 'no_action':
        pm25Factor = 1 + 0.12 * year;
        o3Factor = 1 + 0.06 * year;
        no2Factor = 1 + 0.10 * year;
        so2Factor = 1 + 0.09 * year;
        break;
      default: // current trends
        pm25Factor = 1 + 0.03 * year;
        o3Factor = 1 + 0.02 * year;
        no2Factor = 1 + 0.025 * year;
        so2Factor = 1 + 0.02 * year;
    }

    // Project pollutants
    const pm25 = Math.max(1, Math.min(200, airQuality.pm25 * pm25Factor));
    const o3 = Math.max(1, Math.min(200, airQuality.o3 * o3Factor));
    const no2 = Math.max(1, Math.min(200, airQuality.no2 * no2Factor));
    const so2 = Math.max(1, Math.min(200, airQuality.so2 * so2Factor));

    // Rough AQI approximation emphasizing PM2.5 (dominant health driver)
    const aqiFromPM25 = Math.min(300, pm25 * 4);
    const aqiAdj = Math.min(300, aqiFromPM25 * 0.7 + o3 * 0.5 + no2 * 0.3);
    const projectedAQI = Math.round(Math.min(300, Math.max(0, aqiAdj)));

    // Health metrics (heuristic but grounded in epidemiology)
    const outdoorDays = Math.max(40, Math.min(330, 320 - projectedAQI * 1.1));
    const asthmaRisk = Math.min(200, Math.round(30 + pm25 * 0.6 + o3 * 0.2));
    const respiratoryIndex = Math.min(150, Math.round(pm25 * 0.7 + no2 * 0.3));

    return { outdoorDays, asthmaRisk, respiratoryIndex, projectedAQI };
  };

  const currentPrediction = getCurrentPrediction();
  const healthImpact = calculateHealthImpact();

  const handleHealthNavigation = () => {
    if (cityName && airQuality) {
      navigate('/health', {
        state: {
          cityName,
          airQuality,
          forecast: quantumForecast?.hourly
        }
      });
    }
  };

  return (
    <div className="fixed top-6 left-6 w-80 space-y-4 z-40 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin">
      {/* Back to Home Button */}
      {onBackToHome && (
        <Button
          size="sm"
          variant="outline"
          onClick={onBackToHome}
          className="glass bg-transparent border-white/10 mb-2"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      )}
      {/* City Info Card */}
      {cityName && airQuality && (
        <Card className="glass bg-transparent border-white/10 animate-fade-in-up">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{cityName}</h2>
                <p className="text-sm text-muted-foreground">Live Air Quality (OpenAQ)</p>
              </div>
              <Badge 
                variant="outline" 
                className={`text-lg font-bold ${getAQIColor(airQuality.aqi)} border-current`}
              >
                {airQuality.aqi}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Air Quality</span>
                <span className={getAQIColor(airQuality.aqi)}>
                  {getAQICategory(airQuality.aqi)}
                </span>
              </div>
              <Progress 
                value={(airQuality.aqi / 200) * 100} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                <span>PM2.5: {airQuality.pm25}μg/m³</span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-secondary" />
                <span>O₃: {airQuality.o3}μg/m³</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <span>NO₂: {airQuality.no2}μg/m³</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-earth-blue" />
                <span>SO₂: {airQuality.so2}μg/m³</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quantum 24h Forecast */}
      {quantumForecast && (
        <Card className="glass bg-transparent border-white/10 animate-fade-in-up border-2 border-primary/30">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-primary animate-spin" />
                <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Quantum 24h Forecast
                </h3>
              </div>
              <Badge variant="outline" className="border-primary text-primary">
                IBM Quantum Circuits
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
              🚀 Powered by IBM Quantum Computing - leveraging quantum superposition for exponentially enhanced predictions.
            </div>
            <div className="text-sm text-muted-foreground">
              Next hour AQI: <span className={getAQIColor(quantumForecast.hourly[0]?.aqi || 0)}>
                {quantumForecast.hourly[0]?.aqi ?? '—'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Min AQI (24h)</div>
                <div className="font-medium">
                  {Math.min(...quantumForecast.hourly.map(h => h.aqi))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Max AQI (24h)</div>
                <div className="font-medium">
                  {Math.max(...quantumForecast.hourly.map(h => h.aqi))}
                </div>
              </div>
            </div>
            {onShowQuantumAnalytics && (
              <Button 
                size="sm" 
                className="w-full mt-3 bg-gradient-to-r from-primary to-secondary"
                onClick={onShowQuantumAnalytics}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Quantum Analytics
              </Button>
            )}
            {cityName && airQuality && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-2 glass"
                onClick={handleHealthNavigation}
              >
                <Heart className="w-4 h-4 mr-2" />
                Health Analysis
              </Button>
            )}
            <div className="text-xs text-muted-foreground">
              Horizon: {quantumForecast.model.horizonHours}h • Generated {new Date(quantumForecast.generatedAt).toLocaleTimeString()}
            </div>
          </div>
        </Card>
      )}

      {/* Forecast Controls */}
      {predictions.length > 0 && (
        <Card className="glass bg-transparent border-white/10 animate-fade-in-up">
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">2030 Forecast</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="glass"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Scenario Buttons */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={selectedScenario === 'current' ? 'default' : 'outline'}
                  onClick={() => handleScenarioChange('current')}
                  className="justify-start text-left h-auto p-3 glass"
                >
                  <div>
                    <div className="font-medium">Current Trends</div>
                    <div className="text-xs text-muted-foreground">Continue as today</div>
                  </div>
                </Button>
                
                <Button
                  variant={selectedScenario === 'clean_energy' ? 'default' : 'outline'}
                  onClick={() => handleScenarioChange('clean_energy')}
                  className="justify-start text-left h-auto p-3 glass hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-clean-green" />
                    <div>
                      <div className="font-medium text-clean-green">Clean Energy</div>
                      <div className="text-xs text-muted-foreground">Rapid adoption</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant={selectedScenario === 'no_action' ? 'default' : 'outline'}
                  onClick={() => handleScenarioChange('no_action')}
                  className="justify-start text-left h-auto p-3 glass hover:bg-destructive/20"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-pollution-red" />
                    <div>
                      <div className="font-medium text-pollution-red">No Action</div>
                      <div className="text-xs text-muted-foreground">Business as usual</div>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Year Controls */}
              <div className="space-y-3 pt-3 border-t border-primary/20">
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-2xl font-bold text-primary">
                    {new Date().getFullYear() + currentYear}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleYearChange('prev')}
                    disabled={currentYear === 0}
                    className="glass flex-1"
                  >
                    Previous Year
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleYearChange('next')}
                    disabled={currentYear >= 6}
                    className="glass flex-1"
                  >
                    Next Year
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Year {currentYear + 1} of 7
                </div>
              </div>

              {/* Health Impact Preview */}
              <div className="space-y-3 pt-3 border-t border-primary/20">
                <h4 className="font-medium text-foreground">Health Impact Forecast</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4 text-clean-green" />
                      Outdoor Activity Days
                    </span>
                    <span className={`text-sm font-medium ${
                      selectedScenario === 'clean_energy' ? 'text-clean-green' : 
                      selectedScenario === 'no_action' ? 'text-pollution-red' : 'text-accent'
                    }`}>
                      {Math.round(healthImpact.outdoorDays)} days/year
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      Asthma Risk Index
                    </span>
                    <span className={`text-sm font-medium ${
                      selectedScenario === 'clean_energy' ? 'text-clean-green' : 
                      selectedScenario === 'no_action' ? 'text-pollution-red' : 'text-accent'
                    }`}>
                      {Math.round(healthImpact.asthmaRisk)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-earth-blue" />
                      Projected AQI
                    </span>
                    <span className={`text-sm font-medium ${getAQIColor(healthImpact.projectedAQI)}`}>
                      {Math.round(healthImpact.projectedAQI)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 p-2 glass rounded">
                    <strong>Scenario Impact:</strong><br/>
                    {selectedScenario === 'clean_energy' && 
                      "Clean energy adoption reduces pollution by 60-80%, improving health outcomes significantly."
                    }
                    {selectedScenario === 'no_action' && 
                      "Without intervention, air quality deteriorates, increasing respiratory risks and reducing quality of life."
                    }
                    {selectedScenario === 'current' && 
                      "Current trends show gradual improvement but not enough to meet WHO standards."
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataPanel;