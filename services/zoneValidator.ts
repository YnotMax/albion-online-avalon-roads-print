import { ALL_ZONES } from '../data/zoneNames';

export interface ValidationResult {
  isValid: boolean;
  suggestions: string[];
}

/**
 * Calculates the Levenshtein distance between two strings.
 * A measure of the difference between two sequences.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Validates a zone name against the known list and suggests corrections.
 * @param name The zone name extracted by the AI.
 * @returns A ValidationResult object with a list of suggestions.
 */
export function validateZoneName(name: string | null): ValidationResult {
  if (!name) {
    return { isValid: false, suggestions: [] };
  }
  
  const upperCaseName = name.toUpperCase();

  if (ALL_ZONES.has(upperCaseName)) {
    return { isValid: true, suggestions: [upperCaseName] };
  }

  const suggestionsWithDistance: { name: string, distance: number }[] = [];
  
  // Find all close matches
  for (const knownName of ALL_ZONES) {
    const distance = levenshteinDistance(upperCaseName, knownName);
    // Keep suggestions that are reasonably close (e.g., distance <= 3)
    if (distance <= 3) { 
      suggestionsWithDistance.push({ name: knownName, distance });
    }
  }

  // Sort suggestions by distance (ascending)
  suggestionsWithDistance.sort((a, b) => a.distance - b.distance);

  // Extract just the names and limit to a max of 5 suggestions
  const bestSuggestions = suggestionsWithDistance.slice(0, 5).map(s => s.name);

  // If no suggestions were found, return the original name in the list.
  if (bestSuggestions.length === 0) {
    return { isValid: false, suggestions: [name] };
  }

  return { isValid: false, suggestions: bestSuggestions };
}
