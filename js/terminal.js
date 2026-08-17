/**
 * vim-html — Linux Terminal & Shell Simulation Engine
 * Provides authentic shell commands, pipes/redirection, tab completion, command history,
 * process monitoring (top/ps), and seamless Vim integration.
 */

class TerminalShell {
  constructor() {
    this.screen = document.getElementById('terminal-screen');
    this.output = document.getElementById('terminal-output');
    this.cmdInput = document.getElementById('terminal-cmd-input');
    this.promptUser = document.getElementById('terminal-prompt-user');
    this.promptPath = document.getElementById('terminal-prompt-path');
    this.activeIndicator = document.getElementById('active-app-indicator');

    this.cwd = '/home/user';
    this.user = 'user';
    this.hostname = 'sre-node-01';
    
    // Command History
    this.history = [];
    this.historyIndex = -1;
    this.tempInput = '';

    this.initEventListeners();
  }

  onBootComplete() {
    this.renderWelcomeBanner();
    this.updatePrompt();
    this.focus();
  }

  focus() {
    this.cmdInput.focus();
  }

  initEventListeners() {
    this.screen.addEventListener('click', () => {
      this.focus();
    });

    this.cmdInput.addEventListener('keydown', (e) => {
      // Key click audio
      if (window.soundFx) {
        window.soundFx.playKeyClick(e.key);
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const raw = this.cmdInput.value;
        this.cmdInput.value = '';
        this.historyIndex = -1;
        this.executeCommandLine(raw);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.history.length === 0) return;
        if (this.historyIndex === -1) {
          this.tempInput = this.cmdInput.value;
          this.historyIndex = this.history.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        this.cmdInput.value = this.history[this.historyIndex] || '';
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex === -1) return;
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.cmdInput.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = -1;
          this.cmdInput.value = this.tempInput;
        }
        return;
      }

      // Tab Completion
      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
        return;
      }

      // Ctrl+C (Interrupt)
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.appendOutput(`${this.getPromptHtml()} ${this.escapeHtml(this.cmdInput.value)}^C`);
        this.cmdInput.value = '';
        this.historyIndex = -1;
        this.scrollToBottom();
        return;
      }

      // Ctrl+L (Clear screen)
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        this.output.innerHTML = '';
        return;
      }
    });
  }

  getPromptPathDisplay() {
    if (this.cwd === '/home/user') return '~';
    if (this.cwd.startsWith('/home/user/')) return '~' + this.cwd.slice(10);
    return this.cwd;
  }

  updatePrompt() {
    this.promptUser.textContent = `${this.user}@${this.hostname}`;
    this.promptPath.textContent = this.getPromptPathDisplay();
  }

  getPromptHtml() {
    return `<span class="prompt-user">${this.user}@${this.hostname}</span><span class="prompt-separator">:</span><span class="prompt-path">${this.getPromptPathDisplay()}</span><span class="prompt-symbol">$</span>`;
  }

  renderWelcomeBanner() {
    const banner = document.createElement('div');
    banner.className = 'terminal-banner';
    banner.innerHTML = `
      <div class="terminal-banner-title">Welcome to vim-html — Linux Terminal & Authentic Vim Replica</div>
      <div class="terminal-banner-desc">
        System initialized. Virtual in-memory filesystem mounted at <code>/</code>.<br>
        Type <strong style="color:var(--accent-secondary)">vim &lt;filename&gt;</strong> to create or edit files (e.g. <code>vim server.py</code> or <code>vim notes.txt</code>).<br>
        Type <strong style="color:var(--accent-aqua)">help</strong> for a list of available shell commands. Type <strong style="color:var(--accent-primary)">download &lt;filename&gt;</strong> to export files to your computer.
      </div>
    `;
    this.output.appendChild(banner);
  }

  handleTabCompletion() {
    const text = this.cmdInput.value;
    const tokens = text.split(/\s+/);
    const lastToken = tokens[tokens.length - 1];

    if (tokens.length === 1 && !text.includes(' ')) {
      // Command autocompletion
      const allCommands = [
        'vim', 'vi', 'nvim', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'rm', 'cp', 'mv',
        'echo', 'clear', 'help', 'date', 'whoami', 'uname', 'top', 'htop', 'ps', 'uptime',
        'df', 'free', 'dmesg', 'tree', 'download', 'upload', 'vfs-import', 'vfs-export',
        'import-vfs', 'export-vfs', 'history', 'grep', 'reboot', 'theme'
      ];
      const matches = allCommands.filter(c => c.startsWith(lastToken));
      if (matches.length === 1) {
        this.cmdInput.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        this.appendOutput(`${this.getPromptHtml()} ${text}`);
        this.appendOutput(matches.join('  '));
        this.scrollToBottom();
      }
    } else {
      // File / Directory autocompletion
      const currentItems = window.vfs.readdir(this.cwd) || [];
      const matchPrefix = lastToken.startsWith('/') ? lastToken : lastToken;
      const candidates = currentItems.map(i => i.type === 'dir' ? i.name + '/' : i.name);
      const matches = candidates.filter(name => name.startsWith(matchPrefix));

      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0];
        this.cmdInput.value = tokens.join(' ');
      } else if (matches.length > 1) {
        this.appendOutput(`${this.getPromptHtml()} ${text}`);
        this.appendOutput(matches.join('  '));
        this.scrollToBottom();
      }
    }
  }

  scrollToBottom() {
    this.screen.scrollTop = this.screen.scrollHeight;
  }

  appendOutput(htmlContent) {
    const row = document.createElement('div');
    row.className = 'term-cmd-output';
    row.innerHTML = htmlContent;
    this.output.appendChild(row);
  }

  executeCommandLine(cmdLine) {
    const trimmed = cmdLine.trim();
    if (!trimmed) {
      this.appendOutput(this.getPromptHtml());
      this.scrollToBottom();
      return;
    }

    // Save to history
    this.history.push(cmdLine);
    if (this.history.length > 200) this.history.shift();

    // Echo input row
    this.appendOutput(`${this.getPromptHtml()} ${this.escapeHtml(cmdLine)}`);

    // Check for output redirection (> or >>)
    let redirectMode = null;
    let redirectTarget = null;
    let parsedCmd = trimmed;

    if (trimmed.includes('>>')) {
      const parts = trimmed.split('>>');
      parsedCmd = parts[0].trim();
      redirectMode = 'append';
      redirectTarget = parts[1].trim();
    } else if (trimmed.includes('>')) {
      const parts = trimmed.split('>');
      parsedCmd = parts[0].trim();
      redirectMode = 'overwrite';
      redirectTarget = parts[1].trim();
    }

    const tokens = parsedCmd.split(/\s+/).filter(Boolean);
    const cmd = tokens[0];
    const args = tokens.slice(1);

    // Execute Command
    const outputResult = this.dispatchCommand(cmd, args);

    if (redirectMode && redirectTarget) {
      const targetPath = window.vfs.resolve(this.cwd, redirectTarget);
      const cleanOutput = outputResult.replace(/<[^>]*>?/gm, ''); // strip HTML tags for raw file storage
      if (redirectMode === 'overwrite') {
        window.vfs.writeFile(targetPath, cleanOutput + '\n');
      } else {
        window.vfs.appendFile(targetPath, cleanOutput + '\n');
      }
      if (window.app) window.app.updateSystemStatus();
    } else if (outputResult) {
      this.appendOutput(outputResult);
    }

    this.updatePrompt();
    this.scrollToBottom();
  }

  dispatchCommand(cmd, args) {
    switch (cmd) {
      case 'vim':
      case 'vi':
      case 'nvim':
        return this.cmdVim(args);

      case 'ls':
        return this.cmdLs(args);

      case 'tree':
        return this.cmdTree(args);

      case 'cd':
        return this.cmdCd(args);

      case 'pwd':
        return this.cwd;

      case 'mkdir':
        return this.cmdMkdir(args);

      case 'touch':
        return this.cmdTouch(args);

      case 'cat':
        return this.cmdCat(args);

      case 'rm':
        return this.cmdRm(args);

      case 'cp':
        return this.cmdCp(args);

      case 'mv':
        return this.cmdMv(args);

      case 'echo':
        return args.join(' ').replace(/^["']|["']$/g, '');

      case 'clear':
        this.output.innerHTML = '';
        return '';

      case 'help':
        return this.cmdHelp();

      case 'date':
        return new Date().toUTCString();

      case 'whoami':
        return this.user;

      case 'uname':
        if (args.includes('-a') || args.includes('-r')) {
          return 'Linux sre-node-01 6.12.8-sre-generic #42-SMP PREEMPT Mon Aug 17 2026 x86_64 GNU/Linux';
        }
        return 'Linux';

      case 'uptime':
        return ' 22:04:12 up 14 days,  3:22,  1 user,  load average: 0.12, 0.08, 0.05';

      case 'top':
      case 'htop':
        return this.cmdTop();

      case 'ps':
        return this.cmdPs(args);

      case 'df':
        return this.cmdDf();

      case 'free':
        return this.cmdFree();

      case 'dmesg':
        return this.cmdDmesg();

      case 'download':
      case 'export':
        return this.cmdDownload(args);

      case 'vfs-export':
      case 'export-vfs':
        window.vfs.exportAll();
        return '<span style="color:var(--accent-primary)">[✓] Triggered Virtual Filesystem backup download.</span>';

      case 'vfs-import':
      case 'import-vfs':
        return this.cmdVfsImport(args);

      case 'upload':
        if (window.app) window.app.triggerFileUpload();
        return 'Opening file upload selector...';

      case 'history':
        return this.history.map((h, i) => `${(i + 1).toString().padStart(4, ' ')}  ${this.escapeHtml(h)}`).join('<br>');

      case 'grep':
        return this.cmdGrep(args);

      case 'theme':
        if (args[0] && window.app) {
          window.app.setTheme(args[0]);
          return `Theme switched to: ${args[0]}`;
        }
        return 'Usage: theme [gruvbox|monokai|nord|dracula|tokyonight|onedark|solarized|retro-green|retro-amber]';

      case 'reboot':
        if (window.bootSimulator) {
          window.bootSimulator.start();
        }
        return 'Rebooting system...';

      default:
        return `<span style="color:var(--accent-danger)">bash: ${this.escapeHtml(cmd)}: command not found</span>. Type <strong style="color:var(--accent-secondary)">help</strong> for available commands.`;
    }
  }

  // ==========================================
  // COMMAND IMPLEMENTATIONS
  // ==========================================

  cmdVim(args) {
    const fileName = args[0] || 'untitled.txt';
    const resolvedPath = window.vfs.resolve(this.cwd, fileName);
    const content = window.vfs.readFile(resolvedPath) || '';

    // Switch screen to Vim
    this.screen.classList.add('hidden');
    if (this.activeIndicator) this.activeIndicator.textContent = 'VIM';
    window.vimApp.openFile(resolvedPath, content);
    return '';
  }

  cmdLs(args) {
    const showAll = args.some(a => a.includes('a'));
    const isLong = args.some(a => a.includes('l'));
    
    // Find target path if provided
    const pathArg = args.find(a => !a.startsWith('-')) || '.';
    const resolved = window.vfs.resolve(this.cwd, pathArg);

    if (!window.vfs.exists(resolved)) {
      return `<span style="color:var(--accent-danger)">ls: cannot access '${this.escapeHtml(pathArg)}': No such file or directory</span>`;
    }

    if (window.vfs.isFile(resolved)) {
      const node = window.vfs.getNode(resolved);
      return isLong 
        ? `${node.permissions} 1 ${node.owner} ${node.group} ${String(node.size).padStart(6, ' ')} ${this.formatDate(node.mtime)} <span class="term-exec">${node.name}</span>`
        : `<span class="term-exec">${node.name}</span>`;
    }

    const items = window.vfs.readdir(resolved) || [];
    const filtered = showAll ? items : items.filter(i => !i.name.startsWith('.'));

    if (filtered.length === 0) return '';

    if (isLong) {
      let html = `<div style="color:var(--text-muted); margin-bottom:4px;">total ${filtered.length * 4}</div><table class="term-table">`;
      for (const item of filtered) {
        const typeClass = item.type === 'dir' ? 'term-dir' : (item.name.endsWith('.sh') || item.name.endsWith('.py') ? 'term-exec' : '');
        html += `
          <tr>
            <td>${item.permissions}</td>
            <td>1</td>
            <td>${item.owner}</td>
            <td>${item.group}</td>
            <td style="text-align:right;">${item.size}</td>
            <td>${this.formatDate(item.mtime)}</td>
            <td><span class="${typeClass}">${item.name}${item.type === 'dir' ? '/' : ''}</span></td>
          </tr>
        `;
      }
      html += '</table>';
      return html;
    }

    // Grid layout
    return filtered.map(item => {
      const typeClass = item.type === 'dir' ? 'term-dir' : (item.name.endsWith('.sh') || item.name.endsWith('.py') ? 'term-exec' : '');
      return `<span class="${typeClass}" style="display:inline-block; min-width:140px; margin-right:16px;">${item.name}${item.type === 'dir' ? '/' : ''}</span>`;
    }).join('');
  }

  cmdTree(args) {
    const target = args[0] || '.';
    const resolved = window.vfs.resolve(this.cwd, target);
    if (!window.vfs.exists(resolved)) {
      return `<span style="color:var(--accent-danger)">tree: '${target}': No such file or directory</span>`;
    }
    const lines = window.vfs.tree(resolved);
    return `<span class="term-dir">${this.escapeHtml(resolved)}</span><br>` + lines.map(l => this.escapeHtml(l)).join('<br>');
  }

  cmdCd(args) {
    const target = args[0] || '~';
    const resolved = window.vfs.resolve(this.cwd, target);

    if (!window.vfs.exists(resolved)) {
      return `<span style="color:var(--accent-danger)">bash: cd: ${this.escapeHtml(target)}: No such file or directory</span>`;
    }
    if (!window.vfs.isDir(resolved)) {
      return `<span style="color:var(--accent-danger)">bash: cd: ${this.escapeHtml(target)}: Not a directory</span>`;
    }

    this.cwd = resolved;
    return '';
  }

  cmdMkdir(args) {
    if (args.length === 0) {
      return 'mkdir: missing operand';
    }
    const isRecursive = args.includes('-p');
    const target = args.find(a => !a.startsWith('-'));
    const resolved = window.vfs.resolve(this.cwd, target);

    const success = window.vfs.mkdir(resolved, isRecursive);
    if (!success) {
      return `<span style="color:var(--accent-danger)">mkdir: cannot create directory '${this.escapeHtml(target)}': File or directory exists or parent not found</span>`;
    }
    if (window.app) window.app.updateSystemStatus();
    return '';
  }

  cmdTouch(args) {
    if (args.length === 0) return 'touch: missing file operand';
    for (const fn of args) {
      if (fn.startsWith('-')) continue;
      const resolved = window.vfs.resolve(this.cwd, fn);
      if (!window.vfs.exists(resolved)) {
        window.vfs.writeFile(resolved, '');
      }
    }
    if (window.app) window.app.updateSystemStatus();
    return '';
  }

  cmdCat(args) {
    if (args.length === 0) return 'cat: missing file operand';
    const target = args[0];
    const resolved = window.vfs.resolve(this.cwd, target);

    if (!window.vfs.exists(resolved)) {
      return `<span style="color:var(--accent-danger)">cat: ${this.escapeHtml(target)}: No such file or directory</span>`;
    }
    if (window.vfs.isDir(resolved)) {
      return `<span style="color:var(--accent-danger)">cat: ${this.escapeHtml(target)}: Is a directory</span>`;
    }

    const content = window.vfs.readFile(resolved);
    return this.escapeHtml(content || '');
  }

  cmdRm(args) {
    const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-R');
    const target = args.find(a => !a.startsWith('-'));
    if (!target) return 'rm: missing operand';

    const resolved = window.vfs.resolve(this.cwd, target);
    if (!window.vfs.exists(resolved)) {
      return `<span style="color:var(--accent-danger)">rm: cannot remove '${this.escapeHtml(target)}': No such file or directory</span>`;
    }

    const success = window.vfs.rm(resolved, isRecursive);
    if (!success) {
      return `<span style="color:var(--accent-danger)">rm: cannot remove '${this.escapeHtml(target)}': Is a directory (use -r)</span>`;
    }
    if (window.app) window.app.updateSystemStatus();
    return '';
  }

  cmdCp(args) {
    if (args.length < 2) return 'cp: missing destination file operand';
    const isRecursive = args.includes('-r') || args.includes('-R');
    const nonFlags = args.filter(a => !a.startsWith('-'));
    const src = window.vfs.resolve(this.cwd, nonFlags[0]);
    const dst = window.vfs.resolve(this.cwd, nonFlags[1]);

    const success = window.vfs.cp(src, dst, isRecursive);
    if (!success) return `<span style="color:var(--accent-danger)">cp: failed to copy '${nonFlags[0]}' to '${nonFlags[1]}'</span>`;
    if (window.app) window.app.updateSystemStatus();
    return '';
  }

  cmdMv(args) {
    if (args.length < 2) return 'mv: missing destination file operand';
    const src = window.vfs.resolve(this.cwd, args[0]);
    const dst = window.vfs.resolve(this.cwd, args[1]);

    const success = window.vfs.mv(src, dst);
    if (!success) return `<span style="color:var(--accent-danger)">mv: cannot move '${args[0]}' to '${args[1]}'</span>`;
    if (window.app) window.app.updateSystemStatus();
    return '';
  }

  cmdDownload(args) {
    if (args.length === 0) return 'Usage: download &lt;filename&gt;';
    const target = window.vfs.resolve(this.cwd, args[0]);
    const success = window.vfs.downloadFile(target);
    if (success) {
      return `<span style="color:var(--accent-primary)">[✓] Successfully exported '${this.escapeHtml(args[0])}' to browser download manager.</span>`;
    }
    return `<span style="color:var(--accent-danger)">download: cannot read '${this.escapeHtml(args[0])}': File not found</span>`;
  }

  cmdVfsImport(args) {
    if (args.length === 0) {
      if (window.app && window.app.vfsImporterInput) {
        window.app.vfsImporterInput.click();
        return 'Opening VFS backup file selector dialog...';
      }
      return 'Usage: vfs-import &lt;vfs_backup_file.json&gt;';
    }

    const target = window.vfs.resolve(this.cwd, args[0]);
    const content = window.vfs.readFile(target);
    if (!content) {
      return `<span style="color:var(--accent-danger)">vfs-import: cannot read '${this.escapeHtml(args[0])}': File not found</span>`;
    }

    const res = window.vfs.importTree(content);
    if (res.success) {
      if (window.app) window.app.updateSystemStatus();
      return `<span style="color:var(--accent-primary)">[✓] Successfully restored Virtual Filesystem (${res.filesRestored} files, ${res.dirsRestored} directories) from <strong>${this.escapeHtml(args[0])}</strong>.</span>`;
    }
    return `<span style="color:var(--accent-danger)">vfs-import error: ${this.escapeHtml(res.error || 'Failed to restore VFS')}</span>`;
  }

  cmdGrep(args) {
    if (args.length < 2) return 'Usage: grep &lt;pattern&gt; &lt;file&gt;';
    const pattern = args[0];
    const target = window.vfs.resolve(this.cwd, args[1]);

    const content = window.vfs.readFile(target);
    if (content === null) return `grep: ${args[1]}: No such file`;

    const lines = content.split('\n');
    const matches = lines.filter(l => l.includes(pattern));
    return matches.map(l => l.replace(new RegExp(pattern, 'g'), `<span style="color:var(--accent-danger); font-weight:bold;">${pattern}</span>`)).join('<br>');
  }

  cmdTop() {
    const cpuPct = (Math.random() * 8 + 1.2).toFixed(1);
    const memMb = Math.floor(Math.random() * 50 + 410);
    return `
      <div class="term-top-header">
        <div style="font-weight:bold; color:var(--accent-secondary); margin-bottom:6px;">SRE System Monitor — Node sre-node-01 (x86_64, 8 Cores)</div>
        <div class="term-top-bar-row">
          <span class="term-top-bar-label">CPU: [${cpuPct}%]</span>
          <div class="term-top-bar-outer"><div class="term-top-bar-fill" style="width: ${cpuPct}%"></div></div>
        </div>
        <div class="term-top-bar-row">
          <span class="term-top-bar-label">RAM: [${memMb}M]</span>
          <div class="term-top-bar-outer"><div class="term-top-bar-fill" style="width: ${(memMb/4096)*100}%; background:linear-gradient(90deg, #8ec07c, #fabd2f)"></div></div>
        </div>
        <div style="margin-top:6px; color:var(--text-muted);">Tasks: 42 total, 1 running, 41 sleeping, 0 stopped, 0 zombie</div>
      </div>
      <table class="term-table">
        <tr><th>PID</th><th>USER</th><th>PR</th><th>NI</th><th>VIRT</th><th>RES</th><th>%CPU</th><th>%MEM</th><th>TIME+</th><th>COMMAND</th></tr>
        <tr><td>1</td><td>root</td><td>20</td><td>0</td><td>168M</td><td>14M</td><td>0.1</td><td>0.3</td><td>0:12.4</td><td>/sbin/init</td></tr>
        <tr><td>412</td><td>user</td><td>20</td><td>0</td><td>320M</td><td>48M</td><td>${cpuPct}</td><td>1.2</td><td>0:04.8</td><td>vim-html-engine</td></tr>
        <tr><td>618</td><td>nginx</td><td>20</td><td>0</td><td>142M</td><td>18M</td><td>0.4</td><td>0.4</td><td>1:42.1</td><td>nginx: worker</td></tr>
        <tr><td>890</td><td>otel</td><td>20</td><td>0</td><td>256M</td><td>32M</td><td>0.8</td><td>0.8</td><td>4:11.9</td><td>otel-collector</td></tr>
        <tr><td>1024</td><td>postgres</td><td>20</td><td>0</td><td>840M</td><td>120M</td><td>1.1</td><td>2.9</td><td>18:40.2</td><td>postgres: pooler</td></tr>
      </table>
    `;
  }

  cmdPs(args) {
    return `
      <table class="term-table">
        <tr><th>PID</th><th>TTY</th><th>TIME</th><th>CMD</th></tr>
        <tr><td>1</td><td>?</td><td>00:00:02</td><td>systemd</td></tr>
        <tr><td>340</td><td>?</td><td>00:00:01</td><td>systemd-journald</td></tr>
        <tr><td>610</td><td>?</td><td>00:00:00</td><td>nginx: master process</td></tr>
        <tr><td>720</td><td>tty1</td><td>00:00:01</td><td>bash</td></tr>
        <tr><td>840</td><td>tty1</td><td>00:00:04</td><td>vim-html</td></tr>
        <tr><td>912</td><td>tty1</td><td>00:00:00</td><td>ps ${args.join(' ')}</td></tr>
      </table>
    `;
  }

  cmdDf() {
    return `
      <table class="term-table">
        <tr><th>Filesystem</th><th>1K-blocks</th><th>Used</th><th>Available</th><th>Use%</th><th>Mounted on</th></tr>
        <tr><td>/dev/sda1</td><td>41943040</td><td>4821040</td><td>37122000</td><td>12%</td><td>/</td></tr>
        <tr><td>tmpfs</td><td>2048000</td><td>4120</td><td>2043880</td><td>1%</td><td>/dev/shm</td></tr>
        <tr><td>vfs_in_memory</td><td>1048576</td><td>64</td><td>1048512</td><td>1%</td><td>/home/user</td></tr>
      </table>
    `;
  }

  cmdFree() {
    return `
      <table class="term-table">
        <tr><th></th><th>total</th><th>used</th><th>free</th><th>shared</th><th>buff/cache</th><th>available</th></tr>
        <tr><td>Mem:</td><td>4096000</td><td>412000</td><td>2841200</td><td>4120</td><td>842800</td><td>3412000</td></tr>
        <tr><td>Swap:</td><td>2097148</td><td>0</td><td>2097148</td><td></td><td></td><td></td></tr>
      </table>
    `;
  }

  cmdDmesg() {
    return `
      [    0.000000] Linux version 6.12.8-sre-generic (gcc 13.2.0) #42-SMP<br>
      [    0.024102] CPU0: AMD EPYC 9654 96-Core Processor (fam: 25, model: 11)<br>
      [    0.142091] Memory: 4096000K/4194304K available<br>
      [    0.412089] EXT4-fs (sda1): mounted filesystem with ordered data mode<br>
      [    0.842100] virtio_net virtio0 eth0: renamed from eth0<br>
      [    1.204910] IPv6: ADDRCONF(NETDEV_CHANGE): eth0: link becomes ready<br>
      [    1.849100] VFS: In-Memory hierarchical structure initialized successfully.
    `;
  }

  cmdHelp() {
    return `
      <div style="color:var(--accent-secondary); font-weight:bold; margin-bottom:6px;">Available Shell Commands:</div>
      <table class="term-table">
        <tr><td><strong style="color:var(--accent-primary)">vim &lt;file&gt;</strong></td><td>Open or create file in authentic Vim editor (vi / nvim)</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">download &lt;file&gt;</strong></td><td>Download/Export file to your computer's Downloads folder</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">ls [-la]</strong></td><td>List files in current directory with colors/permissions</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">tree</strong></td><td>Display directory hierarchy tree</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">cd &lt;dir&gt;</strong></td><td>Change directory (cd ~, cd .., cd /etc)</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">pwd</strong></td><td>Print current working directory</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">mkdir &lt;dir&gt;</strong></td><td>Create new directory (-p for recursive)</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">touch &lt;file&gt;</strong></td><td>Create empty file</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">cat &lt;file&gt;</strong></td><td>Print file contents to screen</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">echo "str" &gt; &lt;file&gt;</strong></td><td>Redirect text output to file</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">rm [-r] &lt;target&gt;</strong></td><td>Remove file or directory</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">cp &lt;src&gt; &lt;dst&gt;</strong></td><td>Copy file</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">mv &lt;src&gt; &lt;dst&gt;</strong></td><td>Move or rename file</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">grep &lt;pat&gt; &lt;file&gt;</strong></td><td>Search pattern inside file</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">top / ps</strong></td><td>View running processes and live CPU/Memory utilization</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">df / free</strong></td><td>View disk storage and RAM statistics</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">theme &lt;name&gt;</strong></td><td>Switch theme (gruvbox, nord, monokai, dracula, etc.)</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">clear</strong></td><td>Clear terminal screen (Ctrl+L)</td></tr>
        <tr><td><strong style="color:var(--accent-primary)">reboot</strong></td><td>Restart kernel boot simulation</td></tr>
      </table>
    `;
  }

  formatDate(dateObj) {
    if (!dateObj) dateObj = new Date();
    const m = dateObj.toLocaleString('en-US', { month: 'short' });
    const d = dateObj.getDate().toString().padStart(2, ' ');
    const t = dateObj.toTimeString().slice(0, 5);
    return `${m} ${d} ${t}`;
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
}

window.terminalApp = new TerminalShell();
