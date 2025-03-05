class Planner {
  constructor() {
    // Make planner globally available
    window.planner = this;
    
    this.objectives = [];
    this.reminders = [];
    this.tasks = [];
    this.rules = [];
    this.motivationalQuotes = [
      "Lo más difícil de hacer algo es empezar",
      "No tener disciplina es una forma de autosabotaje",
      "Debes pensar siempre en que paso es el siguiente y ser persistente",
      "Más confianza, menos negativismo",
      "Los días son diferentes, así que siempre hay oportunidades",
      "Cada quien piensa en lo que necesita",
      "La valentía no es la ausencia del miedo; es la persistencia a pesar del miedo"
    ];
    
    this.initializeElements();
    this.setupEventListeners();
    this.setupDataControls();
    this.loadData();
    this.updateMotivationalQuote();
    this.setupTheme();
  }

  initializeElements() {
    // Get all main elements
    this.quoteElement = document.getElementById('motivationalQuote');
    this.objectivesContainer = document.getElementById('objectives');
    this.remindersContainer = document.getElementById('reminders');
    this.tasksContainer = document.getElementById('tasks');
    this.rulesContainer = document.getElementById('rules');
    this.activitiesText = document.getElementById('activities');
    
    // Get control buttons
    this.exportButton = document.getElementById('exportData');
    this.importButton = document.getElementById('importData');
    this.themeButton = document.getElementById('themeToggle');
    this.fileInput = document.getElementById('fileInput');
  }

  setupEventListeners() {
    // Add button listeners
    document.getElementById('addObjective').addEventListener('click', () => this.addItem('objective'));
    document.getElementById('addReminder').addEventListener('click', () => this.addItem('reminder'));
    document.getElementById('addTask').addEventListener('click', () => this.addItem('task'));
    document.getElementById('addRule').addEventListener('click', () => this.addItem('rule'));
    
    // Activities text area
    this.activitiesText.addEventListener('input', () => this.saveData());
  }

  setupDataControls() {
    this.exportButton.addEventListener('click', () => this.exportData());
    this.importButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.importData(e));
  }

  addItem(type) {
    const text = prompt(`Enter new ${type}:`);
    if (!text) return;

    const item = {
      id: Date.now(),
      text,
      completed: false
    };

    if (type === 'task') {
      const objectives = this.objectives.map(o => o.text);
      if (objectives.length > 0) {
        const objectiveOptions = objectives.join('\n');
        const selectedObjective = prompt(`Enter objective name to link (available objectives):\n${objectiveOptions}`);
        if (selectedObjective && objectives.includes(selectedObjective)) {
          item.objectiveName = selectedObjective;
        }
      }
    }

    switch(type) {
      case 'objective':
        this.objectives.push(item);
        break;
      case 'reminder':
        this.reminders.push(item);
        break;
      case 'task':
        this.tasks.push(item);
        break;
      case 'rule':
        this.rules.push(item);
        break;
    }

    this.renderItems();
    this.saveData();
  }

  toggleComplete(type, id) {
    const items = this[type];
    const item = items.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      this.renderItems();
      this.saveData();
    }
  }

  deleteItem(type, id) {
    this[type] = this[type].filter(item => item.id !== id);
    this.renderItems();
    this.saveData();
  }

  renderItems() {
    // Update objective rendering to use names instead of IDs
    this.objectivesContainer.innerHTML = this.objectives.map(obj => {
      const tasks = this.tasks.filter(t => t.objectiveName === obj.text);
      const progress = tasks.length ? 
        (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
      
      return `
        <div class="item" data-id="${obj.id}">
          <div class="item-content">
            <span class="item-text">${obj.text}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
          <button class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    this.remindersContainer.innerHTML = this.reminders.map(rem => {
      return `
        <div class="item" data-id="${rem.id}">
          <div class="item-content">
            <span class="item-text">${rem.text}</span>
          </div>
          <button class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    this.tasksContainer.innerHTML = this.tasks.map(task => {
      const objectiveText = task.objectiveName ? `(${task.objectiveName})` : '';
      
      return `
        <div class="item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <div class="item-content">
            <input type="checkbox" 
              ${task.completed ? 'checked' : ''} 
              class="checkbox"
            >
            <span class="item-text">${task.text} ${objectiveText}</span>
          </div>
          <button class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    this.rulesContainer.innerHTML = this.rules.map(rule => {
      return `
        <div class="item ${rule.completed ? 'completed' : ''}" data-id="${rule.id}">
          <div class="item-content">
            <input type="checkbox" 
              ${rule.completed ? 'checked' : ''} 
              class="checkbox"
            >
            <span class="item-text">${rule.text}</span>
          </div>
          <button class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    // Add event listeners after rendering
    this.setupItemEventListeners();
  }

  setupItemEventListeners() {
    // Setup objectives event listeners
    this.objectivesContainer.querySelectorAll('.item').forEach(item => {
      const id = parseInt(item.dataset.id);
      item.querySelector('.item-text').addEventListener('click', () => this.editItem('objectives', id));
      item.querySelector('.delete-btn').addEventListener('click', () => this.deleteItem('objectives', id));
    });

    // Setup reminders event listeners
    this.remindersContainer.querySelectorAll('.item').forEach(item => {
      const id = parseInt(item.dataset.id);
      item.querySelector('.item-text').addEventListener('click', () => this.editItem('reminders', id));
      item.querySelector('.delete-btn').addEventListener('click', () => this.deleteItem('reminders', id));
    });

    // Setup tasks event listeners
    this.tasksContainer.querySelectorAll('.item').forEach(item => {
      const id = parseInt(item.dataset.id);
      item.querySelector('.checkbox').addEventListener('change', (e) => this.toggleComplete('tasks', id));
      item.querySelector('.item-text').addEventListener('click', () => this.editItem('tasks', id));
      item.querySelector('.delete-btn').addEventListener('click', () => this.deleteItem('tasks', id));
    });

    // Setup rules event listeners
    this.rulesContainer.querySelectorAll('.item').forEach(item => {
      const id = parseInt(item.dataset.id);
      item.querySelector('.checkbox').addEventListener('change', (e) => this.toggleComplete('rules', id));
      item.querySelector('.item-text').addEventListener('click', () => this.editItem('rules', id));
      item.querySelector('.delete-btn').addEventListener('click', () => this.deleteItem('rules', id));
    });
  }

  editItem(type, id) {
    const items = this[type];
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newText = prompt(`Edit ${type.slice(0, -1)}:`, item.text);
    if (!newText) return;

    item.text = newText;

    if (type === 'tasks') {
      const objectives = this.objectives.map(o => o.text);
      if (objectives.length > 0) {
        const objectiveOptions = objectives.join('\n');
        const selectedObjective = prompt(`Enter objective name to link (available objectives):\n${objectiveOptions}\nCurrent: ${item.objectiveName || 'none'}`, item.objectiveName || '');
        if (selectedObjective === '') {
          delete item.objectiveName;
        } else if (objectives.includes(selectedObjective)) {
          item.objectiveName = selectedObjective;
        }
      }
    }

    this.renderItems();
    this.saveData();
  }

  saveData() {
    const data = {
      objectives: this.objectives,
      reminders: this.reminders,
      tasks: this.tasks,
      rules: this.rules,
      activities: this.activitiesText.value
    };
    localStorage.setItem('plannerData', JSON.stringify(data));
  }

  loadData() {
    const data = JSON.parse(localStorage.getItem('plannerData') || '{}');
    this.objectives = data.objectives || [];
    this.reminders = data.reminders || [];
    this.tasks = data.tasks || [];
    this.rules = data.rules || [];
    this.activitiesText.value = data.activities || '';
    this.renderItems();
  }

  updateMotivationalQuote() {
    const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
    this.quoteElement.textContent = this.motivationalQuotes[randomIndex];
  }

  setupTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(currentTheme);

    this.themeButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.updateThemeIcon(newTheme);
    });
  }

  updateThemeIcon(theme) {
    const icon = this.themeButton.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }

  getAllStorageData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        // Try to parse as JSON, if fails, store as plain string
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        // For non-JSON data like theme setting
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  exportData() {
    const data = this.getAllStorageData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planner_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importData(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const text = await file.text();
      const data = JSON.parse(text);

      // Save current theme
      const currentTheme = localStorage.getItem('theme');
      
      localStorage.clear();
      
      // Restore theme
      if (currentTheme) {
        localStorage.setItem('theme', currentTheme);
      }

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'theme') { // Don't override current theme
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      this.loadData();
      alert('Datos importados correctamente');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error al importar los datos. Por favor, verifica el formato del archivo.');
    }

    this.fileInput.value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Planner();
});