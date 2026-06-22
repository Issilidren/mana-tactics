import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL + '/rest/v1',
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  },
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
