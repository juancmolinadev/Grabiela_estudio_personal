/**
 * CONFIGURACIÓN DE SUPABASE
 * 
 * Reemplaza los valores de SUPABASE_URL y SUPABASE_ANON_KEY con las credenciales
 * obtenidas del panel de tu proyecto en Supabase (Settings -> API).
 */

const CONFIG = {
    // URL de tu proyecto de Supabase (ej: https://giedvminqeijqdopwlai.supabase.co)
    // ⚠️ NOTA: No incluyas "/rest/v1/" ni barras al final.
    SUPABASE_URL: "https://giedvminqeijqdopwlai.supabase.co",
    
    // Anon public key (clave pública anónima)
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZWR2bWlucWVpanFkb3B3bGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MzM1NzQsImV4cCI6MjEwMDQwOTU3NH0.T--4OYIgHag2yH_PRJ-0ooLQis4gv-Dta6PM3yM0HNQ"
};

// Instancia global del cliente de Supabase
let supabaseClient = null;

function sanitizeSupabaseUrl(url) {
    if (!url) return "";
    let clean = url.trim();
    
    // Si pegaron la URL del Dashboard de Supabase por error
    if (clean.includes("/dashboard/project/")) {
        const parts = clean.split("/dashboard/project/");
        if (parts[1]) {
            const projectId = parts[1].split("/")[0];
            clean = `https://${projectId}.supabase.co`;
        }
    }
    
    // Eliminar /rest/v1 o /rest/v1/ del final de la URL
    clean = clean.replace(/\/rest\/v1\/?$/i, "");
    
    // Eliminar barras diagonales al final
    clean = clean.replace(/\/+$/, "");
    
    return clean;
}

function initSupabase() {
    // Si las credenciales no se han configurado aún, muestra advertencia
    if (CONFIG.SUPABASE_URL.includes("TU_PROYECTO") || CONFIG.SUPABASE_ANON_KEY.includes("TU_SUPABASE_ANON_KEY")) {
        console.warn("⚠️ Supabase no está configurado todavía.");
        return null;
    }

    const cleanUrl = sanitizeSupabaseUrl(CONFIG.SUPABASE_URL);

    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(cleanUrl, CONFIG.SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}
