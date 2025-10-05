import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import { interpolateRdYlBu } from 'd3-scale-chromatic';
import { SatelliteData } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface GlobeComponentProps {
  onCityClick?: (lat: number, lng: number) => void;
  selectedCity?: { lat: number; lng: number } | null;
  pollutionData?: Array<{ lat: number; lng: number; value: number; color: string }>;
  showSatellites?: boolean;
}

export const GlobeComponent = ({
  onCityClick,
  selectedCity,
  pollutionData = [],
  showSatellites = true
}: GlobeComponentProps) => {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  // Generate satellite data
  useEffect(() => {
    const generateSatellites = () => {
      const sats: SatelliteData[] = [
        {
          id: 'iss',
          name: 'International Space Station',
          lat: 51.6461,
          lng: 0.0,
          altitude: 408,
          velocity: 7.66,
          description: '🎂 Happy Birthday ISS! The ISS orbits Earth approximately every 90 minutes at an altitude of ~408 km'
        },
        {
          id: 'hubble',
          name: 'Hubble Space Telescope',
          lat: 28.5,
          lng: -80.6,
          altitude: 547,
          velocity: 7.59,
          description: 'NASA\'s premier space telescope, capturing stunning images of the universe since 1990'
        },
        {
          id: 'landsat8',
          name: 'Landsat-8',
          lat: -15.8,
          lng: 120.3,
          altitude: 705,
          velocity: 7.47,
          description: 'Earth observation satellite providing critical data for environmental monitoring'
        },
        {
          id: 'terra',
          name: 'TERRA',
          lat: 45.2,
          lng: -90.1,
          altitude: 705,
          velocity: 7.47,
          description: 'NASA\'s flagship Earth observation satellite, monitoring climate and environmental change'
        }
      ];
      
      setSatellites(sats);
    };

    generateSatellites();
  }, []);

  useEffect(() => {
    if (!globeRef.current || globeInstanceRef.current) return; // Prevent re-initialization

    // Initialize Globe
    const globe = new Globe(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .atmosphereColor('#4fa8d8')
      .atmosphereAltitude(0.15)
      .enablePointerInteraction(true);

    // Configure camera
    globe.camera().position.z = 300;
    
    // Auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.1;

    // Click handler for cities
    globe.onGlobeClick((coords: { lat: number; lng: number }) => {
      if (onCityClick) {
        onCityClick(coords.lat, coords.lng);
      }
    });

    globeInstanceRef.current = globe;

    // Cleanup
    return () => {
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor();
        globeInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only initialize once

  // Removed hex towers - they don't look good

  // Update selected city
  useEffect(() => {
    if (!globeInstanceRef.current || !selectedCity) return;

    // Point camera to selected city
    const coords = { lat: selectedCity.lat, lng: selectedCity.lng, altitude: 1.5 };
    globeInstanceRef.current.pointOfView(coords, 2000);

    // Add marker for selected city
    globeInstanceRef.current
      .htmlElementsData([selectedCity])
      .htmlElement((d: any) => {
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="city-marker animate-pulse-glow">
            <div class="w-4 h-4 bg-accent rounded-full glow"></div>
            <div class="w-8 h-8 bg-accent/20 rounded-full absolute -top-2 -left-2 animate-ping"></div>
          </div>
        `;
        el.style.color = 'hsl(var(--accent))';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.position = 'relative';
        return el;
      })
      .htmlLat((d: any) => d.lat)
      .htmlLng((d: any) => d.lng);
  }, [selectedCity]);

  // Animate satellites
  useEffect(() => {
    if (!globeInstanceRef.current || !showSatellites || !satellites.length) return;

    const animateSatellites = () => {
      const updatedSatellites = satellites.map(sat => ({
        ...sat,
        lng: (sat.lng + sat.velocity * 0.01) % 360
      }));
      setSatellites(updatedSatellites);
    };

    const interval = setInterval(animateSatellites, 100);
    
    globeInstanceRef.current
      .objectsData(satellites)
      .objectLat((d: any) => d.lat)
      .objectLng((d: any) => d.lng)
      .objectAltitude((d: any) => d.altitude / 1000)
      .objectThreeObject((d: any) => {
        const isISS = d.id === 'iss';

        // Create satellite mesh
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 2.5);
        const material = new THREE.MeshLambertMaterial({
          color: isISS ? '#fbbf24' : '#60a5fa'
        });
        const satellite = new THREE.Mesh(geometry, material);

        // Add solar panels
        const panelGeometry = new THREE.PlaneGeometry(4, 1.5);
        const panelMaterial = new THREE.MeshLambertMaterial({
          color: '#1e293b',
          transparent: true,
          opacity: 0.9
        });

        const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);

        panel1.position.set(-2.5, 0, 0);
        panel2.position.set(2.5, 0, 0);

        const satelliteGroup = new THREE.Group();
        satelliteGroup.add(satellite);
        satelliteGroup.add(panel1);
        satelliteGroup.add(panel2);

        // Add gold glow aura for ISS
        if (isISS) {
          const glowGeometry = new THREE.SphereGeometry(2.5);
          const glowMaterial = new THREE.MeshLambertMaterial({
            color: '#ffd700',
            transparent: true,
            opacity: 0.4
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          satelliteGroup.add(glow);
        } else {
          // Add normal glow for other satellites
          const glowGeometry = new THREE.SphereGeometry(1.5);
          const glowMaterial = new THREE.MeshLambertMaterial({
            color: '#60a5fa',
            transparent: true,
            opacity: 0.3
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          satelliteGroup.add(glow);
        }

        return satelliteGroup;
      })
      .onObjectClick((sat: any) => {
        setSelectedSatellite(sat);
      });

    return () => clearInterval(interval);
  }, [satellites, showSatellites]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (globeInstanceRef.current) {
        globeInstanceRef.current
          .width(window.innerWidth)
          .height(window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goToISS = () => {
    if (!globeInstanceRef.current) return;

    const issSatellite = satellites.find(sat => sat.id === 'iss');
    if (issSatellite) {
      const coords = {
        lat: issSatellite.lat,
        lng: issSatellite.lng,
        altitude: 2.5
      };
      globeInstanceRef.current.pointOfView(coords, 2000);
      setSelectedSatellite(issSatellite);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={globeRef} className="w-full h-full" />


      {/* Gradient overlay for atmospheric effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/10" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Satellite Info Modal */}
      {selectedSatellite && (
        <div className={`absolute top-4 right-4 z-50 glass rounded-xl max-w-sm max-h-64 overflow-hidden bg-transparent ${
          selectedSatellite.id === 'iss' ? 'border-yellow-400/50 border-2 shadow-2xl shadow-yellow-400/20' : 'border-white/10'
        }`}>
          <ScrollArea className="h-full p-4">
            <button
              onClick={() => setSelectedSatellite(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-primary mb-2">{selectedSatellite.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{selectedSatellite.description}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Altitude:</span>
                <span className="text-foreground">{selectedSatellite.altitude} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Velocity:</span>
                <span className="text-foreground">{selectedSatellite.velocity} km/s</span>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;