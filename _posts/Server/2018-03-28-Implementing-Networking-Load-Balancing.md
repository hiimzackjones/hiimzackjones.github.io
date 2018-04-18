--- 
layout: post 
title: 
date: 2018-3-28 22:54:00 -0400 
categories: Server 
---

Before you can Implement Network Load Balancing, here are some prerequisites:

### Prerequisites

- All hosts in the cluster must be on the same subnet
- All adapters in cluster must be setup as either *multicast* or *unicast* but not a mixture of both
- *if unicast* the NIC used to handle client-to-cluster traffic must support changing its MAC address
- IPs must be static on the nodes. 


### Installing NLB Nodes
 Like most other features. You must install this from Server Manager, add roles and features. 

 Select *Network Load Balancing* from the features section.

### Creating a NLB Cluster

Under the Netowkr Load Blancing Manger
- Right click the cluster and click New Cluster
- Set the host as your current server
- Select the interface for this specific cluster
- find the IP address in the Dedicated IP address section and hit next
- Add an IP address that is shared by all clusters and it will add the IP to the adapters
- add the IP address for the NLB Cluster
- On the Cluster Parameters page, type the full internet name for the cluster, and then set operation mode to either Unicast or Multicast, etc. 
- Set any applicable port rules
- Now just add hosts to this cluster as needed. 



