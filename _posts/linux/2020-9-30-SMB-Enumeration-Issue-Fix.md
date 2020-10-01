--- 
layout: post 
title: Smbclient Giving Weird Errors - A Fix. 
date: 2020-9-30 18:55:00 -0400 
categories: Linux 
---


So while running through some CTFs I noticed that on almost every machine, if I were enumerating SMB using smbclient, I would get this weird error. 

![smbclient error](/assets/img/Walkthroughs/Lame/smbclient.png)

![smbclient error 2](/assets/img/Walkthroughs/Legacy/smbclient.png)

After doing some research, I found out that it was because smbclient was trying to use a higher version of Samba. So I'm writing this quick post as a reminder to myself how to fix it but hopefully it will help some of you guys out as well. 


First find the Samba conf file. It's almost always in /etc/samba/smb.conf. I ran a quick find just in case. 

![Finding Samba Conf file](/assets/img/Linux/SambaConfPost/SambaVersionFind.png)

Then I hopped onto the conf and added NT1 as the lowest accepted version.

I added this to the Global section of the file -
```
min protocol = NT1
```
![SMB Conf Edit](/assets/img/Linux/SambaConfPost/SambaConfEdit.png)

**Note:**This is a good time to mention that you most likely want to have your SMB version as high as possible on machines you'd like to protect from SMB vulnerabilities. This works fine for a pentesting machine, but any other machine maybe should be set to highest possible. Here are some options for setting it. Here are some more options for setting the version. 

```
min protocol = SMB2
min protocol = SMB3
client min protocol = SMB2
max protocol = SMB2
protocol = SMB3
```
Notice you can set it to a specific SMB version, lowest version, highest version, and the same settings for client side. 

Okay lets go back and test to see what happens.  
*But first* - make sure to reset your smb service. 
```
sudo systemctl restart smbd.service
or 
sudo systemctl restart smb.service
```
*when I restart the service it still didn't work correctly. So I restarted the machine to make sure the correct service was restarted and it worked!*

![Imagine of it working goes here](/assets/img/Linux/SambaConfPost/SMBFixed.png)

Okay there ya go. Hope this helps if you're getting similar NT errors while poking at CTFs or even pentesting! 

Cheers, 
Zack. 



