--- 
layout: post 
title: 
date: 2018-3-28 22:54:00 -0400 
categories: Server 
---

## Setting Hyper-V settings

Hyper-V settings can be adjusted for each VM and will in essence adjust the aspects of the VM that would usually be physical components. 

### Hardware Options

![Hyper V Settings](/assets/img/servergifs/hypervset/1.png)

Hyper-V settings feels similar to Device Manager and can be used to: 
- Set which harddrive VHD to use and adjust VHD settings
- Set which NICs/ Virtual Switches to use
![Network Switches](/assets/img/servergifs/hypervset/4.png)
- Adjust available RAM
- adjust the processor useage allocation
- 'load' a disk into the virtual disk drive
![hyperv using an iso](/assets/img/servergifs/hypervset/3.png)

>These settings sometimes can only be adjusted when the machine is turned off, but for some settings can be adjusted as the machine is running. For example loading a local .iso as a Disk in the virtual Disk drive

### Management Options

You will also notice a section near the bottom of the left hand side that is called Managment. Here is a Hyper-V specific set of options for managing Hyper-V such as: 

- using a VM Heartbeat
- Renaming the VM
- Creating checkpoints and it's file location
- Automatic start and stop of VM

![Management Options](/assets/img/servergifs/hypervset/2.png)
