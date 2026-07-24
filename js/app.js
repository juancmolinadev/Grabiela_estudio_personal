/**
 * LÓGICA DE LA APLICACIÓN WEB (SPA) — ESTUDIO BÍBLICO DE LAURITA
 * 
 * Controlador principal que maneja las vistas, tema oscuro, Texto Diario,
 * navegación, filtros, estadísticas y Menú de Desarrollador / Admin.
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
        dailyTexts: [],
        currentTodayText: null,
        timeFilter: "all",
        chartInstance: null,
        footerClicks: 0,
        footerTimer: null,
        theme: "dark"
    },

    // --- INICIALIZACIÓN ---
    init() {
        this.initTheme();
        this.checkSupabaseConfig();
        this.setupNavigation();
        this.setupEventListeners();
        this.setupDeveloperSecretTrigger();
        this.setInitialDates();
        this.loadBooksDropdown();
        this.loadDailyTextHome();
    },

    // --- MANEJO DE TEMA (DARK MODE POR DEFECTO) ---
    initTheme() {
        const savedTheme = localStorage.getItem("laurita_theme") || "dark";
        this.setTheme(savedTheme);

        const toggleBtn = document.getElementById("theme-toggle-btn");
        toggleBtn?.addEventListener("click", () => {
            const nextTheme = this.state.theme === "dark" ? "light" : "dark";
            this.setTheme(nextTheme);
        });
    },

    setTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("laurita_theme", theme);

        const toggleBtn = document.getElementById("theme-toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = theme === "dark" ? "🌙" : "☀️";
            toggleBtn.title = theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro";
        }
    },

    checkSupabaseConfig() {
        const isConfigured = !CONFIG.SUPABASE_URL.includes("TU_PROYECTO");
        const banner = document.getElementById("supabase-demo-banner");
        if (banner && !isConfigured) {
            banner.classList.remove("hidden");
        }
    },

    // --- SISTEMA DE NAVEGACIÓN Y VISTAS (SPA) ---
    setupNavigation() {
        document.getElementById("btn-goto-time")?.addEventListener("click", () => this.showView("sec-time"));
        document.getElementById("btn-goto-stats")?.addEventListener("click", () => this.showView("sec-stats"));
        document.getElementById("btn-goto-log")?.addEventListener("click", () => this.showView("sec-log"));
        document.getElementById("btn-goto-add")?.addEventListener("click", () => this.showView("sec-add"));

        document.getElementById("nav-home-btn")?.addEventListener("click", () => this.showView("sec-home"));
        document.getElementById("nav-brand-btn")?.addEventListener("click", () => this.showView("sec-home"));
        document.getElementById("nav-completed-btn")?.addEventListener("click", () => this.showView("sec-completed"));

        document.querySelectorAll(".btn-back").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = e.target.getAttribute("data-target") || "sec-home";
                this.showView(target);
            });
        });

        // Modales
        document.getElementById("btn-banner-diag")?.addEventListener("click", () => this.runDiagnostic());
        document.getElementById("btn-retry-diag")?.addEventListener("click", () => this.runDiagnostic());
        document.getElementById("btn-close-modal")?.addEventListener("click", () => this.closeDiagnosticModal());
        
        // Controles del Menú de Desarrollador / Admin
        document.getElementById("btn-close-dev-modal")?.addEventListener("click", () => this.closeDevModal());
        document.getElementById("btn-close-dt-modal")?.addEventListener("click", () => this.closeDailyTextAdminModal());

        document.getElementById("btn-dev-admin-daily-text")?.addEventListener("click", () => {
            this.closeDevModal();
            this.openDailyTextAdminModal();
        });

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

    setupDeveloperSecretTrigger() {
        const footerBtn = document.getElementById("app-footer-btn");
        if (!footerBtn) return;

        footerBtn.addEventListener("click", () => {
            this.state.footerClicks++;

            clearTimeout(this.state.footerTimer);
            this.state.footerTimer = setTimeout(() => {
                this.state.footerClicks = 0;
            }, 3500);

            if (this.state.footerClicks >= 4 && this.state.footerClicks < 7) {
                const remaining = 7 - this.state.footerClicks;
                this.showToast(`Estás a ${remaining} toque${remaining > 1 ? 's' : ''} del menú de Admin... 🛠️`, "info");
            }

            if (this.state.footerClicks >= 7) {
                this.state.footerClicks = 0;
                clearTimeout(this.state.footerTimer);
                this.showToast("🛠️ ¡Menú de Administrador Activado!", "success");
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

    openDailyTextAdminModal() {
        document.getElementById("daily-text-admin-modal")?.classList.remove("hidden");
        const dateInput = document.getElementById("admin-dt-date");
        if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
        this.loadAdminDailyTexts();
    },

    closeDailyTextAdminModal() {
        document.getElementById("daily-text-admin-modal")?.classList.add("hidden");
        this.loadDailyTextHome();
    },

    showView(viewId) {
        document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));

        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add("active");
            this.state.activeView = viewId;
        }

        if (viewId === "sec-home") {
            this.loadDailyTextHome();
        } else if (viewId === "sec-time") {
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

        const activitySelect = document.getElementById("log-activity-type");
        const preachingSubContainer = document.getElementById("preaching-suboption-container");
        activitySelect?.addEventListener("change", (e) => {
            if (e.target.value === "predicar") {
                preachingSubContainer?.classList.remove("hidden");
            } else {
                preachingSubContainer?.classList.add("hidden");
                const subSelect = document.getElementById("log-preaching-suboption");
                if (subSelect) subSelect.value = "";
            }
        });

        document.getElementById("form-add-item")?.addEventListener("submit", (e) => this.handleAddSingleItem(e));
        document.getElementById("form-add-book")?.addEventListener("submit", (e) => this.handleAddBook(e));
        document.getElementById("form-add-chapter")?.addEventListener("submit", (e) => this.handleAddChapter(e));
        document.getElementById("form-log-progress")?.addEventListener("submit", (e) => this.handleLogProgress(e));
        document.getElementById("form-admin-daily-text")?.addEventListener("submit", (e) => this.handleSaveDailyText(e));
    },

    setInitialDates() {
        const dateInput = document.getElementById("log-date");
        if (dateInput) {
            const today = new Date().toISOString().split("T")[0];
            dateInput.value = today;
        }
    },

    // --- SECCIÓN: TEXTO DIARIO DEL DÍA EN HOME (MINIMIZADO POR DEFECTO) ---
    async loadDailyTextHome() {
        const container = document.getElementById("daily-text-container");
        if (!container) return;

        const todayStr = new Date().toISOString().split("T")[0];
        const { data, error } = await DB.getDailyTextByDate(todayStr);

        if (!data) {
            container.innerHTML = `
                <div class="dt-header">
                    <div class="dt-title-group">
                        <span class="dt-badge">Texto Diario</span>
                        <span class="dt-verse">Hoy</span>
                    </div>
                    <span class="dt-date">${this.formatNiceDate(todayStr)}</span>
                </div>
                <div class="dt-body" style="margin-top:0.75rem;">
                    No hay un texto diario registrado para hoy. Puedes agregar uno desde el menú de Administrador.
                </div>
            `;
            return;
        }

        this.state.currentTodayText = data;
        const readKey = `laurita_read_dt_${todayStr}`;
        const isRead = localStorage.getItem(readKey) === "true";

        container.innerHTML = `
            <div class="dt-header" id="dt-toggle-header" title="Toca para abrir o cerrar el texto diario">
                <div class="dt-title-group">
                    <span class="dt-badge">Texto Diario</span>
                    <span class="dt-verse">${this.escapeHtml(data.versiculo)}</span>
                </div>
                <div class="dt-header-right">
                    <span class="dt-date">${this.formatNiceDate(todayStr)}</span>
                    <button id="btn-dt-expand" class="btn-dt-expand" aria-label="Abrir texto diario">➕</button>
                </div>
            </div>
            <div id="dt-collapsible-content" class="dt-content-collapsible hidden">
                <div class="dt-body">
                    "${this.escapeHtml(data.texto_relacionado)}"
                </div>
                <div class="dt-footer">
                    <button id="btn-read-daily-text" class="btn-read-dt ${isRead ? 'completed' : ''}" ${isRead ? 'disabled' : ''}>
                        ${isRead ? '✓ Leído hoy ✨ (+5 min)' : '✓ Ya se leyó (+5 min)'}
                    </button>
                </div>
            </div>
        `;

        const toggleHeader = document.getElementById("dt-toggle-header");
        const expandBtn = document.getElementById("btn-dt-expand");
        const collapsible = document.getElementById("dt-collapsible-content");

        const toggleExpand = (e) => {
            if (e.target.closest("#btn-read-daily-text")) return;

            const isHidden = collapsible.classList.contains("hidden");
            if (isHidden) {
                collapsible.classList.remove("hidden");
                expandBtn.textContent = "➖";
            } else {
                collapsible.classList.add("hidden");
                expandBtn.textContent = "➕";
            }
        };

        toggleHeader?.addEventListener("click", toggleExpand);

        if (!isRead) {
            document.getElementById("btn-read-daily-text")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.handleMarkDailyTextRead(todayStr);
            });
        }
    },

    async handleMarkDailyTextRead(todayStr) {
        const btn = document.getElementById("btn-read-daily-text");
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Guardando...";
        }

        const progressData = {
            tipo_actividad: "estudio_personal",
            minutos_invertidos: 5,
            fecha: new Date().toISOString()
        };

        const { data, error } = await DB.createSpiritualProgress(progressData);
        if (error) {
            this.showToast("Error al registrar los 5 minutos.", "error");
            if (btn) {
                btn.disabled = false;
                btn.textContent = "✓ Ya se leyó (+5 min)";
            }
            return;
        }

        localStorage.setItem(`laurita_read_dt_${todayStr}`, "true");
        this.showToast("¡Excelente Laurita! 📖 Se han sumado 5 minutos a tu progreso espiritual.", "success");
        
        // Mantener el texto abierto mostrando el nuevo estado completado
        const collapsible = document.getElementById("dt-collapsible-content");
        const expandBtn = document.getElementById("btn-dt-expand");
        const wasOpen = collapsible && !collapsible.classList.contains("hidden");

        await this.loadDailyTextHome();

        if (wasOpen) {
            document.getElementById("dt-collapsible-content")?.classList.remove("hidden");
            const newBtn = document.getElementById("btn-dt-expand");
            if (newBtn) newBtn.textContent = "➖";
        }
    },

    // --- MÓDULO ADMIN DE TEXTOS DIARIOS ---
    async loadAdminDailyTexts() {
        const container = document.getElementById("admin-dt-list-container");
        if (!container) return;

        container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando textos programados...</p></div>`;

        const { data, error } = await DB.getAllDailyTexts();
        if (error || !data || data.length === 0) {
            container.innerHTML = `<p class="empty-state">No hay textos diarios programados aún.</p>`;
            return;
        }

        this.state.dailyTexts = data;

        let html = "";
        data.forEach(item => {
            html += `
                <div class="history-row">
                    <div>
                        <div style="font-weight: 700; color: var(--primary-teal);">${this.escapeHtml(item.versiculo)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">${this.escapeHtml(item.texto_relacionado)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">📅 Corresponde al: ${this.formatNiceDate(item.fecha)}</div>
                    </div>
                    <button class="btn-danger-sm" onclick="App.handleDeleteDailyText('${item.id}')">🗑️ Eliminar</button>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    async handleSaveDailyText(e) {
        e.preventDefault();
        const dateVal = document.getElementById("admin-dt-date").value;
        const verse = document.getElementById("admin-dt-verse").value.trim();
        const text = document.getElementById("admin-dt-text").value.trim();

        if (!dateVal || !verse || !text) {
            this.showToast("Completa la fecha, versículo y texto del día.", "error");
            return;
        }

        const textData = {
            fecha: dateVal,
            versiculo: verse,
            texto_relacionado: text
        };

        const { data, error } = await DB.saveDailyText(textData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al guardar: ${formatted.title}`, "error");
            return;
        }

        this.showToast("¡Texto diario guardado con éxito!", "success");
        document.getElementById("form-admin-daily-text").reset();
        document.getElementById("admin-dt-date").value = new Date().toISOString().split("T")[0];
        this.loadAdminDailyTexts();
    },

    async handleDeleteDailyText(id) {
        if (!confirm("¿Deseas eliminar este texto diario programado?")) return;

        const res = await DB.deleteDailyText(id);
        if (res.success) {
            this.showToast("Texto diario eliminado.", "success");
            this.loadAdminDailyTexts();
        } else {
            this.showToast("Error al eliminar.", "error");
        }
    },

    // --- DIAGNÓSTICO SUPABASE ---
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
            let actName = activityNames[item.tipo_actividad] || item.tipo_actividad;
            if (item.tipo_actividad === "predicar" && item.subtipo) {
                actName = `🚪 Predicación (${item.subtipo})`;
            }

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

        const isDark = this.state.theme === "dark";
        const textColor = isDark ? "#cbd5e1" : "#64748b";

        this.state.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Predicar', 'Reuniones', 'Pers. Profundo', 'En Grupo', 'Tiempo Libre'],
                datasets: [{
                    label: 'Horas acumuladas',
                    data: dataHours,
                    backgroundColor: [
                        '#14b8a6',
                        '#a78bfa',
                        '#60a5fa',
                        '#fbbf24',
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
                    x: {
                        ticks: { color: textColor }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        title: { display: true, text: 'Horas', color: textColor }
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
        const subOption = document.getElementById("log-preaching-suboption").value;

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

        if (activityType === "predicar" && subOption) {
            progressData.subtipo = subOption;
        }

        const { data, error } = await DB.createSpiritualProgress(progressData);
        if (error) {
            const formatted = DB.formatError(error);
            this.showToast(`Error al guardar: ${formatted.title}`, "error");
            this.runDiagnostic();
            return;
        }

        this.showToast("¡Registro de tiempo guardado con éxito! 🌟", "success");
        document.getElementById("form-log-progress").reset();
        document.getElementById("preaching-suboption-container")?.classList.add("hidden");
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
    formatNiceDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            return dateObj.toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short' });
        }
        return dateStr;
    },

    showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
