import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fdmymfxzwadzvonwcvsp.supabase.co'
const supabaseAnonKey = 'sb_publishable_8jn3zBSfX1nl16pXN4rJNw_W3-uGteH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)