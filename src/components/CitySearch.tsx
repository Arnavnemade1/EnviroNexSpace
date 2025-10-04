import { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { geocodingService } from '@/services/geocoding';

interface CitySearchProps {
  onCitySelect: (city: { name: string; country: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export const CitySearch = ({ onCitySelect, placeholder = "Judge, name a city you care about..." }: CitySearchProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const searchCities = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await geocodingService.searchCity(query);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchCities, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleCitySelect = (city: any) => {
    setQuery(city.name);
    setShowSuggestions(false);
    onCitySelect(city);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleCitySelect(suggestions[0]);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-12 pr-12 h-14 text-lg glass glow transition-all duration-300 focus:shadow-lg focus:shadow-primary/20 border-primary/20"
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5 animate-spin" />
          )}
        </div>
        
        <Button 
          type="submit" 
          disabled={suggestions.length === 0}
          className="mt-3 w-full h-12 text-lg bg-primary hover:bg-primary-glow glow transition-all duration-300"
        >
          Zoom to City
        </Button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-lg border border-primary/20 overflow-hidden z-50 animate-fade-in-up">
          {suggestions.map((city, index) => (
            <button
              key={index}
              onClick={() => handleCitySelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors duration-200 flex items-center gap-3 border-b border-primary/10 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{city.name}</div>
                <div className="text-sm text-muted-foreground truncate">{city.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitySearch;