import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hbxpltuflqsslrktexor.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhieHBsdHVmbHFzc2xya3RleG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDYyMjQsImV4cCI6MjA3NzkyMjIyNH0.Zo8VeZehA5ZctR3VlnRXuRxZhbfkLvg6mwZpxKA7Ai0'

export const supabase = createClient(supabaseUrl, supabaseKey)