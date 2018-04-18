--- 
layout: post 
title: 
date: 2017-11-24 10:36:00 -0400 
categories: Server 
---

One of the main reasons you might want to setup a Windows Server is the File Permissions. It allows you to control who can see, edit, or use various machines or files.

### Seeing the individual users and groups
- Go to Server Manager
- Tools
- Active Directory Users and Computers
![Active Directory Users and Computers](/assets/img/servergifs/permissions/1.png)
- From here notice it has an inventory organized on the left by Computers, Domain Controllers, Users, etc. You can manage these permissions by individual computers, the users that login, or even group computers together, which is useful when the envirnoment has different divisions or departments
![Users list](/assets/img/servergifs/permissions/2.png)
- You can create a couple test users for this walkthrough or apply settings to any existing user/groups if you'd like. 

### Setting permissions based off of groups

In Windows explorer, you can take any folder and open it's properties to change who you can share the folder with. To do this: 

- right click the folder
- click properties
- go to the sharing tab
- click the *share...* button to open up the file sharing to add or remove permissions. 
![File sharing permissions on a folder](/assets/img/servergifs/permissions/3.png)  
- From here you can start typing the group and add it. Or you can change the permissions between a combination of *Read, Write, Modify, Execute, or Owner* using the drop down. 

Once you've created a shared Directory, the folders within that directory can also be manged using the Security tab.  
![Permissions and Security](/assets/img/servergifs/permissions/4.png)

Notice there are both, individual users (Administrator) and groups. You can adjust settings on an individual level or for the whole group.  

>Ownership can also be adjusted. Administators are able to move ownership of files from user to user or group to group. This is useful when shifting systems to new employees. 

>Also, Permission changes are not applied until a user logs off and logs back on. 

### Accessing shared files. 
In windows explorer you will need to use the universal naming convention to access these directories. For example
```\\SVR1/SharedFolder```  
Type this in the path and press enter to see the files. 


Done and Done! 

-Cheers, 

Zack 

