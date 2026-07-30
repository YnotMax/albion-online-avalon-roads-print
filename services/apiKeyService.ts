const API_KEY_STORAGE_KEY = 'avalonScribeApiKey';
const USE_SYSTEM_KEY_STORAGE = 'avalonScribeUseSystemKey';

export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const setApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  localStorage.removeItem(USE_SYSTEM_KEY_STORAGE);
};

export const clearApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(USE_SYSTEM_KEY_STORAGE);
};

export const setUseSystemKey = (): void => {
  localStorage.setItem(USE_SYSTEM_KEY_STORAGE, 'true');
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

export const getUseSystemKey = (): boolean => {
  return localStorage.getItem(USE_SYSTEM_KEY_STORAGE) === 'true';
};
