class Planner {
  constructor() {
    this.plannerData = {};
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
    this.sections = document.querySelectorAll('.content[contenteditable="true"]');
    this.quoteElement = document.getElementById('motivationalQuote');
    this.exportButton = document.getElementById('exportData');
    this.importButton = document.getElementById('importData');
    this.themeButton = document.getElementById('themeToggle');
    this.fileInput = document.getElementById('fileInput');
  }

  setupEventListeners() {
    this.sections.forEach(section => {
      section.addEventListener('blur', () => this.saveData());
    });
  }

  setupDataControls() {
    this.exportButton.addEventListener('click', () => this.exportData());
    this.importButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.importData(e));
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
      data[key] = JSON.parse(localStorage.getItem(key));
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

  updateMotivationalQuote() {
    const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
    this.quoteElement.textContent = this.motivationalQuotes[randomIndex];
  }

  loadData() {
    const savedData = localStorage.getItem('plannerData');
    
    if (savedData) {
      const data = JSON.parse(savedData);
      this.sections.forEach((section, index) => {
        section.innerHTML = data[index] || '';
      });
    } else {
      this.sections.forEach(section => {
        section.innerHTML = '';
      });
    }
  }

  saveData() {
    const data = Array.from(this.sections).map(section => section.innerHTML);
    localStorage.setItem('plannerData', JSON.stringify(data));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Planner();
});