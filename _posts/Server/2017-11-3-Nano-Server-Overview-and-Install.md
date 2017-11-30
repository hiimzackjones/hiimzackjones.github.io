--- 
layout: post 
title: 
date: 2017-11-03 10:36:00 -0400 
categories: Server 
---


*You can find more information about Windows Server 2016 and Server Core in a previous post* (link)[http://link.com]

## Overview of Nano Server

Nano Server is a unique way to install a server machine with a lightweight footprint that allows for remote managment similar to Core, but is even more lightweight than Core. Nano Server works well with cloud based development and running "born-in-the-cloud" containers or applications. It's a headless install, meaning it’s a server without a monitor and keyboard and peripherals. It's specifically meant to be logged into to manage.

## The benefits of lightweight
The purpose of Nano is to be light weight and it's base footprint is a remarkable 460 megabites. The small footprint allows for better security, quick install times, fast restarting, less resource use, etc. Windows Server 2016 is typically much heavier than it needs to be for running things like micro-services, 'cloud-native' applications, containers, etc. Nano is sufficent for services like DNS, small web server (IIS), and being a storage host for a Scale-Out File Server. 

## Nano Server for Developers
 
 Nano comes Cloud-ready as an application and development platform. 

 Developing on Nano allows you to have a single 'machine' for that paticular app, minimzing any dependancies or libraries on that paticular box. When using something like a Windows desktop machine, often a developer will be working on multiple projects, all with a multitude of frameworks dependancies, and APIs as well as all of the extra clutter the machine naturally has. Packaging on Nano is simple and clean using Nano's Windows Server App installer (WSA) and it's built in package managment system similar to apt-get or npm. Using Nano Server for development allows you to configure the machine with specific intenions - be it deployment, development, testing, or production. In theory, multiple Nano Servers can be setup, one for each paticualr stage in your development process or workflow. Additionally, secuirty can be a major concern for developers, and as mentioned above, Nano is inheirently secure due to it's minimal footprint. Additionally, frameworks like Node.js can also be easily installed and ran on top of Nano. 

## Ways Nano Server can be ran.
Nano Server is headless, but can be ran as OS in multiple ways inlcuding through a VM, Hyper-V containers, or on physical hardware as Host OS. It can also be accessed remotely. 

## The Nano Server Image
A unique feature of Nano server is the the need to inject roles and features as you build the OS image for whatever use case you may need. In other words, if you are planning to use Nano server as a DNS server only, there would be no need for the OS to have SoFS services and features as part of the OS image. Each time a Nano Server machine is created, the image should be built for that machines needs.  

## Installing Nano

>Nano server is installed using the NanoServerImageGenerator.iso imported as a module in Powershell. 

<code>Import-Module ./NanoServerImageGenerator - Verbose</code>
The Verbose option allows you to see the progress as the Module is setup. 


>If you run into issues as you import the module, you can try setting the Execution Policy as RemoteSigned




