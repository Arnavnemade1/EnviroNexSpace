import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Layers,
  Zap,
  Wind,
  Thermometer,
  Settings
} from 'lucide-react';

interface EnhancedGlobeProps {
  onCityClick: (lat: number, lng: number) => void;
  selectedCity: { lat: number; lng: number } | null;
  pollutionData: Array<{ lat: number; lng: number; value: number; color: string }>;
  showSatellites: boolean;
  timelapseMode?: boolean;
  currentYear?: number;
  onYearChange?: (year: number) => void;
}

export const EnhancedGlobe = ({ 
  onCityClick, 
  selectedCity, 
  pollutionData, 
  showSatellites,
  timelapseMode = false,
  currentYear = 0,
  onYearChange
}: EnhancedGlobeProps) => {
  const globeInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState([1]);
  const [showPollutionParticles, setShowPollutionParticles] = useState(true);
  const [show3DTerrain, setShow3DTerrain] = useState(false);
  const [particleSystem, setParticleSystem] = useState<THREE.Group | null>(null);

  // Use callback ref to ensure DOM is ready before initializing Globe
  const globeElRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || globeInstanceRef.current) return;

    try {
      console.log('Initializing Globe with node:', node);
      const globeInstance = new Globe(node)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .width(window.innerWidth)
        .height(window.innerHeight)
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor('#4A90E2')
        .atmosphereAltitude(0.25)
        .enablePointerInteraction(true);

      globeInstanceRef.current = globeInstance;
      setIsReady(true);

      // Add click handler
      globeInstance.onGlobeClick((event: any) => {
        if (event.lat && event.lng) {
          onCityClick(event.lat, event.lng);
        }
      });
    } catch (error) {
      console.error('Globe initialization failed:', error);
    }
  }, [onCityClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (globeInstanceRef.current) {
        try {
          globeInstanceRef.current._destructor?.();
        } catch (e) {
          console.error('Globe cleanup error:', e);
        }
        globeInstanceRef.current = null;
      }
    };
  }, [])

  // Add pollution particles
  useEffect(() => {
    if (!globeInstanceRef.current || !showPollutionParticles) return;

    const particles = new THREE.Group();
    
    pollutionData.forEach((point, index) => {
      // Create particle geometry
      const geometry = new THREE.SphereGeometry(0.5, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: point.color,
        transparent: true,
        opacity: 0.6
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Convert lat/lng to 3D coordinates
      const phi = (90 - point.lat) * (Math.PI / 180);
      const theta = (point.lng + 180) * (Math.PI / 180);
      const radius = 101; // Slightly above earth surface
      
      particle.position.x = -(radius * Math.sin(phi) * Math.cos(theta));
      particle.position.y = radius * Math.cos(phi);
      particle.position.z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Add pulsing animation
      const scale = 0.5 + (point.value / 200) * 1.5;
      particle.scale.set(scale, scale, scale);
      
      particles.add(particle);
    });

    globeInstanceRef.current.scene().add(particles);
    setParticleSystem(particles);

    return () => {
      if (particles && globeInstanceRef.current) {
        globeInstanceRef.current.scene().remove(particles);
      }
    };
  }, [globeInstanceRef.current, pollutionData, showPollutionParticles]);

  // Animate particles
  useEffect(() => {
    if (!particleSystem || !isAnimating) return;

    const animate = () => {
      particleSystem.children.forEach((particle, index) => {
        const time = Date.now() * 0.001 * animationSpeed[0];
        const scale = 0.5 + Math.sin(time + index) * 0.3;
        particle.scale.set(scale, scale, scale);
        
        // Rotate particles slightly
        particle.rotation.y += 0.01 * animationSpeed[0];
      });
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [particleSystem, isAnimating, animationSpeed]);

  // Add satellites
  useEffect(() => {
    if (!globeInstanceRef.current || !showSatellites) return;

    // Sample satellite data (ISS and other Earth observation satellites)
    const satellites = [
      {
        name: 'ISS',
        lat: 0,
        lng: 0,
        alt: 0.1,
        color: '#00ff00',
        size: 2
      },
      {
        name: 'Terra',
        lat: 30,
        lng: 45,
        alt: 0.08,
        color: '#ff6600',
        size: 1.5
      },
      {
        name: 'Aqua',
        lat: -20,
        lng: -120,
        alt: 0.09,
        color: '#0066ff',
        size: 1.5
      }
    ];

    globeInstanceRef.current
      .pointsData(satellites)
      .pointAltitude('alt')
      .pointColor('color')
      .pointRadius('size')
      .pointLabel('name');

    // Animate satellite orbits
    const animateSatellites = () => {
      if (!globeInstanceRef.current) return;
      const updatedSatellites = satellites.map(sat => ({
        ...sat,
        lng: (sat.lng + 0.5) % 360
      }));
      globeInstanceRef.current.pointsData(updatedSatellites);
    };

    const satelliteInterval = setInterval(animateSatellites, 100);
    
    return () => clearInterval(satelliteInterval);
  }, [globeInstanceRef.current, showSatellites]);

  // Add 3D terrain
  useEffect(() => {
    if (!globeInstanceRef.current) return;

    if (show3DTerrain) {
      globeInstanceRef.current
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .globeMaterial(new THREE.MeshPhongMaterial({ bumpScale: 10 }));
    } else {
      globeInstanceRef.current
        .bumpImageUrl(null)
        .globeMaterial(new THREE.MeshPhongMaterial({ bumpScale: 1 }));
    }
  }, [globeInstanceRef.current, show3DTerrain]);

  const handlePlayPause = () => {
    setIsAnimating(!isAnimating);
  };

  const handleReset = () => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2 });
    }
    setIsAnimating(false);
    onYearChange?.(0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Globe container */}
      <div ref={globeElRef} className="w-full h-full" />
      
      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Initializing Globe...</p>
          </div>
        </div>
      )}
      
      {/* Enhanced Controls - Only show when ready */}
      {isReady && (
        <div className="absolute top-6 left-6 space-y-4 z-30">
        <Card className="glass p-4 space-y-3 bg-transparent border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Globe Controls</span>
          </div>
          
          {/* Animation Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isAnimating ? "default" : "outline"}
                onClick={handlePlayPause}
                className="glass"
              >
                {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="glass"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Animation Speed */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Animation Speed</label>
              <Slider
                value={animationSpeed}
                onValueChange={setAnimationSpeed}
                max={3}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* Layer Controls */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3 h-3 text-secondary" />
              <span className="text-xs font-medium">Layers</span>
            </div>
            
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showPollutionParticles}
                  onChange={(e) => setShowPollutionParticles(e.target.checked)}
                  className="rounded"
                />
                <Wind className="w-3 h-3" />
                Pollution Particles
              </label>
              
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={show3DTerrain}
                  onChange={(e) => setShow3DTerrain(e.target.checked)}
                  className="rounded"
                />
                <Thermometer className="w-3 h-3" />
                3D Terrain
              </label>
            </div>
          </div>

          {/* Time Controls */}
          {timelapseMode && onYearChange && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-accent" />
                <span className="text-xs font-medium">Time-lapse</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2024</span>
                  <span className="font-medium text-primary">
                    {2024 + currentYear}
                  </span>
                  <span>2030</span>
                </div>
                <Slider
                  value={[currentYear]}
                  onValueChange={(value) => onYearChange(value[0])}
                  max={6}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Status Indicators */}
        <div className="space-y-2">
          {isAnimating && (
            <Badge variant="outline" className="glass bg-transparent border-white/10">
              <Zap className="w-3 h-3 mr-1" />
              Animating
            </Badge>
          )}
          
          {showPollutionParticles && (
            <Badge variant="outline" className="glass bg-transparent border-white/10">
              <Wind className="w-3 h-3 mr-1" />
              {pollutionData.length} Particles
            </Badge>
          )}
        </div>
        </div>
      )}

      {/* Selected City Indicator - Only show when ready */}
      {isReady && selectedCity && (
        <div className="absolute bottom-6 left-6 z-30">
          <Card className="glass p-3 bg-transparent border-white/10">
            <div className="text-sm">
              <div className="text-muted-foreground">Selected Location</div>
              <div className="font-medium">
                {selectedCity.lat.toFixed(2)}°, {selectedCity.lng.toFixed(2)}°
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedGlobe;