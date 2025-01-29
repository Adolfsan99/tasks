import { TaskManager } from './taskManager.js';
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/+esm';

const motivationalQuotes = [
    "Lo más difícil de hacer algo es empezar",
    "No tener disciplina es una forma de autosabotaje",
    "Debes pensar siempre en que paso es el siguiente y ser persistente",
    "Más confianza, menos negativismo",
    "Los días son diferentes, así que siempre hay oportunidades",
    "Cada quien piensa en lo que necesita",
    "La valentía no es la ausencia del miedo; es la persistencia a pesar del miedo"
];

// Function to display a random motivational quote
function displayRandomQuote() {
    const quoteElement = document.getElementById('quote-text');
    if (quoteElement) {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        quoteElement.textContent = motivationalQuotes[randomIndex];
    }
}

// Ensure quote is displayed after full page load
window.addEventListener('load', () => {
    displayRandomQuote();
});

document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();

    // Add theme toggle button event listener
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('change', () => {
        taskManager.toggleTheme();
    });

    // Navigation Tabs and Drag & Drop
    const navTabs = document.querySelectorAll('.nav-tab');
    const taskColumns = document.querySelectorAll('.task-column');

    if (navTabs.length > 0 && taskColumns.length > 0) {
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and columns
                navTabs.forEach(t => t.classList.remove('active'));
                taskColumns.forEach(col => col.classList.remove('active'));

                // Add active class to clicked tab and corresponding column
                tab.classList.add('active');
                const targetColumn = document.getElementById(tab.dataset.tab);
                if (targetColumn) {
                    targetColumn.classList.add('active');
                }
            });
        });

        // Add Drag and Drop functionality to task columns
        const pendingTasksColumn = document.getElementById('pendingTasks');
        const completedTasksColumn = document.getElementById('completedTasks');

        if (pendingTasksColumn && completedTasksColumn && window.Sortable) {
            Sortable.create(pendingTasksColumn, {
                group: 'tasks',
                animation: 150,
                onEnd: (evt) => {
                    // Optional: Implement task reordering logic if needed
                    taskManager.saveTasks();
                }
            });

            Sortable.create(completedTasksColumn, {
                group: 'tasks',
                animation: 150,
                onEnd: (evt) => {
                    // Optional: Implement task reordering logic if needed
                    taskManager.saveTasks();
                }
            });
        }
    }

    // Floating Action Button
    const addTaskFab = document.getElementById('addTaskFab');
    const taskFormModal = document.getElementById('taskFormModal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (addTaskFab && taskFormModal && closeModalBtn) {
        addTaskFab.addEventListener('click', () => {
            taskFormModal.style.display = 'flex';
        });

        closeModalBtn.addEventListener('click', () => {
            taskFormModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === taskFormModal) {
                taskFormModal.style.display = 'none';
            }
        });
    }

    // Nueva tarea formulario
    const newTaskForm = document.getElementById('newTaskForm');
    const obstaculosContainer = document.getElementById('obstaculosContainer');
    const solucionesContainer = document.getElementById('solucionesContainer');
    const pasosContainer = document.getElementById('pasosContainer');
    const recompensasContainer = document.getElementById('recompensasContainer');

    // Defensive checks for critical elements
    if (!newTaskForm || !obstaculosContainer || !solucionesContainer || !pasosContainer || !recompensasContainer) {
        console.error('Critical form elements are missing');
        return;
    }

    // Botones para añadir subtareas
    const addObstaculoBtn = document.getElementById('addObstaculo');
    const addSolucionBtn = document.getElementById('addSolucion');
    const addPasoBtn = document.getElementById('addPaso');
    const addRecompensaBtn = document.getElementById('addRecompensa');

    if (addObstaculoBtn) {
        addObstaculoBtn.addEventListener('click', () => {
            taskManager.addSubtaskField(obstaculosContainer, 'obstaculo');
        });
    }

    if (addSolucionBtn) {
        addSolucionBtn.addEventListener('click', () => {
            taskManager.addSubtaskField(solucionesContainer, 'solucion');
        });
    }

    if (addPasoBtn) {
        addPasoBtn.addEventListener('click', () => {
            taskManager.addSubtaskField(pasosContainer, 'paso');
        });
    }

    if (addRecompensaBtn) {
        addRecompensaBtn.addEventListener('click', () => {
            taskManager.addSubtaskField(recompensasContainer, 'recompensa');
        });
    }

    // Envío del formulario
    newTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Defensive checks for form fields
        const titulo = document.getElementById('titulo');
        const pros = document.getElementById('pros');
        const contras = document.getElementById('contras');
        const fechaInicial = document.getElementById('fechaInicial');
        const fechaFinal = document.getElementById('fechaFinal');
        const momentoDiaSelect = document.getElementById('momentoDiaSelect');

        if (!titulo || !pros || !contras || !fechaInicial || !fechaFinal || !momentoDiaSelect) {
            console.error('Form fields are missing');
            return;
        }

        const task = taskManager.createTask({
            titulo: titulo.value,
            pros: pros.value,
            contras: contras.value,
            fechaInicial: fechaInicial.value,
            fechaFinal: fechaFinal.value,
            momentoDia: momentoDiaSelect.value,
            obstaculos: taskManager.getSubtasks(obstaculosContainer),
            soluciones: taskManager.getSubtasks(solucionesContainer),
            pasos: taskManager.getSubtasks(pasosContainer),
            rewards: taskManager.getSubtasks(recompensasContainer)
        });

        // Limpiar formulario
        newTaskForm.reset();
        obstaculosContainer.innerHTML = '';
        solucionesContainer.innerHTML = '';
        pasosContainer.innerHTML = '';
        recompensasContainer.innerHTML = '';

        // Ocultar modal
        if (taskFormModal) {
            taskFormModal.style.display = 'none';
        }

        taskManager.renderTasks();
    });

    // Filtro por momento del día
    const momentoDiaFilter = document.getElementById('momentoDia');
    if (momentoDiaFilter) {
        momentoDiaFilter.addEventListener('change', (e) => {
            taskManager.filterTasksByMoment(e.target.value);
        });
    }

    // Export Tasks
    const exportTasksBtn = document.getElementById('exportTasks');
    if (exportTasksBtn) {
        exportTasksBtn.addEventListener('click', (event) => {
            taskManager.exportTasks(event);
        });
    }

    // Import Tasks
    const importTasksBtn = document.getElementById('importTasks');
    const importFileInput = document.getElementById('importFileInput');
    
    if (importTasksBtn && importFileInput) {
        importTasksBtn.addEventListener('click', (event) => {
            taskManager.importTasks(event);
        });

        importFileInput.addEventListener('change', (event) => {
            taskManager.handleImportFile(event);
        });
    }

    // Añadir evento global para edición de tareas
    document.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-task');
        if (editButton) {
            const taskId = parseInt(editButton.getAttribute('data-id'));
            if (isNaN(taskId)) {
                console.error('Invalid task ID');
                return;
            }
            
            const task = taskManager.tasks.find(t => t.id === taskId);
            if (task) {
                taskManager.editTask(task);
            } else {
                console.error('Task not found', taskId);
            }
        }
    });

    // Ensure quote is displayed (additional safeguard)
    displayRandomQuote();

    // Renderizar tareas inicial
    taskManager.renderTasks();
});