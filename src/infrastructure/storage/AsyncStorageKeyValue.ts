import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';

/**
 * Layer 4 adapter wrapping React Native's AsyncStorage behind the
 * {@link IKeyValueStorage} port. This is the only place the concrete storage
 * library is referenced; everything inward depends on the abstraction.
 */
export class AsyncStorageKeyValue implements IKeyValueStorage {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
