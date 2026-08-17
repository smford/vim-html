/**
 * vim-html — Master Application Controller
 * Handles UI interactions, toolbar buttons, drag-and-drop file imports, theme management,
 * modals, toast notifications, and metric telemetry tickers.
 */

class AppController {
  constructor() {
    this.currentTheme = localStorage.getItem('vim_theme') || 'gruvbox';
    this.isCrtEnabled = localStorage.getItem('vim_crt_enabled') === 'true';

    this.initDOM();
    this.initThemes();
    this.initAudioUI();
    this.initCRT();
    this.initModal();
    this.initToolbar();
    this.initDragAndDrop();
    this.startTelemetryLoop();
  }

  initDOM() {
    this.btnReboot = document.getElementById('btn-reboot');
    this.btnClear = document.getElementById('btn-clear');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnQuickNew = document.getElementById('btn-quick-new');
    this.btnQuickDownload = document.getElementById('btn-quick-download');
    this.btnExportZip = document.getElementById('btn-export-zip');
    this.btnImportVfs = document.getElementById('btn-import-vfs');
    this.vfsImporterInput = document.getElementById('vfs-importer-input');
    this.btnUploadFile = document.getElementById('btn-upload-file');
    this.fileUploaderInput = document.getElementById('file-uploader-input');
    
    this.btnThemePicker = document.getElementById('btn-theme-picker');
    this.themeMenu = document.getElementById('theme-menu');
    this.currentThemeLabel = document.getElementById('current-theme-label');
    
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIconOn = document.getElementById('sound-icon-on');
    this.soundIconOff = document.getElementById('sound-icon-off');

    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.btnHelpModal = document.getElementById('btn-help-modal');
    this.helpModal = document.getElementById('help-modal');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnModalGotIt = document.getElementById('btn-modal-got-it');
    this.modalTabs = document.querySelectorAll('.modal-tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    this.toastContainer = document.getElementById('toast-container');
    this.cpuVal = document.getElementById('cpu-val');
    this.memVal = document.getElementById('mem-val');
    this.vfsFileCount = document.getElementById('vfs-file-count');
  }

  initThemes() {
    this.setTheme(this.currentTheme);

    // Toggle dropdown
    this.btnThemePicker.addEventListener('click', (e) => {
      e.stopPropagation();
      this.btnThemePicker.parentElement.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      this.btnThemePicker.parentElement.classList.remove('open');
    });

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-set-theme');
        this.setTheme(t);
        this.btnThemePicker.parentElement.classList.remove('open');
      });
    });
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('vim_theme', themeName);
    
    const themeLabels = {
      'gruvbox': 'Gruvbox',
      'monokai': 'Monokai',
      'nord': 'Nord',
      'dracula': 'Dracula',
      'tokyonight': 'Tokyo Night',
      'onedark': 'One Dark',
      'solarized': 'Solarized',
      'retro-green': 'Retro Green',
      'retro-amber': 'Retro Amber'
    };

    if (this.currentThemeLabel) {
      this.currentThemeLabel.textContent = themeLabels[themeName] || themeName;
    }

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-set-theme') === themeName);
    });
  }

  initAudioUI() {
    const isSoundOn = window.soundFx.enabled;
    this.updateSoundIcons(isSoundOn);

    this.btnToggleSound.addEventListener('click', () => {
      const active = window.soundFx.toggle();
      this.updateSoundIcons(active);
      this.showToast(active ? 'Sound effects enabled' : 'Sound effects muted', 'info');
    });
  }

  updateSoundIcons(active) {
    if (active) {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
    } else {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
    }
  }

  initCRT() {
    if (this.isCrtEnabled) {
      this.crtOverlay.classList.remove('hidden');
    }

    this.btnToggleCrt.addEventListener('click', () => {
      this.isCrtEnabled = !this.isCrtEnabled;
      localStorage.setItem('vim_crt_enabled', this.isCrtEnabled ? 'true' : 'false');
      this.crtOverlay.classList.toggle('hidden', !this.isCrtEnabled);
      this.showToast(this.isCrtEnabled ? 'CRT Scanlines turned ON' : 'CRT Scanlines turned OFF', 'info');
    });
  }

  initModal() {
    this.btnHelpModal.addEventListener('click', () => this.openHelpModal());
    this.btnCloseModal.addEventListener('click', () => this.closeHelpModal());
    this.btnModalGotIt.addEventListener('click', () => this.closeHelpModal());

    this.modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        this.modalTabs.forEach(t => t.classList.remove('active'));
        this.tabPanes.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.helpModal.classList.contains('hidden')) {
        this.closeHelpModal();
      }
    });
  }

  openHelpModal() {
    this.helpModal.classList.remove('hidden');
  }

  closeHelpModal() {
    this.helpModal.classList.add('hidden');
    // Restore focus to active screen
    if (!document.getElementById('vim-screen').classList.contains('hidden')) {
      document.getElementById('vim-screen').focus();
    } else {
      window.terminalApp.focus();
    }
  }

  initToolbar() {
    // Reboot
    this.btnReboot.addEventListener('click', () => {
      window.bootSimulator.start();
    });

    // Clear
    this.btnClear.addEventListener('click', () => {
      if (window.terminalApp) {
        window.terminalApp.output.innerHTML = '';
      }
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Quick New File in Vim
    this.btnQuickNew.addEventListener('click', () => {
      const fileName = `scratch_${Date.now().toString().slice(-4)}.txt`;
      const targetPath = `/home/user/${fileName}`;
      window.terminalApp.dispatchCommand('vim', [targetPath]);
      this.showToast(`Opened ${fileName} in Vim`, 'info');
    });

    // Quick Download active file
    this.btnQuickDownload.addEventListener('click', () => {
      const vimScreen = document.getElementById('vim-screen');
      if (!vimScreen.classList.contains('hidden') && window.vimApp) {
        window.vimApp.executeCommand('download');
        this.showToast(`Downloaded ${window.vimApp.getFileName()}`, 'success');
      } else {
        // In terminal: download currently edited or welcome.txt
        const defaultFile = '/home/user/welcome.txt';
        window.vfs.downloadFile(defaultFile);
        this.showToast(`Downloaded welcome.txt`, 'success');
      }
    });

    // Export entire VFS backup
    if (this.btnExportZip) {
      this.btnExportZip.addEventListener('click', () => {
        window.vfs.exportAll();
        this.showToast('Exported entire filesystem as JSON backup', 'success');
      });
    }

    // Import VFS backup
    if (this.btnImportVfs) {
      this.btnImportVfs.addEventListener('click', () => {
        this.vfsImporterInput.click();
      });
    }

    if (this.vfsImporterInput) {
      this.vfsImporterInput.addEventListener('change', (e) => {
        this.handleUploadedFiles(e.target.files, true);
      });
    }

    // Upload files
    if (this.btnUploadFile) {
      this.btnUploadFile.addEventListener('click', () => {
        this.triggerFileUpload();
      });
    }

    if (this.fileUploaderInput) {
      this.fileUploaderInput.addEventListener('change', (e) => {
        this.handleUploadedFiles(e.target.files, false);
      });
    }
  }

  triggerFileUpload() {
    this.fileUploaderInput.click();
  }

  handleUploadedFiles(files, forceVfsImport = false) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;

        // Check if this file is a VFS backup (or forced via Import VFS button)
        let isBackup = forceVfsImport || file.name.endsWith('.json');
        if (isBackup) {
          try {
            const parsed = JSON.parse(content);
            if (window.vfs.isVfsBackup(parsed)) {
              const res = window.vfs.importTree(parsed);
              if (res.success) {
                this.updateSystemStatus();
                this.showToast(`Restored VFS (${res.filesRestored} files, ${res.dirsRestored} dirs)`, 'success');
                if (window.terminalApp) {
                  window.terminalApp.appendOutput(
                    `<span style="color:var(--accent-primary)">[✓] Virtual Filesystem restored successfully from <strong>${this.escapeHtml(file.name)}</strong> (${res.filesRestored} files, ${res.dirsRestored} directories).</span>`
                  );
                  window.terminalApp.scrollToBottom();
                }
                return;
              }
            }
          } catch (e) {
            // Not a valid JSON or not a backup, proceed to regular upload
          }
        }

        // Regular file upload into current working directory
        const targetDir = window.terminalApp ? window.terminalApp.cwd : '/home/user';
        const targetPath = `${targetDir}/${file.name}`;
        window.vfs.writeFile(targetPath, content);
        this.updateSystemStatus();
        this.showToast(`Uploaded ${file.name} to ${targetDir}`, 'success');
        if (window.terminalApp) {
          window.terminalApp.appendOutput(`<span style="color:var(--accent-primary)">[✓] Uploaded file: ${this.escapeHtml(file.name)} (${file.size} bytes)</span>`);
          window.terminalApp.scrollToBottom();
        }
      };
      reader.readAsText(file);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  initDragAndDrop() {
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleUploadedFiles(e.dataTransfer.files);
      }
    });
  }

  updateSystemStatus() {
    if (this.vfsFileCount) {
      const count = window.vfs.countFiles();
      this.vfsFileCount.textContent = `${count} files`;
    }
  }

  startTelemetryLoop() {
    setInterval(() => {
      if (this.cpuVal) {
        const randCpu = (Math.random() * 4.5 + 0.8).toFixed(1);
        this.cpuVal.textContent = `${randCpu}%`;
      }
      if (this.memVal) {
        const randMem = Math.floor(Math.random() * 20 + 410);
        this.memVal.textContent = `${randMem}M / 4096M`;
      }
    }, 3000);

    this.updateSystemStatus();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
      </svg>
      <span>${message}</span>
    `;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  
  // Start Linux Boot Sequence Simulation
  if (window.bootSimulator) {
    window.bootSimulator.start();
  }
});
