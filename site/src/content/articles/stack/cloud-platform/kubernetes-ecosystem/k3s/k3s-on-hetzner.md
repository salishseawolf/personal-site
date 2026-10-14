---
title: K3s on Hetzner, for a single operator
order: 1
---

Salish Sea Wolf LLC's services (source hosting and CI, single sign-on,
document management, time tracking, analytics, and this site) run on a
three-node K3s cluster on Hetzner Cloud. Three nodes is the smallest count
that keeps an embedded etcd quorum through the loss of one, and K3s ships
that control plane as a single binary instead of a set of components to
assemble and upgrade separately. For one operator, fewer moving parts in the
control plane means more attention left for the workloads on top of it.

Hetzner keeps the bill small enough that running real high availability for
a small business is reasonable, rather than something to justify. The
servers, private network, load balancer, firewall, and Cloudflare DNS are all
OpenTofu; Ansible installs K3s once, along with 1Password Connect and Argo
CD, and from then on nothing on the cluster is changed by hand.

The load balancer speaks PROXY protocol, so Traefik sees each client's real
IP. That's what lets token-based routes like git over HTTPS skip SSO while
still being limited by source address, and every other route goes through
Authentik forward-auth.

The whole thing is public:
[k3s-service-cluster](https://github.com/salishseawolf/k3s-service-cluster).
The OpenTofu lives in
[`infrastructure/tofu/`](https://github.com/salishseawolf/k3s-service-cluster/tree/main/infrastructure/tofu)
and the one-time bootstrap in
[`bootstrap/ansible/`](https://github.com/salishseawolf/k3s-service-cluster/tree/main/bootstrap/ansible).
