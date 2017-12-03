--- 
layout: post 
title: 
date: 2017-10-11 22:54:00 -0400 
categories: Server 
---

*in progress, posted to show work for class*


# Active Directory, Domains, and Domain Controllers

These three topics can seem to be almost the same thing, and for that I'm dedicating a whole post to them. I'm going to make this quick. 

---

##Some quick background vocab. 


### Enterprise Environment
The computer systems infrastructure of a particular corporation, business, or organization that is often made up of servers and hosts and other end devices such as printers. Most enterprise environments are designed to give the organization a safe system for maintaining preparatory data storage and working together, while also having the ability to have various layers and segmentation. That's a good enough definition for now. 

### Hostnames
Hostnames are made up of the machine name as well as the Domain name. For example Finance1.sweetbusiness.com would be a full host name. That host name relates directory to an IP address of a machine. 
A good example of a hostname that happens often would be ftp.business.com, which generally would be what you would assign an FTP server as.
 
### Domains
Domains are what make using a server in an enterprise or campus setting vital. Esentially the domain is the overarching group of - machines
- services those machines use
- and user accounts
that belong to central database. Domains allow for organization between the users, as well as seperate organization between the computers, and then security parameters to be applied to those groups to allow and disallow paticualar machines and users from files, services, etc. Domains are for the security of the company or organization. 

### Domain Controller
A Domain Controller is a machine that handles those accounts and machines. The Domain Controller is the Adminstrative hub for the complete Domain. 

### Active Directory 
Active Directory is the Windows version of a Domain Controllers management software. Active Directory is not a domain controller, but what a domain controller uses to handle and manage the domain. These terms are sometimes use interchangeably but don't always mean the same thing. 


### Local Users and Groups vs Domain Users and groups. 



## Making a new Domain User, group, or Organizational Unit. 

Each of these are technically Organizational Units and for the most part will be created in the same way. In the example below, I explain creating a User, but creating other OUs work the same way. 

The method I explain will be using the GUI. You can also do this through the CLI in PowerShell as well. 

In the start menu, you can:
- open up *Active Directory Users and Computers* from the admistrative tools tile.

- Find it in the applications list in start menu.  

- find it in the the Tools dropdown of the Server Manager interface. 

You will see in your local Domain a list of Organizational units. Here you can create groups and users and organize them.

To make a user, make sure the group you'd like to add th user to is selected. Then use the Add A New User from the top menu. It will be the icon of a person's head. You can also right click > New > New User. 

*New Object - User* window will appear. Fill out the information as needed included the name and description and the Logon name. Press next. Now add a password to that user's account. You can change some of the settings for the password here including expiration, allowing the user to change the password, and first time logon password change. Press next. Review the new user's settings and press finish. 

When making a group that you plan to use as part of the local domain, make sure you choose that option in the *New Object - Group* menu. 







Cheers, 
Zack Jones.



