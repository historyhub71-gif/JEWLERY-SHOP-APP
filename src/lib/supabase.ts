import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
    'https://imwjtafodqbwtmrdjvjp.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_m4BSXArrc5KwnHqoCCW0cA_ao5AjF2Q';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);