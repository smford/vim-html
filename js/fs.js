/**
 * vim-html — Virtual In-Memory Filesystem (VFS)
 * Manages full hierarchical directory tree, permissions, timestamps, and real file export/downloads.
 */

class VirtualFS {
  constructor() {
    this.root = {
      type: 'dir',
      name: '',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      mtime: new Date(),
      children: {}
    };

    this.initDefaultFileSystem();
  }

  initDefaultFileSystem() {
    // Standard Linux directory tree
    this.mkdir('/bin', true);
    this.mkdir('/etc', true);
    this.mkdir('/etc/nginx', true);
    this.mkdir('/home/user', true);
    this.mkdir('/home/user/src', true);
    this.mkdir('/var/log/nginx', true);
    this.mkdir('/tmp', true);
    this.mkdir('/proc', true);

    const now = Date.now();
    const tWelcome = new Date(now - 1000 * 60 * 120);     // 2 hours ago
    const tBackup = new Date(now - 1000 * 60 * 90);       // 1.5 hours ago
    const tK8s = new Date(now - 1000 * 60 * 60);          // 1 hour ago
    const tServer = new Date(now - 1000 * 60 * 30);       // 30 mins ago
    const tNginx = new Date(now - 1000 * 60 * 20);        // 20 mins ago
    const tArch = new Date(now - 1000 * 60 * 10);         // 10 mins ago
    const tIncident = new Date(now - 1000 * 60 * 2);      // 2 mins ago

    // 1. Welcome Guide
    this.writeFile('/home/user/welcome.txt', 
`==============================================================================
   __      ___                 _   _ _____ __  __ _     
   \\ \\    / (_)               | | | |_   _|  \\/  | |    
    \\ \\  / / _ _ __ ___ ______| |_| | | | | \\  / | |    
     \\ \\/ / | | '_ \` _ \\______|  _  | | | | |\\/| | |    
      \\  /  | | | | | | |     | | | |_| |_| |  | | |____
       \\/   |_|_| |_| |_|     \\_| |_/_____|_|  |_|______|
                                                        
 Welcome to vim-html — An authentic Vim Replica & Linux SRE Workstation!
==============================================================================

[ QUICK START WITH VIM ]
  1. To open or edit any file, run:
       vim welcome.txt
       vim server.py
       vim incident_report.md

  2. Inside Vim:
       - Press 'i' to enter INSERT mode.
       - Type text as needed.
       - Press 'Esc' to return to NORMAL mode.
       - Type ':w' and Enter to save changes to the virtual filesystem.
       - Type ':wq' or ':x' and Enter to save and exit back to the terminal.
       - Type ':q!' to exit without saving.

[ REAL FILE DOWNLOADS ]
  - Inside Vim: Type ':download' or ':export' or ':w !download'
  - In Terminal: Run 'download <filename>' (e.g. download server.py)
  - Top Navigation Bar: Click the "Download" or "Export VFS" buttons!

[ SHELL COMMANDS ]
  - ls, ls -latr, tree, cd, pwd, mkdir, cat, rm, cp, mv, echo, clear, help,
  - top, htop, ps aux, df -h, free -m, dmesg, whoami, uname -a, reboot.

Try editing sample files in /home/user with vim now!
`, true, tWelcome);

    // 2. SRE Incident Report Template with GFM alerts and SVG image
    this.writeFile('/home/user/incident_report.md',
`# Post-Mortem Incident Report: INC-2026-0817-A

![Cluster Status Badge](https://img.shields.io/badge/Cluster_Status-Mitigated-brightgreen.svg) ![Severity](https://img.shields.io/badge/Severity-P1_Critical-red.svg)

> [!IMPORTANT]
> All primary user sessions have been re-routed through availability zone \`eu-west-1b\`.

**Status**: Resolved  
**Severity**: P1 - Critical  
**Date**: 2026-08-17 19:42:00 UTC  
**Lead SRE**: Alex Chen (@sre-lead)  
**Impacted Services**: \`api-gateway\`, \`auth-service\`, \`billing-processor\`

---

## 1. Executive Summary
Between 19:42 and 20:05 UTC, our European edge gateway experienced a 74% increase in 504 Gateway Timeouts. The root cause was identified as an unindexed query on the \`user_sessions\` table triggered by a scheduled cron migration.

## 2. Infrastructure Topology
![Production System Architecture](architecture.svg)

## 3. Timeline (all times in UTC)
- **19:42**: Datadog latency monitor triggered alert \`ALERT_GATEWAY_P99_SPIKE\`.
- **19:45**: On-call engineer acknowledged incident and initiated war room.
- **19:50**: Traffic shifted to secondary availability zone (eu-west-1b).
- **19:58**: Postgres connection pool saturation mitigated via \`pgbouncer\` restart.
- **20:05**: Hotfix patch applied; response latency normalized to 32ms.

## 4. Action Items
- [x] Add composite index on \`user_sessions(account_id, expires_at)\`
- [ ] Implement query timeout caps on all migration batch runs
- [ ] Upgrade RDS Postgres instance class to \`db.r6g.4xlarge\`
- [ ] Review auto-scaling cooldown intervals in Terraform manifest
`, true, tIncident);

    // 2.1 Architecture SVG Diagram
    this.writeFile('/home/user/architecture.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 240" width="100%" height="240" style="background:#1d2021; font-family:'Fira Code', monospace; border-radius:8px;">
  <defs>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b8bb26"/>
      <stop offset="100%" stop-color="#8ec07c"/>
    </linearGradient>
    <linearGradient id="alertGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb4934"/>
      <stop offset="100%" stop-color="#fabd2f"/>
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="20" y="30" fill="#ebdbb2" font-size="14" font-weight="bold">PROD-EU-WEST-1 CLUSTER TOPOLOGY</text>

  <!-- Gateway Box -->
  <rect x="30" y="70" width="140" height="110" rx="6" fill="#282828" stroke="#8ec07c" stroke-width="2"/>
  <text x="45" y="100" fill="#8ec07c" font-size="12" font-weight="bold">Edge Ingress</text>
  <text x="45" y="125" fill="#a89984" font-size="10">NGINX Gateway</text>
  <text x="45" y="145" fill="#fabd2f" font-size="10">Ports: 80, 443</text>
  <circle cx="150" cy="85" r="5" fill="#b8bb26"/>

  <!-- Arrow 1 -->
  <line x1="170" y1="125" x2="250" y2="125" stroke="#ebdbb2" stroke-width="2" stroke-dasharray="4"/>
  <polygon points="250,120 260,125 250,130" fill="#ebdbb2"/>

  <!-- App Cluster Box -->
  <rect x="260" y="55" width="170" height="140" rx="6" fill="#282828" stroke="#83a598" stroke-width="2"/>
  <text x="275" y="85" fill="#83a598" font-size="12" font-weight="bold">K8s Core Services</text>
  <text x="275" y="110" fill="#ebdbb2" font-size="10">• auth-service (x3)</text>
  <text x="275" y="130" fill="#ebdbb2" font-size="10">• api-backend (x5)</text>
  <text x="275" y="150" fill="#ebdbb2" font-size="10">• otel-collector</text>
  <text x="275" y="175" fill="#b8bb26" font-size="9">✓ Latency: 32ms</text>

  <!-- Arrow 2 -->
  <line x1="430" y1="125" x2="500" y2="125" stroke="#ebdbb2" stroke-width="2" stroke-dasharray="4"/>
  <polygon points="500,120 510,125 500,130" fill="#ebdbb2"/>

  <!-- Database Box -->
  <rect x="510" y="70" width="160" height="110" rx="6" fill="#282828" stroke="#d3869b" stroke-width="2"/>
  <text x="525" y="100" fill="#d3869b" font-size="12" font-weight="bold">Data Layer</text>
  <text x="525" y="125" fill="#a89984" font-size="10">PgBouncer Pooler</text>
  <text x="525" y="145" fill="#a89984" font-size="10">PostgreSQL 16 (Primary)</text>
  <circle cx="650" cy="85" r="5" fill="#b8bb26"/>
</svg>`, true, tArch);

    // 3. Kubernetes Manifest
    this.writeFile('/home/user/k8s_deployment.yaml',
`apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: production
  labels:
    app.kubernetes.io/name: api-gateway
    app.kubernetes.io/tier: backend
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: gateway
        image: nginx:1.27-alpine
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "1000m"
            memory: "512Mi"
          requests:
            cpu: "200m"
            memory: "128Mi"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-svc
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 8080
`, true, tK8s);

    // 4. PostgreSQL Backup Shell Script
    this.writeFile('/home/user/backup_database.sh',
`#!/usr/bin/env bash
# ==============================================================================
# SRE Database Backup Automation Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="\${DB_NAME:-production_cluster}"
S3_BUCKET="s3://sre-cold-storage-backups/postgres/"

echo "[+] Starting database backup for: \${DB_NAME} at \${TIMESTAMP}..."
mkdir -p "\${BACKUP_DIR}"

BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${TIMESTAMP}.sql.gz"

# Stream pg_dump through gzip compression
pg_dump -Fc -Z 6 -h db-primary.internal -U postgres "\${DB_NAME}" > "\${BACKUP_FILE}"

echo "[+] Backup created: \${BACKUP_FILE} (\$(du -h "\${BACKUP_FILE}" | cut -f1))"

# Upload to S3 Glacier Storage
echo "[+] Syncing to S3: \${S3_BUCKET}"
aws s3 cp "\${BACKUP_FILE}" "\${S3_BUCKET}" --storage-class GLACIER_IR

echo "[✓] Backup completed successfully."
`, true, tBackup);

    // 5. Python FastAPI Microservice
    this.writeFile('/home/user/server.py',
`"""
High-Performance Telemetry Ingestion Microservice
Framework: FastAPI / AsyncIO / Uvicorn
"""

import time
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="SRE Metric Collector API",
    version="1.0.0",
    description="Collects and aggregates node health metrics"
)

class MetricPayload(BaseModel):
    hostname: str = Field(..., example="sre-node-01")
    cpu_percent: float = Field(..., ge=0.0, le=100.0)
    memory_mb: float = Field(..., ge=0.0)
    timestamp: float = Field(default_factory=time.time)
    tags: Dict[str, str] = Field(default_factory=dict)

@app.get("/healthz", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "uptime_sec": 84291.4,
        "cluster": "prod-eu-west-1"
    }

@app.post("/api/v1/metrics", status_code=status.HTTP_201_CREATED)
async def ingest_metrics(payload: MetricPayload):
    if payload.cpu_percent > 95.0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Node throttled due to high CPU"
        )
    return {"status": "accepted", "timestamp": payload.timestamp}

    if __name__ == "__main__":
        import uvicorn
        uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)
`, true, tServer);

    // 6. Nginx Config
    this.writeFile('/etc/nginx/nginx.conf',
`user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time';

    access_log /var/log/nginx/access.log main buffer=16k;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    server {
        listen 80;
        server_name sre-node-01.internal;

        location /healthz {
            access_log off;
            return 200 '{"status":"UP"}';
            add_header Content-Type application/json;
        }

        location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
`);

    // 7. System files & logs
    this.writeFile('/etc/os-release',
`NAME="VimLinux GNU/Linux"
VERSION="24.04 LTS (SRE Edition)"
ID=vimlinux
ID_LIKE=debian
PRETTY_NAME="VimLinux 24.04 SRE Server"
VERSION_ID="24.04"
HOME_URL="https://github.com/smford/vim-html"
SUPPORT_URL="https://github.com/smford/vim-html/issues"
`);

    this.writeFile('/etc/hostname', `sre-node-01\n`);
    this.writeFile('/etc/hosts', `127.0.0.1\tlocalhost sre-node-01\n::1\t\tlocalhost ip6-localhost ip6-loopback\n`);

    this.writeFile('/var/log/syslog',
`Aug 17 22:00:01 sre-node-01 systemd[1]: Starting Daily apt upgrade and clean activities...
Aug 17 22:00:02 sre-node-01 systemd[1]: apt-daily-upgrade.service: Deactivated successfully.
Aug 17 22:01:15 sre-node-01 kernel: [ 420.198210] netfilter: connection tracking table full, dropping packet
Aug 17 22:01:16 sre-node-01 sysctl: net.netfilter.nf_conntrack_max increased to 524288
Aug 17 22:02:00 sre-node-01 systemd[1]: Session 412 of User root logged in.
`);

    this.writeFile('/proc/cpuinfo',
`processor\t: 0
vendor_id\t: AuthenticAMD
cpu family\t: 25
model_name\t: AMD EPYC 9654 96-Core Processor
cpu MHz\t\t: 3699.988
cache size\t: 32768 KB
siblings\t: 8
cpu cores\t: 8
`);

    this.writeFile('/proc/meminfo',
`MemTotal:        4096000 kB
MemFree:         2841200 kB
MemAvailable:    3412000 kB
Buffers:          182400 kB
Cached:           692100 kB
SwapTotal:       2097148 kB
SwapFree:        2097148 kB
`);

    this.writeFile('/proc/version',
`Linux version 6.12.8-sre-generic (gcc version 13.2.0) #42-SMP PREEMPT Mon Aug 17 2026
`);
  }

  normalizePath(pathStr) {
    if (!pathStr) return '/';
    const parts = pathStr.split('/').filter(Boolean);
    const stack = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  resolve(cwd, targetPath) {
    if (!targetPath) return cwd;
    targetPath = targetPath.trim();
    if (targetPath === '~' || targetPath.startsWith('~/')) {
      targetPath = '/home/user' + targetPath.slice(1);
    }
    if (targetPath.startsWith('/')) {
      return this.normalizePath(targetPath);
    }
    return this.normalizePath(cwd + '/' + targetPath);
  }

  getNode(pathStr) {
    const norm = this.normalizePath(pathStr);
    if (norm === '/') return this.root;

    const parts = norm.split('/').filter(Boolean);
    let curr = this.root;

    for (const part of parts) {
      if (!curr || curr.type !== 'dir' || !curr.children[part]) {
        return null;
      }
      curr = curr.children[part];
    }
    return curr;
  }

  exists(pathStr) {
    return this.getNode(pathStr) !== null;
  }

  isDir(pathStr) {
    const node = this.getNode(pathStr);
    return node !== null && node.type === 'dir';
  }

  isFile(pathStr) {
    const node = this.getNode(pathStr);
    return node !== null && node.type === 'file';
  }

  mkdir(pathStr, recursive = true) {
    const norm = this.normalizePath(pathStr);
    if (norm === '/') return true;

    const parts = norm.split('/').filter(Boolean);
    let curr = this.root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!curr.children[part]) {
        if (!recursive && i < parts.length - 1) {
          return false;
        }
        curr.children[part] = {
          type: 'dir',
          name: part,
          permissions: 'drwxr-xr-x',
          owner: 'user',
          group: 'user',
          mtime: new Date(),
          children: {}
        };
      } else if (curr.children[part].type !== 'dir') {
        return false; // Not a directory collision
      }
      curr = curr.children[part];
    }
    return true;
  }

  writeFile(pathStr, content = '', createParents = true, customMtime = null) {
    const norm = this.normalizePath(pathStr);
    if (norm === '/') return false;

    const parts = norm.split('/').filter(Boolean);
    const fileName = parts.pop();
    const parentPath = '/' + parts.join('/');

    if (!this.exists(parentPath)) {
      if (createParents) {
        this.mkdir(parentPath, true);
      } else {
        return false;
      }
    }

    const parentNode = this.getNode(parentPath);
    if (!parentNode || parentNode.type !== 'dir') return false;

    const isExec = fileName.endsWith('.sh') || fileName.endsWith('.py');
    parentNode.children[fileName] = {
      type: 'file',
      name: fileName,
      permissions: isExec ? '-rwxr-xr-x' : '-rw-r--r--',
      owner: 'user',
      group: 'user',
      size: new Blob([content]).size,
      mtime: customMtime || new Date(),
      content: content
    };

    return true;
  }

  readFile(pathStr) {
    const node = this.getNode(pathStr);
    if (!node) return null;
    if (node.type !== 'file') return null;
    return node.content;
  }

  appendFile(pathStr, appendContent) {
    const currContent = this.readFile(pathStr);
    if (currContent === null) {
      return this.writeFile(pathStr, appendContent);
    }
    return this.writeFile(pathStr, currContent + appendContent);
  }

  rm(pathStr, recursive = false) {
    const norm = this.normalizePath(pathStr);
    if (norm === '/') return false;

    const parts = norm.split('/').filter(Boolean);
    const targetName = parts.pop();
    const parentPath = '/' + parts.join('/');

    const parentNode = this.getNode(parentPath);
    if (!parentNode || !parentNode.children[targetName]) return false;

    const targetNode = parentNode.children[targetName];
    if (targetNode.type === 'dir' && !recursive) {
      if (Object.keys(targetNode.children).length > 0) {
        return false; // Directory not empty
      }
    }

    delete parentNode.children[targetName];
    return true;
  }

  cp(srcPath, dstPath, recursive = false) {
    const srcNode = this.getNode(srcPath);
    if (!srcNode) return false;

    let targetDst = dstPath;
    if (this.isDir(dstPath)) {
      targetDst = this.resolve(dstPath, srcNode.name);
    }

    if (srcNode.type === 'file') {
      return this.writeFile(targetDst, srcNode.content);
    } else if (srcNode.type === 'dir') {
      if (!recursive) return false;
      this.mkdir(targetDst, true);
      for (const childName in srcNode.children) {
        this.cp(srcPath + '/' + childName, targetDst + '/' + childName, true);
      }
      return true;
    }
    return false;
  }

  mv(srcPath, dstPath) {
    if (this.cp(srcPath, dstPath, true)) {
      return this.rm(srcPath, true);
    }
    return false;
  }

  readdir(pathStr) {
    const node = this.getNode(pathStr);
    if (!node || node.type !== 'dir') return null;

    const items = [];
    for (const name of Object.keys(node.children).sort()) {
      const child = node.children[name];
      items.push({
        name: child.name,
        type: child.type,
        size: child.type === 'file' ? child.size : 4096,
        permissions: child.permissions,
        owner: child.owner,
        group: child.group,
        mtime: child.mtime
      });
    }
    return items;
  }

  tree(pathStr = '/', prefix = '') {
    const node = this.getNode(pathStr);
    if (!node || node.type !== 'dir') return [];

    let lines = [];
    const keys = Object.keys(node.children).sort();
    
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const child = node.children[key];
      const connector = isLast ? '└── ' : '├── ';
      const displayName = child.type === 'dir' ? `${key}/` : key;
      
      lines.push(prefix + connector + displayName);
      
      if (child.type === 'dir') {
        const subPrefix = prefix + (isLast ? '    ' : '│   ');
        lines = lines.concat(this.tree(pathStr === '/' ? '/' + key : pathStr + '/' + key, subPrefix));
      }
    });

    return lines;
  }

  countFiles(node = this.root) {
    let count = 0;
    if (node.type === 'file') return 1;
    if (node.type === 'dir') {
      for (const key in node.children) {
        count += this.countFiles(node.children[key]);
      }
    }
    return count;
  }

  /**
   * Real browser file download trigger
   */
  downloadFile(pathStr) {
    const norm = this.normalizePath(pathStr);
    const content = this.readFile(norm);
    if (content === null) return false;

    const fileName = norm.split('/').pop() || 'untitled.txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Export all filesystem files as a JSON bundle
   */
  exportAll() {
    const exportTree = (node) => {
      if (node.type === 'file') {
        return { type: 'file', content: node.content, size: node.size, mtime: node.mtime };
      }
      const children = {};
      for (const k in node.children) {
        children[k] = exportTree(node.children[k]);
      }
      return { type: 'dir', children };
    };

    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      filesystem: exportTree(this.root)
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfs_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Import files from a JSON bundle or string
   */
  importTree(importedData) {
    try {
      if (typeof importedData === 'string') {
        importedData = JSON.parse(importedData);
      }
      if (!importedData || !importedData.filesystem) {
        return { success: false, error: 'Invalid VFS backup format: missing filesystem root' };
      }

      let filesRestored = 0;
      let dirsRestored = 0;

      const restoreNode = (srcNode, targetPath) => {
        if (!srcNode) return;
        if (srcNode.type === 'file') {
          this.writeFile(targetPath, srcNode.content !== undefined ? srcNode.content : '');
          const createdNode = this.getNode(targetPath);
          if (createdNode && srcNode.permissions) createdNode.permissions = srcNode.permissions;
          if (createdNode && srcNode.mtime) createdNode.mtime = new Date(srcNode.mtime);
          filesRestored++;
        } else if (srcNode.type === 'dir') {
          if (targetPath !== '/') {
            this.mkdir(targetPath, true);
            const dirNode = this.getNode(targetPath);
            if (dirNode && srcNode.permissions) dirNode.permissions = srcNode.permissions;
            dirsRestored++;
          }
          if (srcNode.children) {
            for (const childName in srcNode.children) {
              const subPath = targetPath === '/' ? '/' + childName : targetPath + '/' + childName;
              restoreNode(srcNode.children[childName], subPath);
            }
          }
        }
      };

      restoreNode(importedData.filesystem, '/');
      return { success: true, filesRestored, dirsRestored, exportedAt: importedData.exportedAt };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Helper to check if a parsed object is a valid VFS backup
   */
  isVfsBackup(data) {
    if (!data) return false;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return false;
      }
    }
    return Boolean(data && data.filesystem && data.filesystem.type === 'dir');
  }
}

window.vfs = new VirtualFS();
