--- 
layout: post 
title: 
date: 2018-3-28 22:54:00 -0400 
categories: Server 
---

### Installing the Failover Feature
To add this feature, in Server Manager go to Manage and Add Roles and Features. From the Features list select *Failover Clustering*

### Validate Cluster Configuration
- Go to Failover Clustering in the tools of Server Manager, 
- on the right side there will be a Actions panel where you can select *Validate Configuration*
- Add the names of the servers in the text boxes and continue
- then **Run all Tests**

This will check to make sure the inventory, the stroage, the system configs, and Hyper-V is setup and ready for Clustering. Errors will show up in the **Failover Cluster Report**  
If there are any issues, use the report to help you sovle them before moving forward. 

### Creating a Cluster
- In the same actions pane, click create new cluster
- select the first server and cluster and add
- Name the cluster and type the IP address of the Cluster that we set up previously. 
- Finish

Your cluster should show up in the Cluster's tool section of the Server Manager. 

### Adding a shared Drive to the Cluster (iSCSI)