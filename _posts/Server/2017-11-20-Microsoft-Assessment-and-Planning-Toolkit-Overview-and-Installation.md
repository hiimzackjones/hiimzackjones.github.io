--- 
layout: post 
title: 
date: 2017-11-20 10:36:00 -0400 
categories: Server 
---

### What is MAP?
Before trying to update machines on an enterprise envirnoment, you need to know what their resources are like, what systems are in use, and what the machine is used for on a day to day basic. Microsoft Assessment and Planning Toolkit helps you gather that data so you know as much as you can before deploying out updates or installations. 


### Setting up MAP Toolkit

- To install MAP, use the <code>Windows key + R<code> and type in <code> MapSetup.exe </code>
- Agree to the terms and install. 

### What you can find in MAP
MAP has a handful of reporting options on the left side. Depending on your use case, some of these will be more important than others. For example, in an envirnoment using Azure, the Cloud section will be useful. Others are:

- The **Desktop** section to see things like Microsoft Office, and machine's readiness for updating the OS
- The **Server** section to see an overview of your current running windows servers on the network or domain. 

![Server MAP](/assets/img/servergifs/map/1.png)
- The **Database** to find machines running applications involving SQL and other database information
- **Virtualization** sections will show charts to outline some of the resource usage and help you find bottlenecks or spot machines that are troublesome. 
![MAP Virtualization](/assets/img/servergifs/map/2.png)
- **Usage Tracking** is great for working with Volume Licensing or to see the overall licensing between the machines. 
![MAP Virtualization2](/assets/img/servergifs/map/2.png)

