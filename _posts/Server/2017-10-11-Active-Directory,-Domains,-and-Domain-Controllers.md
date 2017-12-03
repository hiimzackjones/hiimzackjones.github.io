--- 
layout: post 
title: 
date: 2017-10-11 22:54:00 -0400 
categories: Server 
---

*in progress, this post will have screenshots soon*


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
Domains are what make using a server in an enterprise or campus setting vital. Essentially the domain is the overarching group of 

- machines
- services those machines use
- and user accounts

that belong to central database. Domains allow for organization between the users, as well as separate organization between the computers, and then security parameters to be applied to those groups to allow and disallow particular machines and users from files, services, etc. Domains are for the security of the company or organization, but also allow for an Admin to organize different offices, branches, and user roles using sub domains and additional domains to a Forest(See below). 

### Domain Controller
A Domain Controller is a machine that handles those accounts and machines. The Domain Controller is the Administrative hub for the complete Domain. 

### Active Directory 
Active Directory is the Windows version of a Domain Controllers management software. Active Directory is not a domain controller, but what a domain controller uses to handle and manage the domain. These terms are sometimes use interchangeably but don't always mean the same thing. 

>Users accounts can be Local or Domain
You've seen local users. Local users are your typical log in, log out, pick another person, put in a password, "oh look my stuff is here instead of that other guy's" thing. Domain users are the same... sort if. Domain users belong to the server, as part of the Domain, and can be logged into with different machines. The login password can be changed by the Administrator running the domain, and loads of other settings and permissions can be adjusted.

### Trees
Similar to file structure trees, Active Directory Trees are the collection of all the domains that may be in a group. Sometimes organized in a hierarchical way. 

### Forests
A forest is the top level of Active Directory. (aka the top level of a Domain) It holds all the Domain Controllers, including lower level domains of a root domain. 

--- 

## Setting up a domain 

Setting up a domain starts with adding the features needed, i.e the Active Directory Domain Services (ADDS) and then promoting your main server to be a domain controller, aka the Root Domain Controller. From there you may be creating a new forest if needed and then creating the domain itself. Here we go. 

### Adding Active Directory Domain Services Feature

- First click on the Add Roles and Features tab in the Server Manager Dashboard.  

- Press Next until you get to the Server Pool section. Here you will pick the Server you'd like to use as a Domain Controller, i.e. add this feature to. You may have multiple servers depending on your setup, make sure to pick the correct one.   

>Protip: Make sure to name your servers using a naming convention that helps you know something about that server. Giving them arbitrary names will make tasks like this a pain. Picking the location, or Roles/features/services as part of the name will help you in the long run!   

- Press Next.   

- Check off the Active Directory Domain Services Feature, go ahead and 'add features'  

- Next  

- Leave Defaults  

- Install.   

### Promoting a Server to Domain Controller

Now that you've added the feature's we are going to start the process of actually making the server a Domain Controller.  

 - In the Add Roles and Features Wizard find the option that says 'Promote this server to a domain controller'. It will open the Active Directory Domain Services Configuration Wizard. 

 - Assuming that we are setting up a Domain from scratch, there should not be any other Domain Controllers setup. This means there won't be a Forest setup. The forest exists only after a Root Domain Controller exists. Choose Add a new forest and give that forest a name. 

 >naming convention for this is often domainbranch.local or domainbranch.internal. Something like the companyname.local works fine. 

 - Press Next. And give it some time. 

 - The next screen will ask the functional level. Functional level will be based off of the oldest server OS that you will be running. If you plan to run Server 2012, make sure to set it to 2012. **Do not use the lowest because it seems easier, please use the highest available for your planned domain and network**

 - Give it a password for admin login. 

 - Press Next

 >You will get a DNS delegation error. It's okay. 

 - Press Next and wait. 

 - Set the netbios name and press next. You can leave it as default. 

 - Press Next until Prerequisites. Wait for it to check. Then press close and install. You'll need to restart the machine after this to wrap up the Domain Controller setup. 

 - Next time you login, you can log in using the admin domain account instead of the local. Use the domain name we created earlier and administrator as the login. 

 - To test this out you can open up Active Directory Users and Computers and under Domain Controllers you should see your server. 

 ---

## Making a new Domain User, group, or Organizational Unit. 

Each of these are technically Organizational Units and for the most part will be created in the same way. In the example below, I explain creating a User, but creating other OUs work the same way. 

The method I explain will be using the GUI. You can also do this through the CLI in PowerShell as well. 

In the start menu, you can:
- open up *Active Directory Users and Computers* from the administrative tools tile.

- Find it in the applications list in start menu.  

- find it in the the Tools drop-down of the Server Manager interface. 

You will see in your local Domain a list of Organizational units. Here you can create groups and users and organize them.

To make a user, make sure the group you'd like to add th user to is selected. Then use the Add A New User from the top menu. It will be the icon of a person's head. You can also right click > New > New User. 

*New Object - User* window will appear. Fill out the information as needed included the name and description and the Logon name. Press next. Now add a password to that user's account. You can change some of the settings for the password here including expiration, allowing the user to change the password, and first time logon password change. Press next. Review the new user's settings and press finish. 

When making a group that you plan to use as part of the local domain, make sure you choose that option in the *New Object - Group* menu. 







Cheers, 
Zack Jones.



