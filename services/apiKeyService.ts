const API_KEY_STORAGE_KEY = 'avalonScribeApiKey';
export const OUR_API_KEY = 'AIzaSyCOg_YHzkabZwJSmWBqoWz9ffl_PRS0Cu0';

export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const setApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const clearApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};
