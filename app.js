import { TaskManager } from './taskManager.js';
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/+esm';

document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();

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

    // Defensive checks for critical elements
    if (!newTaskForm || !obstaculosContainer || !solucionesContainer || !pasosContainer) {
        console.error('Critical form elements are missing');
        return;
    }

    // Botones para añadir subtareas
    const addObstaculoBtn = document.getElementById('addObstaculo');
    const addSolucionBtn = document.getElementById('addSolucion');
    const addPasoBtn = document.getElementById('addPaso');

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
            pasos: taskManager.getSubtasks(pasosContainer)
        });

        // Limpiar formulario
        newTaskForm.reset();
        obstaculosContainer.innerHTML = '';
        solucionesContainer.innerHTML = '';
        pasosContainer.innerHTML = '';

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
        exportTasksBtn.addEventListener('click', () => {
            const tasks = JSON.parse(localStorage.getItem('taskManagerProTasks')) || [];
            const blob = new Blob([JSON.stringify(tasks, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Import Tasks
    const importFileInput = document.getElementById('importFileInput');
    const importTasksBtn = document.getElementById('importTasks');
    
    if (importTasksBtn && importFileInput) {
        importTasksBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedTasks = JSON.parse(e.target.result);
                        // Validate imported tasks
                        if (Array.isArray(importedTasks)) {
                            // Merge imported tasks with existing tasks
                            const existingTasks = JSON.parse(localStorage.getItem('taskManagerProTasks')) || [];
                            const mergedTasks = [...existingTasks, ...importedTasks];
                            
                            // Remove duplicates based on a unique identifier (e.g., id)
                            const uniqueTasks = mergedTasks.filter((task, index, self) =>
                                index === self.findIndex((t) => t.id === task.id)
                            );

                            localStorage.setItem('taskManagerProTasks', JSON.stringify(uniqueTasks));
                            taskManager.tasks = uniqueTasks;
                            taskManager.renderTasks();
                            alert('Tareas importadas exitosamente.');
                        } else {
                            throw new Error('Formato de archivo inválido');
                        }
                    } catch (error) {
                        console.error('Error importing tasks:', error);
                        alert('Error al importar tareas. Asegúrese de seleccionar un archivo JSON válido.');
                    }
                };
                reader.readAsText(file);
            }
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

    // Renderizar tareas inicial
    taskManager.renderTasks();
});