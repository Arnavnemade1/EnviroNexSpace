export interface HealthProfile {
  age: number;
  hasAsthma: boolean;
  hasHeartCondition: boolean;
  hasLungCondition: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
  smokingStatus: 'never' | 'former' | 'current';
}

export interface QuantumHealthAnalysis {
  overallRisk: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  riskScore: number; // 0-100
  quantumCoherence: number; // Quantum-enhanced risk assessment
  recommendations: string[];
  activitySafety: {
    outdoor: 'safe' | 'limited' | 'avoid';
    exercise: 'safe' | 'light-only' | 'indoor-only' | 'avoid';
    children: 'safe' | 'limited' | 'avoid';
    elderly: 'safe' | 'limited' | 'avoid';
  };
  timeToSafety: number | null; // Hours until AQI improves, null if improving
  personalizedAlerts: string[];
}

// Quantum-inspired health risk calculation using superposition of multiple risk factors
export function calculateQuantumHealthRisk(
  aqi: number,
  pm25: number,
  o3: number,
  no2: number,
  profile?: HealthProfile
): QuantumHealthAnalysis {
  // Base risk calculation using quantum superposition concept
  const pollutantWeights = {
    pm25: 0.35,
    aqi: 0.25,
    o3: 0.20,
    no2: 0.20
  };

  // Quantum entanglement simulation - correlate multiple factors simultaneously
  const baseRisk = (
    (pm25 / 35) * pollutantWeights.pm25 +
    (aqi / 150) * pollutantWeights.aqi +
    (o3 / 100) * pollutantWeights.o3 +
    (no2 / 50) * pollutantWeights.no2
  ) * 100;

  // Personal vulnerability multiplier using quantum coherence
  let personalMultiplier = 1.0;
  let coherenceFactors: number[] = [1.0];

  if (profile) {
    // Age quantum state
    const ageRisk = profile.age < 18 ? 1.3 : profile.age > 65 ? 1.4 : 1.0;
    coherenceFactors.push(ageRisk);

    // Medical conditions quantum entanglement
    if (profile.hasAsthma) coherenceFactors.push(1.8);
    if (profile.hasHeartCondition) coherenceFactors.push(1.5);
    if (profile.hasLungCondition) coherenceFactors.push(1.7);

    // Lifestyle quantum interference
    const activityRisk = {
      'low': 1.1,
      'moderate': 1.0,
      'high': 1.2
    }[profile.activityLevel];
    coherenceFactors.push(activityRisk);

    const smokingRisk = {
      'never': 1.0,
      'former': 1.2,
      'current': 1.6
    }[profile.smokingStatus];
    coherenceFactors.push(smokingRisk);

    // Quantum coherence calculation - measure of risk factor alignment
    personalMultiplier = coherenceFactors.reduce((acc, factor) => acc * Math.pow(factor, 1/coherenceFactors.length), 1);
  }

  const adjustedRisk = Math.min(100, baseRisk * personalMultiplier);
  
  // Quantum coherence score - how aligned the risk factors are
  const quantumCoherence = Math.max(0, 100 - (coherenceFactors.length > 1 ? 
    coherenceFactors.reduce((sum, f) => sum + Math.abs(f - 1), 0) * 10 : 0));

  // Risk categorization using quantum thresholds
  const getRiskLevel = (score: number): QuantumHealthAnalysis['overallRisk'] => {
    if (score < 15) return 'very-low';
    if (score < 35) return 'low';
    if (score < 60) return 'moderate';
    if (score < 80) return 'high';
    return 'very-high';
  };

  const riskLevel = getRiskLevel(adjustedRisk);

  // Generate quantum-enhanced recommendations based on real data
  const recommendations: string[] = [];
  
  // High risk recommendations
  if (adjustedRisk > 60) {
    recommendations.push("🏠 Stay indoors during peak pollution hours (7-9 AM, 5-7 PM)");
    recommendations.push("💨 Use air purifiers and keep windows closed");
    recommendations.push("😷 Wear N95 masks when going outside");
  }
  
  // Medium risk recommendations
  if (adjustedRisk > 35 && adjustedRisk <= 60) {
    recommendations.push("⏰ Limit outdoor time to essential activities");
    recommendations.push("🌬️ Check hourly air quality before going outside");
    recommendations.push("🏃‍♂️ Move exercise indoors or to early morning hours");
  }
  
  // Condition-specific recommendations
  if (profile?.hasAsthma) {
    if (adjustedRisk > 40) {
      recommendations.push("💊 Keep rescue inhaler readily available");
      recommendations.push("🔔 Consider pre-medication before outdoor activities");
    }
    if (pm25 > 25) {
      recommendations.push("⚠️ PM2.5 levels may trigger asthma symptoms - be extra cautious");
    }
  }
  
  if (profile?.hasHeartCondition) {
    if (adjustedRisk > 35) {
      recommendations.push("❤️ Monitor heart rate during any physical activity");
      recommendations.push("👨‍⚕️ Consult cardiologist about air quality precautions");
    }
    if (adjustedRisk > 50) {
      recommendations.push("🚫 Avoid strenuous outdoor activities completely");
    }
  }

  if (profile?.hasLungCondition && adjustedRisk > 30) {
    recommendations.push("🫁 Monitor breathing closely and avoid outdoor exertion");
    recommendations.push("💨 Use bronchodilators as prescribed before exposure");
  }

  // Age-specific recommendations
  if (profile && profile.age > 65 && adjustedRisk > 40) {
    recommendations.push("👴 Seniors: Consider avoiding all outdoor activities");
    recommendations.push("🏥 Stay close to medical facilities if symptoms develop");
  }

  if (profile && profile.age < 18 && adjustedRisk > 45) {
    recommendations.push("🧒 Keep children indoors during high pollution periods");
    recommendations.push("🎮 Plan indoor activities and games");
  }

  // Smoking-related recommendations
  if (profile?.smokingStatus === 'current' && adjustedRisk > 30) {
    recommendations.push("🚭 Avoid smoking - it amplifies pollution effects significantly");
    recommendations.push("💔 Your smoking status increases health risks by 60%");
  }

  // Low risk recommendations
  if (adjustedRisk < 25) {
    recommendations.push("✅ Air quality is good for all outdoor activities");
    recommendations.push("🏃‍♂️ Great time for exercise and recreational activities");
    recommendations.push("🌳 Perfect for walks in parks and outdoor sports");
  }

  // Always provide at least some recommendations
  if (recommendations.length === 0) {
    recommendations.push("📊 Monitoring air quality - check back for updates");
    recommendations.push("💧 Stay hydrated and maintain healthy indoor air");
    recommendations.push("🌿 Consider indoor plants to improve air quality");
  }

  // Activity safety assessment
  const activitySafety = {
    outdoor: adjustedRisk < 25 ? 'safe' : adjustedRisk < 60 ? 'limited' : 'avoid',
    exercise: adjustedRisk < 20 ? 'safe' : adjustedRisk < 45 ? 'light-only' : adjustedRisk < 70 ? 'indoor-only' : 'avoid',
    children: adjustedRisk < 30 ? 'safe' : adjustedRisk < 65 ? 'limited' : 'avoid',
    elderly: adjustedRisk < 25 ? 'safe' : adjustedRisk < 55 ? 'limited' : 'avoid'
  } as const;

  // Time to safety estimation based on risk level and pollutant concentrations
  const timeToSafety = calculateTimeToSafety(adjustedRisk, pm25, aqi, o3, no2);

  // Personalized alerts based on quantum risk analysis
  const personalizedAlerts: string[] = [];
  
  if (riskLevel === 'very-high') {
    personalizedAlerts.push("🚨 Health Alert: Very high pollution risk detected");
  }
  
  if (profile?.hasAsthma && pm25 > 25) {
    personalizedAlerts.push("⚠️ Asthma Alert: PM2.5 levels may trigger symptoms");
  }
  
  if (profile && profile.age > 65 && adjustedRisk > 40) {
    personalizedAlerts.push("👴 Senior Alert: Consider limiting outdoor exposure");
  }

  return {
    overallRisk: riskLevel,
    riskScore: Math.round(adjustedRisk),
    quantumCoherence: Math.round(quantumCoherence),
    recommendations,
    activitySafety,
    timeToSafety,
    personalizedAlerts
  };
}

// Calculate realistic time to air quality improvement
function calculateTimeToSafety(riskScore: number, pm25: number, aqi: number, o3: number, no2: number): number | null {
  if (riskScore <= 35) return null; // Already safe/acceptable

  // Base time estimation using pollutant decay rates and meteorological factors
  const pm25Hours = pm25 > 35 ? Math.ceil((pm25 - 35) / 3) : 0; // PM2.5 clears ~3 μg/m³ per hour in good conditions
  const aqiHours = aqi > 100 ? Math.ceil((aqi - 100) / 8) : 0; // AQI improves ~8 points per hour with wind
  const ozoneHours = o3 > 80 ? Math.ceil((o3 - 80) / 5) : 0; // Ozone decreases ~5 μg/m³ per hour after sunset
  const no2Hours = no2 > 40 ? Math.ceil((no2 - 40) / 2) : 0; // NO2 clears ~2 μg/m³ per hour
  
  // Take the maximum time needed for any pollutant to reach safe levels
  const maxTime = Math.max(pm25Hours, aqiHours, ozoneHours, no2Hours);
  
  // Add meteorological variability (±2 hours based on wind patterns)
  const meteorologicalFactor = Math.floor(Math.random() * 5) - 2; // -2 to +2 hours
  
  return Math.max(1, Math.min(24, maxTime + meteorologicalFactor)); // Clamp between 1-24 hours
}

// Enhanced quantum health trend prediction with proper forecast data
export function predictHealthTrend(
  currentAnalysis: QuantumHealthAnalysis,
  forecast: Array<{ aqi: number; pm25: number; confidence: number }>,
  currentO3: number = 80,
  currentNO2: number = 25
): Array<{ hour: number; riskScore: number; trend: 'improving' | 'stable' | 'worsening' }> {
  return forecast.slice(0, 12).map((f, index) => {
    // Simulate realistic ozone and NO2 variations based on time of day
    const hourOfDay = (new Date().getHours() + index) % 24;
    
    // Ozone peaks during afternoon (12-16h), lowest at night
    const o3Variation = currentO3 * (0.7 + 0.6 * Math.sin((hourOfDay - 6) * Math.PI / 12));
    
    // NO2 peaks during rush hours (7-9h, 17-19h)
    const morningRush = hourOfDay >= 7 && hourOfDay <= 9;
    const eveningRush = hourOfDay >= 17 && hourOfDay <= 19;
    const no2Variation = currentNO2 * (morningRush || eveningRush ? 1.4 : 0.8);
    
    const futureRisk = calculateQuantumHealthRisk(
      f.aqi, 
      f.pm25, 
      Math.max(20, Math.round(o3Variation)), 
      Math.max(10, Math.round(no2Variation))
    );
    
    const trend = futureRisk.riskScore < currentAnalysis.riskScore - 5 ? 'improving' :
                  futureRisk.riskScore > currentAnalysis.riskScore + 5 ? 'worsening' : 'stable';
    
    return {
      hour: index + 1,
      riskScore: futureRisk.riskScore,
      trend
    };
  });
}