--- 
layout: post 
title: Setting Up Hyper-V and First VM
date: 2017-11-29 10:36:00 -0400 
categories: Server 
---

### Install the Hyper-V Role
As done before, let's really quickly add this role and feature. 
- In Server Manager, add roles and features. Select the Correct Server, and add any features needed to run Hyper-V. 
- You can setup the NIC for the Hyper-V machines here or later in Hyper-V Manager. 
- You can also setup migration if needed. You can skip it for now. 
- Set location of the virtual harddrive and the Machine config files. 
- Restart server when finished. 

### Hyper-V Manager. 

Now you will need to setup Hyper-V manager. Head to tools and open Hyper-V Manager. 

In Hyper-V manager you will see Hyper-V Servers on the left drop down. Click the Server you are working on and you will see actions on the Right panel. This is where much of the managment will happen. 
![Hyper-V Manager](/assets/img/servergifs/hyperv/1.png)

#### Setting up a Virtual Switch

These machines are virtual and need a similar virtual switch to allow it to connect to each other, to the host machine, or out to the network. Depending on how you setup your virtual switch, you can isolate your VM envirnoment or have the face the internet like a typical machine. 

- Virtual Switch Manager
- Choose between external, internal, or Private. Again these are the settings for how this switch will interact with the rest of the network. 

**Private** - isolation from the rest of the network, VMs on the same host can connect together with this setting.   
**Internal** - Same as Private but can also communicate with the host as well.  
**External** - Faces the network like a physical machine.  

>Machines that are on Private or Internal networks will usually have to have their IP addresses set unless there is a DHCP server on a VM or on the host machine. 

- If you've set up the switch as external, you will need to link it to an external switch if you'd like to allow it to get to the outside network or internet.    
![External Switch NIC](/assets/img/servergifs/hyperv/2.png)    

In your networking Connections you should see your new interface. 

### New Virtual Machine

To setup a new virtual machine:
- click new virtual machine in action
- Name it
- Pick Generation 1 or 2. 
- Set the amount of Ram and if you want to use Dynamic memory
- Set connection to the virtual switch we jsut made. 
- Create a new Virtual Hard Drive if you haven't already. Give it a name, location, and size.   
![HyperV Hard Drive](/assets/img/servergifs/hyperv/3.png)  
- This next section allows you to attach an .iso to the machine for it's first boot so you can install an operating system on this VM. You can attach it as a disk, or iso or some other options if you'd like.   
![Attaching an ISO](/assets/img/servergifs/hyperv/4.png)  
- finish the prompt. 

You should now see a new VM in the Virtual Machine list for your server. 

### VM first boot and OS install
- Double click the VM to connect to it. 
- A window will appear running the VM. 
![First boot](/assets/img/servergifs/hyperv/5.png)
- If the machine is setup to external, it should pull from the DHCP to get an IP. Otherwise set up a static IP.

That's it. 
