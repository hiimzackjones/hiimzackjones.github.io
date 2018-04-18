---
layout: post 
title: 
date: 2018-3-28 22:54:00 -0400 
categories: Server 
---

Hyper-V has extensive software defined network capabilities allowing an admin to create elaboriate networking, isolating host VMs, Vlans, Link Aggregation, and Load Balancing.

### Basic Hyper-V Networking

There are a couple of places you can Management parts of the virtual network. First, you will want to go to the Virtual Switch Settings in Hyper-V to be able to do basic switch configuration. 


- In Hyper-V Manager, go to the actions bar and select the Hyper-V Switch Manager  
![HyperV Actions](/assets/img/servergifs/hyperVN/1.PNG)  
- In the switch manager, you should see any switches you've created, as well as the default switch. 
![HyperV](/assets/img/servergifs/hyperVN/2.PNG)
- here you can configure your switch to be external, internal, or private. As explained in another post...


*Private* - isolation from the rest of the network, VMs on the same host can connect together with this setting. 
*Internal* - Same as Private but can also communicate with the host as well.
*External* - Faces the network like a physical machine.

>Machines that are on Private or Internal networks will usually have to have their IP addresses set unless there is a DHCP server on a VM or on the host machine.

If you’ve set up the switch as external, you will need to link it to an external switch if you’d like to allow it to get to the outside network or internet.

- Once you've setup the switches, you should be able to access them to change their IP addresses and adjust some of their settings in your local machines network adapter list.  
![Network Adapters](/assets/img/servergifs/hyperVN/3.PNG)  
As you can see, there is a default switch, A switch with a custom name. And then individual switches most likely used as external switches for single VMs. 

### Changing a VMs Switch

Changing the Virtual Switch you use can be handled in the VMs settings. 

- Head to the vm settings for the specific VM you're working on within Hyper-V Manager
- Under hardware there will be a Legacy Network Adapter section. Go there. 
- There you will see a drop down for the Vritual Switch you'd like to use. 
![Selecting switch](/assets/img/servergifs/hypervSet/4.PNG)
- Once you've changed the settings you can apply the settings and quit out. 

### NIC Teaming
Under the Legacy Network Adapter option in the Hyper-V Settings, you will see the dropdown for Advanced Features. Here you can add a handful of advanced features, one including NIC teaming. Select this if you want a NIC to be allow to be part of NIC teaming.

![Nic Teaming](/assets/img/servergifs/hyperVN/4.PNG) 

That's the basics! 