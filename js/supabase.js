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
                study_item_id: null,
                minutos_invertidos: 120,
                fecha: yesterday.toISOString()
            },
            {
                id: "prog-2",
                tipo_actividad: "estudio_personal",
                study_item_id: null,
                minutos_invertidos: 45,
                fecha: today.toISOString()
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

    // --- FORMATEADOR Y DIAGNÓSTICO DE ERRORES SUPABASE ---
    formatError(error) {
        if (!error) return "Error desconocido";

        const msg = error.message || error.error_description || JSON.stringify(error);
        const code = error.code || "";

        // 0. Path de URL inválido (incluyó /rest/v1/ en la URL)
        if (msg.includes("Invalid path specified in request URL")) {
            return {
                title: "Ruta de URL de Supabase incorrecta.",
                solution: "La URL en js/config.js tenía '/rest/v1/' al final. Ya la hemos corregido a 'https://giedvminqeijqdopwlai.supabase.co'.",
                raw: msg
            };
        }

        // 1. Tabla no existe
        if (code === "42P01" || msg.includes("relation") || msg.includes("does not exist")) {
            return {
                title: "La tabla 'study_items' o 'spiritual_progress' no existe en Supabase.",
                solution: "Debes ir al SQL Editor de Supabase y ejecutar todo el contenido del archivo 'supabase_schema.sql'.",
                raw: msg
            };
        }

        // 2. RLS Bloqueando
        if (code === "42501" || msg.includes("row-level security") || msg.includes("RLS")) {
            return {
                title: "Política de seguridad RLS bloqueando la operación.",
                solution: "Asegúrate de ejecutar las sentencias CREATE POLICY del archivo 'supabase_schema.sql' en el SQL Editor de Supabase.",
                raw: msg
            };
        }

        // 3. API Key inválida
        if (code === "PGRST301" || msg.includes("JWT") || msg.includes("apiKey") || msg.includes("Invalid API key") || msg.includes("401")) {
            return {
                title: "La clave 'SUPABASE_ANON_KEY' es incorrecta.",
                solution: "Copia la clave llamada 'anon / public' desde Supabase (Settings -> API) y pégala en js/config.js.",
                raw: msg
            };
        }

        // 4. Error de Red / URL Errónea
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("URL")) {
            return {
                title: "No se pudo conectar con la URL de Supabase.",
                solution: "Verifica que SUPABASE_URL en js/config.js sea correcta (ej: https://xxxx.supabase.co) y tengas conexión a internet.",
                raw: msg
            };
        }

        return {
            title: `Error de Supabase [${code}]: ${msg}`,
            solution: "Revisa los detalles en la consola F12 de tu navegador o valida las políticas de tu proyecto en Supabase.",
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
                solution: "Abre js/config.js en VS Code y reemplaza 'TU_PROYECTO' y 'TU_SUPABASE_ANON_KEY' por tus credenciales de Supabase."
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
            // Test 1: Leer study_items
            const { data, error } = await client.from("study_items").select("id").limit(1);

            if (error) {
                const formatted = this.formatError(error);
                return {
                    ok: false,
                    step: "READ_ITEMS",
                    ...formatted
                };
            }

            // Test 2: Leer spiritual_progress
            const { error: errorProg } = await client.from("spiritual_progress").select("id").limit(1);
            if (errorProg) {
                const formatted = this.formatError(errorProg);
                return {
                    ok: false,
                    step: "READ_PROGRESS",
                    ...formatted
                };
            }

            return {
                ok: true,
                title: "¡Conexión exitosa con Supabase! 🎉",
                solution: "Todas las tablas y permisos RLS están configurados correctamente."
            };
        } catch (err) {
            return {
                ok: false,
                step: "EXCEPTION",
                ...this.formatError(err)
            };
        }
    },

    // --- OPERACIONES PRINCIPALES ---

    /**
     * Obtener ítems de estudio con estado 'pendiente'
     */
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

    /**
     * Obtener ítems de estudio con estado 'finalizado'
     */
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

    /**
     * Obtener la lista de Libros (para el desplegable de capítulos)
     */
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

    /**
     * Crear un nuevo ítem de estudio
     */
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

    /**
     * Marcar ítem como finalizado y registrar automáticamente el progreso espiritual
     */
    async markItemAsFinished(item) {
        const client = initSupabase();
        const now = new Date().toISOString();

        // Determinar minutos según tiempo_estimado
        let minutos = 10;
        if (item.tiempo_estimado === "10-20") minutos = 15;
        if (item.tiempo_estimado === ">30") minutos = 30;

        if (!client) {
            // Actualizar local items
            const localItems = this.getLocalItems();
            const target = localItems.find(i => i.id === item.id);
            if (target) {
                target.estado = "finalizado";
                target.fecha_finalizado = now;
                this.saveLocalItems(localItems);
            }

            // Crear local progress
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
            // 1. Actualizar estado del ítem
            const { error: updateError } = await client
                .from("study_items")
                .update({ estado: "finalizado", fecha_finalizado: now })
                .eq("id", item.id);

            if (updateError) throw updateError;

            // 2. Insertar progreso espiritual automático
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

    /**
     * Registrar manualmente un avance espiritual
     */
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

    /**
     * Obtener todo el historial de progreso espiritual
     */
    async getSpiritualProgressHistory() {
        const client = initSupabase();
        if (!client) {
            const local = this.getLocalProgress();
            // Ordenar por fecha descendente
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
    }
};
