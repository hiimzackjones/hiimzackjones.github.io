--- 
layout: post 
title:
date: 2018-3-28 22:54:00 -0400 
categories: Server 
---


>DRAFT IN PROGRESS  
 -Zack
![1.png](/assets/img/servergifs/wds/1.png)
![2.png](/assets/img/servergifs/wds/2.png)
![3.png](/assets/img/servergifs/wds/3.png)
![4.png](/assets/img/servergifs/wds/4.png)

Windows Deployment Services. 

Deploying Windows to machines from a Windows Server. 

To use WDS with an install, you need to make **both** a boot image and a install image. 

The Windows server 2016 DVD or ISO has the boot image and the install image. 

you can find them in the Sources Folder. 

They will be named boot.wim and install.wim  

Adding the Boot Image:
- Go to server Manager
- go to tools and then find Windows Deployement Services in the dropdown list. 
- Right click Boot Images and click Add Boot Image
- Find the boot.wim file. Click Open
- Next until finished. 

Do the same with the install image but put it in the Install Images folder. 

https://www.youtube.com/watch?v=qIsCv7Gh2fY

