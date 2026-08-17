/**
 * vim-html — Authentic In-Browser Vim Editor Replica
 * Fully featured Vim engine supporting NORMAL, INSERT, VISUAL, COMMAND, SEARCH, REPLACE modes,
 * registers, undo/redo stacks, motions, operators, regex substitution, and VFS file persistence.
 */

class VimEditor {
  constructor() {
    this.screen = document.getElementById('vim-screen');
    this.viewport = document.getElementById('vim-viewport');
    this.gutter = document.getElementById('vim-gutter');
    this.linesContainer = document.getElementById('vim-lines-container');
    this.cursorBlock = document.getElementById('vim-cursor-block');
    this.statusModeTag = document.getElementById('vim-mode-tag');
    this.statusFileInfo = document.getElementById('vim-file-info');
    this.statusDirtyFlag = document.getElementById('vim-dirty-flag');
    this.statusFileTypeTag = document.getElementById('vim-filetype-tag');
    this.statusPercentTag = document.getElementById('vim-percent-tag');
    this.statusPosTag = document.getElementById('vim-position-tag');
    this.cmdline = document.getElementById('vim-commandline');
    this.cmdPrefix = document.getElementById('vim-cmd-prefix');
    this.cmdText = document.getElementById('vim-cmd-text');
    this.cmdCursor = document.getElementById('vim-cmd-cursor');
    this.msgDisplay = document.getElementById('vim-msg-display');

    // Buffer state
    this.lines = [''];
    this.cursor = { row: 0, col: 0 };
    this.desiredCol = 0;
    this.mode = 'NORMAL'; // NORMAL, INSERT, VISUAL, VISUAL_LINE, COMMAND, SEARCH, REPLACE
    this.filePath = '/home/user/untitled.txt';
    this.isDirty = false;
    this.isReadOnly = false;
    
    // Viewport & Scrolling
    this.scrollRow = 0;
    this.scrollCol = 0;
    this.charWidth = 8.7;
    this.lineHeight = 21.75;
    this.visibleRows = 24;

    // Registers & Undo
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = { text: '', isLine: false };
    this.lastChangeAction = null;

    // Command / Search
    this.commandBuffer = '';
    this.searchQuery = '';
    this.searchDirection = 1; // 1 for '/', -1 for '?'
    this.searchMatches = [];
    this.currentSearchMatchIndex = -1;

    // Visual Mode Anchor
    this.visualAnchor = { row: 0, col: 0 };

    // Prefixes & Operators
    this.numberPrefix = '';
    this.pendingOperator = null; // 'd', 'y', 'c', '>', '<', 'r', 'f', 'F', 't', 'T'
    this.pendingCharAction = null;

    // Editor Settings
    this.settings = {
      number: true,
      relativenumber: false,
      wrap: false,
      tabstop: 4,
      hlsearch: true
    };

    this.initEventListeners();
  }

  openFile(pathStr, content = '') {
    this.filePath = pathStr;
    if (content !== null && content !== undefined) {
      this.lines = content.split('\n');
      if (this.lines.length === 0) this.lines = [''];
    } else {
      this.lines = [''];
    }

    this.cursor = { row: 0, col: 0 };
    this.desiredCol = 0;
    this.scrollRow = 0;
    this.scrollCol = 0;
    this.mode = 'NORMAL';
    this.isDirty = false;
    this.undoStack = [];
    this.redoStack = [];
    this.saveSnapshot(); // Initial state for undo

    this.setMode('NORMAL');
    this.setMessage(`"${this.getFileName()}" ${this.lines.length} lines, ${new Blob([this.lines.join('\n')]).size} bytes`, 'info');
    
    this.screen.classList.remove('hidden');
    this.screen.focus();
    this.calculateViewportDimensions();
    this.render();
  }

  getFileName() {
    return this.filePath.split('/').pop() || 'untitled.txt';
  }

  detectFileType() {
    const fn = this.getFileName().toLowerCase();
    if (fn.endsWith('.py')) return 'python';
    if (fn.endsWith('.js') || fn.endsWith('.mjs')) return 'javascript';
    if (fn.endsWith('.json')) return 'json';
    if (fn.endsWith('.yaml') || fn.endsWith('.yml')) return 'yaml';
    if (fn.endsWith('.sh') || fn.endsWith('.bash')) return 'shell';
    if (fn.endsWith('.html') || fn.endsWith('.htm')) return 'html';
    if (fn.endsWith('.css')) return 'css';
    if (fn.endsWith('.md')) return 'markdown';
    if (fn.endsWith('.c') || fn.endsWith('.h') || fn.endsWith('.cpp')) return 'c';
    return 'text';
  }

  setMode(newMode) {
    this.mode = newMode;
    this.screen.setAttribute('data-vim-mode', newMode);
    
    // Clear pending states when switching modes
    this.pendingOperator = null;
    this.numberPrefix = '';
    
    if (newMode === 'NORMAL') {
      this.statusModeTag.textContent = 'NORMAL';
      this.cmdline.style.display = 'flex';
      this.cmdPrefix.textContent = '';
      this.cmdText.textContent = '';
    } else if (newMode === 'INSERT') {
      this.statusModeTag.textContent = '-- INSERT --';
      this.cmdPrefix.textContent = '';
      this.cmdText.textContent = '';
      this.clearMessage();
    } else if (newMode === 'VISUAL') {
      this.statusModeTag.textContent = '-- VISUAL --';
      this.cmdPrefix.textContent = '';
      this.cmdText.textContent = '';
    } else if (newMode === 'VISUAL_LINE') {
      this.statusModeTag.textContent = '-- VISUAL LINE --';
      this.cmdPrefix.textContent = '';
      this.cmdText.textContent = '';
    } else if (newMode === 'REPLACE') {
      this.statusModeTag.textContent = '-- REPLACE --';
    } else if (newMode === 'COMMAND') {
      this.statusModeTag.textContent = 'COMMAND';
      this.cmdPrefix.textContent = ':';
      this.cmdText.textContent = this.commandBuffer;
      this.clearMessage();
    } else if (newMode === 'SEARCH') {
      this.statusModeTag.textContent = 'SEARCH';
      this.cmdPrefix.textContent = this.searchDirection === 1 ? '/' : '?';
      this.cmdText.textContent = this.searchQuery;
      this.clearMessage();
    }

    this.render();
  }

  saveSnapshot() {
    const snapshot = {
      lines: [...this.lines],
      cursor: { ...this.cursor },
      desiredCol: this.desiredCol
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = []; // clear redo on new change
  }

  undo() {
    if (this.undoStack.length <= 1) {
      this.setMessage('Already at oldest change', 'info');
      if (window.soundFx) window.soundFx.playBell();
      return;
    }

    const current = this.undoStack.pop();
    this.redoStack.push(current);

    const prev = this.undoStack[this.undoStack.length - 1];
    this.lines = [...prev.lines];
    this.cursor = { ...prev.cursor };
    this.desiredCol = prev.desiredCol;
    this.isDirty = true;
    this.setMessage(`${this.undoStack.length} changes; before #...`, 'info');
    this.render();
  }

  redo() {
    if (this.redoStack.length === 0) {
      this.setMessage('Already at newest change', 'info');
      if (window.soundFx) window.soundFx.playBell();
      return;
    }

    const next = this.redoStack.pop();
    this.undoStack.push(next);
    this.lines = [...next.lines];
    this.cursor = { ...next.cursor };
    this.desiredCol = next.desiredCol;
    this.isDirty = true;
    this.setMessage(`Redone change`, 'info');
    this.render();
  }

  initEventListeners() {
    window.addEventListener('resize', () => {
      this.calculateViewportDimensions();
      this.render();
    });

    this.screen.addEventListener('click', () => {
      this.screen.focus();
    });

    this.screen.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  calculateViewportDimensions() {
    const bodyRect = this.linesContainer.getBoundingClientRect();
    this.visibleRows = Math.max(5, Math.floor(bodyRect.height / this.lineHeight));
  }

  handleKeyDown(e) {
    if (this.screen.classList.contains('hidden')) return;

    // Mechanical key audio effect
    if (window.soundFx) {
      window.soundFx.playKeyClick(e.key);
    }

    // Help shortcut
    if (e.key === 'F1') {
      e.preventDefault();
      if (window.app) window.app.openHelpModal();
      return;
    }

    // Mode-specific dispatch
    switch (this.mode) {
      case 'NORMAL':
        this.handleNormalModeKey(e);
        break;
      case 'INSERT':
        this.handleInsertModeKey(e);
        break;
      case 'VISUAL':
      case 'VISUAL_LINE':
        this.handleVisualModeKey(e);
        break;
      case 'COMMAND':
        this.handleCommandModeKey(e);
        break;
      case 'SEARCH':
        this.handleSearchModeKey(e);
        break;
      case 'REPLACE':
        this.handleReplaceModeKey(e);
        break;
    }
  }

  // ==========================================
  // NORMAL MODE KEY HANDLING
  // ==========================================
  handleNormalModeKey(e) {
    const key = e.key;

    // Handle single pending character actions (e.g. r<char>, f<char>, F<char>)
    if (this.pendingCharAction) {
      e.preventDefault();
      const action = this.pendingCharAction;
      this.pendingCharAction = null;

      if (action.type === 'replace_char') {
        if (key.length === 1) {
          this.saveSnapshot();
          const line = this.lines[this.cursor.row] || '';
          if (line.length > 0) {
            const count = Math.max(1, parseInt(this.numberPrefix, 10) || 1);
            let newLine = line.slice(0, this.cursor.col);
            for (let i = 0; i < count && (this.cursor.col + i) < line.length; i++) {
              newLine += key;
            }
            newLine += line.slice(this.cursor.col + count);
            this.lines[this.cursor.row] = newLine;
            this.isDirty = true;
          }
          this.numberPrefix = '';
          this.render();
        }
      } else if (action.type === 'find_char_forward') {
        this.findInlineChar(key, 1, false);
      } else if (action.type === 'find_char_backward') {
        this.findInlineChar(key, -1, false);
      } else if (action.type === 'till_char_forward') {
        this.findInlineChar(key, 1, true);
      } else if (action.type === 'till_char_backward') {
        this.findInlineChar(key, -1, true);
      }
      return;
    }

    // Number multipliers (e.g., 5j, 10dd, 2w)
    if (key >= '1' && key <= '9' && this.numberPrefix === '' && !this.pendingOperator) {
      this.numberPrefix = key;
      this.updateStatusPrefix();
      e.preventDefault();
      return;
    }
    if (key >= '0' && key <= '9' && this.numberPrefix !== '') {
      this.numberPrefix += key;
      this.updateStatusPrefix();
      e.preventDefault();
      return;
    }

    const count = parseInt(this.numberPrefix, 10) || 1;

    // Operator pending logic (d, y, c, >, <)
    if (this.pendingOperator) {
      e.preventDefault();
      const op = this.pendingOperator;
      this.pendingOperator = null;

      if (key === op) {
        // Double operator: dd, yy, cc, >>, <<
        if (op === 'd') {
          this.deleteLines(this.cursor.row, count);
        } else if (op === 'y') {
          this.yankLines(this.cursor.row, count);
        } else if (op === 'c') {
          this.deleteLines(this.cursor.row, count);
          this.lines.splice(this.cursor.row, 0, '');
          this.cursor.col = 0;
          this.setMode('INSERT');
        } else if (op === '>') {
          this.indentLines(this.cursor.row, count, 1);
        } else if (op === '<') {
          this.indentLines(this.cursor.row, count, -1);
        }
        this.numberPrefix = '';
        this.render();
        return;
      }

      // Operator + Motion (e.g. dw, d$, d0, yw, y$, etc.)
      if (key === 'w' || key === 'e' || key === '$' || key === '0' || key === '^' || key === 'G' || key === 'gg') {
        const startPos = { ...this.cursor };
        this.executeMotion(key, count);
        const endPos = { ...this.cursor };

        if (op === 'd') {
          this.deleteRange(startPos, endPos);
        } else if (op === 'y') {
          this.yankRange(startPos, endPos);
          this.cursor = startPos;
        } else if (op === 'c') {
          this.deleteRange(startPos, endPos);
          this.setMode('INSERT');
        }
        this.numberPrefix = '';
        this.render();
        return;
      }

      // Cancel operator
      this.numberPrefix = '';
      this.render();
      return;
    }

    // Escape in Normal Mode
    if (key === 'Escape') {
      this.numberPrefix = '';
      this.pendingOperator = null;
      this.clearMessage();
      this.render();
      return;
    }

    // Transitions to Insert Mode
    if (key === 'i') {
      e.preventDefault();
      this.saveSnapshot();
      this.setMode('INSERT');
      return;
    }
    if (key === 'I') {
      e.preventDefault();
      this.saveSnapshot();
      this.moveToFirstNonBlank();
      this.setMode('INSERT');
      return;
    }
    if (key === 'a') {
      e.preventDefault();
      this.saveSnapshot();
      const lineLen = (this.lines[this.cursor.row] || '').length;
      if (this.cursor.col < lineLen) {
        this.cursor.col++;
      }
      this.desiredCol = this.cursor.col;
      this.setMode('INSERT');
      return;
    }
    if (key === 'A') {
      e.preventDefault();
      this.saveSnapshot();
      this.cursor.col = (this.lines[this.cursor.row] || '').length;
      this.desiredCol = this.cursor.col;
      this.setMode('INSERT');
      return;
    }
    if (key === 'o') {
      e.preventDefault();
      this.saveSnapshot();
      const indent = this.getLineIndent(this.lines[this.cursor.row] || '');
      this.lines.splice(this.cursor.row + 1, 0, indent);
      this.cursor.row++;
      this.cursor.col = indent.length;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.setMode('INSERT');
      return;
    }
    if (key === 'O') {
      e.preventDefault();
      this.saveSnapshot();
      const indent = this.getLineIndent(this.lines[this.cursor.row] || '');
      this.lines.splice(this.cursor.row, 0, indent);
      this.cursor.col = indent.length;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.setMode('INSERT');
      return;
    }
    if (key === 's') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      if (line.length > 0) {
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + line.slice(this.cursor.col + 1);
        this.isDirty = true;
      }
      this.setMode('INSERT');
      return;
    }
    if (key === 'S') {
      e.preventDefault();
      this.saveSnapshot();
      const indent = this.getLineIndent(this.lines[this.cursor.row] || '');
      this.lines[this.cursor.row] = indent;
      this.cursor.col = indent.length;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.setMode('INSERT');
      return;
    }
    if (key === 'C') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      this.lines[this.cursor.row] = line.slice(0, this.cursor.col);
      this.isDirty = true;
      this.setMode('INSERT');
      return;
    }
    if (key === 'D') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      this.clipboard = { text: line.slice(this.cursor.col), isLine: false };
      this.lines[this.cursor.row] = line.slice(0, this.cursor.col);
      if (this.cursor.col > 0 && this.cursor.col >= this.lines[this.cursor.row].length) {
        this.cursor.col = Math.max(0, this.lines[this.cursor.row].length - 1);
      }
      this.isDirty = true;
      this.render();
      return;
    }
    if (key === 'R') {
      e.preventDefault();
      this.saveSnapshot();
      this.setMode('REPLACE');
      return;
    }

    // Transitions to Visual Mode
    if (key === 'v') {
      e.preventDefault();
      this.visualAnchor = { ...this.cursor };
      this.setMode('VISUAL');
      return;
    }
    if (key === 'V') {
      e.preventDefault();
      this.visualAnchor = { ...this.cursor };
      this.setMode('VISUAL_LINE');
      return;
    }

    // Transitions to Command & Search
    if (key === ':') {
      e.preventDefault();
      this.commandBuffer = '';
      this.setMode('COMMAND');
      return;
    }
    if (key === '/') {
      e.preventDefault();
      this.searchQuery = '';
      this.searchDirection = 1;
      this.setMode('SEARCH');
      return;
    }
    if (key === '?') {
      e.preventDefault();
      this.searchQuery = '';
      this.searchDirection = -1;
      this.setMode('SEARCH');
      return;
    }

    // Search Next / Prev
    if (key === 'n') {
      e.preventDefault();
      this.jumpSearchMatch(this.searchDirection);
      return;
    }
    if (key === 'N') {
      e.preventDefault();
      this.jumpSearchMatch(-this.searchDirection);
      return;
    }

    // Single Character Actions
    if (key === 'r') {
      e.preventDefault();
      this.pendingCharAction = { type: 'replace_char' };
      return;
    }
    if (key === 'f') {
      e.preventDefault();
      this.pendingCharAction = { type: 'find_char_forward' };
      return;
    }
    if (key === 'F') {
      e.preventDefault();
      this.pendingCharAction = { type: 'find_char_backward' };
      return;
    }
    if (key === 't') {
      e.preventDefault();
      this.pendingCharAction = { type: 'till_char_forward' };
      return;
    }
    if (key === 'T') {
      e.preventDefault();
      this.pendingCharAction = { type: 'till_char_backward' };
      return;
    }

    // Operators
    if (key === 'd' || key === 'y' || key === 'c' || key === '>' || key === '<') {
      e.preventDefault();
      this.pendingOperator = key;
      this.updateStatusPrefix();
      return;
    }

    // Delete Char Under Cursor: x / X
    if (key === 'x') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      if (line.length > 0) {
        this.clipboard = { text: line.substr(this.cursor.col, count), isLine: false };
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + line.slice(this.cursor.col + count);
        if (this.cursor.col >= this.lines[this.cursor.row].length) {
          this.cursor.col = Math.max(0, this.lines[this.cursor.row].length - 1);
        }
        this.isDirty = true;
      }
      this.numberPrefix = '';
      this.render();
      return;
    }
    if (key === 'X') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      if (this.cursor.col > 0) {
        const start = Math.max(0, this.cursor.col - count);
        this.clipboard = { text: line.slice(start, this.cursor.col), isLine: false };
        this.lines[this.cursor.row] = line.slice(0, start) + line.slice(this.cursor.col);
        this.cursor.col = start;
        this.isDirty = true;
      }
      this.numberPrefix = '';
      this.render();
      return;
    }

    // Paste: p / P
    if (key === 'p') {
      e.preventDefault();
      this.saveSnapshot();
      this.pasteClipboard(1);
      this.numberPrefix = '';
      this.render();
      return;
    }
    if (key === 'P') {
      e.preventDefault();
      this.saveSnapshot();
      this.pasteClipboard(-1);
      this.numberPrefix = '';
      this.render();
      return;
    }

    // Undo / Redo
    if (key === 'u') {
      e.preventDefault();
      this.undo();
      return;
    }
    if (e.ctrlKey && key.toLowerCase() === 'r') {
      e.preventDefault();
      this.redo();
      return;
    }

    // Join Lines: J
    if (key === 'J') {
      e.preventDefault();
      this.saveSnapshot();
      if (this.cursor.row < this.lines.length - 1) {
        const nextLine = this.lines[this.cursor.row + 1].trimStart();
        const curLine = this.lines[this.cursor.row];
        this.cursor.col = curLine.length + (curLine.length > 0 ? 1 : 0);
        this.lines[this.cursor.row] = curLine + (curLine.length > 0 ? ' ' : '') + nextLine;
        this.lines.splice(this.cursor.row + 1, 1);
        this.isDirty = true;
        this.render();
      }
      return;
    }

    // Toggle Case: ~
    if (key === '~') {
      e.preventDefault();
      this.saveSnapshot();
      const line = this.lines[this.cursor.row] || '';
      if (this.cursor.col < line.length) {
        const ch = line[this.cursor.col];
        const flipped = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase();
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + flipped + line.slice(this.cursor.col + 1);
        if (this.cursor.col < line.length - 1) this.cursor.col++;
        this.isDirty = true;
        this.render();
      }
      return;
    }

    // Bracket matching: %
    if (key === '%') {
      e.preventDefault();
      this.matchBracket();
      return;
    }

    // Page scrolling: Ctrl+D, Ctrl+U, Ctrl+F, Ctrl+B
    if (e.ctrlKey && key.toLowerCase() === 'd') {
      e.preventDefault();
      this.scrollHalfPage(1);
      return;
    }
    if (e.ctrlKey && key.toLowerCase() === 'u') {
      e.preventDefault();
      this.scrollHalfPage(-1);
      return;
    }
    if (e.ctrlKey && key.toLowerCase() === 'f') {
      e.preventDefault();
      this.scrollFullPage(1);
      return;
    }
    if (e.ctrlKey && key.toLowerCase() === 'b') {
      e.preventDefault();
      this.scrollFullPage(-1);
      return;
    }

    // Double key shortcuts (gg, ZZ)
    if (key === 'g') {
      if (this.lastNormalKey === 'g') {
        this.lastNormalKey = null;
        e.preventDefault();
        const targetRow = this.numberPrefix ? Math.min(this.lines.length - 1, Math.max(0, parseInt(this.numberPrefix, 10) - 1)) : 0;
        this.cursor.row = targetRow;
        this.moveToFirstNonBlank();
        this.numberPrefix = '';
        this.render();
        return;
      } else {
        this.lastNormalKey = 'g';
        this.updateStatusPrefix();
        return;
      }
    }
    this.lastNormalKey = null;

    if (key === 'Z' && e.shiftKey) {
      if (this.lastZKey === 'Z') {
        this.lastZKey = null;
        this.executeCommand('wq');
        return;
      } else {
        this.lastZKey = 'Z';
        return;
      }
    }
    this.lastZKey = null;

    // Standard motions (h, j, k, l, w, b, e, 0, ^, $, G, {, })
    if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '^', '$', 'G', '{', '}', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      e.preventDefault();
      this.executeMotion(key, count);
      this.numberPrefix = '';
      this.render();
      return;
    }
  }

  // ==========================================
  // INSERT MODE KEY HANDLING
  // ==========================================
  handleInsertModeKey(e) {
    const key = e.key;

    if (key === 'Escape' || (e.ctrlKey && key === '[')) {
      e.preventDefault();
      if (this.cursor.col > 0) {
        this.cursor.col--;
      }
      this.desiredCol = this.cursor.col;
      this.setMode('NORMAL');
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const line = this.lines[this.cursor.row] || '';
      const leftPart = line.slice(0, this.cursor.col);
      const rightPart = line.slice(this.cursor.col);
      const indent = this.getLineIndent(leftPart);

      this.lines[this.cursor.row] = leftPart;
      this.lines.splice(this.cursor.row + 1, 0, indent + rightPart);
      this.cursor.row++;
      this.cursor.col = indent.length;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.render();
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      const line = this.lines[this.cursor.row] || '';
      if (this.cursor.col > 0) {
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col - 1) + line.slice(this.cursor.col);
        this.cursor.col--;
        this.desiredCol = this.cursor.col;
        this.isDirty = true;
      } else if (this.cursor.row > 0) {
        // Join with previous line
        const prevLine = this.lines[this.cursor.row - 1];
        this.cursor.col = prevLine.length;
        this.lines[this.cursor.row - 1] = prevLine + line;
        this.lines.splice(this.cursor.row, 1);
        this.cursor.row--;
        this.desiredCol = this.cursor.col;
        this.isDirty = true;
      }
      this.render();
      return;
    }

    if (key === 'Delete') {
      e.preventDefault();
      const line = this.lines[this.cursor.row] || '';
      if (this.cursor.col < line.length) {
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + line.slice(this.cursor.col + 1);
        this.isDirty = true;
      } else if (this.cursor.row < this.lines.length - 1) {
        this.lines[this.cursor.row] = line + this.lines[this.cursor.row + 1];
        this.lines.splice(this.cursor.row + 1, 1);
        this.isDirty = true;
      }
      this.render();
      return;
    }

    if (key === 'Tab') {
      e.preventDefault();
      const spaces = ' '.repeat(this.settings.tabstop);
      const line = this.lines[this.cursor.row] || '';
      this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + spaces + line.slice(this.cursor.col);
      this.cursor.col += spaces.length;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.render();
      return;
    }

    // Arrow keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      e.preventDefault();
      this.executeMotion(key, 1);
      this.render();
      return;
    }

    // Printable character
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const line = this.lines[this.cursor.row] || '';
      this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + key + line.slice(this.cursor.col);
      this.cursor.col++;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.render();
      return;
    }
  }

  // ==========================================
  // VISUAL MODE KEY HANDLING
  // ==========================================
  handleVisualModeKey(e) {
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      this.setMode('NORMAL');
      return;
    }

    // Cut / Delete selection: d or x
    if (key === 'd' || key === 'x') {
      e.preventDefault();
      this.saveSnapshot();
      this.deleteVisualSelection();
      this.setMode('NORMAL');
      return;
    }

    // Yank selection: y
    if (key === 'y') {
      e.preventDefault();
      this.yankVisualSelection();
      this.setMode('NORMAL');
      return;
    }

    // Change selection: c
    if (key === 'c') {
      e.preventDefault();
      this.saveSnapshot();
      this.deleteVisualSelection();
      this.setMode('INSERT');
      return;
    }

    // Indent / Unindent selection
    if (key === '>' || key === '<') {
      e.preventDefault();
      this.saveSnapshot();
      const range = this.getVisualLineRange();
      this.indentLines(range.start, range.end - range.start + 1, key === '>' ? 1 : -1);
      this.setMode('NORMAL');
      return;
    }

    // Case conversions
    if (key === 'u' || key === 'U' || key === '~') {
      e.preventDefault();
      this.saveSnapshot();
      this.transformVisualCase(key);
      this.setMode('NORMAL');
      return;
    }

    // Motions within visual selection
    if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '^', '$', 'G', 'gg', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      e.preventDefault();
      this.executeMotion(key, 1);
      this.render();
      return;
    }
  }

  // ==========================================
  // REPLACE MODE KEY HANDLING
  // ==========================================
  handleReplaceModeKey(e) {
    const key = e.key;

    if (key === 'Escape' || (e.ctrlKey && key === '[')) {
      e.preventDefault();
      this.setMode('NORMAL');
      return;
    }

    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const line = this.lines[this.cursor.row] || '';
      if (this.cursor.col < line.length) {
        this.lines[this.cursor.row] = line.slice(0, this.cursor.col) + key + line.slice(this.cursor.col + 1);
      } else {
        this.lines[this.cursor.row] = line + key;
      }
      this.cursor.col++;
      this.desiredCol = this.cursor.col;
      this.isDirty = true;
      this.render();
      return;
    }
  }

  // ==========================================
  // COMMAND-LINE (:) KEY HANDLING
  // ==========================================
  handleCommandModeKey(e) {
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      this.commandBuffer = '';
      this.setMode('NORMAL');
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const cmd = this.commandBuffer.trim();
      this.commandBuffer = '';
      this.setMode('NORMAL');
      this.executeCommand(cmd);
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      if (this.commandBuffer.length > 0) {
        this.commandBuffer = this.commandBuffer.slice(0, -1);
        this.cmdText.textContent = this.commandBuffer;
      } else {
        this.setMode('NORMAL');
      }
      return;
    }

    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.commandBuffer += key;
      this.cmdText.textContent = this.commandBuffer;
      return;
    }
  }

  // ==========================================
  // SEARCH (/ or ?) KEY HANDLING
  // ==========================================
  handleSearchModeKey(e) {
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      this.searchQuery = '';
      this.setMode('NORMAL');
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      this.setMode('NORMAL');
      this.performSearch(this.searchQuery, this.searchDirection);
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.cmdText.textContent = this.searchQuery;
      } else {
        this.setMode('NORMAL');
      }
      return;
    }

    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.searchQuery += key;
      this.cmdText.textContent = this.searchQuery;
      return;
    }
  }

  // ==========================================
  // COMMAND EXECUTION LOGIC
  // ==========================================
  executeCommand(cmdStr) {
    if (!cmdStr) return;

    // :w (Save) or :w <filename>
    if (cmdStr === 'w' || cmdStr.startsWith('w ')) {
      let targetPath = this.filePath;
      if (cmdStr.startsWith('w ')) {
        const newFn = cmdStr.slice(2).trim();
        if (newFn) {
          targetPath = window.vfs.resolve(this.filePath.split('/').slice(0, -1).join('/') || '/home/user', newFn);
          this.filePath = targetPath;
        }
      }
      const success = window.vfs.writeFile(targetPath, this.lines.join('\n'));
      if (success) {
        this.isDirty = false;
        const lineCount = this.lines.length;
        const byteCount = new Blob([this.lines.join('\n')]).size;
        this.setMessage(`"${this.getFileName()}" ${lineCount}L, ${byteCount}B written`, 'success');
        if (window.app) window.app.updateSystemStatus();
      } else {
        this.setMessage(`E212: Cannot open file for writing: ${targetPath}`, 'error');
      }
      this.render();
      return;
    }

    // :download or :export or :w !download (Real Browser Download)
    if (cmdStr === 'download' || cmdStr === 'export' || cmdStr === 'w !download' || cmdStr === 'w !dl') {
      const content = this.lines.join('\n');
      const fileName = this.getFileName();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setMessage(`Exported "${fileName}" (${blob.size} bytes) to browser downloads.`, 'success');
      return;
    }

    // :q (Quit)
    if (cmdStr === 'q') {
      if (this.isDirty) {
        this.setMessage('E37: No write since last change (add ! to override)', 'error');
        if (window.soundFx) window.soundFx.playBell();
        return;
      }
      this.exitVim();
      return;
    }

    // :q! (Force Quit)
    if (cmdStr === 'q!') {
      this.exitVim();
      return;
    }

    // :wq or :x (Write and Quit)
    if (cmdStr === 'wq' || cmdStr === 'x' || cmdStr === 'wq!') {
      window.vfs.writeFile(this.filePath, this.lines.join('\n'));
      this.isDirty = false;
      this.exitVim();
      return;
    }

    // Line number jump: e.g. :42 or :$
    if (/^\d+$/.test(cmdStr)) {
      const targetRow = Math.max(0, Math.min(this.lines.length - 1, parseInt(cmdStr, 10) - 1));
      this.cursor.row = targetRow;
      this.moveToFirstNonBlank();
      this.render();
      return;
    }
    if (cmdStr === '$') {
      this.cursor.row = this.lines.length - 1;
      this.moveToFirstNonBlank();
      this.render();
      return;
    }

    // Regex Substitution: :%s/find/replace/g or :s/find/replace/g
    const subMatch = cmdStr.match(/^(%?)s\/(.*?)\/(.*?)\/([gi]*)$/);
    if (subMatch) {
      const isGlobalLines = subMatch[1] === '%';
      const findPattern = subMatch[2];
      const replaceWith = subMatch[3];
      const flags = subMatch[4];

      this.saveSnapshot();
      try {
        const regex = new RegExp(findPattern, flags.includes('g') ? 'g' : '');
        let count = 0;
        let lineCount = 0;

        const startLine = isGlobalLines ? 0 : this.cursor.row;
        const endLine = isGlobalLines ? this.lines.length - 1 : this.cursor.row;

        for (let i = startLine; i <= endLine; i++) {
          const orig = this.lines[i];
          const matches = orig.match(regex);
          if (matches) {
            count += matches.length;
            lineCount++;
            this.lines[i] = orig.replace(regex, replaceWith);
          }
        }

        this.isDirty = true;
        this.setMessage(`${count} substitution${count === 1 ? '' : 's'} on ${lineCount} line${lineCount === 1 ? '' : 's'}`, 'info');
      } catch (err) {
        this.setMessage(`E486: Pattern not found or invalid regex: ${findPattern}`, 'error');
      }
      this.render();
      return;
    }

    // Settings: :set number, :set nu, :set nonu, :set rnu, etc.
    if (cmdStr.startsWith('set ') || cmdStr.startsWith('se ')) {
      const opt = cmdStr.split(' ')[1];
      if (opt === 'number' || opt === 'nu') {
        this.settings.number = true;
        this.settings.relativenumber = false;
      } else if (opt === 'nonumber' || opt === 'nonu') {
        this.settings.number = false;
      } else if (opt === 'relativenumber' || opt === 'rnu') {
        this.settings.relativenumber = true;
        this.settings.number = true;
      } else if (opt === 'norelativenumber' || opt === 'nornu') {
        this.settings.relativenumber = false;
      } else if (opt === 'wrap') {
        this.settings.wrap = true;
      } else if (opt === 'nowrap') {
        this.settings.wrap = false;
      } else if (opt && opt.startsWith('tabstop=')) {
        this.settings.tabstop = parseInt(opt.split('=')[1], 10) || 4;
      }
      this.render();
      return;
    }

    // Clear search highlight: :nohlsearch, :noh
    if (cmdStr === 'noh' || cmdStr === 'nohlsearch') {
      this.searchMatches = [];
      this.render();
      return;
    }

    // Read file into buffer: :r <file>
    if (cmdStr.startsWith('r ')) {
      const readPath = window.vfs.resolve(this.filePath.split('/').slice(0, -1).join('/'), cmdStr.slice(2).trim());
      const content = window.vfs.readFile(readPath);
      if (content !== null) {
        this.saveSnapshot();
        const newLines = content.split('\n');
        this.lines.splice(this.cursor.row + 1, 0, ...newLines);
        this.isDirty = true;
        this.setMessage(`"${readPath.split('/').pop()}" ${newLines.length}L inserted`, 'info');
      } else {
        this.setMessage(`E484: Can't open file ${readPath}`, 'error');
      }
      this.render();
      return;
    }

    // Execute shell command: :! <cmd>
    if (cmdStr.startsWith('!')) {
      const shellCmd = cmdStr.slice(1).trim();
      if (shellCmd) {
        this.setMessage(`[Executed]: ${shellCmd} (Press Enter to continue)`, 'info');
      }
      return;
    }

    // Help
    if (cmdStr === 'h' || cmdStr === 'help') {
      if (window.app) window.app.openHelpModal();
      return;
    }

    this.setMessage(`E492: Not an editor command: ${cmdStr}`, 'error');
    if (window.soundFx) window.soundFx.playBell();
  }

  exitVim() {
    this.screen.classList.add('hidden');
    const termScreen = document.getElementById('terminal-screen');
    termScreen.classList.remove('hidden');
    
    const indicator = document.getElementById('active-app-indicator');
    if (indicator) indicator.textContent = 'TERMINAL';

    if (window.terminalApp) {
      window.terminalApp.focus();
    }
  }

  // ==========================================
  // MOTIONS & NAVIGATION
  // ==========================================
  executeMotion(motion, count = 1) {
    for (let c = 0; c < count; c++) {
      const line = this.lines[this.cursor.row] || '';
      const lineLen = line.length;

      switch (motion) {
        case 'h':
        case 'ArrowLeft':
          if (this.cursor.col > 0) {
            this.cursor.col--;
            this.desiredCol = this.cursor.col;
          }
          break;

        case 'l':
        case 'ArrowRight':
          const maxCol = this.mode === 'INSERT' ? lineLen : Math.max(0, lineLen - 1);
          if (this.cursor.col < maxCol) {
            this.cursor.col++;
            this.desiredCol = this.cursor.col;
          }
          break;

        case 'j':
        case 'ArrowDown':
          if (this.cursor.row < this.lines.length - 1) {
            this.cursor.row++;
            this.restoreDesiredCol();
          }
          break;

        case 'k':
        case 'ArrowUp':
          if (this.cursor.row > 0) {
            this.cursor.row--;
            this.restoreDesiredCol();
          }
          break;

        case '0':
          this.cursor.col = 0;
          this.desiredCol = 0;
          break;

        case '^':
          this.moveToFirstNonBlank();
          break;

        case '$':
          this.cursor.col = Math.max(0, lineLen - 1);
          this.desiredCol = Infinity;
          break;

        case 'w':
          this.moveWordForward();
          break;

        case 'b':
          this.moveWordBackward();
          break;

        case 'e':
          this.moveWordEndForward();
          break;

        case 'G':
          this.cursor.row = this.lines.length - 1;
          this.moveToFirstNonBlank();
          break;

        case '{':
          this.moveParagraph(-1);
          break;

        case '}':
          this.moveParagraph(1);
          break;
      }
    }
  }

  restoreDesiredCol() {
    const targetLine = this.lines[this.cursor.row] || '';
    const maxCol = this.mode === 'INSERT' ? targetLine.length : Math.max(0, targetLine.length - 1);
    if (this.desiredCol === Infinity) {
      this.cursor.col = maxCol;
    } else {
      this.cursor.col = Math.min(this.desiredCol, maxCol);
    }
  }

  moveToFirstNonBlank() {
    const line = this.lines[this.cursor.row] || '';
    const match = line.match(/\S/);
    this.cursor.col = match ? match.index : 0;
    this.desiredCol = this.cursor.col;
  }

  getLineIndent(line) {
    const match = line.match(/^(\s+)/);
    return match ? match[1] : '';
  }

  moveWordForward() {
    let r = this.cursor.row;
    let c = this.cursor.col;
    let line = this.lines[r] || '';

    // If at end of line, jump to next line
    if (c >= line.length - 1) {
      if (r < this.lines.length - 1) {
        this.cursor.row++;
        this.cursor.col = 0;
        this.moveToFirstNonBlank();
      }
      return;
    }

    const isWordChar = (ch) => /[\w$]/.test(ch);
    const startType = isWordChar(line[c]);

    // Skip current word
    while (c < line.length && isWordChar(line[c]) === startType && line[c] !== ' ') {
      c++;
    }
    // Skip whitespace
    while (c < line.length && line[c] === ' ') {
      c++;
    }

    if (c >= line.length && r < this.lines.length - 1) {
      this.cursor.row++;
      this.cursor.col = 0;
      this.moveToFirstNonBlank();
    } else {
      this.cursor.col = Math.min(c, line.length - 1);
      this.desiredCol = this.cursor.col;
    }
  }

  moveWordBackward() {
    let r = this.cursor.row;
    let c = this.cursor.col;
    let line = this.lines[r] || '';

    if (c <= 0) {
      if (r > 0) {
        this.cursor.row--;
        this.cursor.col = Math.max(0, this.lines[this.cursor.row].length - 1);
        this.desiredCol = this.cursor.col;
      }
      return;
    }

    c--;
    // Skip whitespace backward
    while (c > 0 && line[c] === ' ') {
      c--;
    }

    const isWordChar = (ch) => /[\w$]/.test(ch);
    const targetType = isWordChar(line[c]);

    // Move to start of word
    while (c > 0 && isWordChar(line[c - 1]) === targetType && line[c - 1] !== ' ') {
      c--;
    }

    this.cursor.col = c;
    this.desiredCol = c;
  }

  moveWordEndForward() {
    let r = this.cursor.row;
    let c = this.cursor.col + 1;
    let line = this.lines[r] || '';

    while (c < line.length && line[c] === ' ') {
      c++;
    }

    const isWordChar = (ch) => /[\w$]/.test(ch);
    if (c < line.length) {
      const targetType = isWordChar(line[c]);
      while (c < line.length - 1 && isWordChar(line[c + 1]) === targetType) {
        c++;
      }
      this.cursor.col = c;
      this.desiredCol = c;
    }
  }

  moveParagraph(dir) {
    let r = this.cursor.row + dir;
    while (r >= 0 && r < this.lines.length) {
      if (this.lines[r].trim() === '') {
        this.cursor.row = r;
        this.cursor.col = 0;
        this.desiredCol = 0;
        return;
      }
      r += dir;
    }
    this.cursor.row = dir > 0 ? this.lines.length - 1 : 0;
    this.cursor.col = 0;
    this.desiredCol = 0;
  }

  findInlineChar(targetChar, dir, till = false) {
    const line = this.lines[this.cursor.row] || '';
    let c = this.cursor.col + dir;
    while (c >= 0 && c < line.length) {
      if (line[c] === targetChar) {
        this.cursor.col = till ? c - dir : c;
        this.desiredCol = this.cursor.col;
        this.render();
        return;
      }
      c += dir;
    }
    if (window.soundFx) window.soundFx.playBell();
  }

  matchBracket() {
    const line = this.lines[this.cursor.row] || '';
    const char = line[this.cursor.col];
    const pairs = { '(': ')', '[': ']', '{': '}', ')': '(', ']': '[', '}': '{' };
    if (!pairs[char]) return;

    const target = pairs[char];
    const dir = ['(', '[', '{'].includes(char) ? 1 : -1;
    let depth = 1;
    let r = this.cursor.row;
    let c = this.cursor.col + dir;

    while (r >= 0 && r < this.lines.length) {
      const curLine = this.lines[r];
      while (c >= 0 && c < curLine.length) {
        if (curLine[c] === char) depth++;
        else if (curLine[c] === target) {
          depth--;
          if (depth === 0) {
            this.cursor.row = r;
            this.cursor.col = c;
            this.desiredCol = c;
            this.render();
            return;
          }
        }
        c += dir;
      }
      r += dir;
      if (r >= 0 && r < this.lines.length) {
        c = dir === 1 ? 0 : this.lines[r].length - 1;
      }
    }
  }

  scrollHalfPage(dir) {
    const half = Math.floor(this.visibleRows / 2);
    this.cursor.row = Math.max(0, Math.min(this.lines.length - 1, this.cursor.row + dir * half));
    this.restoreDesiredCol();
    this.render();
  }

  scrollFullPage(dir) {
    const full = Math.max(1, this.visibleRows - 2);
    this.cursor.row = Math.max(0, Math.min(this.lines.length - 1, this.cursor.row + dir * full));
    this.restoreDesiredCol();
    this.render();
  }

  // ==========================================
  // EDITING & OPERATORS IMPLEMENTATION
  // ==========================================
  deleteLines(startRow, count) {
    this.saveSnapshot();
    const removed = this.lines.splice(startRow, count);
    if (this.lines.length === 0) this.lines = [''];
    this.clipboard = { text: removed.join('\n'), isLine: true };
    this.cursor.row = Math.min(this.cursor.row, this.lines.length - 1);
    this.moveToFirstNonBlank();
    this.isDirty = true;
  }

  yankLines(startRow, count) {
    const yanked = this.lines.slice(startRow, startRow + count);
    this.clipboard = { text: yanked.join('\n'), isLine: true };
    this.setMessage(`${count} line${count === 1 ? '' : 's'} yanked`, 'info');
  }

  indentLines(startRow, count, dir) {
    this.saveSnapshot();
    const spaces = ' '.repeat(this.settings.tabstop);
    for (let i = 0; i < count && (startRow + i) < this.lines.length; i++) {
      const idx = startRow + i;
      const line = this.lines[idx];
      if (dir > 0) {
        this.lines[idx] = spaces + line;
      } else {
        if (line.startsWith(spaces)) {
          this.lines[idx] = line.slice(spaces.length);
        } else if (/^\s/.test(line)) {
          this.lines[idx] = line.replace(/^\s+/, '');
        }
      }
    }
    this.isDirty = true;
  }

  deleteRange(startPos, endPos) {
    this.saveSnapshot();
    // Normalize order
    if (startPos.row > endPos.row || (startPos.row === endPos.row && startPos.col > endPos.col)) {
      const temp = startPos;
      startPos = endPos;
      endPos = temp;
    }

    if (startPos.row === endPos.row) {
      const line = this.lines[startPos.row];
      this.clipboard = { text: line.slice(startPos.col, endPos.col), isLine: false };
      this.lines[startPos.row] = line.slice(0, startPos.col) + line.slice(endPos.col);
      this.cursor = startPos;
    } else {
      const firstPart = this.lines[startPos.row].slice(0, startPos.col);
      const lastPart = this.lines[endPos.row].slice(endPos.col);
      this.lines.splice(startPos.row, endPos.row - startPos.row + 1, firstPart + lastPart);
      this.cursor = startPos;
    }
    this.isDirty = true;
  }

  yankRange(startPos, endPos) {
    if (startPos.row > endPos.row || (startPos.row === endPos.row && startPos.col > endPos.col)) {
      const temp = startPos;
      startPos = endPos;
      endPos = temp;
    }

    if (startPos.row === endPos.row) {
      this.clipboard = { text: this.lines[startPos.row].slice(startPos.col, endPos.col), isLine: false };
    } else {
      const parts = [];
      parts.push(this.lines[startPos.row].slice(startPos.col));
      for (let r = startPos.row + 1; r < endPos.row; r++) {
        parts.push(this.lines[r]);
      }
      parts.push(this.lines[endPos.row].slice(0, endPos.col));
      this.clipboard = { text: parts.join('\n'), isLine: false };
    }
    this.setMessage('Yanked selection', 'info');
  }

  pasteClipboard(dir) {
    if (!this.clipboard.text) return;
    this.saveSnapshot();

    if (this.clipboard.isLine) {
      const newLines = this.clipboard.text.split('\n');
      const insertAt = dir > 0 ? this.cursor.row + 1 : this.cursor.row;
      this.lines.splice(insertAt, 0, ...newLines);
      this.cursor.row = insertAt;
      this.moveToFirstNonBlank();
    } else {
      const line = this.lines[this.cursor.row] || '';
      const insertCol = dir > 0 ? Math.min(line.length, this.cursor.col + 1) : this.cursor.col;
      this.lines[this.cursor.row] = line.slice(0, insertCol) + this.clipboard.text + line.slice(insertCol);
      this.cursor.col = insertCol + this.clipboard.text.length - 1;
      this.desiredCol = this.cursor.col;
    }
    this.isDirty = true;
  }

  // ==========================================
  // VISUAL SELECTION HELPERS
  // ==========================================
  getVisualLineRange() {
    const start = Math.min(this.visualAnchor.row, this.cursor.row);
    const end = Math.max(this.visualAnchor.row, this.cursor.row);
    return { start, end };
  }

  deleteVisualSelection() {
    if (this.mode === 'VISUAL_LINE') {
      const range = this.getVisualLineRange();
      this.deleteLines(range.start, range.end - range.start + 1);
    } else {
      const start = { ...this.visualAnchor };
      const end = { ...this.cursor };
      this.deleteRange(start, end);
    }
  }

  yankVisualSelection() {
    if (this.mode === 'VISUAL_LINE') {
      const range = this.getVisualLineRange();
      this.yankLines(range.start, range.end - range.start + 1);
    } else {
      this.yankRange({ ...this.visualAnchor }, { ...this.cursor });
    }
  }

  transformVisualCase(type) {
    const range = this.getVisualLineRange();
    for (let r = range.start; r <= range.end; r++) {
      const line = this.lines[r];
      let res = '';
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (type === 'u') res += ch.toLowerCase();
        else if (type === 'U') res += ch.toUpperCase();
        else res += (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase());
      }
      this.lines[r] = res;
    }
    this.isDirty = true;
  }

  // ==========================================
  // SEARCH & HIGHLIGHTING
  // ==========================================
  performSearch(query, dir = 1) {
    if (!query) return;
    this.searchMatches = [];
    try {
      const regex = new RegExp(query, 'g');
      for (let r = 0; r < this.lines.length; r++) {
        let match;
        while ((match = regex.exec(this.lines[r])) !== null) {
          this.searchMatches.push({ row: r, col: match.index, len: match[0].length });
        }
      }
    } catch (e) {
      this.setMessage(`E486: Invalid search pattern: ${query}`, 'error');
      return;
    }

    if (this.searchMatches.length === 0) {
      this.setMessage(`E486: Pattern not found: ${query}`, 'error');
      if (window.soundFx) window.soundFx.playBell();
    } else {
      this.jumpSearchMatch(dir);
    }
    this.render();
  }

  jumpSearchMatch(dir = 1) {
    if (this.searchMatches.length === 0) return;
    
    // Find next match relative to current cursor
    let nextIdx = -1;
    if (dir > 0) {
      nextIdx = this.searchMatches.findIndex(m => m.row > this.cursor.row || (m.row === this.cursor.row && m.col > this.cursor.col));
      if (nextIdx === -1) nextIdx = 0; // wrap around
    } else {
      for (let i = this.searchMatches.length - 1; i >= 0; i--) {
        const m = this.searchMatches[i];
        if (m.row < this.cursor.row || (m.row === this.cursor.row && m.col < this.cursor.col)) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx === -1) nextIdx = this.searchMatches.length - 1; // wrap
    }

    this.currentSearchMatchIndex = nextIdx;
    const match = this.searchMatches[nextIdx];
    this.cursor.row = match.row;
    this.cursor.col = match.col;
    this.desiredCol = match.col;
    this.render();
  }

  // ==========================================
  // STATUS & MESSAGES
  // ==========================================
  setMessage(msg, type = 'info') {
    this.msgDisplay.textContent = msg;
    this.msgDisplay.className = `vim-msg-display ${type === 'error' ? 'msg-error' : type === 'success' ? 'msg-success' : ''}`;
  }

  clearMessage() {
    this.msgDisplay.textContent = '';
    this.msgDisplay.className = 'vim-msg-display';
  }

  updateStatusPrefix() {
    let txt = '';
    if (this.pendingOperator) txt += this.pendingOperator;
    if (this.numberPrefix) txt += this.numberPrefix;
    if (this.lastNormalKey) txt += this.lastNormalKey;
    this.msgDisplay.textContent = txt;
  }

  // ==========================================
  // SYNTAX HIGHLIGHTER ENGINE
  // ==========================================
  highlightLine(lineText, fileType) {
    if (!lineText) return '&nbsp;';

    // HTML escape first
    let escaped = lineText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (fileType === 'python') {
      escaped = escaped
        .replace(/(#.*$)/g, '<span class="syn-comment">$1</span>')
        .replace(/(\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|async|await|lambda|yield|pass|break|continue)\b)/g, '<span class="syn-keyword">$1</span>')
        .replace(/(\b(True|False|None)\b)/g, '<span class="syn-boolean">$1</span>')
        .replace(/(\b(int|str|float|list|dict|set|tuple|bool|Any|Dict|List|Optional)\b)/g, '<span class="syn-type">$1</span>')
        .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, '<span class="syn-string">$1</span>')
        .replace(/(\b\d+\.?\d*\b)/g, '<span class="syn-number">$1</span>');
    } else if (fileType === 'javascript') {
      escaped = escaped
        .replace(/(\/\/.*$)/g, '<span class="syn-comment">$1</span>')
        .replace(/(\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|import|export|from|default|class|extends|new|this|async|await|try|catch)\b)/g, '<span class="syn-keyword">$1</span>')
        .replace(/(\b(true|false|null|undefined)\b)/g, '<span class="syn-boolean">$1</span>')
        .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, '<span class="syn-string">$1</span>')
        .replace(/(\b\d+\.?\d*\b)/g, '<span class="syn-number">$1</span>');
    } else if (fileType === 'yaml') {
      escaped = escaped
        .replace(/(#.*$)/g, '<span class="syn-comment">$1</span>')
        .replace(/^(\s*[\w.-]+:)/g, '<span class="syn-property">$1</span>')
        .replace(/(\b(true|false|yes|no)\b)/g, '<span class="syn-boolean">$1</span>')
        .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, '<span class="syn-string">$1</span>');
    } else if (fileType === 'shell') {
      escaped = escaped
        .replace(/(^#!.*$)/g, '<span class="syn-shebang">$1</span>')
        .replace(/(#.*$)/g, '<span class="syn-comment">$1</span>')
        .replace(/(\b(if|then|else|elif|fi|case|esac|for|while|do|done|function|return|exit|echo|set|export)\b)/g, '<span class="syn-keyword">$1</span>')
        .replace(/(\$[A-Za-z0-9_{}]+)/g, '<span class="syn-variable">$1</span>')
        .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, '<span class="syn-string">$1</span>');
    } else if (fileType === 'markdown') {
      escaped = escaped
        .replace(/^(#{1,6}\s.*$)/g, '<span class="syn-header">$1</span>')
        .replace(/(`[^`]+`)/g, '<span class="syn-md-code">$1</span>')
        .replace(/(\*\*.*?\*\*)/g, '<strong>$1</strong>');
    }

    return escaped || '&nbsp;';
  }

  // ==========================================
  // RENDER LOOP
  // ==========================================
  render() {
    // 1. Maintain scroll window
    if (this.cursor.row < this.scrollRow) {
      this.scrollRow = this.cursor.row;
    } else if (this.cursor.row >= this.scrollRow + this.visibleRows) {
      this.scrollRow = this.cursor.row - this.visibleRows + 1;
    }

    // 2. Render Gutter (Line Numbers)
    let gutterHtml = '';
    for (let i = 0; i < this.visibleRows; i++) {
      const rowIdx = this.scrollRow + i;
      if (rowIdx < this.lines.length) {
        let numStr = '';
        if (this.settings.relativenumber) {
          const diff = Math.abs(rowIdx - this.cursor.row);
          numStr = diff === 0 ? String(rowIdx + 1) : String(diff);
        } else if (this.settings.number) {
          numStr = String(rowIdx + 1);
        }
        const isCurrent = rowIdx === this.cursor.row;
        gutterHtml += `<div class="vim-gutter-num ${isCurrent ? 'current-line' : ''}">${numStr}</div>`;
      } else {
        gutterHtml += `<div class="vim-gutter-num vim-tilde">~</div>`;
      }
    }
    this.gutter.innerHTML = gutterHtml;

    // 3. Render Buffer Lines
    const fileType = this.detectFileType();
    let linesHtml = '';

    for (let i = 0; i < this.visibleRows; i++) {
      const rowIdx = this.scrollRow + i;
      if (rowIdx < this.lines.length) {
        const lineText = this.lines[rowIdx];
        const isCurrent = rowIdx === this.cursor.row;
        const highlighted = this.highlightLine(lineText, fileType);
        linesHtml += `<div class="vim-line-row ${isCurrent ? 'active-line' : ''}">${highlighted}</div>`;
      } else {
        linesHtml += `<div class="vim-line-row"><span class="vim-tilde">~</span></div>`;
      }
    }
    this.linesContainer.innerHTML = linesHtml;

    // 4. Update Cursor Positioning
    const visibleCursorRow = this.cursor.row - this.scrollRow;
    const topPos = visibleCursorRow * this.lineHeight;
    const leftPos = this.cursor.col * this.charWidth;

    this.cursorBlock.style.top = `${topPos}px`;
    this.cursorBlock.style.left = `${leftPos}px`;
    this.cursorBlock.style.height = `${this.lineHeight}px`;
    this.cursorBlock.style.width = `${this.charWidth}px`;

    // 5. Update Statusline
    this.statusFileInfo.textContent = this.getFileName();
    this.statusDirtyFlag.textContent = this.isDirty ? ' [+]' : '';
    this.statusFileTypeTag.textContent = fileType;

    const totalLines = this.lines.length;
    let pctStr = 'Top';
    if (this.cursor.row === 0) pctStr = 'Top';
    else if (this.cursor.row === totalLines - 1) pctStr = 'Bot';
    else pctStr = `${Math.round(((this.cursor.row + 1) / totalLines) * 100)}%`;

    this.statusPercentTag.textContent = pctStr;
    this.statusPosTag.textContent = `${this.cursor.row + 1},${this.cursor.col + 1}`;
  }
}

window.vimApp = new VimEditor();
