import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Search, TrendingUp, Satellite, TriangleAlert as AlertTriangle, MessageCircle, Play, ChevronRight, User } from 'lucide-react';

interface HomeScreenProps {
  onStartExploring: () => void;
  onQuickStart: (type: 'search' | 'globe' | 'disasters') => void;
}

export const HomeScreen = ({ onStartExploring, onQuickStart }: HomeScreenProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const quickStartOptions = [
    {
      id: 'search',
      title: 'Search a City',
      description: 'Enter any city name to see its air quality and future predictions',
      icon: Search,
      gradient: 'from-primary to-primary/60',
      shadowColor: 'shadow-primary/20'
    },
    {
      id: 'globe',
      title: 'Explore the Globe',
      description: 'Click anywhere on Earth to discover local air quality data',
      icon: Globe,
      gradient: 'from-secondary to-secondary/60',
      shadowColor: 'shadow-secondary/20'
    },
    {
      id: 'disasters',
      title: 'Natural Disasters',
      description: 'View current natural disasters affecting air quality worldwide',
      icon: AlertTriangle,
      gradient: 'from-accent to-accent/60',
      shadowColor: 'shadow-accent/20'
    }
  ];

  const features = [
    {
      icon: Satellite,
      title: 'Live Satellites',
      description: 'Interactive ISS and Earth observation satellites',
      highlight: 'Real-time tracking'
    },
    {
      icon: TrendingUp,
      title: '2030 Predictions',
      description: 'Quantum-enhanced AI forecasting',
      highlight: 'IBM Quantum'
    },
    {
      icon: MessageCircle,
      title: 'Grok-4 Fast',
      description: 'Ask questions about air quality and climate data',
      highlight: 'X.AI Quantum AI'
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background/98 to-primary/5 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl h-full overflow-y-auto scrollbar-hide">
        <div className="min-h-full flex flex-col justify-center space-y-12 py-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center glow">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-earth bg-clip-text text-transparent">
              EnviroNex
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="border-primary text-primary px-4 py-2 glass bg-transparent border-white/10">
              Powered by IBM Quantum Computing
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore real-time air quality from NASA satellites and see quantum-enhanced AI predictions for Earth’s atmosphere.
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-3 gap-8">
          {quickStartOptions.map((option) => (
            <Card 
              key={option.id}
              className={`group glass p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:rotate-1 border-2 backdrop-blur-md ${
                hoveredCard === option.id 
                  ? 'border-primary/50 shadow-2xl shadow-primary/20' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => onQuickStart(option.id as 'search' | 'globe' | 'disasters')}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="space-y-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-xl ${option.shadowColor} backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{option.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                </div>
                <div className="flex items-center text-primary text-sm font-semibold transition-colors relative z-20">
                  <span className="drop-shadow-lg">Get started</span> <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Powered by NASA EarthData
            </h2>
            <p className="text-muted-foreground">Advanced satellite technology meets AI innovation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="group flex items-start gap-4 glass p-6 rounded-xl hover:scale-105 transition-all duration-300 border border-white/10 hover:border-white/20">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <Badge variant="outline" className="text-xs px-2 py-0 border-primary/30 text-primary shrink-0">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-10 py-6 glow hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-secondary shadow-xl"
            onClick={onStartExploring}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Exploring
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-10 py-6 glass hover:scale-110 transition-all duration-300 border-2 border-primary/30 hover:border-primary/50"
            onClick={() => onQuickStart('search')}
          >
            <Search className="w-5 h-5 mr-2" />
            Search a City
          </Button>
        </div>

        {/* Auth Section */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            variant="ghost"
            className="text-lg px-8 py-4 glass hover:scale-105 transition-all duration-300"
            onClick={() => window.location.href = '/auth'}
          >
            <User className="w-5 h-5 mr-2" />
            Sign In / Create Account
          </Button>
        </div>

        {/* Info Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="glass text-sm px-6 py-2 border-primary/30 bg-transparent border-white/10">
            🌍 Real-time data • 🚀 Quantum-enhanced AI • 🛰️ Interactive globe
          </Badge>
        </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
