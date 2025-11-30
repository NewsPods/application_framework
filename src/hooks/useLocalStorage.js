import { useEffect, useState } from 'react';
import Storage from '../services/storage';

export const useStorage = (key, initialValue) => {
    const [value, setValue] = useState(initialValue);

    // Initial Load
    useEffect(() => {
        let mounted = true;
        Storage.get(key).then(v => {
            if (mounted && v !== null && v !== undefined) {
                setValue(v);
            }
        });
        return () => { mounted = false; };
    }, [key]);

    // Save on change
    const setStoredValue = (newValue) => {
        setValue(newValue);
        Storage.set(key, newValue).catch(console.error);
    };

    return [value, setStoredValue];
};