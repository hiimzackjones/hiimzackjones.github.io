--- 
layout: post 
title: 
date: 2017-11-03 10:36:00 -0400 
categories: Server 
---


*You can find more information about Windows Server 2016 and Server Core in a previous post* 
[... This previous post to be exact.](https://hiimzackjones.github.io/server/2017/10/06/Installing-and-setting-up-Windows-Server-2016-&-Server-Core.html)

## Overview of Nano Server

Nano Server is a unique way to install a server machine with a lightweight footprint that allows for remote managment similar to Core, but is even more lightweight than Core. Nano Server works well with cloud based development and running "born-in-the-cloud" containers or applications. It's a headless install, meaning it’s a server without a monitor and keyboard and peripherals. It's specifically meant to be logged into to manage.

## The Benefits of Lightweight
The purpose of Nano is to be light weight and it's base footprint is a remarkable 460 megabites. The small footprint allows for better security, quick install times, fast restarting, less resource use, etc. Windows Server 2016 is typically much heavier than it needs to be for running things like micro-services, 'cloud-native' applications, containers, etc. Nano is sufficent for services like DNS, small web server (IIS), and being a storage host for a Scale-Out File Server. 

## Nano Server for Developers
 
 Nano comes Cloud-ready as an application and development platform. 

 Developing on Nano allows you to have a single 'machine' for that paticular app, minimzing any dependancies or libraries on that paticular box. When using something like a Windows desktop machine, often a developer will be working on multiple projects, all with a multitude of frameworks dependancies, and APIs as well as all of the extra clutter the machine naturally has. Packaging on Nano is simple and clean using Nano's Windows Server App installer (WSA) and it's built in package managment system similar to apt-get or npm. Using Nano Server for development allows you to configure the machine with specific intenions - be it deployment, development, testing, or production. In theory, multiple Nano Servers can be setup, one for each paticualr stage in your development process or workflow. Additionally, secuirty can be a major concern for developers, and as mentioned above, Nano is inheirently secure due to it's minimal footprint. Additionally, frameworks like Node.js can also be easily installed and ran on top of Nano. 

## Ways Nano Server Can Be Ran.
Nano Server is headless, but can be ran as OS in multiple ways inlcuding through a VM, Hyper-V containers, or on physical hardware as Host OS. It can also be accessed remotely. 

## The Nano Server Image
A unique feature of Nano server is the the need to inject roles and features as you build the OS image for whatever use case you may need. In other words, if you are planning to use Nano server as a DNS server only, there would be no need for the OS to have SoFS services and features as part of the OS image. Each time a Nano Server machine is created, the image should be built for that machines needs.  

## Installing Nano

In this example we will be installing our Nano Server as a VM on Hyper-V with an image setup for webserver IIS feature included. Nano Server is installed using the NanoServerImageGenerator scripts  imported as a module in Powershell. The NanoServerImageGenerator scripts can be found on the Windows Server 2016 installation media. 

To setup for the creation of the Nano image, create a directory somewhere on the server. For example in Documents create a folder called Nano. Paste the scripts into that folder.  

![Nano1](/assets/img/servergifs/nano/nano1.gif)


Next run Powershell as admin and import the module. Move to the directory that the scripts are in and run the following command. 

```
Import-Module ./NanoServerImageGenerator.psm1 -Verbose
```  

The Verbose option allows you to see the progress as the module is setup. This switch is optional.  

Once the module is imported, you will run a script to create a new nano server image. Depending on what type of image you'd like to create, some of your options made be different than the example.  
>The MediaPath in this example refers back to the installation disk on drive D. The BasePath is for setting a temp location for configuration files. The target path is where the image file will be created. In this case, we will use the extension of .vhdx for our virtual machine. We should also set the Deployement type as Guest since it will be a guest machine on Hyper-V. 

```
New-NanoServerImage -Edition Standard -MediaPath D:\ -BasePath C:\Nano -TargetPath C:\Nano\NanoServer1.vhdx - DeploymentType Guest -ComputerName My-Nano-Server -storage -Package Microsoft-NanoServer-IIS-Package
```

It will then prompt you for a password. Powershell will then show progress in the top of the window with a green status bar. 

![Nano3](/assets/img/servergifs/nano/nano3.gif)

...to be continued




