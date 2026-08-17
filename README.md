# vim-html 🚀

> An authentic, in-browser Vim replica and simulated Linux SRE workstation environment with virtual filesystem persistence, syntax highlighting, kernel boot simulation, and real file export/download capabilities.

![vim-html Preview](https://img.shields.io/badge/Vim-Replica-brightgreen.svg) ![Linux-Kernel-6.12](https://img.shields.io/badge/Linux_Kernel-6.12.8--sre-blue.svg) ![HTML5-CSS3-JS](https://img.shields.io/badge/Stack-Vanilla_Web-orange.svg)

---

## 🌟 Key Features

### 1. 🖥️ Simulated Linux Boot & SRE Terminal Shell
- **Kernel Boot Sequence**: Realistic `dmesg` logs with microsecond precision, CPU/RAM detection, PCI/VirtIO bus discovery, and systemd target activations (`[ OK ] Started ...`). Press `Space`, `Enter`, or `Esc` to skip instantly.
- **Hierarchical Virtual In-Memory Filesystem (VFS)**: Complete `/`, `/home/user`, `/etc`, `/var/log`, `/proc`, and `/tmp` filesystem layout.
- **Shell Commands**: `ls` (with `-l`, `-a`, `-la` and colorized file types), `cd`, `pwd`, `mkdir -p`, `touch`, `cat`, `rm -r`, `cp`, `mv`, `echo` (with `>` and `>>` redirection), `clear`, `grep`, `top` / `htop` (live CPU/RAM bars and process lists), `ps aux`, `df -h`, `free -m`, `dmesg`, `whoami`, `uname -a`, `uptime`, `date`, `history`, `tree`, `download`, `upload`, `theme`, and `reboot`.
- **Shell Polish**: Autocompletion on `<Tab>`, command history with `<Up>`/`<Down>` arrows, and `<Ctrl+C>` interrupt.

### 2. ⚡ Exact Authentic Vim Editor Replica (`vim <filename>`)
- **Modes**:
  - `NORMAL`: Navigation, operators, count multipliers (`5j`, `10dd`, `3w`), undo/redo.
  - `INSERT`: Typing, auto-indentation, new line splits, backspace/delete.
  - `VISUAL` & `VISUAL LINE`: Character and line-wise selections, indent/unindent, yanking, deletion, case conversion (`u`/`U`/`~`).
  - `COMMAND-LINE` (`:`): `:w`, `:w <file>`, `:q`, `:q!`, `:wq`, `:x`, `:download`, `:export`, `:w !download`, `:set nu/rnu/wrap/ts`, `:%s/find/replace/g`, `:<line>`, `:r <file>`, `:! <cmd>`, `:help`.
  - `SEARCH` (`/` & `?`): Regex search with highlighted matches, `n` (next) and `N` (previous) jumps.
  - `REPLACE` (`R`): Character overwrite mode.
- **Motions**: `h`, `j`, `k`, `l`, `0`, `^`, `$`, `w`, `b`, `e`, `ge`, `gg`, `G`, `{`, `}`, `Ctrl+d`, `Ctrl+u`, `Ctrl+f`, `Ctrl+b`, `f<char>`, `F<char>`, `t<char>`, `T<char>`, `%` (matching brackets).
- **Operators & Actions**: `x`, `X`, `r<char>`, `dd`, `dw`, `d$`, `d0`, `dgg`, `dG`, `yy`, `yw`, `y$`, `p`, `P`, `u`, `Ctrl+r`, `.`, `J`, `>>`, `<<`, `~`.
- **Statusline**: Powerline-style statusline displaying active mode, filename, `[+]` modified status, filetype, percentage, and `line,col` coordinates.
- **Syntax Highlighting**: Real-time syntax token highlighting for Python, JavaScript, JSON, YAML, Shell scripts, Markdown, HTML, CSS, and C.

### 3. 💾 Real File Download, Upload & VFS Restore
- **Inside Vim**: Type `:download`, `:export`, or `:w !download` to trigger immediate browser download of the active buffer.
- **In Terminal**: Run `download <filename>` (e.g. `download server.py`).
- **Backup Entire System**: Click **Export VFS** in the top navigation bar or run `export-vfs` / `vfs-export` in the terminal to download all files and directories as a JSON snapshot (`vfs_export_<timestamp>.json`).
- **Upload & Restore Previous VFS**:
  - Click the **Import VFS** button in the header toolbar.
  - Or run `vfs-import <file.json>` in the terminal.
  - Or simply **drag-and-drop** your previously downloaded `vfs_export_*.json` anywhere onto the browser window. The system will automatically detect the VFS backup signature and restore all files, directories, permissions, and timestamps.
- **Upload Regular Files**: Click **Upload File** or drag-and-drop any code/text files directly into your current working directory.

### 4. 🎨 Themes & Retro Aesthetics
- **9 Curated Color Themes**: Gruvbox Dark, Monokai Pro, Nord Arctic, Dracula, Tokyo Night, One Dark, Solarized Dark, Retro Green CRT, and Retro Amber CRT.
- **Retro CRT Scanlines**: Toggleable scanlines and CRT display glow.
- **Web Audio Synthesizer**: Realistic mechanical keyboard key clicks, vintage boot chime, and terminal bell audio.

---

## 🛠️ How to Run Locally

Because `vim-html` is built with pure, self-contained modern HTML5, CSS3, and JavaScript, you can run it with any static web server:

```bash
# Using Python 3 built-in HTTP server:
python3 -m http.server 8080

# Or using Node npx serve:
npx serve .
```

Open your browser at `http://localhost:8080` to launch the workstation!
