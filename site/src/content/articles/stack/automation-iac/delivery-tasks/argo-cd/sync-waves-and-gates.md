---
title: Sync waves as deploy gates
order: 1
---

In the cluster that runs this site, Argo CD is the only deploy path: a merge
to `main` is a deploy, and there is no `kubectl apply` step. A single root
Application owns the platform components, and an ApplicationSet discovers
every app chart under `services/*/app`, so adding a service is adding a
directory.

Order matters on a fresh cluster, so components sync in waves, and each wave
has to be healthy before the next one starts:

| Wave | Components | Gate before the next wave |
|---|---|---|
| 0 | Argo CD itself, CRDs, the CloudNativePG operator | operators healthy |
| 10 | cert-manager config, step-ca, Postgres, Redis | Postgres cluster healthy |
| 20 | SeaweedFS, Authentik | filer and Authentik up |
| 30 | SeaweedFS CSI, VolSync | a PVC canary mounts a real volume |
| 40 | every app under `services/*/app` | none |

The wave-30 gate is the strictest. A canary Job binds a fresh volume and
checks `/proc/mounts` for an actual `fuse.seaweedfs` mount before it writes
and reads anything back. A plain write-and-read test would also pass on
node-local disk, so checking the mount itself is what proves the storage
layer is really in the path. If it isn't, the rollout stops before any app
starts, instead of apps quietly writing somewhere they shouldn't.

See
[`platform/argocd/`](https://github.com/salishseawolf/k3s-service-cluster/tree/main/platform/argocd)
for the root Application and ApplicationSet.
