// =============================================
// SUPABASE CONFIGURATION
// =============================================

// IMPORTANT: Remplacez ces valeurs par vos propres identifiants Supabase
// Trouvez-les dans : Settings > API de votre projet Supabase
const SUPABASE_URL = 'https://eagodpesknbsdxzomqkj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZ29kcGVza25ic2R4em9tcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDk0MTcsImV4cCI6MjA4NTI4NTQxN30.X_C90lmVKXHPv7GxZwgqSvy-xCKOlx7K3cqcbsZMI84';

// Initialisation du client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Vérification de la configuration
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'VOTRE_URL_SUPABASE' && SUPABASE_ANON_KEY !== 'VOTRE_CLE_ANON_SUPABASE';
}

// Export pour utilisation dans d'autres scripts
window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
