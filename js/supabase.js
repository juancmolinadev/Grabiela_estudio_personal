/**
 * CAPA DE DATOS - SUPABASE SERVICE
 * 
 * Funciones reutilizables para operaciones CRUD en la base de datos de Supabase.
 * Incluye un diagnóstico detallado de errores y respaldo LocalStorage.
 */

const DB = {
    // Claves para el respaldo LocalStorage
    STORAGE_ITEMS_KEY: "laurita_study_items",
    STORAGE_PROGRESS_KEY: "laurita_spiritual_progress",
    STORAGE_DAILY_TEXTS_KEY: "laurita_daily_texts",
    STORAGE_SETTINGS_KEY: "laurita_app_settings",

    // Datos iniciales de prueba para LocalStorage si está vacío
    getInitialMockItems() {
        return [
            {
                id: "mock-1",
                categoria: "atalaya",
                titulo: "La Atalaya - Mantengamos un espíritu apacible",
                enlace: "https://wol.jw.org",
                libro_padre_id: null,
                tiempo_estimado: "10-20",
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            },
            {
                id: "mock-2",
                categoria: "texto_corto",
                titulo: "Examinando las Escrituras: Texto de hoy",
                enlace: "https://wol.jw.org",
                libro_padre_id: null,
                tiempo_estimado: "<=10",
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            },
            {
                id: "mock-3",
                categoria: "versiculo",
                titulo: "Salmo 23:1 - Jehová es mi Pastor",
                enlace: null,
                libro_padre_id: null,
                tiempo_estimado: "<=10",
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            },
            {
                id: "mock-book-1",
                categoria: "libro",
                titulo: "Acerquémonos a Jehová",
                enlace: null,
                libro_padre_id: null,
                tiempo_estimado: null,
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            },
            {
                id: "mock-cap-1",
                categoria: "capitulo",
                titulo: "Capítulo 1: '¡Miren! Este es nuestro Dios'",
                enlace: "https://wol.jw.org",
                libro_padre_id: "mock-book-1",
                tiempo_estimado: ">30",
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            }
        ];
    },

    getInitialMockProgress() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        return [
            {
                id: "prog-1",
                tipo_actividad: "predicar",
                subtipo: "De casa en casa",
                study_item_id: null,
                minutos_invertidos: 120,
                fecha: yesterday.toISOString()
            },
            {
                id: "prog-2",
                tipo_actividad: "estudio_personal",
                subtipo: null,
                study_item_id: null,
                minutos_invertidos: 45,
                fecha: today.toISOString()
            }
        ];
    },

    getInitialMockDailyTexts() {
        const todayStr = new Date().toISOString().split("T")[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        return [
            {
                id: "dt-mock-1",
                fecha: todayStr,
                versiculo: "Salmo 119:105",
                texto_relacionado: "Tu palabra es una lámpara para mi pie y una luz para mi camino. Meditar en la palabra de Dios nos da guía clara para cada día.",
                fecha_creacion: new Date().toISOString()
            },
            {
                id: "dt-mock-2",
                fecha: tomorrowStr,
                versiculo: "Filipenses 4:6, 7",
                texto_relacionado: "No se inquieten por nada; más bien, en toda situación, mediante la oración y el ruego presenten sus peticiones a Dios.",
                fecha_creacion: new Date().toISOString()
            }
        ];
    },

    // --- MÉTODOS LOCALSTORAGE DE RESPALDO ---
    getLocalItems() {
        const data = localStorage.getItem(this.STORAGE_ITEMS_KEY);
        if (!data) {
            const initial = this.getInitialMockItems();
            localStorage.setItem(this.STORAGE_ITEMS_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveLocalItems(items) {
        localStorage.setItem(this.STORAGE_ITEMS_KEY, JSON.stringify(items));
    },

    getLocalProgress() {
        const data = localStorage.getItem(this.STORAGE_PROGRESS_KEY);
        if (!data) {
            const initial = this.getInitialMockProgress();
            localStorage.setItem(this.STORAGE_PROGRESS_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveLocalProgress(progressList) {
        localStorage.setItem(this.STORAGE_PROGRESS_KEY, JSON.stringify(progressList));
    },

    getLocalDailyTexts() {
        const data = localStorage.getItem(this.STORAGE_DAILY_TEXTS_KEY);
        if (!data) {
            const initial = this.getInitialMockDailyTexts();
            localStorage.setItem(this.STORAGE_DAILY_TEXTS_KEY, JSON.stringify(initial));
            return initial;
        }
        return JSON.parse(data);
    },

    saveLocalDailyTexts(list) {
        localStorage.setItem(this.STORAGE_DAILY_TEXTS_KEY, JSON.stringify(list));
    },

    // --- FORMATEADOR Y DIAGNÓSTICO DE ERRORES SUPABASE ---
    formatError(error) {
        if (!error) return "Error desconocido";

        const msg = error.message || error.error_description || JSON.stringify(error);
        const code = error.code || "";

        if (msg.includes("Invalid path specified in request URL")) {
            return {
                title: "Ruta de URL de Supabase incorrecta.",
                solution: "La URL en js/config.js tenía '/rest/v1/' al final. Se ha saneado en config.js.",
                raw: msg
            };
        }

        if (code === "42P01" || msg.includes("relation") || msg.includes("does not exist")) {
            return {
                title: "Una de las tablas no existe en Supabase.",
                solution: "Ejecuta el script SQL actualizado 'supabase_schema.sql' en el Editor SQL de tu proyecto en Supabase.",
                raw: msg
            };
        }

        if (code === "42501" || msg.includes("row-level security") || msg.includes("RLS")) {
            return {
                title: "Política de seguridad RLS bloqueando la operación.",
                solution: "Asegúrate de ejecutar las sentencias CREATE POLICY del archivo 'supabase_schema.sql' en Supabase.",
                raw: msg
            };
        }

        if (code === "PGRST301" || msg.includes("JWT") || msg.includes("apiKey") || msg.includes("Invalid API key") || msg.includes("401")) {
            return {
                title: "La clave 'SUPABASE_ANON_KEY' es incorrecta.",
                solution: "Copia la clave llamada 'anon / public' desde Supabase (Settings -> API) y pégala en js/config.js.",
                raw: msg
            };
        }

        if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("URL")) {
            return {
                title: "No se pudo conectar con la URL de Supabase.",
                solution: "Verifica que SUPABASE_URL en js/config.js sea correcta y tengas conexión a internet.",
                raw: msg
            };
        }

        return {
            title: `Error de Supabase [${code}]: ${msg}`,
            solution: "Revisa los detalles en la consola F12 de tu navegador.",
            raw: msg
        };
    },

    /**
     * Test de conexión completo para diagnosticar problemas
     */
    async testConnection() {
        if (CONFIG.SUPABASE_URL.includes("TU_PROYECTO") || CONFIG.SUPABASE_ANON_KEY.includes("TU_SUPABASE_ANON_KEY")) {
            return {
                ok: false,
                step: "CONFIG",
                title: "Credenciales incompletas en js/config.js",
                solution: "Abre js/config.js y reemplaza 'TU_PROYECTO' y 'TU_SUPABASE_ANON_KEY' por tus credenciales de Supabase."
            };
        }

        const client = initSupabase();
        if (!client) {
            return {
                ok: false,
                step: "CLIENT",
                title: "No se pudo inicializar la librería de Supabase",
                solution: "Verifica que tengas acceso a internet para cargar el SDK desde CDN en index.html."
            };
        }

        try {
            const { error: err1 } = await client.from("study_items").select("id").limit(1);
            if (err1) return { ok: false, step: "READ_ITEMS", ...this.formatError(err1) };

            const { error: err2 } = await client.from("spiritual_progress").select("id").limit(1);
            if (err2) return { ok: false, step: "READ_PROGRESS", ...this.formatError(err2) };

            const { error: err3 } = await client.from("daily_texts").select("id").limit(1);
            if (err3) return { ok: false, step: "READ_DAILY_TEXTS", ...this.formatError(err3) };

            return {
                ok: true,
                title: "¡Conexión exitosa con Supabase! 🎉",
                solution: "Todas las tablas (study_items, spiritual_progress, daily_texts) y RLS están listas."
            };
        } catch (err) {
            return {
                ok: false,
                step: "EXCEPTION",
                ...this.formatError(err)
            };
        }
    },

    // --- MÉTODOS DE TEXTO DIARIO (DAILY TEXTS) ---

    async getDailyTextByDate(dateStr) {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalDailyTexts();
            const found = local.find(dt => dt.fecha === dateStr);
            return { data: found || null, error: null };
        }

        try {
            const { data, error } = await client
                .from("daily_texts")
                .select("*")
                .eq("fecha", dateStr)
                .maybeSingle();

            return { data, error };
        } catch (err) {
            console.error("Error al obtener texto diario por fecha:", err);
            return { data: null, error: err };
        }
    },

    async getAllDailyTexts() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalDailyTexts();
            local.sort((a, b) => b.fecha.localeCompare(a.fecha));
            return { data: local, error: null };
        }

        try {
            const { data, error } = await client
                .from("daily_texts")
                .select("*")
                .order("fecha", { ascending: false });

            return { data, error };
        } catch (err) {
            console.error("Error al obtener todos los textos diarios:", err);
            return { data: null, error: err };
        }
    },

    async saveDailyText(textData) {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalDailyTexts();
            const existingIndex = local.findIndex(dt => dt.fecha === textData.fecha);
            if (existingIndex >= 0) {
                local[existingIndex] = { ...local[existingIndex], ...textData };
            } else {
                local.push({
                    id: "dt-local-" + Date.now(),
                    ...textData,
                    fecha_creacion: new Date().toISOString()
                });
            }
            this.saveLocalDailyTexts(local);
            return { data: textData, error: null };
        }

        try {
            const { data, error } = await client
                .from("daily_texts")
                .upsert([textData], { onConflict: "fecha" })
                .select();

            return { data: data ? data[0] : null, error };
        } catch (err) {
            console.error("Error al guardar texto diario:", err);
            return { data: null, error: err };
        }
    },

    async deleteDailyText(id) {
        const client = initSupabase();
        if (!client) {
            let local = this.getLocalDailyTexts();
            local = local.filter(dt => dt.id !== id);
            this.saveLocalDailyTexts(local);
            return { success: true, error: null };
        }

        try {
            const { error } = await client
                .from("daily_texts")
                .delete()
                .eq("id", id);

            return { success: !error, error };
        } catch (err) {
            console.error("Error al eliminar texto diario:", err);
            return { success: false, error: err };
        }
    },

    // --- OPERACIONES DE ÍTEMS Y PROGRESO ---

    async getPendingStudyItems() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalItems();
            return { data: local.filter(item => item.estado === "pendiente"), error: null };
        }

        try {
            const { data, error } = await client
                .from("study_items")
                .select("*")
                .eq("estado", "pendiente")
                .order("fecha_creacion", { ascending: false });
            
            return { data, error };
        } catch (err) {
            console.error("Error al obtener ítems pendientes:", err);
            return { data: null, error: err };
        }
    },

    async getFinishedStudyItems() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalItems();
            return { data: local.filter(item => item.estado === "finalizado"), error: null };
        }

        try {
            const { data, error } = await client
                .from("study_items")
                .select("*")
                .eq("estado", "finalizado")
                .order("fecha_finalizado", { ascending: false });
            
            return { data, error };
        } catch (err) {
            console.error("Error al obtener ítems finalizados:", err);
            return { data: null, error: err };
        }
    },

    async getBooks() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalItems();
            return { data: local.filter(item => item.categoria === "libro"), error: null };
        }

        try {
            const { data, error } = await client
                .from("study_items")
                .select("id, titulo")
                .eq("categoria", "libro")
                .order("titulo", { ascending: true });
            
            return { data, error };
        } catch (err) {
            console.error("Error al obtener libros:", err);
            return { data: null, error: err };
        }
    },

    async createStudyItem(itemData) {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalItems();
            const newItem = {
                id: "local-" + Date.now(),
                ...itemData,
                estado: "pendiente",
                fecha_creacion: new Date().toISOString(),
                fecha_finalizado: null
            };
            local.push(newItem);
            this.saveLocalItems(local);
            return { data: newItem, error: null };
        }

        try {
            const { data, error } = await client
                .from("study_items")
                .insert([itemData])
                .select();
            
            return { data: data ? data[0] : null, error };
        } catch (err) {
            console.error("Error al crear ítem de estudio:", err);
            return { data: null, error: err };
        }
    },

    async markItemAsFinished(item) {
        const client = initSupabase();
        const now = new Date().toISOString();

        let minutos = 10;
        if (item.tiempo_estimado === "10-20") minutos = 15;
        if (item.tiempo_estimado === ">30") minutos = 30;

        if (!client) {
            const localItems = this.getLocalItems();
            const target = localItems.find(i => i.id === item.id);
            if (target) {
                target.estado = "finalizado";
                target.fecha_finalizado = now;
                this.saveLocalItems(localItems);
            }

            const localProgress = this.getLocalProgress();
            const newProgress = {
                id: "prog-" + Date.now(),
                tipo_actividad: "estudio_tiempo_libre",
                study_item_id: item.id,
                minutos_invertidos: minutos,
                fecha: now
            };
            localProgress.push(newProgress);
            this.saveLocalProgress(localProgress);

            return { success: true, error: null };
        }

        try {
            const { error: updateError } = await client
                .from("study_items")
                .update({ estado: "finalizado", fecha_finalizado: now })
                .eq("id", item.id);

            if (updateError) throw updateError;

            const { error: progressError } = await client
                .from("spiritual_progress")
                .insert([{
                    tipo_actividad: "estudio_tiempo_libre",
                    study_item_id: item.id,
                    minutos_invertidos: minutos,
                    fecha: now
                }]);

            if (progressError) throw progressError;

            return { success: true, error: null };
        } catch (err) {
            console.error("Error al marcar como finalizado:", err);
            return { success: false, error: err };
        }
    },

    async createSpiritualProgress(progressData) {
        const client = initSupabase();
        if (!client) {
            const localProgress = this.getLocalProgress();
            const newProgress = {
                id: "prog-" + Date.now(),
                ...progressData,
                fecha: progressData.fecha || new Date().toISOString()
            };
            localProgress.push(newProgress);
            this.saveLocalProgress(localProgress);
            return { data: newProgress, error: null };
        }

        try {
            const { data, error } = await client
                .from("spiritual_progress")
                .insert([progressData])
                .select();
            
            return { data: data ? data[0] : null, error };
        } catch (err) {
            console.error("Error al registrar progreso espiritual:", err);
            return { data: null, error: err };
        }
    },

    async getSpiritualProgressHistory() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalProgress();
            local.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            return { data: local, error: null };
        }

        try {
            const { data, error } = await client
                .from("spiritual_progress")
                .select("*")
                .order("fecha", { ascending: false });
            
            return { data, error };
        } catch (err) {
            console.error("Error al obtener historial de progreso:", err);
            return { data: null, error: err };
        }
    },

    // --- MANEJO DE CONFIGURACIONES (100% BASE DE DATOS SUPABASE) ---
    async getSetting(clave, defaultValue = "") {
        const client = initSupabase();
        if (client) {
            try {
                const { data, error } = await client
                    .from("app_settings")
                    .select("valor")
                    .eq("clave", clave)
                    .maybeSingle();

                if (!error && data && data.valor !== undefined && data.valor !== null) {
                    return data.valor;
                }

                // Si no existe la clave aún en la BD, se inserta la meta por defecto
                if (!error && !data) {
                    await client.from("app_settings").insert([{ clave, valor: String(defaultValue) }]);
                    return String(defaultValue);
                }
            } catch (err) {
                console.error(`Error al obtener '${clave}' de Supabase:`, err);
            }
        }

        // Respaldo únicamente si Supabase no está configurado (modo offline / local)
        const localVal = localStorage.getItem(`laurita_${clave}`);
        return (localVal !== null && localVal !== undefined) ? localVal : String(defaultValue);
    },

    async setSetting(clave, valor) {
        const valStr = String(valor);
        const client = initSupabase();
        if (client) {
            try {
                const { error } = await client
                    .from("app_settings")
                    .upsert([
                        { clave: clave, valor: valStr, fecha_actualizacion: new Date().toISOString() }
                    ], { onConflict: "clave" });

                if (error) {
                    console.error(`Error al guardar configuración '${clave}' en Supabase:`, error);
                    return { success: false, error };
                }
                return { success: true, error: null };
            } catch (err) {
                console.error(`Error al guardar configuración '${clave}' en Supabase:`, err);
                return { success: false, error: err };
            }
        }

        localStorage.setItem(`laurita_${clave}`, valStr);
        return { success: true, error: null };
    }
};
