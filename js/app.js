/**
 * LÓGICA DE LA APLICACIÓN WEB (SPA) — ESTUDIO BÍBLICO DE LAURITA
 * 
 * Controlador principal que maneja las vistas, estado de la interfaz,
 * navegación, filtros, gráficos de estadísticas, eventos de usuario y
 * el Menú Secreto de Desarrollador (activado con 7 toques en el footer).
 */

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});

const App = {
    // Estado de la aplicación
    state: {
        activeView: "sec-home",
        pendingItems: [],
        finishedItems: [],
        books: [],
        progressHistory: [],
        timeFilter: "all",
        chartInstance: null,
        footerClicks: 0,
        footerTimer: null
    },

    // --- INICIALIZACIÓN ---
    init() {
        this.checkSupabaseConfig();
        this.setupNavigation();
        this.setupEventListeners();
        this.setupDeveloperSecretTrigger();
        this.setInitialDates();
        this.loadBooksDropdown();
    },

    // Comprueba si se está ejecutando en modo demo o con Supabase real
    checkSupabaseConfig() {
        const isConfigured = !CONFIG.SUPABASE_URL.includes("TU_PROYECTO");
        const banner = document.getElementById("supabase-demo-banner");
        if (banner && !isConfigured) {
            banner.classList.remove("hidden");
        }
    },

    // --- SISTEMA DE NAVEGACIÓN Y VISTAS (SPA) ---
    setupNavigation() {
        // Botones de inicio -> Ir a secciones
        document.getElementById("btn-goto-time")?.addEventListener("click", () => this.showView("sec-time"));
        document.getElementById("btn-goto-stats")?.addEventListener("click", () => this.showView("sec-stats"));
        document.getElementById("btn-goto-log")?.addEventListener("click", () => this.showView("sec-log"));
        document.getElementById("btn-goto-add")?.addEventListener("click", () => this.showView("sec-add"));

        // Links de navegación superior
        document.getElementById("nav-home-btn")?.addEventListener("click", () => this.showView("sec-home"));
        document.getElementById("nav-brand-btn")?.addEventListener("click", () => this.showView("sec-home"));
        document.getElementById("nav-completed-btn")?.addEventListener("click", () => this.showView("sec-completed"));

        // Botones de regresar (← Volver)
        document.querySelectorAll(".btn-back").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = e.target.getAttribute("data-target") || "sec-home";
                this.showView(target);
            });
        });

        // Modales de Diagnóstico y Desarrollador
        document.getElementById("btn-banner-diag")?.addEventListener("click", () => this.runDiagnostic());
        document.getElementById("btn-retry-diag")?.addEventListener("click", () => this.runDiagnostic());
        document.getElementById("btn-close-modal")?.addEventListener("click", () => this.closeDiagnosticModal());
        
        // Controles del Menú de Desarrollador
        document.getElementById("btn-close-dev-modal")?.addEventListener("click", () => this.closeDevModal());
        document.getElementById("btn-dev-run-diag")?.addEventListener("click", () => {
            this.closeDevModal();
            this.runDiagnostic();
        });
        document.getElementById("btn-dev-clear-cache")?.addEventListener("click", () => {
            localStorage.clear();
            this.showToast("🧹 Caché local del navegador limpiada.", "success");
        });
        document.getElementById("btn-dev-log-data")?.addEventListener("click", () => {
            console.log("📋 ESTADO ACTUAL DE LA APP:", this.state);
            this.showToast("📋 Estado del sistema impreso en Consola F12.", "success");
        });
    },

    // --- TRIGGER SECRETO: 7 TOQUES EN EL FOOTER ---
    setupDeveloperSecretTrigger() {
        const footerBtn = document.getElementById("app-footer-btn");
        if (!footerBtn) return;

        footerBtn.addEventListener("click", () => {
            this.state.footerClicks++;

            // Reiniciar contador si pasan 3.5 segundos sin pulsar
            clearTimeout(this.state.footerTimer);
            this.state.footerTimer = setTimeout(() => {
                this.state.footerClicks = 0;
            }, 3500);

            // Mostrar cuenta regresiva sutil en los últimos toques
            if (this.state.footerClicks >= 4 && this.state.footerClicks < 7) {
                const remaining = 7 - this.state.footerClicks;
                this.showToast(`Estás a ${remaining} toque${remaining > 1 ? 's' : ''} de ser desarrollador... 🛠️`, "info");
            }

            // Al llegar a 7 toques -> Desbloquear Menú de Desarrollador
            if (this.state.footerClicks >= 7) {
                this.state.footerClicks = 0;
                clearTimeout(this.state.footerTimer);
                this.showToast("🛠️ ¡Modo Desarrollador Activado!", "success");
                this.openDevModal();
            }
        });
    },

    openDevModal() {
        document.getElementById("dev-menu-modal")?.classList.remove("hidden");
    },

    closeDevModal() {
        document.getElementById("dev-menu-modal")?.classList.add("hidden");
    },

    showView(viewId) {
        document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add("active");
            this.state.activeView = viewId;
        }

        if (viewId === "sec-time") {
            this.loadPendingSection();
        } else if (viewId === "sec-stats") {
            this.loadStatsSection();
        } else if (viewId === "sec-completed") {
            this.loadCompletedSection();
        } else if (viewId === "sec-add") {
            this.loadBooksDropdown();
        }

        document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
        if (viewId === "sec-home") document.getElementById("nav-home-btn")?.classList.add("active");
        if (viewId === "sec-completed") document.getElementById("nav-completed-btn")?.classList.add("active");

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // --- EVENT LISTENERS GENERALES Y FORMULARIOS ---
    setupEventListeners() {
        // 1. Filtros de tiempo en Sección 1
        const timeChips = document.querySelectorAll("#time-filter-group .chip");
        timeChips.forEach(chip => {
            chip.addEventListener("click", (e) => {
                timeChips.forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                document.querySelectorAll("#activity-filter-group .chip").forEach(c => c.classList.remove("active"));

                this.state.timeFilter = e.target.getAttribute("data-time");
                this.renderPendingItems();
            });
        });

        // 2. Filtros de Actividades cotidianas en Sección 1
        const activityChips = document.querySelectorAll("#activity-filter-group .chip");
        activityChips.forEach(chip => {
            chip.addEventListener("click", (e) => {
                activityChips.forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                document.querySelectorAll("#time-filter-group .chip").forEach(c => c.classList.remove("active"));

                const timeValue = e.target.getAttribute("data-activity-time");
                this.state.timeFilter = timeValue;
                this.renderPendingItems();
            });
        });

        // 3. Pestañas en Sección 4 (Agregar opciones)
        const tabBtns = document.querySelectorAll(".tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                tabBtns.forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                e.target.classList.add("active");
                const targetTab = e.target.getAttribute("data-tab");
                document.getElementById(targetTab)?.classList.add("active");
            });
        });

        // 4. Formulario de Ítems Simples (Atalayas, Textos, Versículos)
        document.getElementById("form-add-item")?.addEventListener("submit", (e) => this.handleAddSingleItem(e));

        // 5. Formulario de Libros
        document.getElementById("form-add-book")?.addEventListener("submit", (e) => this.handleAddBook(e));

        // 6. Formulario de Capítulos
        document.getElementById("form-add-chapter")?.addEventListener("submit", (e) => this.handleAddChapter(e));

        // 7. Formulario de Registro de Progreso Espiritual
        document.getElementById("form-log-progress")?.addEventListener("submit", (e) => this.handleLogProgress(e));
    },

    setInitialDates() {
        const dateInput = document.getElementById("log-date");
        if (dateInput) {
            const today = new Date().toISOString().split("T")[0];
            dateInput.value = today;
        }
    },

    // --- MODAL Y DIAGNÓSTICO DE SUPABASE ---
    async runDiagnostic() {
        const modal = document.getElementById("diagnostic-modal");
        const statusBox = document.getElementById("diag-status-box");
        const detailsBox = document.getElementById("diag-details-box");

        modal.classList.remove("hidden");
        statusBox.classList.remove("hidden");
        detailsBox.classList.add("hidden");
        detailsBox.classList.remove("success-state");

        statusBox.innerHTML = `
            <div class="spinner"></div>
            <p>Comprobando conexión y permisos con Supabase...</p>
        `;

        const result = await DB.testConnection();

        statusBox.classList.add("hidden");
        detailsBox.classList.remove("hidden");

        const titleEl = document.getElementById("diag-title");
        const solutionEl = document.getElementById("diag-solution");
        const rawEl = document.getElementById("diag-raw-error");

        titleEl.textContent = result.title;
        solutionEl.textContent = result.solution;

        if (result.ok) {
            detailsBox.classList.add("success-state");
            rawEl.textContent = "Sin errores. Conexión limpia a la base de datos.";
        } else {
            rawEl.textContent = JSON.stringify(result.raw || result, null, 2);
        }
    },

    closeDiagnosticModal() {
        document.getElementById("diagnostic-modal")?.classList.add("hidden");
    },

    // --- SECCIÓN 1: PENDIENTES Y TIEMPO LIBRE ---
    async loadPendingSection() {
        const container = document.getElementById("pending-items-container");
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando opciones disponibles...</p>
            </div>
        `;

        const { data, error } = await DB.getPendingStudyItems();
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error de conexión: ${formatted.title}`, "error");
            container.innerHTML = `
                <div class="empty-state">
                    <p>⚠️ ${formatted.title}</p>
                    <p class="diag-solution-text">${formatted.solution}</p>
                    <button class="btn-primary" onclick="App.runDiagnostic()" style="max-width:260px; margin: 1rem auto;">🔍 Diagnosticar Supabase</button>
                </div>
            `;
            return;
        }

        this.state.pendingItems = data || [];
        this.renderPendingItems();
    },

    renderPendingItems() {
        const container = document.getElementById("pending-items-container");
        let items = [...this.state.pendingItems];

        if (this.state.timeFilter !== "all") {
            items = items.filter(item => item.tiempo_estimado === this.state.timeFilter);
        }

        items = items.filter(item => item.categoria !== "libro");

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>✨ ¡No hay opciones pendientes para este filtro de tiempo!</p>
                    <p>Prueba seleccionando otro rango o agrega más en la sección de crear.</p>
                </div>
            `;
            return;
        }

        const categoriesMap = {
            atalaya: "📖 Atalayas",
            texto_corto: "📝 Textos Cortos",
            versiculo: "💡 Versículos",
            capitulo: "📚 Capítulos de Libros"
        };

        const grouped = {};
        items.forEach(item => {
            const catKey = item.categoria;
            if (!grouped[catKey]) grouped[catKey] = [];
            grouped[catKey].push(item);
        });

        let html = "";
        for (const [catKey, groupItems] of Object.entries(grouped)) {
            const catName = categoriesMap[catKey] || catKey;
            html += `
                <div class="category-group">
                    <h3 class="category-title">${catName}</h3>
                    <div class="item-list">
            `;

            groupItems.forEach(item => {
                const linkAttr = item.enlace ? `<a href="${item.enlace}" target="_blank" rel="noopener" class="item-link">🔗 Abrir</a>` : "";
                const timeText = item.tiempo_estimado ? `${item.tiempo_estimado} min` : "Breve";

                html += `
                    <div class="study-item-card" id="card-item-${item.id}">
                        <div class="item-left">
                            <div class="custom-checkbox" data-id="${item.id}" title="Marcar como completado" role="button" tabindex="0"></div>
                            <div class="item-info">
                                <span class="item-title">${this.escapeHtml(item.titulo)}</span>
                                <div class="item-meta">
                                    <span class="time-badge">⏱️ ${timeText}</span>
                                    ${linkAttr}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        container.querySelectorAll(".custom-checkbox").forEach(chk => {
            chk.addEventListener("click", (e) => {
                const itemId = e.target.getAttribute("data-id");
                const item = this.state.pendingItems.find(i => i.id === itemId);
                if (item) {
                    this.markAsCompleted(item, e.target);
                }
            });
        });
    },

    async markAsCompleted(item, checkboxEl) {
        checkboxEl.classList.add("checked");
        const card = document.getElementById(`card-item-${item.id}`);
        if (card) {
            card.style.opacity = "0.5";
            card.style.transform = "scale(0.98)";
        }

        const res = await DB.markItemAsFinished(item);
        if (res.success) {
            this.showToast(`¡Excelente Laurita! "${item.titulo}" guardado en tu progreso. 🎉`, "success");
            this.state.pendingItems = this.state.pendingItems.filter(i => i.id !== item.id);
            
            setTimeout(() => {
                this.renderPendingItems();
            }, 500);
        } else {
            checkboxEl.classList.remove("checked");
            if (card) {
                card.style.opacity = "1";
                card.style.transform = "none";
            }
            const formatted = DB.formatError(res.error);
            this.showToast(`Error al guardar: ${formatted.title}`, "error");
            this.runDiagnostic();
        }
    },

    // --- SECCIÓN 2: PROGRESO Y ESTADÍSTICAS ---
    async loadStatsSection() {
        const historyContainer = document.getElementById("history-container");
        historyContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando estadísticas...</p></div>`;

        const { data, error } = await DB.getSpiritualProgressHistory();
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al cargar historial: ${formatted.title}`, "error");
            return;
        }

        this.state.progressHistory = data || [];
        this.calculateMetrics();
        this.renderHistoryList();
        this.renderChart();
    },

    calculateMetrics() {
        const history = this.state.progressHistory;
        
        const totalMinutes = history.reduce((acc, curr) => acc + Number(curr.minutos_invertidos || 0), 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        document.getElementById("metric-total-hours").textContent = totalHours;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthMinutes = history.reduce((acc, curr) => {
            const d = new Date(curr.fecha);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                return acc + Number(curr.minutos_invertidos || 0);
            }
            return acc;
        }, 0);
        
        document.getElementById("metric-month-hours").textContent = (monthMinutes / 60).toFixed(1);

        const streak = this.calculateStreak(history);
        document.getElementById("metric-streak-days").textContent = streak;
    },

    calculateStreak(history) {
        if (!history || history.length === 0) return 0;

        const datesSet = new Set(history.map(item => new Date(item.fecha).toISOString().split("T")[0]));
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (!datesSet.has(todayStr) && !datesSet.has(yesterdayStr)) {
            return 0;
        }

        let streakCount = 0;
        let checkDate = datesSet.has(todayStr) ? new Date() : yesterday;

        while (true) {
            const checkStr = checkDate.toISOString().split("T")[0];
            if (datesSet.has(checkStr)) {
                streakCount++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streakCount;
    },

    renderHistoryList() {
        const container = document.getElementById("history-container");
        const history = this.state.progressHistory;

        if (history.length === 0) {
            container.innerHTML = `<p class="empty-state">Aún no se ha registrado ninguna actividad espiritual.</p>`;
            return;
        }

        const activityNames = {
            predicar: "🚪 Predicación",
            estudiar_reuniones: "🏛️ Estudiar las reuniones",
            estudio_personal: "📖 Estudio personal",
            estudio_grupo: "👥 Estudio en grupo",
            estudio_tiempo_libre: "⏱️ Estudio en tiempo libre"
        };

        let html = "";
        history.slice(0, 15).forEach(item => {
            const actName = activityNames[item.tipo_actividad] || item.tipo_actividad;
            const dateFormatted = new Date(item.fecha).toLocaleDateString("es-ES", {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            html += `
                <div class="history-row">
                    <div>
                        <span class="history-type">${actName}</span>
                        <div style="font-size:0.75rem; color: var(--text-muted);">${dateFormatted}</div>
                    </div>
                    <span class="history-time">${item.minutos_invertidos} min</span>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    renderChart() {
        const ctx = document.getElementById("progressChart");
        if (!ctx) return;

        if (this.state.chartInstance) {
            this.state.chartInstance.destroy();
        }

        const history = this.state.progressHistory;
        const categories = {
            predicar: 0,
            estudiar_reuniones: 0,
            estudio_personal: 0,
            estudio_grupo: 0,
            estudio_tiempo_libre: 0
        };

        history.forEach(item => {
            if (categories[item.tipo_actividad] !== undefined) {
                categories[item.tipo_actividad] += Number(item.minutos_invertidos || 0);
            }
        });

        const dataHours = [
            (categories.predicar / 60).toFixed(1),
            (categories.estudiar_reuniones / 60).toFixed(1),
            (categories.estudio_personal / 60).toFixed(1),
            (categories.estudio_grupo / 60).toFixed(1),
            (categories.estudio_tiempo_libre / 60).toFixed(1)
        ];

        this.state.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Predicar', 'Reuniones', 'Pers. Profundo', 'En Grupo', 'Tiempo Libre'],
                datasets: [{
                    label: 'Horas acumuladas',
                    data: dataHours,
                    backgroundColor: [
                        '#0d9488',
                        '#8b5cf6',
                        '#3b82f6',
                        '#f59e0b',
                        '#10b981'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Horas' }
                    }
                }
            }
        });
    },

    // --- SECCIÓN 3: REGISTRAR PROGRESO ESPIRITUAL ---
    async handleLogProgress(e) {
        e.preventDefault();
        const activityType = document.getElementById("log-activity-type").value;
        const minutes = parseInt(document.getElementById("log-minutes").value, 10);
        const dateVal = document.getElementById("log-date").value;

        if (!activityType || isNaN(minutes) || minutes <= 0) {
            this.showToast("Por favor completa los campos requeridos con valores válidos.", "error");
            return;
        }

        const dateObj = new Date(dateVal + "T12:00:00Z");

        const progressData = {
            tipo_actividad: activityType,
            minutos_invertidos: minutes,
            fecha: dateObj.toISOString()
        };

        const { data, error } = await DB.createSpiritualProgress(progressData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al guardar: ${formatted.title}`, "error");
            this.runDiagnostic();
            return;
        }

        this.showToast("¡Registro de tiempo guardado con éxito! 🌟", "success");
        document.getElementById("form-log-progress").reset();
        this.setInitialDates();
        
        setTimeout(() => this.showView("sec-stats"), 600);
    },

    // --- SECCIÓN 4: CREACIÓN DE ÍTEMS Y LIBROS ---
    async handleAddSingleItem(e) {
        e.preventDefault();
        const category = document.getElementById("add-category").value;
        const title = document.getElementById("add-title").value.trim();
        const link = document.getElementById("add-link").value.trim() || null;
        const time = document.getElementById("add-time").value;

        if (!title) {
            this.showToast("Ingresa un título válido", "error");
            return;
        }

        const itemData = {
            categoria: category,
            titulo: title,
            enlace: link,
            tiempo_estimado: time
        };

        const { data, error } = await DB.createStudyItem(itemData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al guardar: ${formatted.title}`, "error");
            this.runDiagnostic();
            return;
        }

        this.showToast("¡Opción de estudio agregada correctamente!", "success");
        document.getElementById("form-add-item").reset();
    },

    async handleAddBook(e) {
        e.preventDefault();
        const title = document.getElementById("book-title").value.trim();

        if (!title) {
            this.showToast("Ingresa el título del libro", "error");
            return;
        }

        const itemData = {
            categoria: "libro",
            titulo: title,
            enlace: null,
            tiempo_estimado: null
        };

        const { data, error } = await DB.createStudyItem(itemData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al crear libro: ${formatted.title}`, "error");
            this.runDiagnostic();
            return;
        }

        this.showToast("¡Libro creado! Ahora puedes agregarle capítulos abajo.", "success");
        document.getElementById("form-add-book").reset();
        this.loadBooksDropdown();
    },

    async handleAddChapter(e) {
        e.preventDefault();
        const parentBookId = document.getElementById("chapter-parent-book").value;
        const title = document.getElementById("chapter-title").value.trim();
        const link = document.getElementById("chapter-link").value.trim() || null;
        const time = document.getElementById("chapter-time").value;

        if (!parentBookId || !title) {
            this.showToast("Selecciona un libro padre y escribe un título para el capítulo.", "error");
            return;
        }

        const itemData = {
            categoria: "capitulo",
            titulo: title,
            enlace: link,
            libro_padre_id: parentBookId,
            tiempo_estimado: time
        };

        const { data, error } = await DB.createStudyItem(itemData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al guardar capítulo: ${formatted.title}`, "error");
            this.runDiagnostic();
            return;
        }

        this.showToast("¡Capítulo agregado al libro con éxito!", "success");
        document.getElementById("chapter-title").value = "";
        document.getElementById("chapter-link").value = "";
    },

    async loadBooksDropdown() {
        const select = document.getElementById("chapter-parent-book");
        if (!select) return;

        const { data, error } = await DB.getBooks();
        if (error || !data || data.length === 0) {
            select.innerHTML = `<option value="" disabled selected>No hay libros creados aún</option>`;
            return;
        }

        let html = `<option value="" disabled selected>Selecciona un libro</option>`;
        data.forEach(book => {
            html += `<option value="${book.id}">${this.escapeHtml(book.titulo)}</option>`;
        });

        select.innerHTML = html;
    },

    // --- SECCIÓN 5: COMPLETADOS Y FINALIZADOS ---
    async loadCompletedSection() {
        const container = document.getElementById("completed-items-container");
        container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando ítems finalizados...</p></div>`;

        const { data, error } = await DB.getFinishedStudyItems();
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error: ${formatted.title}`, "error");
            return;
        }

        this.state.finishedItems = data || [];
        this.renderCompletedItems();
    },

    renderCompletedItems() {
        const container = document.getElementById("completed-items-container");
        const items = this.state.finishedItems;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aún no has marcado ninguna opción como finalizada.</p>
                </div>
            `;
            return;
        }

        const categoriesMap = {
            atalaya: "📖 Atalayas Leídas",
            texto_corto: "📝 Textos Cortos Completados",
            versiculo: "💡 Versículos Repasados",
            capitulo: "📚 Capítulos Finalizados"
        };

        const grouped = {};
        items.forEach(item => {
            const catKey = item.categoria;
            if (!grouped[catKey]) grouped[catKey] = [];
            grouped[catKey].push(item);
        });

        let html = "";
        for (const [catKey, groupItems] of Object.entries(grouped)) {
            const catName = categoriesMap[catKey] || catKey;
            html += `
                <div class="category-group">
                    <h3 class="category-title">${catName}</h3>
                    <div class="item-list">
            `;

            groupItems.forEach(item => {
                const dateFinished = item.fecha_finalizado 
                    ? new Date(item.fecha_finalizado).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })
                    : "Completado";

                html += `
                    <div class="study-item-card">
                        <div class="item-left">
                            <span style="color: var(--status-completed); font-weight: bold; font-size:1.2rem;">✓</span>
                            <div class="item-info">
                                <span class="item-title">${this.escapeHtml(item.titulo)}</span>
                                <div class="item-meta">
                                    <span>Leído el ${dateFinished}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    // --- UTILIDADES ---
    showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
};
