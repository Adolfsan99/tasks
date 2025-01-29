export class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('taskManagerProTasks_v2')) || [];
    this.ensureEditModalExists();
    this.initializeTheme();
  }

  // New method to ensure edit modal exists
  ensureEditModalExists() {
    if (!document.getElementById('editTaskModal')) {
      this.createEditModal();
    }
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('taskManagerTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskManagerTheme', newTheme);
  }

  createTask(taskData) {
    const task = {
      id: Date.now(),
      ...taskData,
      completed: false,
      rewards: taskData.rewards || []
    };
    this.tasks.push(task);
    this.saveTasks();
    return task;
  }

  updateTask(taskId, updatedData) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedData };
      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.saveTasks();
    this.renderTasks();
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(task => task.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  }

  filterTasksByMoment(moment) {
    const pendingTasks = document.getElementById('pendingTasks');
    pendingTasks.innerHTML = '<h2>Tareas Pendientes</h2>';

    const filteredTasks = moment 
        ? this.tasks.filter(task => !task.completed && task.momentoDia === moment)
        : this.tasks.filter(task => !task.completed);

    this.renderFilteredTasks(filteredTasks, pendingTasks);
  }

  renderFilteredTasks(tasks, container) {
    tasks.sort((a, b) => new Date(a.fechaFinal) - new Date(b.fechaFinal));
    tasks.forEach(task => this.renderTask(task, container));
  }

  renderTasks() {
    const pendingTasks = document.getElementById('pendingTasks');
    const completedTasks = document.getElementById('completedTasks');

    pendingTasks.innerHTML = '<h2>Tareas Pendientes</h2>';
    completedTasks.innerHTML = '<h2>Tareas Completadas</h2>';

    const pendingList = this.tasks.filter(task => !task.completed);
    const completedList = this.tasks.filter(task => task.completed);

    pendingList.sort((a, b) => new Date(a.fechaFinal) - new Date(b.fechaFinal));
    completedList.sort((a, b) => new Date(b.fechaFinal) - new Date(a.fechaFinal));

    pendingList.forEach(task => this.renderTask(task, pendingTasks));
    completedList.forEach(task => this.renderTask(task, completedTasks));
  }

  renderTask(task, container) {
    const allSubtasksCompleted = () => {
      const checkArrayComplete = (arr) => arr && arr.length > 0 ? arr.every(item => item.completed) : true;
      return checkArrayComplete(task.pasos);
    };

    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item');
    if (task.completed) taskElement.classList.add('completed');

    // Generate HTML for subtasks with their completed state
    const renderSubtaskList = (subtasks) => {
      if (!subtasks || subtasks.length === 0) return '';
      return subtasks.map((subtask, index) => `
        <div class="subtask">
          <input type="checkbox" 
                 id="subtask-${task.id}-${index}" 
                 ${subtask.completed ? 'checked' : ''}>
          <label for="subtask-${task.id}-${index}">${subtask.text}</label>
        </div>
      `).join('');
    };
  
    taskElement.innerHTML = `
      <div class="task-header">
        <h3>${task.titulo}</h3>
        <button class="edit-task" data-id="${task.id}">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      <p><strong>Momento:</strong> ${task.momentoDia}</p>
      <p><strong>Plazo:</strong> ${task.fechaInicial} - ${task.fechaFinal}</p>
      
      ${task.completed ? `
        <div class="rewards-section">
          <h4>Recompensas</h4>
          ${renderSubtaskList(task.rewards)}
        </div>
      ` : `
        <div class="task-details">
          <details class="task-details-section">
            <summary>Detalles</summary>
            <p class="pros-text"><strong>Pros:</strong> ${task.pros}</p>
            <p class="contras-text"><strong>Contras:</strong> ${task.contras}</p>
          </details>

          <details class="task-details-section obstaculos-section">
            <summary>Obstáculos</summary>
            ${renderSubtaskList(task.obstaculos)}
          </details>

          <details class="task-details-section soluciones-section">
            <summary>Soluciones</summary>
            ${renderSubtaskList(task.soluciones)}
          </details>

          <details class="task-details-section pasos-section">
            <summary>Pasos</summary>
            ${renderSubtaskList(task.pasos)}
          </details>

          <details class="task-details-section recompensas-section">
            <summary>Recompensas</summary>
            ${renderSubtaskList(task.rewards)}
          </details>
        </div>
      `}

      <div class="task-actions">
        ${task.completed ? `
          <button class="toggle-complete" data-id="${task.id}">
            Restaurar
          </button>
        ` : `
          <button class="toggle-complete" data-id="${task.id}">
            Completar
          </button>
        `}
        <button class="delete-task" data-id="${task.id}">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    `;

    const deleteTaskBtn = taskElement.querySelector('.delete-task');
    deleteTaskBtn.addEventListener('click', () => {
      this.deleteTask(task.id);
    });

    const editTaskBtn = taskElement.querySelector('.edit-task');
    editTaskBtn.addEventListener('click', () => {
      this.editTask(task);
    });

    const toggleCompleteBtn = taskElement.querySelector('.toggle-complete');
    if (toggleCompleteBtn) {
      toggleCompleteBtn.addEventListener('click', () => {
        this.toggleTaskCompletion(task.id);
      });
    }

    // Añadir eventos para subtareas
    this.addSubtaskEvents(taskElement, task);

    // After rendering, restore the open state of details elements
    const detailsElements = taskElement.querySelectorAll('details');
    detailsElements.forEach(details => {
      const sectionName = details.className.split(' ')[1];
      const isOpen = localStorage.getItem(`${task.id}-${sectionName}-open`);
      if (isOpen === 'true') {
        details.setAttribute('open', '');
      }

      // Save open/closed state when toggled
      details.addEventListener('toggle', () => {
        localStorage.setItem(`${task.id}-${sectionName}-open`, details.open);
      });
    });

    container.appendChild(taskElement);
  }

  addSubtaskEvents(taskElement, task) {
    const subtaskCheckboxes = taskElement.querySelectorAll('input[type="checkbox"]');
    subtaskCheckboxes.forEach((checkbox, index) => {
      checkbox.addEventListener('change', (e) => {
        // Find the task in the tasks array
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex === -1) return;

        // Find the closest details or section container
        let container = checkbox.closest('.subtask').parentElement;
        if (!container) return;

        // Determine subtask type based on container class or content
        let subtaskType;
        if (container.matches('.obstaculos-section, #editObstaculosContainer') || container.closest('details')?.querySelector('summary')?.textContent.includes('Obstáculos')) {
          subtaskType = 'obstaculos';
        } else if (container.matches('.soluciones-section, #editSolucionesContainer') || container.closest('details')?.querySelector('summary')?.textContent.includes('Soluciones')) {
          subtaskType = 'soluciones';
        } else if (container.matches('.pasos-section, #editPasosContainer') || container.closest('details')?.querySelector('summary')?.textContent.includes('Pasos')) {
          subtaskType = 'pasos';
        } else if (container.matches('.recompensas-section, #editRecompensasContainer') || container.closest('details')?.querySelector('summary')?.textContent.includes('Recompensas')) {
          subtaskType = 'rewards';
        }

        // Get all checkboxes in the current section to find the correct index
        const sectionCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
        const currentIndex = sectionCheckboxes.indexOf(checkbox);

        if (subtaskType && this.tasks[taskIndex][subtaskType] && this.tasks[taskIndex][subtaskType][currentIndex]) {
          this.tasks[taskIndex][subtaskType][currentIndex].completed = e.target.checked;
          this.saveTasks();
        }
      });
    });
  }

  addSubtaskField(container, type) {
    const subtaskField = document.createElement('div');
    subtaskField.classList.add('subtask');
    subtaskField.innerHTML = `
      <input type="text" placeholder="Descripción del ${type}">
      <button type="button" class="remove-subtask">-</button>
    `;

    subtaskField.querySelector('.remove-subtask').addEventListener('click', () => {
      container.removeChild(subtaskField);
    });

    container.appendChild(subtaskField);
  }

  getSubtasks(container) {
    return Array.from(container.querySelectorAll('input[type="text"]'))
      .map(input => ({
        text: input.value,
        completed: false
      }))
      .filter(subtask => subtask.text.trim() !== '');
  }

  editTask(task) {
    // Ensure edit modal exists
    this.ensureEditModalExists();

    const editModal = document.getElementById('editTaskModal');
    if (!editModal) {
      console.error('Edit modal could not be created');
      return;
    }

    // Defensive checks for all edit form elements
    const editTitulo = document.getElementById('editTitulo');
    const editPros = document.getElementById('editPros');
    const editContras = document.getElementById('editContras');
    const editFechaInicial = document.getElementById('editFechaInicial');
    const editFechaFinal = document.getElementById('editFechaFinal');
    const editMomentoDiaSelect = document.getElementById('editMomentoDiaSelect');
    const editObstaculosContainer = document.getElementById('editObstaculosContainer');
    const editSolucionesContainer = document.getElementById('editSolucionesContainer');
    const editPasosContainer = document.getElementById('editPasosContainer');
    const editRecompensasContainer = document.getElementById('editRecompensasContainer');

    // Comprehensive null checks
    const editElements = [
      editTitulo, editPros, editContras, 
      editFechaInicial, editFechaFinal, 
      editMomentoDiaSelect, 
      editObstaculosContainer, 
      editSolucionesContainer, 
      editPasosContainer,
      editRecompensasContainer
    ];

    if (editElements.some(el => el === null)) {
      console.error('One or more edit form elements are missing');
      this.createEditModal(); // Recreate modal if elements are missing
      return;
    }

    // Populate modal with task details
    editTitulo.value = task.titulo || '';
    editPros.value = task.pros || '';
    editContras.value = task.contras || '';
    editFechaInicial.value = task.fechaInicial || '';
    editFechaFinal.value = task.fechaFinal || '';
    editMomentoDiaSelect.value = task.momentoDia || 'Dia';

    // Populate subtasks
    this.populateSubtaskFields('editObstaculosContainer', task.obstaculos || []);
    this.populateSubtaskFields('editSolucionesContainer', task.soluciones || []);
    this.populateSubtaskFields('editPasosContainer', task.pasos || []);
    this.populateSubtaskFields('editRecompensasContainer', task.rewards || []);

    // Store current task ID for update
    editModal.dataset.taskId = task.id;

    // Show modal
    editModal.style.display = 'flex';
  }

  createEditModal() {
    const modalHTML = `
      <div id="editTaskModal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3>Editar Tarea</h3>
          <form id="editTaskForm">
            <input type="text" id="editTitulo" placeholder="Título" required>
            <textarea id="editPros" placeholder="Pros"></textarea>
            <textarea id="editContras" placeholder="Contras"></textarea>
            
            <div class="date-range">
              <label>Fecha Inicial</label>
              <input type="date" id="editFechaInicial">
              <label>Fecha Final</label>
              <input type="date" id="editFechaFinal">
            </div>

            <select id="editMomentoDiaSelect">
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Dia">Día</option>
              <option value="Madrugada">Madrugada</option>
            </select>

            <div class="subtask-section">
              <h4>Obstáculos</h4>
              <div id="editObstaculosContainer"></div>
              <button type="button" id="editAddObstaculo">+ Añadir Obstáculo</button>
            </div>

            <div class="subtask-section">
              <h4>Soluciones</h4>
              <div id="editSolucionesContainer"></div>
              <button type="button" id="editAddSolucion">+ Añadir Solución</button>
            </div>

            <div class="subtask-section">
              <h4>Pasos</h4>
              <div id="editPasosContainer"></div>
              <button type="button" id="editAddPaso">+ Añadir Paso</button>
            </div>

            <div class="subtask-section">
              <h4>Recompensas</h4>
              <div id="editRecompensasContainer"></div>
              <button type="button" id="editAddRecompensa">+ Añadir Recompensa</button>
            </div>

            <button type="submit">Guardar Cambios</button>
          </form>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML.trim();
    document.body.appendChild(tempDiv.firstChild);

    const editModal = document.getElementById('editTaskModal');
    const closeModalBtn = editModal.querySelector('.close-modal');
    const editTaskForm = document.getElementById('editTaskForm');

    closeModalBtn.addEventListener('click', () => {
      editModal.style.display = 'none';
    });

    // Add event listeners for adding subtasks
    document.getElementById('editAddObstaculo').addEventListener('click', () => {
      this.addSubtaskField(document.getElementById('editObstaculosContainer'), 'obstaculo');
    });

    document.getElementById('editAddSolucion').addEventListener('click', () => {
      this.addSubtaskField(document.getElementById('editSolucionesContainer'), 'solucion');
    });

    document.getElementById('editAddPaso').addEventListener('click', () => {
      this.addSubtaskField(document.getElementById('editPasosContainer'), 'paso');
    });

    document.getElementById('editAddRecompensa').addEventListener('click', () => {
      this.addSubtaskField(document.getElementById('editRecompensasContainer'), 'recompensa');
    });

    editTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskId = parseInt(editModal.dataset.taskId);

      const updatedTask = {
        titulo: document.getElementById('editTitulo').value,
        pros: document.getElementById('editPros').value,
        contras: document.getElementById('editContras').value,
        fechaInicial: document.getElementById('editFechaInicial').value,
        fechaFinal: document.getElementById('editFechaFinal').value,
        momentoDia: document.getElementById('editMomentoDiaSelect').value,
        obstaculos: this.getSubtasks(document.getElementById('editObstaculosContainer')),
        soluciones: this.getSubtasks(document.getElementById('editSolucionesContainer')),
        pasos: this.getSubtasks(document.getElementById('editPasosContainer')),
        rewards: this.getSubtasks(document.getElementById('editRecompensasContainer'))
      };

      this.updateTask(taskId, updatedTask);
      editModal.style.display = 'none';
    });
  }

  populateSubtaskFields(containerId, subtasks) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing fields

    if (subtasks && subtasks.length > 0) {
      subtasks.forEach(subtask => {
        const subtaskField = document.createElement('div');
        subtaskField.classList.add('subtask');
        subtaskField.innerHTML = `
          <input type="text" value="${subtask.text}" placeholder="Descripción">
          <button type="button" class="remove-subtask">-</button>
        `;

        subtaskField.querySelector('.remove-subtask').addEventListener('click', () => {
          container.removeChild(subtaskField);
        });

        container.appendChild(subtaskField);
      });
    }
  }

  exportTasks(event) {
    event.preventDefault(); // Prevent default link behavior
    const tasks = JSON.parse(localStorage.getItem('taskManagerProTasks_v2')) || [];
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importTasks(event) {
    event.preventDefault(); // Prevent default link behavior
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
  }

  handleImportFile(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTasks = JSON.parse(e.target.result);
          if (Array.isArray(importedTasks)) {
            const existingTasks = JSON.parse(localStorage.getItem('taskManagerProTasks_v2')) || [];
            const mergedTasks = [...existingTasks, ...importedTasks];
            
            const uniqueTasks = mergedTasks.filter((task, index, self) =>
              index === self.findIndex((t) => t.id === task.id)
            );

            localStorage.setItem('taskManagerProTasks_v2', JSON.stringify(uniqueTasks));
            this.tasks = uniqueTasks;
            this.renderTasks();
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
  }

  saveTasks() {
    localStorage.setItem('taskManagerProTasks_v2', JSON.stringify(this.tasks));
  }
}