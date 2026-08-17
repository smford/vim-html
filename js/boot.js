/**
 * vim-html — Linux Boot Simulation Engine
 * Simulates vintage and modern Linux kernel dmesg logs & systemd target milestones.
 */

class BootSimulator {
  constructor() {
    this.bootContainer = document.getElementById('boot-log-container');
    this.bootScreen = document.getElementById('boot-screen');
    this.terminalScreen = document.getElementById('terminal-screen');
    this.activeIndicator = document.getElementById('active-app-indicator');
    
    this.isBooting = true;
    this.bootLogs = [
      { text: "Linux version 6.12.8-sre-generic (gcc 13.2.0) #42 SMP PREEMPT Mon Aug 17 2026", type: "kernel" },
      { text: "Command line: BOOT_IMAGE=/vmlinuz-6.12.8-sre root=UUID=7c8f-28a1 ro quiet splash console=tty1", type: "kernel" },
      { text: "x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'", type: "kernel" },
      { text: "x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'", type: "kernel" },
      { text: "x86/fpu: Supporting XSAVE feature 0x004: 'AVX registers'", type: "kernel" },
      { text: "BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable", type: "kernel" },
      { text: "BIOS-e820: [mem 0x0000000000100000-0x00000000dfffffff] usable", type: "kernel" },
      { text: "Memory: 4096000K/4194304K available (14336K kernel code, 2304K rwdata, 4096K rodata)", type: "kernel" },
      { text: "smpboot: Allowing 8 CPUs, 0 hotplug CPUs", type: "kernel" },
      { text: "smp: Brought up 1 node, 8 CPUs", type: "kernel" },
      { text: "smpboot: Max logical packages: 1, Cores per package: 8", type: "kernel" },
      { text: "ACPI: Core revision 20240322", type: "kernel" },
      { text: "clocksource: Switched to clocksource tsc", type: "kernel" },
      { text: "pci 0000:00:00.0: [8086:1237] Host bridge", type: "kernel" },
      { text: "pci 0000:00:01.0: [8086:7000] ISA bridge", type: "kernel" },
      { text: "pci 0000:00:03.0: [8086:100e] Ethernet controller (VirtIO)", type: "kernel" },
      { text: "virtio-pci 0000:00:03.0: enabling device (0000 -> 0003)", type: "kernel" },
      { text: "scsi host0: virtio-scsi", type: "kernel" },
      { text: "scsi 0:0:0:0: Direct-Access     VIM-VFS  SSD DISK         1.0  PQ: 0 ANSI: 5", type: "kernel" },
      { text: "sd 0:0:0:0: [sda] 83886080 512-byte logical blocks: (42.9 GB / 40.0 GiB)", type: "kernel" },
      { text: "sd 0:0:0:0: [sda] Write cache: enabled, read cache: enabled, doesn't support DPO or FUA", type: "kernel" },
      { text: "EXT4-fs (sda1): mounted filesystem with ordered data mode. Quota mode: none.", type: "kernel" },
      { text: "systemd[1]: Inserted module 'autofs4'", type: "systemd" },
      { text: "systemd[1]: Set hostname to <sre-node-01>.", type: "systemd" },
      { text: "systemd[1]: Initializing machine ID from D-Bus machine ID.", type: "systemd" },
      { text: "Started File System Check on Root Device.", type: "ok" },
      { text: "Mounted /etc/fstab virtual swap partitions.", type: "ok" },
      { text: "Reached target Local File Systems (Pre).", type: "ok" },
      { text: "Mounted Virtual Filesystem (/vfs).", type: "ok" },
      { text: "Started Load/Save Random Seed.", type: "ok" },
      { text: "Started Apply Kernel Variables.", type: "ok" },
      { text: "Started Network Time Synchronization (systemd-timesyncd).", type: "ok" },
      { text: "Started D-Bus System Message Bus.", type: "ok" },
      { text: "Reached target Network (Pre).", type: "ok" },
      { text: "Started Network Configuration (systemd-networkd).", type: "ok" },
      { text: "eth0: Link UP (10000Mbps Full Duplex, IP: 10.244.0.15/24)", type: "info" },
      { text: "Reached target Network.", type: "ok" },
      { text: "Started OpenSSH SSH daemon.", type: "ok" },
      { text: "Started NGINX High Performance HTTP / Reverse Proxy Server.", type: "ok" },
      { text: "Started SRE Telemetry & Observability Daemon (otel-col).", type: "ok" },
      { text: "Reached target Multi-User System.", type: "ok" },
      { text: "Reached target Graphical Interface / Shell Ready.", type: "ok" },
      { text: "VimLinux 24.04 SRE Server (tty1) ready for user login.", type: "highlight" }
    ];

    this.timer = null;
    this.initKeyListeners();
  }

  initKeyListeners() {
    this.keyHandler = (e) => {
      if (this.isBooting) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          this.skipBoot();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    this.bootScreen.addEventListener('click', () => {
      if (this.isBooting) this.skipBoot();
    });
  }

  start() {
    this.isBooting = true;
    this.bootContainer.innerHTML = '';
    this.bootScreen.classList.remove('hidden');
    this.terminalScreen.classList.add('hidden');
    if (this.activeIndicator) this.activeIndicator.textContent = 'BOOT';

    let index = 0;
    let baseTime = 0.000100;

    const renderNextLog = () => {
      if (!this.isBooting) return;

      if (index >= this.bootLogs.length) {
        this.finishBoot();
        return;
      }

      const item = this.bootLogs[index];
      const lineEl = document.createElement('div');
      lineEl.className = 'boot-line';

      baseTime += Math.random() * 0.045 + 0.008;
      const timeStr = `[ ${baseTime.toFixed(6).padStart(11, ' ')} ]`;

      if (item.type === 'kernel') {
        lineEl.innerHTML = `<span class="boot-time">${timeStr}</span> ${this.escapeHtml(item.text)}`;
      } else if (item.type === 'ok') {
        lineEl.innerHTML = `<span class="boot-ok-box">OK</span> Started ${this.escapeHtml(item.text)}`;
      } else if (item.type === 'info') {
        lineEl.innerHTML = `<span class="boot-info-box">INFO</span> ${this.escapeHtml(item.text)}`;
      } else if (item.type === 'highlight') {
        lineEl.innerHTML = `<span class="boot-highlight">${this.escapeHtml(item.text)}</span>`;
      } else {
        lineEl.innerHTML = `<span class="boot-time">${timeStr}</span> ${this.escapeHtml(item.text)}`;
      }

      this.bootContainer.appendChild(lineEl);
      this.bootScreen.scrollTop = this.bootScreen.scrollHeight;

      index++;
      // Variable delay between lines for authentic system boot feel
      const delay = index < 15 ? (Math.random() * 30 + 15) : (Math.random() * 65 + 30);
      this.timer = setTimeout(renderNextLog, delay);
    };

    renderNextLog();
  }

  skipBoot() {
    if (!this.isBooting) return;
    clearTimeout(this.timer);
    this.finishBoot();
  }

  finishBoot() {
    this.isBooting = false;
    if (window.soundFx) {
      window.soundFx.playBootBeep();
    }

    setTimeout(() => {
      this.bootScreen.classList.add('hidden');
      this.terminalScreen.classList.remove('hidden');
      if (this.activeIndicator) this.activeIndicator.textContent = 'TERMINAL';
      
      if (window.terminalApp) {
        window.terminalApp.onBootComplete();
      }
    }, 200);
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.bootSimulator = new BootSimulator();
